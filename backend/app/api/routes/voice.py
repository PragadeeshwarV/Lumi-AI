from fastapi import APIRouter, UploadFile, File, HTTPException, status
from app.services.voice_service import voice_service

router = APIRouter(prefix="/voice", tags=["Voice Assistant"])

@router.post("/transcribe")
async def transcribe_audio(file: UploadFile = File(...)):
    if not file.filename:
        raise HTTPException(status_code=400, detail="Audio file must have a filename.")

    audio_bytes = await file.read()
    if not audio_bytes:
        raise HTTPException(status_code=400, detail="Empty audio file provided.")

    text = await voice_service.transcribe_audio_file(audio_bytes, file.filename)
    return {"transcript": text}
