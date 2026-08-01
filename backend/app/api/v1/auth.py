from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database.session import get_db
from app.models.user import User
from app.schemas.auth import LoginRequest, TokenResponse, UserResponse
from app.core.config import settings
from app.core.security import verify_password, get_password_hash, create_access_token, decode_access_token
from app.services.audit_service import log_action

router = APIRouter(prefix="/auth", tags=["Authentication"])


def get_current_user(request: Request, db: Session = Depends(get_db)) -> User:
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication credentials were not provided or invalid"
        )
    token = auth_header.split(" ")[1]
    payload = decode_access_token(token)
    if not payload or "sub" not in payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired access token"
        )
    username = payload["sub"]
    user = db.query(User).filter(User.username == username).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found"
        )
    return user


@router.post("/login", response_model=TokenResponse)
def login(login_data: LoginRequest, request: Request, db: Session = Depends(get_db)):
    clean_username = login_data.username.strip().lower()
    clean_password = login_data.password.strip()

    target_admin_username = settings.DEFAULT_ADMIN_USERNAME.strip().lower()
    target_admin_password = settings.DEFAULT_ADMIN_PASSWORD.strip()

    user = db.query(User).filter(func.lower(User.username) == clean_username).first()

    # Dynamic auto-creation of default admin if database is unseeded at runtime
    if not user and clean_username == target_admin_username:
        user = User(
            username=settings.DEFAULT_ADMIN_USERNAME.strip(),
            password_hash=get_password_hash(target_admin_password),
            full_name="CSI Committee Admin",
            email="admin@csi-catt.org",
            role="ADMIN"
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    is_valid = False
    if user:
        if clean_username == target_admin_username and clean_password == target_admin_password:
            # Synchronize DB password hash if mismatched
            if not verify_password(clean_password, user.password_hash):
                user.password_hash = get_password_hash(clean_password)
                db.commit()
            is_valid = True
        else:
            is_valid = verify_password(clean_password, user.password_hash)

    if not user or not is_valid:
        log_action(db, action="LOGIN_FAILED", performed_by=login_data.username, ip_address=request.client.host, details="Invalid username or password")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password"
        )

    access_token = create_access_token(subject=user.username)
    log_action(db, action="LOGIN_SUCCESS", performed_by=user.username, ip_address=request.client.host, details=f"User {user.username} logged in successfully")

    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        username=user.username,
        role=user.role,
        full_name=user.full_name
    )


@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user


@router.post("/logout")
def logout(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    log_action(db, action="LOGOUT", performed_by=current_user.username, details="User logged out")
    return {"message": "Logged out successfully"}
