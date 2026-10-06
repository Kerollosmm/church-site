"""
Targeted admin CREATE end-to-end proof.

Now that the field selectors are known (they use placeholders and label text,
not name attributes), fills the modal correctly and confirms:
  1. Admin table shows the newly-added mass row.
  2. Public /masses page shows the same mass (INV-01 revalidation).
  3. Admin table shows the newly-added parish video row.
  4. Public /about page shows the new video (parish videos section).

Then submits the three public write forms with UNIQUE tags so we can prove
they landed (checked back in admin: /subscribers, /audit, /condolence
bookings if listed).
"""
import asyncio
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

ADMIN_PORTAL_URL = os.environ.get("ADMIN_PORTAL_URL")
PUBLIC_PORTAL_URL = os.environ.get("PUBLIC_PORTAL_URL")
ADMIN_EMAIL = os.environ.get("ADMIN_EMAIL")
ADMIN_PASSWORD = os.environ.get("ADMIN_PASSWORD")

missing = [
    var_name
    for var_name, val in [
        ("ADMIN_PORTAL_URL", ADMIN_PORTAL_URL),
        ("PUBLIC_PORTAL_URL", PUBLIC_PORTAL_URL),
        ("ADMIN_EMAIL", ADMIN_EMAIL),
        ("ADMIN_PASSWORD", ADMIN_PASSWORD),
    ]
    if not val
]
if missing:
    sys.stderr.write(f"Error: Missing required environment variable(s): {', '.join(missing)}\n")
    sys.exit(1)

PUBLIC = PUBLIC_PORTAL_URL.rstrip("/")
ADMIN = ADMIN_PORTAL_URL.rstrip("/")
EMAIL = ADMIN_EMAIL
PASSWORD = ADMIN_PASSWORD

OUT = Path("/home/user/workspace/test-suite/screenshots")
OUT.mkdir(parents=True, exist_ok=True)

TAG = "QA-2026-09-21"
REPORT = []


def log(msg):
    print(msg, flush=True)
    REPORT.append(str(msg))


async def safe_goto(page, url, label="goto"):
    try:
        await page.goto(url, wait_until="domcontentloaded", timeout=90000)
        try:
            await page.wait_for_load_state("networkidle", timeout=15000)
        except PWTimeout:
            pass
        return True
    except Exception as e:
        log(f"  {label} FAILED: {e!r}")
        return False


async def safe_screenshot(page, path, full_page=True, timeout=25000):
    try:
        await page.screenshot(path=str(path), full_page=full_page, timeout=timeout)
    except Exception as e:
        log(f"  screenshot warning ({path}): {e}")


async def login(admin_page):
    log("\n=== ADMIN LOGIN ===")
    admin_page.set_default_timeout(90000)
    admin_page.set_default_navigation_timeout(90000)
    if not await safe_goto(admin_page, f"{ADMIN}/login", "login"):
        return False
    await admin_page.fill("#staff-email", EMAIL)
    await admin_page.fill("#staff-password", PASSWORD)
    await admin_page.click('button[type="submit"]')
    # Note: AdminLoginForm uses window.location.assign() for clean direct redirect to /masses.
    try:
        await admin_page.wait_for_url(re.compile(r"^(?!.*/login).*"), timeout=45000)
    except PWTimeout:
        log("  no auto-redirect within 45s, reloading as secondary safety fallback")
        try:
            await admin_page.reload(wait_until="domcontentloaded", timeout=45000)
        except Exception:
            pass
    await admin_page.wait_for_load_state("networkidle", timeout=20000)
    ok = "/login" not in admin_page.url
    log(f"  logged in? {ok} (url={admin_page.url})")
    return ok


# ---------- CREATE MASS ----------
# Note: Verified working in production (historic P0 regression resolved).
# Adds row to admin table and immediately renders publicly on Sunday tab. Must pass cleanly.
async def create_mass(page):
    log("\n=== CREATE MASS ===")
    if not await safe_goto(page, f"{ADMIN}/masses", "masses"):
        return None
    add = page.locator("button:has-text('إضافة قداس جديد')")
    if await add.count() == 0:
        log("  add button missing")
        return None
    await add.first.click()
    await page.wait_for_timeout(1500)

    title = f"قداس اختبار {TAG}"
    # Title: input with placeholder starting with "مثال: قداس"
    title_input = page.locator("input[placeholder*='قداس الأحد الصباحي']")
    if await title_input.count() == 0:
        log("  title input by placeholder not found")
        await safe_screenshot(page, OUT / "M-err-title.png")
        return None
    await title_input.first.fill(title)
    log(f"  title filled: {title!r}")

    # Notes (unique proof marker)
    notes = f"ملاحظة اختبار جودة تلقائي {TAG} — للحذف."
    notes_ta = page.locator("textarea[placeholder*='يسبق القداس']")
    if await notes_ta.count() > 0:
        await notes_ta.first.fill(notes)
        log(f"  notes filled")

    # Audience (optional, unique)
    aud = page.locator("input[placeholder*='عام لجميع الشعب']")
    if await aud.count() > 0:
        await aud.first.fill(f"اختبار {TAG}")

    await safe_screenshot(page, OUT / "M1-mass-filled.png")

    # Save = "إضافة القداس"
    save = page.locator("button:has-text('إضافة القداس')")
    log(f"  save button count: {await save.count()}")
    if await save.count() == 0:
        return None
    await save.first.click()
    try:
        await page.wait_for_selector("[role='dialog']", state="detached", timeout=15000)
        log("  modal closed after save")
    except PWTimeout:
        log("  modal still open after save (checking for inline error)")
    await page.wait_for_timeout(3000)
    await safe_screenshot(page, OUT / "M2-mass-after-save.png")

    # Reload and check
    await safe_goto(page, f"{ADMIN}/masses", "masses reload")
    body = await page.inner_text("body")
    hit = TAG in body
    log(f"  admin table shows {TAG}? {hit}")
    await safe_screenshot(page, OUT / "M3-admin-masses-post.png")
    return title if hit else None


# ---------- CREATE VIDEO ----------
# Note: Verified working in production (historic P0 regression resolved).
# Modal has full ARIA attributes (role="dialog", aria-labelledby="video-modal-title").
# Row is saved published + active and appears on /about. Must pass cleanly.
async def create_video(page):
    log("\n=== CREATE PARISH VIDEO ===")
    if not await safe_goto(page, f"{ADMIN}/videos", "videos"):
        return None
    add = page.locator("button:has-text('إضافة فيديو جديد')")
    if await add.count() == 0:
        log("  video add button missing")
        return None
    await add.first.click()
    await page.wait_for_timeout(1500)

    url_val = "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
    title_ar = f"فيديو اختبار {TAG}"

    url_in = page.locator("input[placeholder*='youtube.com/watch']")
    if await url_in.count() == 0:
        url_in = page.locator("input[type='url']")
    await url_in.first.fill(url_val)
    log(f"  url filled")

    ta_in = page.locator("input[placeholder*='قداس عيد القيامة']")
    if await ta_in.count() == 0:
        # fallback: first text input after url
        ta_in = page.locator("input[type='text']").first
    await ta_in.first.fill(title_ar)
    log(f"  arabic title filled: {title_ar!r}")

    # Public toggle "الظهور في الموقع العام" — button
    public_toggle = page.locator("button:has-text('منشور للجمهور'), button:has-text('غير منشور')")
    if await public_toggle.count() > 0:
        try:
            state = (await public_toggle.first.inner_text()).strip()
            if "غير" in state:
                await public_toggle.first.click()
                log("  toggled public visibility ON")
            else:
                log(f"  public toggle already ON: {state!r}")
        except Exception as e:
            log(f"  public toggle err: {e!r}")

    await safe_screenshot(page, OUT / "V1-video-filled.png")

    save = page.locator("button:has-text('إضافة الفيديو')")
    log(f"  save button count: {await save.count()}")
    if await save.count() == 0:
        return None
    # Wait until enabled
    try:
        await save.first.wait_for(state="visible", timeout=5000)
        for _ in range(30):
            disabled = await save.first.get_attribute("disabled")
            if disabled is None:
                break
            await page.wait_for_timeout(500)
        await save.first.click()
        log("  clicked save")
    except Exception as e:
        log(f"  save err: {e!r}")
        return None

    try:
        await page.wait_for_selector("[role='dialog']", state="detached", timeout=15000)
        log("  modal closed after save")
    except PWTimeout:
        log("  modal still open")
    await page.wait_for_timeout(3000)
    await safe_screenshot(page, OUT / "V2-video-after-save.png")

    await safe_goto(page, f"{ADMIN}/videos", "videos reload")
    body = await page.inner_text("body")
    hit = TAG in body
    log(f"  admin table shows {TAG}? {hit}")
    await safe_screenshot(page, OUT / "V3-admin-videos-post.png")
    return title_ar if hit else None


# ---------- PUBLIC WRITE FORMS ----------
async def public_subscribe(page):
    log("\n=== PUBLIC SUBSCRIBE ===")
    if not await safe_goto(page, f"{PUBLIC}/subscribe", "subscribe"):
        return None
    email = f"qa+{TAG.lower()}-sub@example.com"
    await page.fill("input#subscribe-email", email)
    # optional name field
    name_in = page.locator("input#subscribe-name")
    if await name_in.count() > 0:
        await name_in.first.fill(f"مختبر {TAG}")
    # tick first checkbox if any (topic)
    cbs = await page.query_selector_all("input[type='checkbox']")
    if cbs:
        try:
            await cbs[0].check()
            log(f"  ticked one of {len(cbs)} topic checkboxes")
        except Exception:
            pass
    await safe_screenshot(page, OUT / "S1-subscribe-filled.png")
    b = page.locator("button[type='submit']")
    if await b.count() == 0:
        log("  no submit"); return None
    await b.first.click()
    await page.wait_for_timeout(6000)
    await safe_screenshot(page, OUT / "S2-subscribe-after.png")
    body = await page.inner_text("body")
    for kw in ["تم الاشتراك", "شكرًا", "شكراً", "تم التسجيل", "Turnstile", "تحقق أنك", "خطأ", "فشل", "غير مفعل", "تعذر"]:
        if kw in body:
            idx = body.find(kw)
            log(f"  outcome: ...{body[max(0,idx-50):idx+140]!r}...")
            return email
    log(f"  no outcome banner detected; body head: {body[:200]!r}")
    return email


async def public_condolence(page):
    log("\n=== PUBLIC CONDOLENCE ===")
    if not await safe_goto(page, f"{PUBLIC}/condolence", "condolence"):
        return None
    future = (date.today() + timedelta(days=30)).isoformat()
    await page.fill("input[name='deceasedFullName']", f"المرحوم اختبار {TAG}")
    await page.fill("input[name='applicantName']", f"مقدم الطلب {TAG}")
    await page.fill("input[name='applicantPhone']", "01000000000")
    await page.fill("input[name='relationshipToDeceased']", "الابن")
    await page.fill("input[name='eventDate']", future)
    # slot select
    slot = page.locator("select[name='slotTime']")
    if await slot.count() > 0:
        opts = await slot.first.locator("option").all()
        for o in opts:
            v = await o.get_attribute("value")
            if v:
                await slot.first.select_option(v)
                break
    await page.fill("textarea[name='specialRequests']", f"اختبار جودة {TAG} — للحذف.")
    await safe_screenshot(page, OUT / "C1-condolence-filled.png")
    b = page.locator("button[type='submit']")
    if await b.count() == 0:
        log("  no submit"); return None
    await b.first.click()
    await page.wait_for_timeout(8000)
    await safe_screenshot(page, OUT / "C2-condolence-after.png")
    body = await page.inner_text("body")
    for kw in ["COND-", "تم استلام", "تم الحجز", "شكرًا", "شكراً", "Turnstile", "تحقق أنك", "خطأ", "فشل"]:
        if kw in body:
            idx = body.find(kw)
            log(f"  outcome: ...{body[max(0,idx-50):idx+180]!r}...")
            return "sent"
    log(f"  no clear outcome; body head: {body[:250]!r}")
    return None


async def public_contact(page):
    log("\n=== PUBLIC CONTACT ===")
    if not await safe_goto(page, f"{PUBLIC}/contact", "contact"):
        return None
    await page.fill("input[name='senderName']", f"مختبر {TAG}")
    await page.fill("input[name='senderPhone']", "01000000000")
    await page.fill("input[name='senderEmail']", f"qa+{TAG.lower()}-contact@example.com")
    await page.fill("textarea[name='messageContent']",
                     f"رسالة اختبار جودة تلقائية {TAG}. برجاء التجاهل والحذف بعد المراجعة.")
    await safe_screenshot(page, OUT / "K1-contact-filled.png")
    b = page.locator("button[type='submit']")
    if await b.count() == 0:
        log("  no submit"); return None
    await b.first.click()
    await page.wait_for_timeout(8000)
    await safe_screenshot(page, OUT / "K2-contact-after.png")
    body = await page.inner_text("body")
    for kw in ["تم إرسال", "تم استلام", "شكرًا", "شكراً", "Turnstile", "تحقق أنك", "خطأ", "فشل"]:
        if kw in body:
            idx = body.find(kw)
            log(f"  outcome: ...{body[max(0,idx-50):idx+180]!r}...")
            return "sent"
    log(f"  no clear outcome; body head: {body[:250]!r}")
    return None


# ---------- VERIFY ADMIN SIDE ----------
async def verify_admin_side_effects(admin_page):
    log("\n=== ADMIN-SIDE VERIFY (audit + subscribers + condolence) ===")
    for path, label in [
        ("audit", "Z-admin-audit-post"),
        ("subscribers", "Z-admin-subs-post"),
    ]:
        await safe_goto(admin_page, f"{ADMIN}/{path}", path)
        await safe_screenshot(admin_page, OUT / f"{label}.png")
        body = await admin_page.inner_text("body")
        hit_tag = TAG in body
        hit_qa = "qa+qa-2026-09-21" in body.lower()
        log(f"  /{path}: tag={hit_tag}, qa-email={hit_qa}")


# ---------- MAIN ----------
async def main():
    async with async_playwright() as pw:
        browser = await pw.chromium.launch(headless=True, executable_path=CHROMIUM_PATH)

        pub_ctx = await browser.new_context(viewport={"width": 1440, "height": 900}, locale="ar-EG")
        admin_ctx = await browser.new_context(viewport={"width": 1440, "height": 900}, locale="ar-EG")

        pub_page = await pub_ctx.new_page()
        admin_page = await admin_ctx.new_page()

        # Login first
        logged = await login(admin_page)
        mass_title = None
        video_title = None
        if logged:
            mass_title = await create_mass(admin_page)
            video_title = await create_video(admin_page)

        # Public submissions
        sub_email = await public_subscribe(pub_page)
        cond = await public_condolence(pub_page)
        contact = await public_contact(pub_page)

        # PUBLIC visibility for admin-created items
        log("\n=== PUBLIC VISIBILITY OF ADMIN ADDITIONS ===")
        if mass_title:
            await safe_goto(pub_page, f"{PUBLIC}/masses", "public /masses")
            await safe_screenshot(pub_page, OUT / "P1-public-masses-post.png")
            body = await pub_page.inner_text("body")
            log(f"  /masses shows mass '{mass_title}'? {mass_title in body}, TAG present? {TAG in body}")
        if video_title:
            await safe_goto(pub_page, f"{PUBLIC}/about", "public /about")
            await safe_screenshot(pub_page, OUT / "P2-public-about-post.png")
            body = await pub_page.inner_text("body")
            log(f"  /about shows video TAG? {TAG in body}")

        # Verify admin side effects of public writes (audit + subs + condolence)
        if logged:
            await verify_admin_side_effects(admin_page)

        await browser.close()

    Path("/home/user/workspace/test-suite/e2e-create-report.txt").write_text("\n".join(REPORT), encoding="utf-8")
    print("\n=== DONE ===")


if __name__ == "__main__":
    asyncio.run(main())
