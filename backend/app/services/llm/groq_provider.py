import asyncio
import time
from typing import AsyncGenerator, Dict, Any, List
import groq
from app.core.config import settings
from app.core.logging import logger
from app.core.exceptions import ProviderConfigurationException
from app.services.llm.base import LLMProvider

class GroqProvider(LLMProvider):
    def __init__(self):
        self.api_key = settings.GROQ_API_KEY.strip()
        self.client = None
        if self.api_key:
            try:
                self.client = groq.AsyncGroq(
                    api_key=self.api_key,
                    timeout=settings.LLM_REQUEST_TIMEOUT
                )
            except Exception as e:
                logger.error(f"Failed to initialize Groq client: {e}")
                self.client = None

    def is_available(self) -> bool:
        return bool(self.api_key and len(self.api_key) > 5)

    def get_supported_models(self) -> List[str]:
        return settings.ALLOWED_MODELS

    async def stream_chat(
        self,
        messages: List[Dict[str, str]],
        model: str,
        temperature: float = 0.7,
        max_tokens: int = 2048,
    ) -> AsyncGenerator[Dict[str, Any], None]:
        if not self.is_available():
            raise ProviderConfigurationException(
                detail="Groq API key is not configured. Please set GROQ_API_KEY in your .env file or backend configuration."
            )

        if model not in settings.ALLOWED_MODELS:
            logger.warning(f"Model '{model}' not in allowlist. Falling back to {settings.GROQ_DEFAULT_MODEL}")
            model = settings.GROQ_DEFAULT_MODEL

        try:
            start_time = time.time()
            prompt_tokens = 0
            completion_tokens = 0

            stream = await self.client.chat.completions.create(
                model=model,
                messages=messages,
                temperature=max(0.0, min(temperature, 1.5)),
                max_tokens=max_tokens,
                stream=True
            )

            async for chunk in stream:
                if chunk.choices and len(chunk.choices) > 0:
                    delta = chunk.choices[0].delta
                    if delta and delta.content:
                        yield {"type": "token", "content": delta.content}

                # Groq returns usage in the final chunk or metadata
                if hasattr(chunk, "x_groq") and chunk.x_groq and hasattr(chunk.x_groq, "usage") and chunk.x_groq.usage:
                    u = chunk.x_groq.usage
                    prompt_tokens = getattr(u, "prompt_tokens", 0)
                    completion_tokens = getattr(u, "completion_tokens", 0)

            duration_ms = (time.time() - start_time) * 1000.0
            yield {
                "type": "usage",
                "prompt_tokens": prompt_tokens,
                "completion_tokens": completion_tokens,
                "latency_ms": round(duration_ms, 2)
            }

        except groq.AuthenticationError as e:
            logger.error(f"Groq Authentication failed: {e}")
            raise ProviderConfigurationException(detail="Groq authentication failed. Please verify that your GROQ_API_KEY is valid.")
        except groq.RateLimitError as e:
            logger.warning(f"Groq Rate limit encountered: {e}")
            raise ProviderConfigurationException(detail="Groq API rate limit reached. Please wait a few moments before sending another message.")
        except groq.APIConnectionError as e:
            logger.error(f"Groq Connection error: {e}")
            raise ProviderConfigurationException(detail="Unable to reach Groq API server. Please check your internet connection or try again later.")
        except groq.APIStatusError as e:
            logger.error(f"Groq API status error: {e.status_code} - {e.message}")
            raise ProviderConfigurationException(detail=f"Groq API error ({e.status_code}): {e.message}")
        except Exception as e:
            logger.error(f"Unexpected error in Groq provider: {e}", exc_info=True)
            raise ProviderConfigurationException(detail=f"Error communicating with AI provider: {str(e)}")
