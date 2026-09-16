# Reference Site Analysis — stathanasius-elseyouf.com

**Purpose:** information-architecture and presentation-pattern study only.
**Method:** publicly accessible pages read at human scale with the TinyFish CLI (`tinyfish fetch content get --links`) on 2026-09-16. Seven pages read: `/`, `/about`, `/mass-schedule`, `/news`, `/church-education`, `/church-activities`, plus the link graph of `/`.
**Status of the source:** `https://stathanasius-elseyouf.com/` — title *كنيسة الأنبا أثناسيوس الرسولي بالسيوف* (a Coptic Orthodox parish site, Arabic-first, RTL).

## Originality note (mandatory)

**Nothing from the reference site is copied.** Specifically NOT reused: any Arabic or English text, headings, service names, clergy names, meeting names, schedules, times, room/location names, phone numbers, activity descriptions, images, logos, colours, downloadable files, or datasets. The reference is used **only** as a structural and navigational reference — the *shape* of the information (what kinds of pages exist, how a weekly schedule is grouped, how activities are classified) — never its content. All content in the delivered site comes from the parish's own seed data or is authored fresh; all schedules shown are the owning parish's own.

## 1. Sitemap observed

Top-level navigation (from the home-page link graph):

| Path | Page type |
|---|---|
| `/` | Home — hero, highlighted services, latest news, quick links |
| `/about` · `/about-st-athanasius` | About the parish; patron-saint page |
| `/news` | News list (article cards) |
| `/mass-schedule` | Weekly liturgy schedule, grouped by weekday |
| `/church-education` | Weekly education/meetings, grouped by weekday + Facebook pages |
| `/education/{malaeika,ebtedaey,edaady,thanaway,arshi-youth,ni-angelos-youth,family-meeting,men-meeting,women-meeting,widows-meeting}` | One page per education class / meeting group |
| `/schools` · `/deacon-school` · `/bible-school` · `/schools/{hameel-faith,karouz,karouz-choir}` | Schools & academies |
| `/church-activities` | Activity cards list |
| `/activity/{kashafa,efiaro-library,efiaro-printing,marmina-creativity,san-athanasius-club,computer-center,summer-club}` | One page per activity |
| `/public-services` · `/clinics` · `/public-service/{...}` | Public/charity services and clinic |
| `/condolence-hall` | Condolence hall |
| `/live-broadcast` | Live stream |
| `/bible` | Bible reader |
| `/donations` | Donation accounts |
| `/contact` | Contact + map + social links |

Pattern: a **hub page** (e.g. `/church-activities`) with a **detail page per item** (`/activity/<slug>`), i.e. hub-and-spoke. This is exactly the IA the current Church-Site already follows; the reference confirms the hub-and-spoke model and the specific *dimensions* below.

## 2. Navigation model

- Flat top nav with a handful of hubs (About, News, Mass schedule, Education, Schools, Activities, Public services, Bible, Donations, Contact).
- Every hub links to per-item detail pages.
- Persistent social/contact affordances: a Google Maps embed, a Facebook page, a YouTube channel.
- RTL Arabic-first, with `lang`/direction set for Arabic.

## 3. Weekly-schedule presentation pattern

`/mass-schedule` groups liturgies **by weekday** (`الأحد، الاثنين، …`), and within a day lists each liturgy as a **name + time range**, e.g. *"القداس الأول — من 6:00 الى 8:00 صباحا"*. Some entries carry a **venue/location qualifier** (which church/building, and for children which stage). `/church-education` uses the same weekday grouping, but each entry is *"meeting name • time range"*, and the page also lists **Facebook pages per service**.

**Take-away for our build:** the weekly schedule is a first-class, day-grouped view — not a flat list. Times are wall-clock in the parish timezone (Africa/Cairo). Venue and audience are separate facts attached to each entry. This maps directly onto a *recurring-event* model (weekly recurrence + venue + audience classification).

## 4. Activity / event card pattern

`/church-activities` renders each activity as a **card**: title, hours-of-operation lines (sometimes per-day exceptions, e.g. "daily except Sunday …"), a phone number, a Facebook link, and a **"التفاصيل" (details) link** to the per-item page. A **"آخر تحديث" (last updated) timestamp** is shown at the top of the list — i.e. the site surfaces *when it was last changed*, which is the same signal a real-time admin should emit.

## 5. Classification / "flags" observed (the multi-dimension taxonomy)

The reference classifies its content along several **independent dimensions**, each shown as a label/segment rather than free text:

| Dimension | Values observed (illustrative) |
|---|---|
| **Day / recurrence** | Sunday … Saturday (weekly grouping) |
| **Audience / life-stage** | kindergarten, primary (ابتدائي), preparatory (إعدادي), secondary (ثانوي), university (جامعة), graduates (خريجين), men (رجال), mothers (أمهات), families (عائلات) |
| **Ministry / service group** | named services (e.g. children's, youth, preparatory) tied to a group |
| **Venue / location** | which church/building/hall, and floor/room |
| **Kind of offering** | liturgy / meeting / activity / school / public service / condolence hall |
| **External channel** | Facebook page, YouTube channel |

That is the "classification of many things with flags" the request refers to: **orthogonal dimensions, each rendered as a distinct chip/badge and usable as a filter** — not a single free-text category.

## 6. Presentation & design observations

- Arabic-only UI in practice; no visible language switcher on the pages read (bilingual intent is implied by English slugs/URLs).
- Cards, day-grouped lists, and short paragraphs; very little decoration.
- Contact page carries map + social links.
- The visual tone is quiet and content-first — consistent with the chosen design preset **03 Information Architects (Reading-First Clarity)**.

## 7. What we mirror vs. what we do differently

**Mirror (structure only):**
- Hub-and-spoke IA for activities, services, schools, education.
- Day-grouped weekly schedule as a first-class view.
- Card list + per-item detail for activities/events.
- "Last updated" freshness signal.
- Audience / ministry / venue as separate, filterable dimensions.

**Do differently (our own product):**
- **A real events calendar** (list **and** month view) with one-off events on top of the recurring weekly schedule — the reference has schedules and news, not a unified dated calendar.
- **Explicit flag badges** for every taxonomy dimension (the reference leaves several dimensions implicit in prose).
- **A flag-based language switcher** (Arabic/English at launch, extensible) with per-language content fields and a graceful fallback — the reference is Arabic-only.
- **A non-technical admin** with role-based access and an audit log — the reference shows no admin surface.
- **Real-time publish** (save → visible in seconds, no deploy) — our own requirement.

## 8. Implications recorded for the build

1. Data model must separate: `event series` (recurrence rule) vs `occurrence` (dated instance) vs `exception` (cancelled/moved instance).
2. Taxonomy is its own set of tables (type, ministry, audience, language, venue, tags), many-to-many with events, each row carrying icon + colour for the badge.
3. i18n is field-level (per-language values for event/page fields) with a defined fallback, not a separate site per language.
4. The schedule view and the calendar view read the same underlying recurrence model.
5. All content is original; the reference contributes structure only.
