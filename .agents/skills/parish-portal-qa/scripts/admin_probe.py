"""
Live admin dashboard probe.
Logs into the admin site with the provided credentials, then navigates
through every visible admin route and screenshots the result.
"""
import asyncio
import os
import re
import sys
from pathlib import Path

from playwright.async_api import async_playwright, TimeoutError as PWTimeout

sys.stdout.reconfigure(encoding="utf-8")

CHROMIUM_PATH = os.environ.get(
    "PLAYWRIGHT_CHROMIUM_PATH",
    r"C:\Users\KimoStore\AppData\Local\ms-playwright\chromium-1208\chrome-win64\chrome.exe"
)

BASE = "https://volt-buildings-advertise-dawn.trycloudflare.com"
PUBLIC = "https://joshua-enters-hourly-devoted.trycloudflare.com"
EMAIL = "admin@saintsmaximos.org"
PASSWORD = "Admin@StMaximus2026!"

OUT = Path("/home/user/workspace/test-suite/screenshots")
OUT.mkdir(parents=True, exist_ok=True)

# Admin routes to probe (discovered from memory bank).
ADMIN_ROUTES = [
    ("", "20-admin-home"),
    ("masses", "21-admin-masses"),
    ("events", "22-admin-events"),
    ("services", "23-admin-services"),
    ("navigation", "24-admin-navigation"),
    ("videos", "25-admin-videos"),
    ("media", "26-admin-media"),
    ("subscribers", "27-admin-subscribers"),
    ("content-types", "28-admin-content-types"),
    ("audit", "29-admin-audit"),
]

REPORT = []


def log(msg: str):
    print(msg, flush=True)
    REPORT.append(msg)


async def safe_screenshot(page, path, full_page=True, timeout=25000):
    try:
        await page.screenshot(path=str(path), full_page=full_page, timeout=timeout)
    except Exception as e:
        log(f"  screenshot warning ({path}): {e}")


async def safe_goto(page, url, timeout=90000):
    resp = await page.goto(url, wait_until="domcontentloaded", timeout=timeout)
    try:
        await page.wait_for_load_state("networkidle", timeout=10000)
    except PWTimeout:
        pass
    return resp


async def main():
    async with async_playwright() as pw:
        browser = await pw.chromium.launch(headless=True, executable_path=CHROMIUM_PATH)
        ctx = await browser.new_context(
            viewport={"width": 1440, "height": 900},
            locale="ar-EG",
        )
        page = await ctx.new_page()

        # ---- 1. Login screen ----
        log("=== [1] LOGIN ===")
        page.set_default_timeout(90000)
        page.set_default_navigation_timeout(90000)
        await safe_goto(page, f"{BASE}/login")
        log(f"login page title: {await page.title()!r}")
        await safe_screenshot(page, OUT / "19-admin-login-fresh.png")

        # ---- 2. Submit credentials ----
        log("=== [2] SUBMIT CREDENTIALS ===")
        await page.fill("#staff-email", EMAIL)
        await page.fill("#staff-password", PASSWORD)
        # capture any /login POST response for diagnostics
        network_log = []
        page.on("response", lambda r: network_log.append(f"{r.status} {r.request.method} {r.url}") if any(
            k in r.url for k in ["login", "auth", "supabase"]) else None)
        await page.click('button[type="submit"]')
        # Note: AdminLoginForm uses window.location.assign() for clean direct redirect to /masses.
        try:
            await page.wait_for_url(re.compile(r"^(?!.*/login).*"), timeout=45000)
        except PWTimeout:
            log("no auto-redirect within 45s — triggering secondary safety reload fallback for slow networks")
        await page.wait_for_load_state("networkidle", timeout=30000)
        log(f"after-submit URL: {page.url}")
        for n in network_log[-15:]:
            log(f"  net: {n}")
        await safe_screenshot(page, OUT / "19b-admin-after-login.png")

        # ---- 2b. Secondary safety fallback (reload) for slow network connections ----
        if "/login" in page.url:
            log("=== [2b] SECONDARY FALLBACK: REFRESH + CLICK 'Return to main site' ===")
            await page.reload(wait_until="networkidle", timeout=30000)
            log(f"after-reload URL: {page.url}")
            await safe_screenshot(page, OUT / "19c-admin-after-reload.png")
            if "/login" in page.url:
                # Try clicking the 'return to main site' link below the login area
                for label_txt in ["العودة إلى الموقع العام", "الموقع العام", "الرئيسية", "لوحة الإدارة"]:
                    loc = page.locator(f"a:has-text('{label_txt}'), button:has-text('{label_txt}')")
                    if await loc.count() > 0:
                        try:
                            await loc.first.click()
                            await page.wait_for_load_state("networkidle", timeout=30000)
                            log(f"clicked '{label_txt}' -> URL now: {page.url}")
                            await safe_screenshot(page, OUT / "19d-after-click-return.png")
                            break
                        except Exception as e:
                            log(f"click '{label_txt}' err: {e!r}")
                # After landing on the public site, try admin dashboard root explicitly
                await safe_goto(page, f"{BASE}/", timeout=45000)
                log(f"after direct-nav to admin root: {page.url}")
                await safe_screenshot(page, OUT / "19e-admin-root.png")

        # Detect failure banners
        content = await page.content()
        if "/login" in page.url:
            # Grab visible error, if any
            err = ""
            for sel in ['[role="alert"]', ".text-red-500", ".bg-red-50", "form p"]:
                nodes = await page.query_selector_all(sel)
                for n in nodes:
                    t = (await n.inner_text()).strip()
                    if t and len(t) < 500:
                        err += t + " | "
            log(f"LOGIN FAILED. errors: {err!r}")
        else:
            log("LOGIN OK.")

        # ---- 3. Sweep every admin route ----
        log("=== [3] SWEEP ADMIN ROUTES ===")
        for path, label in ADMIN_ROUTES:
            url = f"{BASE}/{path}".rstrip("/")
            try:
                resp = await safe_goto(page, url)
                status = resp.status if resp else "?"
                title = await page.title()
                # Look at first H1
                h1 = ""
                h1_el = await page.query_selector("h1")
                if h1_el:
                    h1 = (await h1_el.inner_text()).strip()[:120]
                # Detect error / not implemented banner
                body_text = (await page.inner_text("body"))[:800]
                notes = ""
                for kw in ["غير مصرح", "غير متاح", "خطأ", "غير موجود", "404", "500", "Forbidden", "قيد التطوير", "غير منفذة"]:
                    if kw in body_text:
                        notes += f"[{kw}] "
                log(f"[{label}] {url} -> HTTP {status} | title={title!r} | h1={h1!r} | flags={notes}")
                await safe_screenshot(page, OUT / f"{label}.png")
            except PWTimeout:
                log(f"[{label}] {url} -> TIMEOUT")
                await safe_screenshot(page, OUT / f"{label}.png")
            except Exception as e:
                log(f"[{label}] {url} -> ERROR: {e!r}")

        # ---- 4. Try to add a Weekly Mass (a supported entity per memory bank) ----
        log("=== [4] ADD-CONTENT ATTEMPT: Weekly Mass ===")
        try:
            await safe_goto(page, f"{BASE}/masses")
            # Find "add new" button by Arabic label variations
            add_btn = None
            for label_txt in ["إضافة قداس جديد", "إضافة قداس", "إضافة", "جديد"]:
                loc = page.locator(f"button:has-text('{label_txt}'), a:has-text('{label_txt}')")
                if await loc.count() > 0:
                    add_btn = loc.first
                    break
            if add_btn is None:
                log("  no add button found on /masses")
            else:
                await add_btn.click()
                await page.wait_for_timeout(1500)
                await safe_screenshot(page, OUT / "30-add-mass-modal.png")
                # Inspect fields
                inputs = await page.query_selector_all("input, select, textarea")
                names = []
                for i in inputs[:40]:
                    n = await i.get_attribute("name") or await i.get_attribute("id") or await i.get_attribute("placeholder") or ""
                    if n:
                        names.append(n)
                log(f"  modal fields: {names}")

                # Attempt to fill known field names from memory bank (title_ar, day_of_week, start_time, altar)
                stamp = "TEST-QA-2026-09-21"
                filled = []
                for sel_name in ["title_ar", "titleAr", "title", "name_ar", "nameAr"]:
                    sel = f"input[name='{sel_name}'], input[id='{sel_name}']"
                    el = await page.query_selector(sel)
                    if el:
                        await el.fill(f"قداس اختبار {stamp}")
                        filled.append(sel_name)
                        break
                for sel_name in ["day_of_week", "dayOfWeek", "day"]:
                    el = await page.query_selector(f"select[name='{sel_name}'], select[id='{sel_name}']")
                    if el:
                        # pick first non-empty option
                        opts = await el.query_selector_all("option")
                        for o in opts:
                            v = await o.get_attribute("value")
                            if v:
                                await el.select_option(v)
                                filled.append(sel_name)
                                break
                        break
                for sel_name in ["start_time", "startTime", "time"]:
                    el = await page.query_selector(f"input[name='{sel_name}'], input[id='{sel_name}']")
                    if el:
                        await el.fill("06:00")
                        filled.append(sel_name)
                        break
                log(f"  filled fields: {filled}")
                await safe_screenshot(page, OUT / "31-add-mass-filled.png")

                # Try submit
                for btn_txt in ["حفظ", "إضافة", "إنشاء", "تأكيد"]:
                    b = page.locator(f"button:has-text('{btn_txt}')")
                    if await b.count() > 0:
                        try:
                            await b.first.click()
                            await page.wait_for_timeout(3000)
                            await safe_screenshot(page, OUT / "32-add-mass-submitted.png")
                            log(f"  clicked submit '{btn_txt}'")
                            # Look for success/error toasts
                            body = await page.inner_text("body")
                            for kw in ["تم", "نجاح", "خطأ", "فشل", "مطلوب"]:
                                if kw in body:
                                    idx = body.find(kw)
                                    log(f"  toast/notice: ...{body[max(0,idx-40):idx+80]}...")
                        except Exception as e:
                            log(f"  submit failed: {e!r}")
                        break
        except Exception as e:
            log(f"  add-mass block failed: {e!r}")

        # ---- 5. Verify on public site ----
        log("=== [5] PUBLIC VERIFY ===")
        public_page = await ctx.new_page()
        for path, label in [("masses", "40-public-masses"), ("events", "41-public-events"),
                             ("subscribe", "42-public-subscribe"), ("condolence", "43-public-condolence")]:
            try:
                await safe_goto(public_page, f"{PUBLIC}/{path}")
                await safe_screenshot(public_page, OUT / f"{label}.png")
                body = await public_page.inner_text("body")
                found_test = "TEST-QA-2026-09-21" in body or "قداس اختبار" in body
                log(f"[{label}] /{path} test-record visible: {found_test}")
            except Exception as e:
                log(f"[{label}] error: {e!r}")

        await browser.close()

    # Save report
    Path("/home/user/workspace/test-suite/probe-report.txt").write_text("\n".join(REPORT), encoding="utf-8")
    print("\n=== REPORT SAVED ===")


if __name__ == "__main__":
    asyncio.run(main())
