from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime

class RegisterRequest(BaseModel):
    email: EmailStr
    password: str

class VerifyRegistrationRequest(BaseModel):
    email: EmailStr
    password: str
    otp: str

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class VerifyLoginRequest(BaseModel):
    email: EmailStr
    password: str
    otp: str

class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: str
    email: str

class UserMe(BaseModel):
    id: str
    email: str
