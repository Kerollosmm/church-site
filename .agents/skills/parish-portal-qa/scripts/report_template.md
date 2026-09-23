# تقرير اختبار مباشر شامل للبوابة الرعوية
# Full Live QA Report — Parish Portal (Church of Sts. Maximus, Domadius & Anba Moses the Black)

**Date:** <FILL: weekday DD Month YYYY> · **Time:** <HH:MM Africa/Cairo → completion>
**Test session ID:** `QA-<yyyy-mm-dd>`

**URLs tested:**
- Public: `<public URL>`
- Admin: `<admin URL>`
- Admin login: `<admin>/login`

**Admin account:** `<email>` — role: **<مالك | سكرتارية>**

---

## 1. Executive verdict

| Layer | Verdict | Detail |
|---|---|---|
| Public read (14 routes) | | |
| Public write (3 forms) | | |
| Admin login | | |
| Admin dashboard (10 areas) | | |
| Admin CREATE — Weekly Mass | | |
| Admin CREATE — Parish Video | | |
| Public→admin plumbing | | |
| Legacy 404 paths | | |
| Security posture | | |

**Overall grade:** __ / 10 — <one-line narrative>

---

## 2. Live content snapshot (from Admin Home)

| Counter | Value |
|---|---|
| القداسات الأسبوعية | |
| الفعاليات | |
| فيديوهات الكنيسة | |
| الخدمات والمرافق | |
| مكتبة الوسائط | |
| حجوزات العزاء | |
| نماذج المحتوى CMS | |
| شريط التنقل | |
| المشتركون | |

---

## 3. Public sweep

<insert table: route | HTTP | h1 | screenshot>

## 4. Public write proofs

- `/subscribe` — <outcome> — screenshot
- `/condolence` — reference `COND-XXXXXX` — screenshot
- `/contact` — <outcome> — screenshot

## 5. Admin dashboard walkthrough

<one row per admin area>

## 6. Admin CREATE outcomes

<mass + video, screenshots, error text quoted verbatim>

## 7. Bugs & improvements

| Severity | Area | Issue | Evidence |
|---|---|---|---|
| P0 | | | |
| P1 | | | |
| P2 | | | |

## 8. Cleanup instructions for staff

- `/subscribers` → delete rows containing `qa+qa-<date>`
- Condolence → delete reference `COND-______`
- `/audit` → leave alone (append-only)

## 9. Artefacts

- `screenshots/` (<N> full-page PNGs)
- `scripts/` (public_sweep.py, admin_probe.py, e2e_create.py)
- `run-logs/` (three `.txt` outputs)
