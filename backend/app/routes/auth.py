from fastapi import APIRouter, Depends, status
from app.schemas.auth import RegisterRequest, VerifyRegistrationRequest, LoginRequest, VerifyLoginRequest, AuthResponse, UserMe
from app.services.auth_service import register_user_init, verify_registration_and_create, login_user_init, verify_login_and_authenticate
from app.core.dependencies import get_current_user, CurrentUser

router = APIRouter()

@router.post("/register", status_code=status.HTTP_202_ACCEPTED)
def register(payload: RegisterRequest):
    otp = register_user_init(payload.email, payload.password)
    return {"message": "OTP generated and sent", "otp_for_testing": otp}

@router.post("/verify-registration", response_model=AuthResponse)
def verify_registration(payload: VerifyRegistrationRequest):
    return verify_registration_and_create(payload.email, payload.password, payload.otp)

@router.post("/login", status_code=status.HTTP_202_ACCEPTED)
def login(payload: LoginRequest):
    otp = login_user_init(payload.email, payload.password)
    return {"message": "OTP generated and sent", "otp_for_testing": otp}

@router.post("/verify-login", response_model=AuthResponse)
def verify_login(payload: VerifyLoginRequest):
    return verify_login_and_authenticate(payload.email, payload.password, payload.otp)

@router.get("/me", response_model=UserMe)
def get_me(current_user: CurrentUser = Depends(get_current_user)):
    return current_user

@router.post("/logout")
def logout(current_user: CurrentUser = Depends(get_current_user)):
    return {"message": "Logged out successfully"}
