from passlib.context import CryptContext
pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")
print("Testing hashing...")
try:
    h = pwd_context.hash("password123")
    print(f"Hash: {h}")
except Exception as e:
    print(f"Error: {e}")
