from fastapi import FastAPI
# Trigger reload
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings

from app.routes import auth, profile, onboarding, checkin, sleep, eeg, cognitive, prediction, recovery, iot
from app.database.supabase import supabase_admin

app = FastAPI(
    title="NoctaLink Backend API",
    description="Backend API for NoctaLink Cognitive Twin System",
    version="2.0.0"
)

# Configure CORS
origins = [
    settings.FRONTEND_URL,
    "http://localhost:3000",
    "http://localhost:8080",
    "http://127.0.0.1:8080",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health", tags=["Health"])
def health_check():
    db_status = "connected" if supabase_admin else "disconnected"
    return {
        "status": "ok", 
        "version": "2.0.0",
        "database": db_status,
        "cognitive_model": "mocked" if settings.MOCK_ML else "not_ready",
        "sleep_model": "mocked" if settings.MOCK_ML else "not_ready"
    }

# Include routers
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(profile.router, prefix="/api/profile", tags=["Profile"])
app.include_router(onboarding.router, prefix="/api/onboarding", tags=["Onboarding"])
app.include_router(checkin.router, prefix="/api/checkin", tags=["Daily Check-in"])
app.include_router(sleep.router, prefix="/api/sleep", tags=["Sleep"])
app.include_router(eeg.router, prefix="/api/eeg", tags=["EEG Features"])
app.include_router(iot.router, prefix="/api/iot", tags=["IoT Integration"])
app.include_router(cognitive.router, prefix="/api/cognitive-twin", tags=["Cognitive Twin"])
app.include_router(prediction.router, prefix="/api/predictions", tags=["Predictions"])
app.include_router(recovery.router, prefix="/api/recovery", tags=["Recovery"])
