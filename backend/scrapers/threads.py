import asyncio
import logging

logger = logging.getLogger(__name__)


def _playwright_available() -> bool:
    try:
        import playwright  # noqa: F401
        return True
    except ImportError:
        return False


class ThreadsScraper:
    """
    Scrapes public Threads trending posts via Playwright.
    Returns empty list when blocked or Playwright is unavailable.
    """

    async def get_trending(self) -> list[dict]:
        if not _playwright_available():
            logger.info("Playwright not available — skipping Threads scrape")
            return []
        try:
            return await self._scrape_threads()
        except Exception as e:
            logger.warning("Threads scrape failed: %s", e)
            return []

    async def _scrape_threads(self) -> list[dict]:
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
                    viewport={"width": 1280, "height": 900},
                )
                page = await context.new_page()
                await page.goto(
                    "https://www.threads.net/",
                    wait_until="domcontentloaded",
                    timeout=20000,
                )
                await asyncio.sleep(4)

                posts = await page.evaluate("""
                    () => {
                        const articles = document.querySelectorAll('article, [role="article"]');
                        return Array.from(articles).slice(0, 10).map((el, i) => {
                            const textEl = el.querySelector('span, p');
                            const imgEl = el.querySelector('img');
                            return {
                                platform: 'threads',
                                rank: i + 1,
                                description: textEl?.textContent?.trim() || '',
                                thumbnail: imgEl?.src || '',
                            };
                        }).filter(p => p.description);
                    }
                """)
                return posts
            finally:
                await browser.close()
