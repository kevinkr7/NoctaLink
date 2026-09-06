import pyotp
import hashlib
from datetime import datetime, timedelta
from app.database.supabase import supabase_admin
from fastapi import HTTPException, status
import uuid

OTP_EXPIRY_MINUTES = 10
MAX_ATTEMPTS = 5

def _hash_otp(otp: str) -> str:
    return hashlib.sha256(otp.encode()).hexdigest()

def generate_otp(email: str, purpose: str) -> str:
    """Generates a secure 6-digit OTP and stores it in the database."""
    # Generate 6-digit OTP
    totp = pyotp.TOTP(pyotp.random_base32())
    otp_code = totp.now()
    
    hashed_otp = _hash_otp(otp_code)
    expires_at = (datetime.utcnow() + timedelta(minutes=OTP_EXPIRY_MINUTES)).isoformat()
    
    # Store in DB
    data = {
        "email": email,
        "otp_hash": hashed_otp,
        "purpose": purpose,
        "expires_at": expires_at
    }
    
    res = supabase_admin.table("otp_verifications").insert(data).execute()
    
    # In a real app, send the OTP via Email/SMS here
    # For now we will return it so it can be seen in the response or logs
    print(f"Generated OTP for {email} ({purpose}): {otp_code}")
    
    return otp_code

def verify_otp(email: str, otp: str, purpose: str) -> bool:
    """Verifies the OTP against the database."""
    # Find latest unverified OTP for this email and purpose
    res = supabase_admin.table("otp_verifications") \
        .select("*") \
        .eq("email", email) \
        .eq("purpose", purpose) \
        .eq("verified", False) \
        .order("created_at", desc=True) \
        .limit(1) \
        .execute()
        
    if not res.data:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No active OTP found")
        
    record = res.data[0]
    
    if record["attempts"] >= MAX_ATTEMPTS:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Max attempts exceeded")
        
    # Check expiry (Supabase returns ISO string, parse carefully if needed)
    # Simple string comparison works for UTC ISO formats
    if datetime.utcnow().isoformat() > record["expires_at"]:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="OTP expired")
        
    hashed_input = _hash_otp(otp)
    
    if hashed_input == record["otp_hash"]:
        # Mark as verified
        supabase_admin.table("otp_verifications") \
            .update({"verified": True}) \
            .eq("id", record["id"]) \
            .execute()
        return True
    else:
        # Increment attempts
        supabase_admin.table("otp_verifications") \
            .update({"attempts": record["attempts"] + 1}) \
            .eq("id", record["id"]) \
            .execute()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid OTP")
