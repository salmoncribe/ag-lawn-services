import sqlite3
import uuid
import jwt
import bcrypt
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any
from app.config import Settings

DB_PATH = Path("data") / "local.db"
ALGORITHM = "HS256"

class LocalDBService:
    def __init__(self, settings: Settings) -> None:
        self.settings = settings
        DB_PATH.parent.mkdir(parents=True, exist_ok=True)
        self._init_db()

    def _get_conn(self):
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        return conn

    def _init_db(self):
        with self._get_conn() as conn:
            conn.executescript("""
                CREATE TABLE IF NOT EXISTS profiles (
                    user_id TEXT PRIMARY KEY,
                    email TEXT UNIQUE NOT NULL,
                    password_hash TEXT NOT NULL,
                    credit_balance INTEGER DEFAULT 0,
                    stripe_customer_id TEXT,
                    watermark_url TEXT,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
                );

                CREATE TABLE IF NOT EXISTS clips (
                    clip_id TEXT PRIMARY KEY,
                    user_id TEXT NOT NULL REFERENCES profiles(user_id),
                    stream_id TEXT NOT NULL,
                    platform TEXT,
                    title TEXT,
                    storage_path TEXT,
                    thumbnail_path TEXT,
                    duration REAL,
                    status TEXT,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
                );
            """)

    def _create_token(self, user_id: str, email: str) -> str:
        if not self.settings.encryption_key:
            raise ValueError("ENCRYPTION_KEY missing for JWT signing")
        expire = datetime.now(timezone.utc) + timedelta(days=7)
        to_encode = {"sub": user_id, "email": email, "exp": expire}
        return jwt.encode(to_encode, self.settings.encryption_key, algorithm=ALGORITHM)

    def sign_up(self, email: str, password: str) -> dict[str, Any]:
        user_id = str(uuid.uuid4())
        hashed_pw = bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
        try:
            with self._get_conn() as conn:
                conn.execute(
                    "INSERT INTO profiles (user_id, email, password_hash) VALUES (?, ?, ?)",
                    (user_id, email, hashed_pw)
                )
        except sqlite3.IntegrityError:
            raise ValueError("Email already exists")

        user_data = {"id": user_id, "email": email}
        token = self._create_token(user_id, email)
        return {
            "user": user_data,
            "session": {"access_token": token}
        }

    def sign_in(self, email: str, password: str) -> dict[str, Any]:
        with self._get_conn() as conn:
            row = conn.execute("SELECT user_id, password_hash FROM profiles WHERE email = ?", (email,)).fetchone()
            
        if not row or not bcrypt.checkpw(password.encode("utf-8"), row["password_hash"].encode("utf-8")):
            raise ValueError("Invalid email or password")
            
        user_data = {"id": row["user_id"], "email": email}
        token = self._create_token(row["user_id"], email)
        return {
            "user": user_data,
            "session": {"access_token": token}
        }

    def get_user_from_token(self, token: str) -> dict[str, Any]:
        try:
            payload = jwt.decode(token, self.settings.encryption_key, algorithms=[ALGORITHM])
            return {"id": payload.get("sub"), "email": payload.get("email")}
        except jwt.PyJWTError:
            raise ValueError("Invalid auth token")

    def ensure_profile(self, user_id: str, email: str) -> dict[str, Any]:
        existing = self.get_profile(user_id)
        if existing:
            return existing

        # In LocalDBService, signup already creates the profile, but just in case:
        with self._get_conn() as conn:
            conn.execute(
                "INSERT OR IGNORE INTO profiles (user_id, email) VALUES (?, ?)",
                (user_id, email)
            )
        return self.get_profile(user_id)

    def get_profile(self, user_id: str) -> dict[str, Any] | None:
        with self._get_conn() as conn:
            row = conn.execute("SELECT * FROM profiles WHERE user_id = ?", (user_id,)).fetchone()
            return dict(row) if row else None

    def update_profile(self, user_id: str, updates: dict[str, Any]) -> dict[str, Any]:
        if not updates:
            return self.get_profile(user_id)
            
        updates["updated_at"] = datetime.now(timezone.utc).isoformat()
        set_clause = ", ".join([f"{k} = ?" for k in updates.keys()])
        values = list(updates.values()) + [user_id]
        
        with self._get_conn() as conn:
            conn.execute(f"UPDATE profiles SET {set_clause} WHERE user_id = ?", values)
            
        profile = self.get_profile(user_id)
        if not profile:
            raise ValueError("Profile not found")
        return profile

    def add_credits(self, user_id: str, amount: int) -> dict[str, Any]:
        with self._get_conn() as conn:
            conn.execute(
                "UPDATE profiles SET credit_balance = credit_balance + ?, updated_at = ? WHERE user_id = ?",
                (amount, datetime.now(timezone.utc).isoformat(), user_id)
            )
        return self.get_profile(user_id)

    def consume_credits(self, user_id: str, amount: int = 1) -> dict[str, Any]:
        profile = self.get_profile(user_id)
        if not profile or profile.get("credit_balance", 0) < amount:
            raise ValueError("Insufficient credits")
            
        with self._get_conn() as conn:
            conn.execute(
                "UPDATE profiles SET credit_balance = credit_balance - ?, updated_at = ? WHERE user_id = ?",
                (amount, datetime.now(timezone.utc).isoformat(), user_id)
            )
        return self.get_profile(user_id)

    def list_clips(self, user_id: str, page: int, page_size: int) -> tuple[list[dict[str, Any]], int]:
        offset = (page - 1) * page_size
        with self._get_conn() as conn:
            total = conn.execute("SELECT count(*) FROM clips WHERE user_id = ?", (user_id,)).fetchone()[0]
            rows = conn.execute(
                "SELECT * FROM clips WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?",
                (user_id, page_size, offset)
            ).fetchall()
            return [dict(r) for r in rows], total

    def create_clip(self, clip_payload: dict[str, Any]) -> dict[str, Any]:
        if "clip_id" not in clip_payload:
            clip_payload["clip_id"] = str(uuid.uuid4())
            
        columns = ", ".join(clip_payload.keys())
        placeholders = ", ".join(["?" for _ in clip_payload])
        values = tuple(clip_payload.values())
        
        with self._get_conn() as conn:
            conn.execute(f"INSERT INTO clips ({columns}) VALUES ({placeholders})", values)
            
        return self.get_clip(clip_payload["user_id"], clip_payload["clip_id"])

    def count_stream_clips(self, user_id: str, stream_id: str) -> int:
        with self._get_conn() as conn:
            return conn.execute(
                "SELECT count(*) FROM clips WHERE user_id = ? AND stream_id = ?",
                (user_id, stream_id)
            ).fetchone()[0]

    def get_clip(self, user_id: str, clip_id: str) -> dict[str, Any] | None:
        with self._get_conn() as conn:
            row = conn.execute("SELECT * FROM clips WHERE user_id = ? AND clip_id = ?", (user_id, clip_id)).fetchone()
            return dict(row) if row else None

    def delete_clip(self, user_id: str, clip_id: str) -> None:
        with self._get_conn() as conn:
            conn.execute("DELETE FROM clips WHERE user_id = ? AND clip_id = ?", (user_id, clip_id))

    def update_clip(self, clip_id: str, updates: dict[str, Any]) -> dict[str, Any] | None:
        if not updates:
            return None
            
        updates["updated_at"] = datetime.now(timezone.utc).isoformat()
        set_clause = ", ".join([f"{k} = ?" for k in updates.keys()])
        values = list(updates.values()) + [clip_id]
        
        with self._get_conn() as conn:
            conn.execute(f"UPDATE clips SET {set_clause} WHERE clip_id = ?", values)
            row = conn.execute("SELECT * FROM clips WHERE clip_id = ?", (clip_id,)).fetchone()
            return dict(row) if row else None

    def mark_old_clips_for_deletion(self, retention_days: int) -> list[dict[str, Any]]:
        cutoff_date = (datetime.now(timezone.utc) - timedelta(days=retention_days)).isoformat()
        with self._get_conn() as conn:
            rows = conn.execute("SELECT * FROM clips WHERE created_at < ?", (cutoff_date,)).fetchall()
            return [dict(r) for r in rows]

    def update_plan_by_customer(self, stripe_customer_id: str, plan_tier: str) -> None:
        pass # No longer tracking plans, but modifying this might break stripe webhook temporarily. Will handle in Stripe updates.

    def set_customer_id(self, user_id: str, customer_id: str) -> None:
        with self._get_conn() as conn:
            conn.execute(
                "UPDATE profiles SET stripe_customer_id = ?, updated_at = ? WHERE user_id = ?",
                (customer_id, datetime.now(timezone.utc).isoformat(), user_id)
            )
