from sqlalchemy.orm import Session

from app.models.user import User
from app.core.security import (
    hash_password,
    verify_password
)


# ==========================================
# FIND USER BY EMAIL
# ==========================================

def get_user_by_email(
    db: Session,
    email: str
):
    return (
        db.query(User)
        .filter(User.email == email)
        .first()
    )


# ==========================================
# CREATE USER
# ==========================================

def create_user(
    db: Session,
    name: str,
    email: str,
    password: str
):

    # Check whether email already exists
    existing_user = get_user_by_email(
        db,
        email
    )

    if existing_user:
        raise ValueError(
            "A user with this email already exists."
        )

    # Convert password into secure hash
    hashed_password = hash_password(password)

    user = User(
        name=name,
        email=email,
        password_hash=hashed_password,
        role="user"
    )

    db.add(user)
    db.commit()
    db.refresh(user)

    return user


# ==========================================
# AUTHENTICATE USER
# ==========================================

def authenticate_user(
    db: Session,
    email: str,
    password: str
):

    user = get_user_by_email(
        db,
        email
    )

    # User doesn't exist
    if not user:
        return None

    # Password doesn't match
    if not verify_password(
        password,
        user.password_hash
    ):
        return None

    return user