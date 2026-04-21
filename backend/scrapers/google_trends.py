import asyncio
import logging
from typing import Optional

logger = logging.getLogger(__name__)


class GoogleTrendsScraper:
    def __init__(self):
        self._pytrends = None

    def _get_client(self):
        if self._pytrends is None:
            from pytrends.request import TrendReq
            self._pytrends = TrendReq(hl="ko", tz=540, timeout=(10, 30))
        return self._pytrends

    async def get_trending_searches(self, country: str = "south_korea") -> list[dict]:
        loop = asyncio.get_event_loop()
        try:
            return await loop.run_in_executor(None, self._fetch_trending, country)
        except Exception as e:
            logger.error("Google Trends trending fetch failed: %s", e)
            return []

    def _fetch_trending(self, country: str) -> list[dict]:
        pt = self._get_client()
        df = pt.trending_searches(pn=country)
        return [{"title": row, "rank": i + 1, "platform": "google"} for i, row in enumerate(df[0].tolist()[:20])]

    async def get_related_queries(self, keyword: str) -> dict:
        loop = asyncio.get_event_loop()
        try:
            return await loop.run_in_executor(None, self._fetch_related, keyword)
        except Exception as e:
            logger.error("Google Trends related queries failed: %s", e)
            return {}

    def _fetch_related(self, keyword: str) -> dict:
        pt = self._get_client()
        pt.build_payload([keyword], timeframe="now 7-d")
        related = pt.related_queries()
        result = {}
        if keyword in related and related[keyword]["top"] is not None:
            result["top"] = related[keyword]["top"].head(10).to_dict("records")
        if keyword in related and related[keyword]["rising"] is not None:
            result["rising"] = related[keyword]["rising"].head(10).to_dict("records")
        return result

    async def get_interest_over_time(self, keywords: list[str], timeframe: str = "now 7-d") -> dict:
        loop = asyncio.get_event_loop()
        try:
            return await loop.run_in_executor(None, self._fetch_interest, keywords, timeframe)
        except Exception as e:
            logger.error("Google Trends interest over time failed: %s", e)
            return {}

    def _fetch_interest(self, keywords: list[str], timeframe: str) -> dict:
        pt = self._get_client()
        pt.build_payload(keywords[:5], timeframe=timeframe)
        df = pt.interest_over_time()
        if df.empty:
            return {}
        df = df.drop(columns=["isPartial"], errors="ignore")
        df.index = df.index.strftime("%Y-%m-%dT%H:%M:%S")
        return df.to_dict()
