import asyncio
import logging
import os

logger = logging.getLogger(__name__)


class YouTubeScraper:
    def __init__(self):
        self._youtube = None

    def _get_client(self):
        if self._youtube is None:
            from googleapiclient.discovery import build
            api_key = os.getenv("YOUTUBE_API_KEY", "")
            self._youtube = build("youtube", "v3", developerKey=api_key)
        return self._youtube

    def is_configured(self) -> bool:
        return bool(os.getenv("YOUTUBE_API_KEY"))

    async def get_trending_videos(
        self, region_code: str = "KR", max_results: int = 20
    ) -> list[dict]:
        if not self.is_configured():
            return []
        loop = asyncio.get_event_loop()
        try:
            return await loop.run_in_executor(None, self._fetch_trending, region_code, max_results)
        except Exception as e:
            logger.error("YouTube trending fetch failed: %s", e)
            return []

    def _fetch_trending(self, region_code: str, max_results: int) -> list[dict]:
        yt = self._get_client()
        req = yt.videos().list(
            part="snippet,statistics",
            chart="mostPopular",
            regionCode=region_code,
            maxResults=max_results,
        )
        resp = req.execute()

        videos = []
        for i, item in enumerate(resp.get("items", [])):
            snippet = item.get("snippet", {})
            stats = item.get("statistics", {})
            thumbnails = snippet.get("thumbnails", {})
            thumb = (
                thumbnails.get("medium", {}).get("url")
                or thumbnails.get("default", {}).get("url")
            )
            videos.append({
                "platform": "youtube",
                "rank": i + 1,
                "title": snippet.get("title", ""),
                "channel": snippet.get("channelTitle", ""),
                "description": snippet.get("description", "")[:200],
                "url": f"https://youtube.com/watch?v={item['id']}",
                "thumbnail": thumb,
                "view_count": int(stats.get("viewCount", 0)),
                "like_count": int(stats.get("likeCount", 0)),
                "comment_count": int(stats.get("commentCount", 0)),
                "published_at": snippet.get("publishedAt", ""),
                "tags": snippet.get("tags", [])[:5],
            })
        return videos
