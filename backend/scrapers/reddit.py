import asyncio
import logging
import os
from typing import Optional

logger = logging.getLogger(__name__)

DEFAULT_SUBREDDITS = [
    "technology", "worldnews", "programming", "artificial",
    "MachineLearning", "datascience", "Korea",
]


class RedditScraper:
    def __init__(self):
        self._reddit = None

    def _get_client(self):
        if self._reddit is None:
            import praw
            self._reddit = praw.Reddit(
                client_id=os.getenv("REDDIT_CLIENT_ID", ""),
                client_secret=os.getenv("REDDIT_CLIENT_SECRET", ""),
                user_agent="SNSTrendBot/1.0 (by u/trend_collector)",
                read_only=True,
            )
        return self._reddit

    def is_configured(self) -> bool:
        return bool(os.getenv("REDDIT_CLIENT_ID") and os.getenv("REDDIT_CLIENT_SECRET"))

    async def get_hot_posts(
        self, subreddits: Optional[list[str]] = None, limit: int = 10
    ) -> list[dict]:
        if not self.is_configured():
            return []
        subs = subreddits or DEFAULT_SUBREDDITS
        loop = asyncio.get_event_loop()
        try:
            return await loop.run_in_executor(None, self._fetch_hot, subs, limit)
        except Exception as e:
            logger.error("Reddit fetch failed: %s", e)
            return []

    def _fetch_hot(self, subreddits: list[str], limit: int) -> list[dict]:
        reddit = self._get_client()
        posts = []
        for sub_name in subreddits:
            try:
                subreddit = reddit.subreddit(sub_name)
                for post in subreddit.hot(limit=limit):
                    if post.stickied:
                        continue
                    thumbnail = post.thumbnail if post.thumbnail.startswith("http") else None
                    posts.append({
                        "platform": "reddit",
                        "title": post.title,
                        "url": f"https://reddit.com{post.permalink}",
                        "score": post.score,
                        "comment_count": post.num_comments,
                        "subreddit": sub_name,
                        "author": str(post.author) if post.author else "[deleted]",
                        "thumbnail": thumbnail,
                        "upvote_ratio": post.upvote_ratio,
                    })
            except Exception as e:
                logger.warning("r/%s fetch error: %s", sub_name, e)
        return posts

    async def get_trending_subreddits(self) -> list[dict]:
        if not self.is_configured():
            return []
        loop = asyncio.get_event_loop()
        try:
            return await loop.run_in_executor(None, self._fetch_trending_subs)
        except Exception as e:
            logger.error("Reddit trending subs failed: %s", e)
            return []

    def _fetch_trending_subs(self) -> list[dict]:
        reddit = self._get_client()
        subs = reddit.subreddits.popular(limit=10)
        return [
            {"name": s.display_name, "subscribers": s.subscribers, "title": s.title}
            for s in subs
        ]
