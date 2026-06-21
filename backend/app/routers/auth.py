from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.models.database import User, get_db
import hashlib

router = APIRouter()

class UserRegister(BaseModel):
    name: str
    email: str
    password: str

class UserLogin(BaseModel):
    email: str
    password: str

class UserResponse(BaseModel):
    name: str
    email: str
    id: int
    token: str

def hash_password(password: str) -> str:
    # Basic hashing for demo functionality. In production, use passlib with bcrypt.
    return hashlib.sha256(password.encode()).hexdigest()

@router.post("/auth/register")
def register_user(user: UserRegister, db: Session = Depends(get_db)):
    if db.query(User).filter(User.name == user.name).first():
        raise HTTPException(status_code=400, detail="Username is already taken. Please select a different username.")
    if db.query(User).filter(User.email == user.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_pwd = hash_password(user.password)
    new_user = User(name=user.name, email=user.email, password_hash=hashed_pwd)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    return UserResponse(name=new_user.name, email=new_user.email, id=new_user.id, token="MOCK_JWT_TOKEN_" + new_user.email)

@router.post("/auth/login")
def login_user(user: UserLogin, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.email == user.email).first()
    if not db_user or db_user.password_hash != hash_password(user.password):
        raise HTTPException(status_code=401, detail="Invalid email or password")
        
    return UserResponse(name=db_user.name, email=db_user.email, id=db_user.id, token="MOCK_JWT_TOKEN_" + db_user.email)
