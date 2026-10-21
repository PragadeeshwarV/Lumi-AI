from typing import Optional
from app.services.llm.base import LLMProvider
from app.services.llm.groq_provider import GroqProvider

class LLMRegistry:
    _instance: Optional["LLMRegistry"] = None
    _provider: Optional[LLMProvider] = None

    def __init__(self):
        self._provider = GroqProvider()

    @classmethod
    def get_instance(cls) -> "LLMRegistry":
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance

    def get_provider(self) -> LLMProvider:
        return self._provider

    def reload(self):
        self._provider = GroqProvider()

def get_llm_provider() -> LLMProvider:
    return LLMRegistry.get_instance().get_provider()
