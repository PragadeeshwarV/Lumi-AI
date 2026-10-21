from abc import ABC, abstractmethod
from typing import AsyncGenerator, Dict, Any, List, Optional

class LLMProvider(ABC):
    @abstractmethod
    async def stream_chat(
        self,
        messages: List[Dict[str, str]],
        model: str,
        temperature: float = 0.7,
        max_tokens: int = 2048,
    ) -> AsyncGenerator[Dict[str, Any], None]:
        """
        Yields events:
        {"type": "token", "content": str}
        {"type": "usage", "prompt_tokens": int, "completion_tokens": int, "total_tokens": int}
        """
        pass

    @abstractmethod
    def is_available(self) -> bool:
        pass

    @abstractmethod
    def get_supported_models(self) -> List[str]:
        pass
