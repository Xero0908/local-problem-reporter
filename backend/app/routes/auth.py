from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
from datetime import timedelta
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import string
import random
import os

from ..database import get_db
from ..models import User
from ..services.auth import (
    hash_password, verify_password, create_access_token, decode_access_token
)

router = APIRouter(prefix="/api/auth", tags=["auth"])

# Security questions for password recovery
SECURITY_QUESTIONS = [
    "What is your favorite color?",
    "What is the name of your first pet?",
    "What city were you born in?",
    "What is your mother's maiden name?",
    "What is the name of your best friend?",
    "What was the name of your primary school?",
    "What is your favorite food?",
    "In what year were you born?",
    "What is the make of your first car?",
    "What is your favorite movie?",
    "What is the name of the street you grew up on?",
    "What is your favorite sport?",
    "What is the name of your first employer?",
    "What is your favorite book?",
    "What is your lucky number?",
]


def get_random_security_question():
    """Get a random security question"""
    return random.choice(SECURITY_QUESTIONS)


def generate_temporary_password(length: int = 12) -> str:
    """Generate a random temporary password"""
    characters = string.ascii_letters + string.digits + "!@#$%^&*"
    return ''.join(random.choice(characters) for _ in range(length))


def send_email(recipient_email: str, subject: str, body: str, html_body: str = None) -> bool:
    """Send email to user"""
    try:
        # Email configuration from environment
        sender_email = os.getenv("EMAIL_SMTP_USERNAME", os.getenv("SENDER_EMAIL"))
        sender_password = os.getenv("EMAIL_SMTP_PASSWORD", os.getenv("SENDER_PASSWORD"))
        smtp_server = os.getenv("EMAIL_SMTP_SERVER", "smtp.gmail.com")
        smtp_port = int(os.getenv("EMAIL_SMTP_PORT", "587"))
        
        # Validate configuration
        if not sender_email or not sender_password:
            print("Error: Email credentials not configured in environment variables")
            print("Set EMAIL_SMTP_USERNAME and EMAIL_SMTP_PASSWORD or SENDER_EMAIL and SENDER_PASSWORD")
            return False
        
        # Create message
        message = MIMEMultipart("alternative")
        message["Subject"] = subject
        message["From"] = sender_email
        message["To"] = recipient_email
        
        # Attach plain text and HTML versions
        message.attach(MIMEText(body, "plain"))
        if html_body:
            message.attach(MIMEText(html_body, "html"))
        
        # Send email
        with smtplib.SMTP(smtp_server, smtp_port) as server:
            server.starttls()
            server.login(sender_email, sender_password)
            server.sendmail(sender_email, recipient_email, message.as_string())
        
        print(f"Email sent successfully to {recipient_email}")
        return True
    except Exception as e:
        print(f"Error sending email: {str(e)}")
        return False


class UserLogin(BaseModel):
    email: str
    password: str


class UserRegister(BaseModel):
    email: str
    username: str
    full_name: str
    password: str
    security_question: str
    security_answer: str


class ForgotPasswordRequest(BaseModel):
    email: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    user_id: int
    email: str
    is_authority: bool


class UserResponse(BaseModel):
    id: int
    email: str
    username: str
    full_name: str
    is_authority: bool

    class Config:
        from_attributes = True


@router.post("/register")
async def register(user_data: UserRegister, db: Session = Depends(get_db)):
    """Register a new user"""
    
    # Check if email already exists
    existing_email = db.query(User).filter(User.email == user_data.email).first()
    if existing_email:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Check if username already exists
    existing_username = db.query(User).filter(User.username == user_data.username).first()
    if existing_username:
        raise HTTPException(status_code=400, detail="Username already taken")
    
    # Create new user
    hashed_password = hash_password(user_data.password)
    db_user = User(
        email=user_data.email,
        username=user_data.username,
        full_name=user_data.full_name,
        password_hash=hashed_password,
        is_authority=False,  # New users are regular users by default
        security_question=user_data.security_question,
        security_answer=user_data.security_answer.lower().strip()  # Store lowercase for comparison
    )
    
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    # Create access token
    access_token = create_access_token(
        data={"sub": str(db_user.id), "email": db_user.email, "is_authority": db_user.is_authority}
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user_id": db_user.id,
        "email": db_user.email,
        "is_authority": db_user.is_authority
    }


@router.post("/login")
async def login(credentials: UserLogin, db: Session = Depends(get_db)):
    """Login a user"""
    
    # Find user by email
    user = db.query(User).filter(User.email == credentials.email).first()
    if not user or not user.password_hash:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    # Verify password
    if not verify_password(credentials.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    # Create access token
    access_token = create_access_token(
        data={"sub": str(user.id), "email": user.email, "is_authority": user.is_authority}
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user_id": user.id,
        "email": user.email,
        "is_authority": user.is_authority
    }


@router.get("/me")
async def get_current_user(token: str = Query(...), db: Session = Depends(get_db)):
    """Get current authenticated user"""
    
    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    
    user_id = payload.get("sub")
    user = db.query(User).filter(User.id == int(user_id)).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return user


@router.post("/verify-authority")
async def verify_authority(token: str = Query(...), db: Session = Depends(get_db)):
    """Verify if current user is an authority"""
    
    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    
    is_authority = payload.get("is_authority", False)
    if not is_authority:
        raise HTTPException(status_code=403, detail="User is not an authority")
    
    return {"is_authority": True}


@router.get("/random-security-question")
async def get_random_question():
    """Get a random security question for registration"""
    return {
        "question": get_random_security_question()
    }


class SecurityQuestionVerification(BaseModel):
    email: str
    security_answer: str


@router.get("/security-question")
async def get_security_question(email: str = Query(...), db: Session = Depends(get_db)):
    """Get security question for a user (for password reset)"""
    
    user = db.query(User).filter(User.email == email).first()
    if not user or not user.security_question:
        return {
            "question": None,
            "found": False,
            "message": "Email not found or security question not set"
        }
    
    return {
        "question": user.security_question,
        "found": True,
        "message": "Security question retrieved"
    }


@router.post("/forgot-password")
async def forgot_password(request: SecurityQuestionVerification, db: Session = Depends(get_db)):
    """Reset password using security question verification"""
    
    # Find user by email
    user = db.query(User).filter(User.email == request.email).first()
    if not user:
        # Don't reveal if email exists for security
        return {
            "success": False,
            "message": "Email or security answer is incorrect.",
            "temporary_password": None
        }
    
    # Verify security answer (case-insensitive, trimmed)
    provided_answer = request.security_answer.lower().strip()
    if not user.security_answer or provided_answer != user.security_answer:
        return {
            "success": False,
            "message": "Email or security answer is incorrect.",
            "temporary_password": None
        }
    
    # Generate temporary password
    temp_password = generate_temporary_password()
    
    # Hash and update password
    hashed_password = hash_password(temp_password)
    user.password_hash = hashed_password
    db.commit()
    
    return {
        "success": True,
        "message": "Password reset successful. Use the temporary password to log in.",
        "temporary_password": temp_password,
        "user_name": user.full_name
    }

