from app.database.supabase import supabase_admin, supabase
from fastapi import HTTPException, status
from app.schemas.auth import AuthResponse
from app.services.otp_service import generate_otp, verify_otp

def register_user_init(email: str, password: str) -> str:
    """Initiates registration by generating an OTP. Does not create user yet."""
    return generate_otp(email, purpose="registration")

def verify_registration_and_create(email: str, password: str, otp: str) -> AuthResponse:
    """Verifies OTP and creates the Supabase user if valid."""
    verify_otp(email, otp, purpose="registration")
    
    # Create user in Supabase Auth
    try:
        # admin.auth.admin.create_user is needed to directly create a confirmed user
        response = supabase_admin.auth.admin.create_user({
            "email": email,
            "password": password,
            "email_confirm": True
        })
        
        user = response.user
        
        # Now sign them in to get a session
        auth_res = supabase_admin.auth.sign_in_with_password({
            "email": email,
            "password": password
        })
        
        return AuthResponse(
            access_token=auth_res.session.access_token,
            user_id=str(user.id),
            email=str(user.email)
        )
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

def login_user_init(email: str, password: str) -> str:
    """Validates credentials and sends OTP for login."""
    try:
        # Sign in to verify credentials. We discard the token because we want OTP first.
        # Note: In a real flow with Supabase MFA, you'd use their native MFA.
        # Since we are implementing a custom OTP flow, we verify credentials and then send our OTP.
        auth_res = supabase_admin.auth.sign_in_with_password({
            "email": email,
            "password": password
        })
        return generate_otp(email, purpose="login")
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

def verify_login_and_authenticate(email: str, password: str, otp: str) -> AuthResponse:
    """Verifies OTP and returns the session token."""
    verify_otp(email, otp, purpose="login")
    
    try:
        # Re-authenticate to issue the final token
        auth_res = supabase_admin.auth.sign_in_with_password({
            "email": email,
            "password": password
        })
        return AuthResponse(
            access_token=auth_res.session.access_token,
            user_id=str(auth_res.user.id),
            email=str(auth_res.user.email)
        )
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(e))
