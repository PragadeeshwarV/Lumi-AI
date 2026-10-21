import io
from pathlib import Path
from typing import Optional
from app.core.config import settings
from app.core.logging import logger
from app.core.exceptions import ProviderConfigurationException
import groq

class VoiceService:
    @staticmethod
    async def transcribe_audio_file(file_bytes: bytes, filename: str) -> str:
        """
        Transcribes audio using Groq's whisper-large-v3 model if Groq is configured.
        """
        if not settings.GROQ_API_KEY:
            raise ProviderConfigurationException(
                detail="Groq API key is not configured for server-side audio transcription. Please configure GROQ_API_KEY or use in-browser speech recognition."
            )

        try:
            client = groq.Groq(api_key=settings.GROQ_API_KEY)
            audio_file = (filename, file_bytes)
            transcription = client.audio.transcriptions.create(
                model="whisper-large-v3",
                file=audio_file,
                response_format="text"
            )
            return str(transcription).strip()
        except Exception as e:
            logger.error(f"Error during audio transcription: {e}")
            raise ProviderConfigurationException(detail=f"Audio transcription error: {str(e)}")

voice_service = VoiceService()
