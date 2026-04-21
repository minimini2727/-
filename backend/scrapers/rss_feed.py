import asyncio
import logging
from typing import Optional

logger = logging.getLogger(__name__)

FEEDS: dict[str, str] = {
    "google_news_kr": "https://news.google.com/rss?hl=ko&gl=KR&ceid=KR:ko",
    "google_news_tech": (
        "https://news.google.com/rss/topics/"
        "CAAqJggKIiBDQkFTRWdvSUwyMHZNRGRqTVhZU0FtdHZHZ0pMVWlnQVAB"
        "?hl=ko&gl=KR&ceid=KR:ko"
    ),
    "google_news_biz": (
        "https://news.google.com/rss/topics/"
        "CAAqJggKIiBDQkFTRWdvSUwyMHZNRGt6Y1hZU0FtdHZHZ0pMVWlnQVAB"
        "?hl=ko&gl=KR&ceid=KR:ko"
    ),
    "yna_top": "https://www.yna.co.kr/rss/news.xml",
}


class RSSFeedScraper:
    async def fetch_feed(self, name: str, url: str) -> list[dict]:
        loop = asyncio.get_event_loop()
        try:
            return await loop.run_in_executor(None, self._parse_feed, name, url)
        except Exception as e:
            logger.error("RSS feed %s failed: %s", name, e)
            return []

    def _parse_feed(self, name: str, url: str) -> list[dict]:
        import feedparser
        feed = feedparser.parse(url)
        items = []
        for entry in feed.entries[:15]:
            source = ""
            if hasattr(entry, "source"):
                source = getattr(entry.source, "title", "")
            items.append({
                "platform": "rss",
                "feed_name": name,
                "title": entry.get("title", ""),
                "url": entry.get("link", ""),
                "description": _strip_html(entry.get("summary", ""))[:300],
                "published": entry.get("published", ""),
                "source": source,
            })
        return items

    async def get_all_feeds(self) -> dict[str, list[dict]]:
        tasks = {name: self.fetch_feed(name, url) for name, url in FEEDS.items()}
        results: dict[str, list[dict]] = {}
        for name, coro in tasks.items():
            results[name] = await coro
        return results

    async def get_flat_items(self) -> list[dict]:
        all_feeds = await self.get_all_feeds()
        flat = []
        for items in all_feeds.values():
            flat.extend(items)
        return flat


def _strip_html(text: str) -> str:
    import re
    return re.sub(r"<[^>]+>", "", text).strip()
