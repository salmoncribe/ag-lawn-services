CREATE TABLE IF NOT EXISTS profiles (
    user_id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    plan_tier TEXT DEFAULT 'agency',
    stripe_customer_id TEXT,
    twitch_token TEXT,
    kick_token TEXT,
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
