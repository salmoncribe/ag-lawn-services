from __future__ import annotations

from cryptography.fernet import Fernet


def build_fernet(key: str) -> Fernet:
    return Fernet(key.encode("utf-8"))


def encrypt_text(cipher: Fernet, value: str) -> str:
    return cipher.encrypt(value.encode("utf-8")).decode("utf-8")


def decrypt_text(cipher: Fernet, value: str | None) -> str | None:
    if not value:
        return None
    return cipher.decrypt(value.encode("utf-8")).decode("utf-8")
