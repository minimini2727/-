import logging
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.interval import IntervalTrigger

logger = logging.getLogger(__name__)


def setup_scheduler(app) -> AsyncIOScheduler:
    scheduler = AsyncIOScheduler(timezone="Asia/Seoul")

    scheduler.add_job(
        _collect_google,
        trigger=IntervalTrigger(minutes=30),
        id="collect_google",
        replace_existing=True,
        misfire_grace_time=60,
    )
    scheduler.add_job(
        _collect_reddit,
        trigger=IntervalTrigger(minutes=30),
        id="collect_reddit",
        replace_existing=True,
        misfire_grace_time=60,
    )
    scheduler.add_job(
        _collect_youtube,
        trigger=IntervalTrigger(hours=1),
        id="collect_youtube",
        replace_existing=True,
        misfire_grace_time=120,
    )
    scheduler.add_job(
        _collect_rss,
        trigger=IntervalTrigger(minutes=15),
        id="collect_rss",
        replace_existing=True,
        misfire_grace_time=30,
    )
    scheduler.add_job(
        _evict_cache,
        trigger=IntervalTrigger(minutes=10),
        id="evict_cache",
        replace_existing=True,
    )

    logger.info("Scheduler configured with %d jobs", len(scheduler.get_jobs()))
    return scheduler


async def _collect_google():
    from cache import cache
    from scrapers.google_trends import GoogleTrendsScraper
    try:
        scraper = GoogleTrendsScraper()
        data = await scraper.get_trending_searches()
        if data:
            cache.set("google_trends", data, ttl=1800)
            logger.info("Google Trends: collected %d items", len(data))
    except Exception as e:
        logger.error("Scheduled Google Trends collection failed: %s", e)


async def _collect_reddit():
    from cache import cache
    from scrapers.reddit import RedditScraper
    try:
        scraper = RedditScraper()
        data = await scraper.get_hot_posts()
        if data:
            cache.set("reddit_trends", data, ttl=1800)
            logger.info("Reddit: collected %d items", len(data))
    except Exception as e:
        logger.error("Scheduled Reddit collection failed: %s", e)


async def _collect_youtube():
    from cache import cache
    from scrapers.youtube import YouTubeScraper
    try:
        scraper = YouTubeScraper()
        data = await scraper.get_trending_videos()
        if data:
            cache.set("youtube_trends", data, ttl=3600)
            logger.info("YouTube: collected %d items", len(data))
    except Exception as e:
        logger.error("Scheduled YouTube collection failed: %s", e)


async def _collect_rss():
    from cache import cache
    from scrapers.rss_feed import RSSFeedScraper
    try:
        scraper = RSSFeedScraper()
        data = await scraper.get_flat_items()
        if data:
            cache.set("rss_trends", data, ttl=900)
            logger.info("RSS: collected %d items", len(data))
    except Exception as e:
        logger.error("Scheduled RSS collection failed: %s", e)


async def _evict_cache():
    from cache import cache
    cache.evict_expired()
