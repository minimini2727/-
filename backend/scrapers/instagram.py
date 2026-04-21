import asyncio
import logging

logger = logging.getLogger(__name__)


def _playwright_available() -> bool:
    try:
        import playwright  # noqa: F401
        return True
    except ImportError:
        return False


class InstagramScraper:
    """
    Scrapes public Instagram hashtag pages via Playwright.
    Returns empty list when blocked or Playwright is unavailable.
    """

    async def get_hashtag_posts(self, hashtag: str) -> list[dict]:
        if not _playwright_available():
            logger.info("Playwright not available — skipping Instagram scrape")
            return []
        try:
            return await self._scrape_hashtag(hashtag)
        except Exception as e:
            logger.warning("Instagram scrape failed for #%s: %s", hashtag, e)
            return []

    async def _scrape_hashtag(self, hashtag: str) -> list[dict]:
        from playwright.async_api import async_playwright

        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=True)
            try:
                context = await browser.new_context(
                    user_agent=(
                        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
                        "AppleWebKit/537.36 (KHTML, like Gecko) "
                        "Chrome/120.0.0.0 Safari/537.36"
                    ),
                    viewport={"width": 1280, "height": 800},
                )
                page = await context.new_page()
                await page.goto(
                    f"https://www.instagram.com/explore/tags/{hashtag}/",
                    wait_until="domcontentloaded",
                    timeout=20000,
                )
                await asyncio.sleep(3)

                posts = await page.evaluate("""
                    () => {
                        const imgs = document.querySelectorAll('article img');
                        return Array.from(imgs).slice(0, 12).map((img, i) => ({
                            platform: 'instagram',
                            rank: i + 1,
                            description: img.alt || '',
                            thumbnail: img.src || '',
                        }));
                    }
                """)
                return [p for p in posts if p.get("thumbnail")]
            finally:
                await browser.close()
