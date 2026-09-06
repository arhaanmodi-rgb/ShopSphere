"""
Authentication & Security utility re-exports for backward compatibility.
All core security logic resides in app.core.security.
"""

from app.core.security import (
    SECRET_KEY,
    ALGORITHM,
    ACCESS_TOKEN_EXPIRE_MINUTES,
    hash_password,
    verify_password,
    create_access_token,
    decode_access_token,
)

__all__ = [
    "SECRET_KEY",
    "ALGORITHM",
    "ACCESS_TOKEN_EXPIRE_MINUTES",
    "hash_password",
    "verify_password",
    "create_access_token",
    "decode_access_token",
]