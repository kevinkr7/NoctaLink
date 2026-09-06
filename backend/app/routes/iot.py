from fastapi import APIRouter, Depends, HTTPException, status
from app.schemas.iot import IoTEEGPayload, IoTEEGResponse
from app.core.dependencies import get_current_user, CurrentUser
from app.database.supabase import supabase_admin
from app.services.cognitive_service import process_iot_eeg_payload
import uuid

router = APIRouter()

@router.post("/eeg", response_model=IoTEEGResponse)
def receive_iot_eeg(payload: IoTEEGPayload, current_user: CurrentUser = Depends(get_current_user)):
    """
    Endpoint for the NoctaLink IoT EEG Module to push processed EEG features.
    """
    try:
        # Pass to the cognitive service which handles processing, ML inference, and DB insertion
        result = process_iot_eeg_payload(current_user.id, payload)
        
        return IoTEEGResponse(
            id=result.get("id", str(uuid.uuid4())),
            message="EEG features processed and Cognitive Twin updated.",
            status="success"
        )
    except ValueError as ve:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"error": "INVALID_EEG_DATA", "message": str(ve)}
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"error": "PROCESSING_ERROR", "message": str(e)}
        )

@router.post("/eeg/test", response_model=IoTEEGResponse)
def receive_iot_eeg_test(payload: IoTEEGPayload, current_user: CurrentUser = Depends(get_current_user)):
    """
    [DEVELOPMENT ONLY] Test endpoint for testing the IoT EEG pipeline without actual hardware.
    """
    from app.core.config import settings
    if settings.ENVIRONMENT.lower() == "production" and not settings.MOCK_ML:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={"error": "DEVELOPMENT_ENDPOINT", "message": "This endpoint is disabled in production."}
        )

    try:
        result = process_iot_eeg_payload(current_user.id, payload)
        return IoTEEGResponse(
            id=result.get("id", str(uuid.uuid4())),
            message="[TEST] EEG features processed successfully.",
            status="success"
        )
    except ValueError as ve:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"error": "INVALID_EEG_DATA", "message": str(ve)}
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"error": "PROCESSING_ERROR", "message": str(e)}
        )
