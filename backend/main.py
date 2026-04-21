import asyncio
import logging
import os
import time
from contextlib import asynccontextmanager
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Query
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles

load_dotenv()

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")
logger = logging.getLogger(__name__)

from database import Base, engine
from cache import cache
from scrapers.google_trends import GoogleTrendsScraper
from scrapers.reddit import RedditScraper
from scrapers.youtube import YouTubeScraper
from scrapers.rss_feed import RSSFeedScraper
from scrapers.instagram import InstagramScraper
from scrapers.threads import ThreadsScraper
from scheduler import setup_scheduler

Base.metadata.create_all(bind=engine)

google_scraper = GoogleTrendsScraper()
reddit_scraper = RedditScraper()
youtube_scraper = YouTubeScraper()
rss_scraper = RSSFeedScraper()
instagram_scraper = InstagramScraper()
threads_scraper = ThreadsScraper()

_scheduler = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    global _scheduler
    _scheduler = setup_scheduler(app)
    _scheduler.start()
    logger.info("APScheduler started")
    yield
    _scheduler.shutdown(wait=False)
    logger.info("APScheduler stopped")


app = FastAPI(title="SNS Trends AI Agent", version="1.0.0", lifespan=lifespan)


# ── API Routes ──────────────────────────────────────────────────────────────


@app.get("/api/status")
async def get_status():
    return {
        "status": "running",
        "timestamp": time.time(),
        "sources": {
            "google_trends": {"available": True, "note": "pytrends (공개 API)"},
            "reddit": {
                "available": reddit_scraper.is_configured(),
                "note": "REDDIT_CLIENT_ID / SECRET 필요",
            },
            "youtube": {
                "available": youtube_scraper.is_configured(),
                "note": "YOUTUBE_API_KEY 필요",
            },
            "rss": {"available": True, "note": "인증 불필요"},
            "instagram": {"available": True, "note": "Playwright (공개 페이지만)"},
            "threads": {"available": True, "note": "Playwright (공개 피드)"},
        },
    }


@app.get("/api/trends/google")
async def get_google_trends():
    cached = cache.get("google_trends")
    if cached is not None:
        return {"source": "cache", "data": cached}
    data = await google_scraper.get_trending_searches()
    cache.set("google_trends", data, ttl=1800)
    return {"source": "live", "data": data}


@app.get("/api/trends/google/interest")
async def get_google_interest(
    keywords: str = Query(..., description="쉼표로 구분된 키워드"),
    timeframe: str = Query("now 7-d", description="pytrends 시간 범위"),
):
    kw_list = [k.strip() for k in keywords.split(",") if k.strip()][:5]
    if not kw_list:
        raise HTTPException(status_code=400, detail="keywords 파라미터가 필요합니다")
    data = await google_scraper.get_interest_over_time(kw_list, timeframe)
    return {"keywords": kw_list, "data": data}


@app.get("/api/trends/reddit")
async def get_reddit_trends():
    cached = cache.get("reddit_trends")
    if cached is not None:
        return {"source": "cache", "data": cached}
    data = await reddit_scraper.get_hot_posts()
    cache.set("reddit_trends", data, ttl=1800)
    return {"source": "live", "data": data}


@app.get("/api/trends/youtube")
async def get_youtube_trends(region: str = Query("KR")):
    key = f"youtube_trends_{region}"
    cached = cache.get(key)
    if cached is not None:
        return {"source": "cache", "data": cached}
    data = await youtube_scraper.get_trending_videos(region_code=region)
    cache.set(key, data, ttl=3600)
    return {"source": "live", "data": data}


@app.get("/api/trends/rss")
async def get_rss_trends():
    cached = cache.get("rss_trends")
    if cached is not None:
        return {"source": "cache", "data": cached}
    data = await rss_scraper.get_flat_items()
    cache.set("rss_trends", data, ttl=900)
    return {"source": "live", "data": data}


@app.get("/api/trends/instagram/{hashtag}")
async def get_instagram_trends(hashtag: str):
    key = f"instagram_{hashtag}"
    cached = cache.get(key)
    if cached is not None:
        return {"source": "cache", "data": cached}
    data = await instagram_scraper.get_hashtag_posts(hashtag)
    cache.set(key, data, ttl=3600)
    return {"source": "live", "data": data}


@app.get("/api/trends/threads")
async def get_threads_trends():
    cached = cache.get("threads_trends")
    if cached is not None:
        return {"source": "cache", "data": cached}
    data = await threads_scraper.get_trending()
    cache.set("threads_trends", data, ttl=3600)
    return {"source": "live", "data": data}


@app.get("/api/trends/all")
async def get_all_trends():
    """단일 요청으로 모든 플랫폼 트렌드 반환 (캐시 우선)."""
    results: dict = {}

    async def _safe(key: str, coro):
        try:
            results[key] = await coro
        except Exception as e:
            logger.warning("all-trends %s failed: %s", key, e)
            results[key] = []

    cached_google = cache.get("google_trends")
    cached_reddit = cache.get("reddit_trends")
    cached_youtube = cache.get("youtube_trends_KR")
    cached_rss = cache.get("rss_trends")

    tasks = []
    if cached_google is not None:
        results["google"] = cached_google
    else:
        tasks.append(_safe("google", google_scraper.get_trending_searches()))

    if cached_reddit is not None:
        results["reddit"] = cached_reddit
    else:
        tasks.append(_safe("reddit", reddit_scraper.get_hot_posts()))

    if cached_youtube is not None:
        results["youtube"] = cached_youtube
    else:
        tasks.append(_safe("youtube", youtube_scraper.get_trending_videos()))

    if cached_rss is not None:
        results["rss"] = cached_rss
    else:
        tasks.append(_safe("rss", rss_scraper.get_flat_items()))

    if tasks:
        await asyncio.gather(*tasks)

    # Cache fresh results
    if "google" in results and results["google"]:
        cache.set("google_trends", results["google"], ttl=1800)
    if "reddit" in results and results["reddit"]:
        cache.set("reddit_trends", results["reddit"], ttl=1800)
    if "youtube" in results and results["youtube"]:
        cache.set("youtube_trends_KR", results["youtube"], ttl=3600)
    if "rss" in results and results["rss"]:
        cache.set("rss_trends", results["rss"], ttl=900)

    return {
        "timestamp": time.time(),
        "data": results,
        "meta": {
            "google_count": len(results.get("google", [])),
            "reddit_count": len(results.get("reddit", [])),
            "youtube_count": len(results.get("youtube", [])),
            "rss_count": len(results.get("rss", [])),
        },
    }


@app.post("/api/collect")
async def trigger_collection(platform: str = Query("all")):
    """수동으로 데이터 수집 트리거."""
    collected = {}

    async def _run(name: str, coro, cache_key: str, ttl: int):
        try:
            data = await coro
            if data:
                cache.set(cache_key, data, ttl=ttl)
            collected[name] = len(data) if isinstance(data, list) else "ok"
        except Exception as e:
            collected[name] = f"error: {e}"

    targets = {
        "google": (google_scraper.get_trending_searches(), "google_trends", 1800),
        "reddit": (reddit_scraper.get_hot_posts(), "reddit_trends", 1800),
        "youtube": (youtube_scraper.get_trending_videos(), "youtube_trends_KR", 3600),
        "rss": (rss_scraper.get_flat_items(), "rss_trends", 900),
    }

    if platform == "all":
        await asyncio.gather(*[_run(k, *v) for k, v in targets.items()])
    elif platform in targets:
        await _run(platform, *targets[platform])
    else:
        raise HTTPException(status_code=400, detail=f"알 수 없는 플랫폼: {platform}")

    return {"collected": collected, "timestamp": time.time()}


# ── Static files ─────────────────────────────────────────────────────────────

_static_dir = Path(__file__).parent / "static"
app.mount("/static", StaticFiles(directory=str(_static_dir)), name="static")


@app.get("/", response_class=HTMLResponse)
async def root():
    html_path = _static_dir / "index.html"
    return HTMLResponse(html_path.read_text(encoding="utf-8"))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host=os.getenv("HOST", "0.0.0.0"),
        port=int(os.getenv("PORT", "8000")),
        reload=True,
    )
