import httpx
from typing import List, Dict, Any, Optional
from app.core.config import settings
from app.core.logging import logger

class WebSearchService:
    def __init__(self):
        self.enabled = settings.WEB_SEARCH_ENABLED
        self.provider = settings.WEB_SEARCH_PROVIDER.lower()
        self.api_key = settings.WEB_SEARCH_API_KEY.strip()

    def is_available(self) -> bool:
        if not self.enabled:
            return False
        if self.provider in ["tavily", "serpapi"] and not self.api_key:
            return False
        return True

    async def search(self, query: str, max_results: int = 4) -> List[Dict[str, str]]:
        if not self.is_available():
            logger.info("Web search requested but search provider is not enabled/configured.")
            return []

        try:
            if self.provider == "tavily" and self.api_key:
                return await self._search_tavily(query, max_results)
            elif self.provider == "serpapi" and self.api_key:
                return await self._search_serpapi(query, max_results)
            else:
                return await self._search_duckduckgo(query, max_results)
        except Exception as e:
            logger.warning(f"Web search failed for query '{query}': {e}")
            return []

    async def _search_duckduckgo(self, query: str, max_results: int) -> List[Dict[str, str]]:
        """Query DuckDuckGo API or HTML without requiring an API key."""
        results = []
        async with httpx.AsyncClient(timeout=10.0, follow_redirects=True) as client:
            # DuckDuckGo Instant Answer API
            resp = await client.get(
                "https://api.duckduckgo.com/",
                params={
                    "q": query,
                    "format": "json",
                    "no_html": "1",
                    "skip_disambig": "1"
                },
                headers={"User-Agent": "LumiAI/1.0"}
            )
            if resp.status_code == 200:
                data = resp.json()
                abstract = data.get("AbstractText", "")
                source_url = data.get("AbstractURL", "")
                heading = data.get("Heading", query)
                
                if abstract and source_url:
                    results.append({
                        "title": heading,
                        "url": source_url,
                        "snippet": abstract[:400]
                    })
                
                # Check related topics
                for topic in data.get("RelatedTopics", [])[:max_results]:
                    if isinstance(topic, dict) and "Text" in topic and "FirstURL" in topic:
                        results.append({
                            "title": topic.get("Text", "").split(" - ")[0],
                            "url": topic.get("FirstURL", ""),
                            "snippet": topic.get("Text", "")[:350]
                        })
                    if len(results) >= max_results:
                        break

            # If instant answer returned nothing, fallback to DuckDuckGo lite search
            if not results:
                html_resp = await client.post(
                    "https://lite.duckduckgo.com/lite/",
                    data={"q": query},
                    headers={
                        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
                        "Content-Type": "application/x-www-form-urlencoded"
                    }
                )
                if html_resp.status_code == 200:
                    from re import findall, sub
                    # Basic extraction from lite html
                    snippets = findall(r'<td class="result-snippet">(.*?)</td>', html_resp.text)
                    links = findall(r'<a class="result-link" href="([^"]+)">(.*?)</a>', html_resp.text)
                    for i in range(min(len(links), max_results)):
                        url, title = links[i]
                        snippet = snippets[i] if i < len(snippets) else ""
                        clean_title = sub('<[^<]+?>', '', title).strip()
                        clean_snippet = sub('<[^<]+?>', '', snippet).strip()
                        if clean_title and url:
                            results.append({
                                "title": clean_title,
                                "url": url,
                                "snippet": clean_snippet
                            })

        return results[:max_results]

    async def _search_tavily(self, query: str, max_results: int) -> List[Dict[str, str]]:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(
                "https://api.tavily.com/search",
                json={
                    "api_key": self.api_key,
                    "query": query,
                    "max_results": max_results,
                    "include_answer": False
                }
            )
            if resp.status_code == 200:
                data = resp.json()
                return [
                    {
                        "title": r.get("title", ""),
                        "url": r.get("url", ""),
                        "snippet": r.get("content", "")[:400]
                    }
                    for r in data.get("results", [])
                ]
            return []

    async def _search_serpapi(self, query: str, max_results: int) -> List[Dict[str, str]]:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(
                "https://serpapi.com/search",
                params={
                    "api_key": self.api_key,
                    "q": query,
                    "engine": "google",
                    "num": max_results
                }
            )
            if resp.status_code == 200:
                data = resp.json()
                results = []
                for r in data.get("organic_results", [])[:max_results]:
                    results.append({
                        "title": r.get("title", ""),
                        "url": r.get("link", ""),
                        "snippet": r.get("snippet", "")[:400]
                    })
                return results
            return []

search_service = WebSearchService()
