from typing import Annotated

from fastapi import APIRouter, Header, HTTPException, Request, Response, status

from app.auth import CurrentUser, OptionalCurrentUser
from app.models import Credentials, ErrorResponse, User


router = APIRouter(prefix="/auth", tags=["Authentication"])


def set_auth(response: Response, token: str) -> None:
    response.headers["Authorization"] = f"Bearer {token}"
    response.set_cookie(
        "snake_session",
        token,
        httponly=True,
        samesite="lax",
        path="/",
    )


@router.get("/me", response_model=User, operation_id="getCurrentUser")
async def get_current_user(user: CurrentUser) -> User:
    return user


@router.post(
    "/login",
    response_model=User,
    operation_id="login",
    responses={401: {"model": ErrorResponse}},
)
async def login(
    credentials: Credentials, request: Request, response: Response
) -> User:
    user = request.app.state.store.authenticate(
        credentials.username, credentials.password
    )
    if user is None:
        raise HTTPException(
            status_code=401,
            detail={
                "error": "invalid_credentials",
                "message": "Invalid username or password",
            },
        )
    set_auth(response, request.app.state.store.issue_token(user.id))
    return user


@router.post(
    "/signup",
    response_model=User,
    status_code=status.HTTP_201_CREATED,
    operation_id="signup",
    responses={409: {"model": ErrorResponse}},
)
async def signup(
    credentials: Credentials, request: Request, response: Response
) -> User:
    username = credentials.username.strip()
    if not username or not credentials.password.strip():
        raise HTTPException(
            status_code=400,
            detail={
                "error": "invalid_request",
                "message": "Username and password are required",
            },
        )
    user = request.app.state.store.signup(username, credentials.password)
    if user is None:
        raise HTTPException(
            status_code=409,
            detail={"error": "username_taken", "message": "Username is already taken"},
        )
    set_auth(response, request.app.state.store.issue_token(user.id))
    return user


@router.post(
    "/logout",
    status_code=status.HTTP_204_NO_CONTENT,
    operation_id="logout",
)
async def logout(
    user: OptionalCurrentUser,
    request: Request,
    response: Response,
    authorization: Annotated[str | None, Header()] = None,
) -> None:
    if user is None:
        raise HTTPException(
            status_code=401,
            detail={"error": "not_authenticated", "message": "Not authenticated"},
        )
    token = (
        authorization.removeprefix("Bearer ").strip()
        if authorization and authorization.startswith("Bearer ")
        else request.cookies.get("snake_session")
    )
    if token:
        request.app.state.store.revoke_token(token)
    response.delete_cookie("snake_session", path="/")
