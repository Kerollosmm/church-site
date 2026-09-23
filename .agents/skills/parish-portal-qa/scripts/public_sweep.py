"""
Live public web probe.
Walks every public route and (a) checks response, (b) tests the write forms
that the memory bank documents: /subscribe, /condolence, /contact.
Every attempt uses a TEST-QA prefix so the church staff can identify and
purge the test rows.
"""
import asyncio
import json
import os
import re
import sys
from pathlib import Path
from datetime import date, timedelta

from playwright.async_api import async_playwright, TimeoutError as PWTimeout

sys.stdout.reconfigure(encoding="utf-8")

CHROMIUM_PATH = os.environ.get(
    "PLAYWRIGHT_CHROMIUM_PATH",
    r"C:\Users\KimoStore\AppData\Local\ms-playwright\chromium-1208\chrome-win64\chrome.exe"
)

PUBLIC = "https://joshua-enters-hourly-devoted.trycloudflare.com"
OUT = Path("/home/user/workspace/test-suite/screenshots")
OUT.mkdir(parents=True, exist_ok=True)

TAG = "TEST-QA-2026-09-21"
REPORT = []


def log(msg):
    print(msg, flush=True)
    REPORT.append(msg)


async def safe_goto(page, url, timeout=90000):
    resp = await page.goto(url, wait_until="domcontentloaded", timeout=timeout)
    try:
        await page.wait_for_load_state("networkidle", timeout=10000)
    except PWTimeout:
        pass
    return resp


# Discovered admin dashboard route "/masses" etc. is public-side page.
# Public site routes tested per memory bank.
PUBLIC_ROUTES = [
    "/",
    "/masses",
    "/events",
    "/live",
    "/bible",
    "/gallery",
    "/sermons",
    "/subscribe",
    "/condolence",
    "/contact",
    "/privacy",
    "/about",
    "/about/clergy",
    "/about/altars",
    # Non-existent legacy paths from memory bank references:
    "/clinics",     # memory bank mentions "14 عيادات" but /clinics returned 404
    "/donate",
    "/schedule",
    "/stream",
    "/content/article",
]


async def probe_navigation(page):
    """Sample header nav on home page to catalog the visible menus."""
    log("=== [A] HEADER NAV CATALOG ===")
    await safe_goto(page, f"{PUBLIC}/")
    hrefs = []
    for a in await page.query_selector_all("header a[href]"):
        h = await a.get_attribute("href")
        t = (await a.inner_text()).strip()
        if h and not h.startswith("#"):
            hrefs.append((t[:40], h))
    seen = set()
    uniq = []
    for t, h in hrefs:
        if h not in seen:
            seen.add(h)
            uniq.append((t, h))
    log(f"header links unique count: {len(uniq)}")
    for t, h in uniq[:40]:
        log(f"  - {t!r} -> {h}")
    # Footer links
    log("--- footer ---")
    fhrefs = []
    for a in await page.query_selector_all("footer a[href]"):
        h = await a.get_attribute("href")
        t = (await a.inner_text()).strip()
        if h and not h.startswith("#"):
            fhrefs.append((t[:40], h))
    seen2 = set()
    for t, h in fhrefs:
        if h not in seen2:
            seen2.add(h)
    log(f"footer unique links count: {len(seen2)}")


async def probe_routes(page):
    log("=== [B] ROUTE SWEEP ===")
    results = []
    for path in PUBLIC_ROUTES:
        url = f"{PUBLIC}{path}"
        try:
            resp = await safe_goto(page, url)
            status = resp.status if resp else "?"
            title = await page.title()
            h1 = ""
            h1_el = await page.query_selector("h1")
            if h1_el:
                h1 = (await h1_el.inner_text()).strip()[:120]
            body_text = (await page.inner_text("body"))[:2000]
            notes = []
            for kw in ["This page could not be found", "404", "Server Error", "Application error", "خطأ في الخادم", "500 Internal"]:
                if kw in body_text:
                    notes.append(kw)
            # Regex 500 check: ensure '500' is not triggered by telephone number 03-5500000
            if re.search(r'(?<!\d)500(?!\d)', body_text):
                text_without_phone = re.sub(r'03[-\s]?5500000', '', body_text)
                if re.search(r'(?<!\d)500(?!\d)', text_without_phone) and "500" not in notes:
                    notes.append("500")
            log(f"  {path:30s} -> {status} | h1={h1!r} | notes={notes}")
            results.append((path, status, h1, notes))
        except PWTimeout:
            log(f"  {path:30s} -> TIMEOUT")
            results.append((path, "TIMEOUT", "", []))
        except Exception as e:
            log(f"  {path:30s} -> {e!r}")
            results.append((path, "ERR", "", [str(e)]))
    return results


async def test_subscribe(page):
    log("=== [C] SUBSCRIBE FORM ===")
    try:
        await safe_goto(page, f"{PUBLIC}/subscribe")
        await page.screenshot(path=str(OUT / "50-subscribe-blank.png"), full_page=True)

        # Dump form field cataloging
        inputs = await page.query_selector_all("input, select, textarea, button[type='submit']")
        cat = []
        for i in inputs[:30]:
            tag = await i.evaluate("el => el.tagName")
            name = await i.get_attribute("name") or ""
            typ = await i.get_attribute("type") or ""
            idv = await i.get_attribute("id") or ""
            ph = await i.get_attribute("placeholder") or ""
            cat.append(f"    <{tag} id={idv!r} name={name!r} type={typ!r} placeholder={ph[:40]!r}>")
        log("  form fields:")
        for c in cat:
            log(c)

        # Try to fill email + first available checkbox and submit
        email_selectors = ["input[type='email']", "input[name='email']", "input[id*='email']"]
        for sel in email_selectors:
            el = await page.query_selector(sel)
            if el:
                await el.fill(f"qa+{TAG.lower()}@example.com")
                log(f"  filled email via {sel}")
                break

        # Check first checkbox if any
        checkboxes = await page.query_selector_all("input[type='checkbox']")
        if checkboxes:
            try:
                await checkboxes[0].check()
                log(f"  ticked first of {len(checkboxes)} checkboxes")
            except Exception as e:
                log(f"  checkbox click failed: {e!r}")

        await page.screenshot(path=str(OUT / "51-subscribe-filled.png"), full_page=True)

        # Try submit
        submit = await page.query_selector("button[type='submit']")
        if submit:
            await submit.click()
            await page.wait_for_timeout(4500)
            await page.screenshot(path=str(OUT / "52-subscribe-submitted.png"), full_page=True)
            body = await page.inner_text("body")
            # Look for success / turnstile / error phrases
            for phrase in ["تم الاشتراك", "تم التسجيل", "شكراً", "شكرًا",
                            "تحقق أنك لست روبوت", "Turnstile", "لم يتم التحقق",
                            "خطأ", "فشل", "تعذر", "غير صحيح", "غير مفعل"]:
                if phrase in body:
                    idx = body.find(phrase)
                    log(f"  after-submit sees: ...{body[max(0,idx-40):idx+120]}...")
        else:
            log("  no submit button found")
    except Exception as e:
        log(f"  subscribe test failed: {e!r}")


async def test_condolence(page):
    log("=== [D] CONDOLENCE BOOKING FORM ===")
    try:
        await safe_goto(page, f"{PUBLIC}/condolence")
        await page.screenshot(path=str(OUT / "60-condolence-blank.png"), full_page=True)

        inputs = await page.query_selector_all("input, select, textarea")
        cat = []
        for i in inputs[:40]:
            tag = await i.evaluate("el => el.tagName")
            name = await i.get_attribute("name") or ""
            typ = await i.get_attribute("type") or ""
            idv = await i.get_attribute("id") or ""
            ph = await i.get_attribute("placeholder") or ""
            cat.append(f"    <{tag} id={idv!r} name={name!r} type={typ!r} placeholder={ph[:40]!r}>")
        log("  form fields:")
        for c in cat:
            log(c)

        # Best-effort fill
        future = (date.today() + timedelta(days=14)).isoformat()
        for sel, val in [
            ("input[name='deceased_name']", f"اختبار {TAG}"),
            ("input[name='requester_name']", f"مختبر {TAG}"),
            ("input[name='requester_phone']", "01000000000"),
            ("input[name='phone']", "01000000000"),
            ("input[name='requested_date']", future),
            ("input[type='date']", future),
            ("textarea[name='notes']", f"طلب اختبار جودة {TAG}"),
        ]:
            el = await page.query_selector(sel)
            if el:
                try:
                    await el.fill(val)
                    log(f"  filled {sel} = {val}")
                except Exception as e:
                    log(f"  fill {sel} err: {e!r}")

        await page.screenshot(path=str(OUT / "61-condolence-filled.png"), full_page=True)

        submit = await page.query_selector("button[type='submit']")
        if submit:
            await submit.click()
            await page.wait_for_timeout(5000)
            await page.screenshot(path=str(OUT / "62-condolence-submitted.png"), full_page=True)
            body = await page.inner_text("body")
            for phrase in ["COND-", "تم الحجز", "تم استلام", "شكراً", "شكرًا",
                             "Turnstile", "تحقق أنك", "خطأ", "فشل", "غير متاح", "لم يتم"]:
                if phrase in body:
                    idx = body.find(phrase)
                    log(f"  after-submit sees: ...{body[max(0,idx-40):idx+160]}...")
        else:
            log("  no submit button")
    except Exception as e:
        log(f"  condolence test failed: {e!r}")


async def test_contact(page):
    log("=== [E] CONTACT FORM ===")
    try:
        await safe_goto(page, f"{PUBLIC}/contact")
        await page.screenshot(path=str(OUT / "70-contact-blank.png"), full_page=True)

        inputs = await page.query_selector_all("input, select, textarea")
        cat = []
        for i in inputs[:30]:
            tag = await i.evaluate("el => el.tagName")
            name = await i.get_attribute("name") or ""
            typ = await i.get_attribute("type") or ""
            idv = await i.get_attribute("id") or ""
            ph = await i.get_attribute("placeholder") or ""
            cat.append(f"    <{tag} id={idv!r} name={name!r} type={typ!r} placeholder={ph[:40]!r}>")
        log("  form fields:")
        for c in cat:
            log(c)

        for sel, val in [
            ("input[name='name']", f"مختبر {TAG}"),
            ("input[name='email']", f"qa+{TAG.lower()}@example.com"),
            ("input[name='phone']", "01000000000"),
            ("input[name='subject']", f"رسالة اختبار {TAG}"),
            ("textarea[name='message']", f"هذه رسالة اختبار جودة تلقائي {TAG}. برجاء التجاهل والحذف."),
            ("textarea[name='body']", f"هذه رسالة اختبار جودة تلقائي {TAG}. برجاء التجاهل والحذف."),
        ]:
            el = await page.query_selector(sel)
            if el:
                try:
                    await el.fill(val)
                    log(f"  filled {sel}")
                except Exception:
                    pass

        await page.screenshot(path=str(OUT / "71-contact-filled.png"), full_page=True)
        submit = await page.query_selector("button[type='submit']")
        if submit:
            await submit.click()
            await page.wait_for_timeout(5000)
            await page.screenshot(path=str(OUT / "72-contact-submitted.png"), full_page=True)
            body = await page.inner_text("body")
            for phrase in ["تم إرسال", "شكراً", "شكرًا", "تم استلام",
                             "Turnstile", "تحقق أنك", "خطأ", "فشل", "غير مفعل"]:
                if phrase in body:
                    idx = body.find(phrase)
                    log(f"  after-submit sees: ...{body[max(0,idx-40):idx+120]}...")
    except Exception as e:
        log(f"  contact test failed: {e!r}")


async def test_masses_filters(page):
    log("=== [F] MASSES PAGE INTERACTIONS ===")
    try:
        await safe_goto(page, f"{PUBLIC}/masses")
        await page.screenshot(path=str(OUT / "80-masses-default.png"), full_page=True)

        # count mass cards
        cards = await page.query_selector_all("[data-mass], article, .rounded-2xl")
        log(f"  DOM candidates for cards: {len(cards)}")

        # find day buttons
        buttons = await page.query_selector_all("button")
        day_labels = []
        for b in buttons[:40]:
            t = (await b.inner_text()).strip()
            if t and 1 <= len(t) <= 15 and any(d in t for d in ["الأحد", "الاثنين", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"]):
                day_labels.append(t)
        log(f"  day buttons visible: {day_labels[:10]}")

        if day_labels:
            # Click الجمعة if present
            for want in ["الجمعة", "السبت", "الأحد"]:
                loc = page.locator(f"button:has-text('{want}')")
                if await loc.count() > 0:
                    try:
                        await loc.first.click()
                        await page.wait_for_timeout(1500)
                        await page.screenshot(path=str(OUT / f"81-masses-filter-{want}.png"), full_page=True)
                        log(f"  clicked day '{want}' OK")
                        break
                    except Exception as e:
                        log(f"  click '{want}' err: {e!r}")
    except Exception as e:
        log(f"  masses interactions failed: {e!r}")


async def test_bible(page):
    log("=== [G] BIBLE READER ===")
    try:
        await safe_goto(page, f"{PUBLIC}/bible")
        await page.screenshot(path=str(OUT / "90-bible.png"), full_page=True)

        # count links and interactive book buttons (73 books: 46 OT, 27 NT)
        books = await page.query_selector_all("a[href*='/bible/'], button[data-book], div.grid button")
        buttons = await page.query_selector_all("button[data-book], div.grid button")
        links = await page.query_selector_all("a[href*='/bible/']")
        log(f"  bible books detected: {len(books)} total (buttons: {len(buttons)}, links: {len(links)})")
        first_hrefs = []
        for a in links[:5]:
            h = await a.get_attribute("href")
            if h:
                first_hrefs.append(h)
        if first_hrefs:
            log(f"  first book URLs: {first_hrefs}")
            await safe_goto(page, f"{PUBLIC}{first_hrefs[0]}")
            await page.screenshot(path=str(OUT / "91-bible-book.png"), full_page=True)
            body = await page.inner_text("body")
            log(f"  first book page char count: {len(body)}")
        elif buttons:
            try:
                await buttons[0].click()
                await page.wait_for_timeout(1000)
                await page.screenshot(path=str(OUT / "91-bible-book.png"), full_page=True)
                body = await page.inner_text("body")
                log(f"  first book button clicked; page char count: {len(body)}")
            except Exception as e:
                log(f"  book button click err: {e!r}")
    except Exception as e:
        log(f"  bible test failed: {e!r}")


async def test_live(page):
    log("=== [H] LIVE STREAM PAGE ===")
    try:
        await safe_goto(page, f"{PUBLIC}/live")
        await page.screenshot(path=str(OUT / "95-live.png"), full_page=True)
        body = await page.inner_text("body")
        for phrase in ["لم تُضبط القناة", "youtube", "youtu.be", "غير مضبوط", "قناة الكنيسة", "البث المباشر"]:
            if phrase.lower() in body.lower():
                idx = body.lower().find(phrase.lower())
                log(f"  live sees: ...{body[max(0,idx-30):idx+120]}...")
                break
        # iframes
        iframes = await page.query_selector_all("iframe")
        log(f"  iframes on /live: {len(iframes)}")
        for f in iframes[:3]:
            log(f"    iframe src = {await f.get_attribute('src')}")
    except Exception as e:
        log(f"  live failed: {e!r}")


async def test_font_switch(page):
    log("=== [I] FONT-SIZE SWITCHER + PERFORMANCE HINTS ===")
    try:
        await safe_goto(page, f"{PUBLIC}/")
        # Check button[data-font-size-btn] selectors first
        font_switched = False
        for sel in ["button[data-font-size-btn='large']", "button[data-font-size-btn='xlarge']", "button[data-font-size-btn]"]:
            b = page.locator(sel)
            if await b.count() > 0:
                try:
                    await b.first.click()
                    await page.wait_for_timeout(700)
                    html_class = await page.get_attribute("html", "class") or await page.get_attribute("body", "class") or ""
                    log(f"  clicked '{sel}' -> html.class={html_class[:80]}")
                    font_switched = True
                    break
                except Exception:
                    pass

        # Fallback: Try all buttons whose text is exactly "A" or "A+" or "A++"
        if not font_switched:
            for label in ["A++", "A+", "A"]:
                b = page.locator(f"button:has-text('{label}')")
                if await b.count() > 0:
                    try:
                        await b.first.click()
                        await page.wait_for_timeout(700)
                        html_class = await page.get_attribute("html", "class") or await page.get_attribute("body", "class") or ""
                        log(f"  clicked '{label}' -> html.class={html_class[:80]}")
                        break
                    except Exception:
                        pass
    except Exception as e:
        log(f"  font switch failed: {e!r}")


async def main():
    async with async_playwright() as pw:
        browser = await pw.chromium.launch(headless=True, executable_path=CHROMIUM_PATH)
        ctx = await browser.new_context(viewport={"width": 1440, "height": 900}, locale="ar-EG")
        page = await ctx.new_page()
        page.set_default_timeout(90000)
        page.set_default_navigation_timeout(90000)
        results = {}
        await probe_navigation(page)
        results["routes"] = await probe_routes(page)
        await test_masses_filters(page)
        await test_bible(page)
        await test_live(page)
        await test_font_switch(page)
        await test_subscribe(page)
        await test_condolence(page)
        await test_contact(page)
        await browser.close()

    Path("/home/user/workspace/test-suite/public-probe-report.txt").write_text("\n".join(REPORT), encoding="utf-8")
    print("\n=== DONE ===")


if __name__ == "__main__":
    asyncio.run(main())
