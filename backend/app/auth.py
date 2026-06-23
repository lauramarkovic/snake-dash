import hashlib
import hmac
import secrets
from typing import Annotated

from fastapi import Cookie, Depends, HTTPException, Request
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.models import User


bearer_scheme = HTTPBearer(auto_error=False)


def hash_password(password: str) -> str:
    salt = secrets.token_bytes(16)
    digest = hashlib.scrypt(
        password.encode("utf-8"),
        salt=salt,
        n=2**14,
        r=8,
        p=1,
        dklen=32,
    )
    return f"scrypt${salt.hex()}${digest.hex()}"


def verify_password(password: str, encoded: str) -> bool:
    try:
        algorithm, salt_hex, expected_hex = encoded.split("$", 2)
        if algorithm != "scrypt":
            return False
        actual = hashlib.scrypt(
            password.encode("utf-8"),
            salt=bytes.fromhex(salt_hex),
            n=2**14,
            r=8,
            p=1,
            dklen=32,
        )
        return hmac.compare_digest(actual, bytes.fromhex(expected_hex))
    except (ValueError, TypeError):
        return False


def create_token() -> str:
    return secrets.token_urlsafe(32)


async def optional_current_user(
    request: Request,
    credentials: Annotated[
        HTTPAuthorizationCredentials | None, Depends(bearer_scheme)
    ],
    snake_session: Annotated[str | None, Cookie()] = None,
) -> User | None:
    token = credentials.credentials if credentials else snake_session
    if not token:
        return None
    return request.app.state.store.get_user_for_token(token)


async def require_current_user(
    user: Annotated[User | None, Depends(optional_current_user)],
) -> User:
    if user is None:
        raise HTTPException(
            status_code=401,
            detail={"error": "not_authenticated", "message": "Not authenticated"},
        )
    return user


CurrentUser = Annotated[User, Depends(require_current_user)]
OptionalCurrentUser = Annotated[User | None, Depends(optional_current_user)]
