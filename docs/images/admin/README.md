# docs/images/admin — screenshot drop folder

The images referenced by `docs/admin-guide.md` are **placeholders**. They were never captured: this
repository's development environment has no browser, so no screenshot in this project is real.

Drop the real captures here, with these exact filenames, and the guide's placeholders can be replaced
one by one with standard markdown image lines:

```markdown
![وصف الصورة](images/admin/01-sign-in.png)
```

| Filename | Guide section | Page to open | What must be visible |
| :--- | :--- | :--- | :--- |
| `01-sign-in.png` | §1 الدخول | `/admin/login` | the e-mail + password fields and the sign-in button |
| `02-role-and-readonly.png` | §2 الأدوار | `/admin/events` | the «دورك: …» line in the page header |
| `03-new-event.png` | §3 إنشاء فعالية | `/admin/events/new` | the fields down to «وقت الانتهاء», plus the save buttons |
| `04-new-series.png` | §6 سلسلة متكررة | `/admin/events/series/new` | «نوع التكرار» + «تاريخ أول موعد» + «وقت البدء» |
| `05-occurrences.png` | §7 إلغاء/نقل موعد | `/admin/events/series/<id>` | the upcoming-dates table with «إلغاء هذا الموعد» / «نقل هذا الموعد» |
| `06-media.png` | §9 الوسائط | `/admin/media` | the registration form and the metadata table |
| `07-audit.png` | §10 سجل التدقيق | `/admin/audit` | the entries table with the «قبل ← بعد» column |
| `08-republish.png` | §11 إعادة النشر | `/admin/events` | the «مسح الذاكرة المؤقتة وإعادة النشر» control + «آخر تعديل على المحتوى» |
| `09-subscribers.png` | §12 المشتركون | `/admin/subscribers` | the table with the «إيقاف الاشتراك» buttons |
| `10-no-email-notice.png` | §13 البريد | `/admin/subscribers` | the «لا يُرسل أي بريد إلكتروني» banner |

Rules for whoever captures them:

1. **Sign in on a staging copy with test data.** Never publish a screenshot containing a real
   person's data: subscriber e-mail addresses, phone numbers, a condolence booking naming a deceased
   person, or a staff member's full name. Use `example@example.com` and the seeded demo rows.
2. Desktop viewport, normal zoom, one screen per image — do not stitch.
3. Crop to the region the guide describes; keep the surrounding panel so the reader can orient.
4. PNG, and keep each file under ~300 KB (the repository ships no image processing tools).
5. After dropping a file, replace the matching blockquote placeholder in `docs/admin-guide.md` with
   the markdown image line above — leaving a placeholder and a real image side by side is worse than
   leaving only the placeholder.
