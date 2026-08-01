import hmac
import hashlib
import time
from datetime import datetime, timedelta
from typing import Optional, Union, Any, Tuple
import jwt
from passlib.context import CryptContext
from app.core.config import settings

import bcrypt

# Password Context Helper using direct bcrypt
def verify_password(plain_password: str, hashed_password: str) -> bool:
    if not plain_password or not hashed_password:
        return False
    plain = plain_password.strip()
    hashed = hashed_password.strip()
    try:
        if hashed.startswith("$2"):
            return bcrypt.checkpw(plain.encode('utf-8'), hashed.encode('utf-8'))
        hashed_plain = hashlib.sha256(plain.encode('utf-8')).hexdigest()
        return hashed_plain == hashed
    except Exception:
        try:
            hashed_plain = hashlib.sha256(plain.encode('utf-8')).hexdigest()
            return hashed_plain == hashed
        except Exception:
            return False


def get_password_hash(password: str) -> str:
    try:
        salt = bcrypt.gensalt()
        return bcrypt.hashpw(password.strip().encode('utf-8'), salt).decode('utf-8')
    except Exception:
        return hashlib.sha256(password.strip().encode('utf-8')).hexdigest()



def create_access_token(subject: Union[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode = {"exp": expire, "sub": str(subject)}
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt


def decode_access_token(token: str) -> Optional[dict]:
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload
    except jwt.PyJWTError:
        return None


# Physical Presence Rotating Token Security
def generate_presence_token(session_uuid: str, timestamp: Optional[int] = None) -> Tuple[str, int]:
    """
    Generates a time-synced 6-character hex token derived from the session UUID & secret key.
    The token rotates every TOKEN_ROTATION_INTERVAL_SECONDS (default 20s).
    Returns (token, remaining_seconds_until_next_rotation).
    """
    if timestamp is None:
        timestamp = int(time.time())
    
    interval = settings.TOKEN_ROTATION_INTERVAL_SECONDS
    time_counter = timestamp // interval
    seconds_remaining = interval - (timestamp % interval)
    
    # Secret seed composite
    key = f"{session_uuid}:{settings.PRESENCE_SECRET_SEED}:{time_counter}".encode('utf-8')
    raw_hmac = hmac.new(key, msg=f"csi_presence_{time_counter}".encode('utf-8'), digestmod=hashlib.sha256).hexdigest()
    
    # 6-character uppercase token
    token = raw_hmac[:6].upper()
    return token, seconds_remaining


def verify_presence_token(session_uuid: str, candidate_token: str) -> bool:
    """
    Verifies candidate token against current time window +/- TOKEN_VALIDITY_WINDOW_STEPS.
    """
    if not candidate_token:
        return False
    
    candidate_clean = candidate_token.strip().upper()
    current_time = int(time.time())
    interval = settings.TOKEN_ROTATION_INTERVAL_SECONDS
    
    # Check steps from -WINDOW to +WINDOW
    for window in range(-settings.TOKEN_VALIDITY_WINDOW_STEPS, settings.TOKEN_VALIDITY_WINDOW_STEPS + 1):
        test_time = current_time + (window * interval)
        valid_token, _ = generate_presence_token(session_uuid, test_time)
        if hmac.compare_digest(valid_token, candidate_clean):
            return True
            
    return False
