from datetime import datetime, timedelta
from typing import Optional
import os
import bcrypt as bcrypt_lib
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import HTTPException, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.database import get_database
from app.core.config import settings

# Suppress passlib warnings to avoid initialization issues
os.environ['PASSLIB_SUPPRESS_WARNINGS'] = '1'

# Password hashing - using bcrypt for compatibility
# We use direct bcrypt to avoid passlib initialization bug detection issues
pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto",
    bcrypt__ident="2b",  # Use bcrypt 2b format
    bcrypt__rounds=12,  # Standard number of rounds
)

# JWT token handling
security = HTTPBearer()

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash"""
    import hashlib
    
    try:
        # Use direct bcrypt to avoid passlib initialization issues
        password_bytes = plain_password.encode('utf-8')
        hash_bytes = hashed_password.encode('utf-8')
        
        # Try direct verification
        if bcrypt_lib.checkpw(password_bytes, hash_bytes):
            return True
        
        # If password is longer than 72 bytes, it might have been pre-hashed with SHA256
        if len(password_bytes) > 72:
            password_hash = hashlib.sha256(password_bytes).hexdigest()
            if bcrypt_lib.checkpw(password_hash.encode('utf-8'), hash_bytes):
                return True
    except Exception as e:
        # Fallback to passlib if direct bcrypt fails
        try:
            if pwd_context.verify(plain_password, hashed_password):
                return True
        except:
            pass
    
    return False

def get_password_hash(password: str) -> str:
    """Hash a password"""
    # Bcrypt has a 72-byte limit, so we need to handle longer passwords
    # We'll hash the password first with SHA256, then bcrypt the hash
    import hashlib
    
    password_bytes = password.encode('utf-8')
    
    # Use direct bcrypt to avoid passlib initialization issues
    try:
        # If password is longer than 72 bytes, pre-hash with SHA256
        if len(password_bytes) > 72:
            password_hash = hashlib.sha256(password_bytes).hexdigest()
            password_to_hash = password_hash.encode('utf-8')
        else:
            password_to_hash = password_bytes
        
        salt = bcrypt_lib.gensalt(rounds=12)
        hashed = bcrypt_lib.hashpw(password_to_hash, salt)
        return hashed.decode('utf-8')
    except Exception as e:
        # Fallback to passlib if direct bcrypt fails
        try:
            if len(password_bytes) > 72:
                password_hash = hashlib.sha256(password_bytes).hexdigest()
                return pwd_context.hash(password_hash)
            else:
                return pwd_context.hash(password)
        except:
            # Last resort: simple bcrypt
            salt = bcrypt_lib.gensalt(rounds=12)
            hashed = bcrypt_lib.hashpw(password_bytes[:72], salt)  # Truncate to 72 bytes
            return hashed.decode('utf-8')

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Create JWT access token"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.access_token_expire_minutes)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.secret_key, algorithm=settings.algorithm)
    return encoded_jwt

def verify_token(token: str) -> Optional[dict]:
    """Verify JWT token"""
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
        return payload
    except JWTError:
        return None

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> dict:
    """Get current authenticated user"""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        payload = jwt.decode(credentials.credentials, settings.secret_key, algorithms=[settings.algorithm])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    db = await get_database()
    from bson import ObjectId
    try:
        user = await db.users.find_one({"_id": ObjectId(user_id)})
    except:
        raise credentials_exception
    
    if user is None:
        raise credentials_exception
    
    return user
