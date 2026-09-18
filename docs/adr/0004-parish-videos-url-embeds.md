# ADR-0004: Parish Videos via External URL Embeds (Superseding Video Studio)

- **Status**: Accepted
- **Date**: 2026-09-18
- **Deciders**: Parish Priest / Owner, Lead Architect, Senior Engineering Lead
- **Invariants**: **INV-01 (Zero-Auth Public Portal Isolation)**, **Security Gate Integrity (`getTrustedEmbedUrl`)**, **Zero External Image Wildcards**

---

## 1. Context & Problem Statement

The initial project roadmap included a "Video Studio" feature conceived as an automated video generation pipeline (rendering MP4 announcements from liturgical schedules or event flyers using paid external cloud render services or server-side headless browsers / ffmpeg).

During stakeholder review, the parish leadership explicitly cancelled and replaced this requirement:
> *"أنا عايز أضيف رابط فيديو، فيديو عن الكنيسة موجود على يوتيوب أو سوشيال ميديا، على الموقع ده site about us … الفيتشر ده مش محتاجه"*
> *(I want to add video URLs of church videos that already exist on YouTube or social media onto the about us website; the video-generation feature is not needed).*

The parish already maintains active broadcast channels on YouTube and Facebook featuring divine liturgies, vespers sermons, saint feast celebrations, and pastoral documentaries. Staff needed a straightforward administrative interface to register and curate these existing external videos, displaying them safely on the public portal without operational complexity, ongoing render API costs, or heavy server infrastructure.

---

## 2. Decision: Secure External URL Embeds Architecture

We superseded the Video Studio concept with a lightweight, secure **Parish Videos (External URL Embeds)** subsystem adhering to strict security and architectural invariants:

### 2.1 Database Schema (Migration 14)
We introduced `supabase/migrations/20260916140000_parish_videos.sql`:
- `video_provider_enum`: `'youtube'`, `'facebook'`, `'direct'`.
- `parish_videos` table:
  - Multilingual metadata: `title_ar`, `title_en`, `description_ar`, `description_en`.
  - URL tracking: `source_url` (raw staff input) and `embed_url` (server-normalized secure embed URL).
  - Optional thumbnail: `thumbnail_url` (e.g. `img.youtube.com`).
  - Presentation controls: `sort_order`, `is_public`, `is_active`.
  - Audit attributes: `created_by`, `updated_by`, `created_at`, `updated_at`.
- Strict RLS: Public anonymous visitors may SELECT only rows where `is_public = true AND is_active = true`. Staff mutations require authenticated roles (`admin` or `secretary`).

### 2.2 Server-Side Normalization & Security Filter (`normalizeVideoUrl`)
Raw URLs provided by staff are never trusted or directly passed to browsers. `normalizeVideoUrl()` parses inputs strictly on top of the `TRUSTED_EMBED_HOSTS` allowlist:
- **YouTube**: Transforms standard watch links (`watch?v=...`), short links (`youtu.be/...`), shorts (`/shorts/...`), and mobile links (`m.youtube.com`) into privacy-preserving `https://www.youtube-nocookie.com/embed/<id>`.
- **Facebook**: Normalizes post, watch, and `fb.watch` links into Facebook's official video plugin embed endpoint (`https://www.facebook.com/plugins/video.php?href=...`).
- **Direct Streams**: Restricts direct video playback to approved HTTPS origins (`*.supabase.co`).
- **Hostile Inputs**: Non-HTTPS protocols (`http:`, `javascript:`, `data:`), unparseable inputs, and lookalike/phishing domains are rejected immediately.

### 2.3 Public Embed Security Gate (`getTrustedEmbedUrl`)
Enforces invariant INV-01 on the public website (`apps/web`):
- No raw `<iframe src>` is ever rendered.
- Every embed URL must be validated at runtime through `getTrustedEmbedUrl()`.
- Content-Security-Policy (CSP) `frame-src` allowlist in `next.config.ts` is generated directly from `TRUSTED_EMBED_HOSTS`, guaranteeing zero security drift between HTTP headers and markup rendering.
- `images.remotePatterns` retains zero wildcard entries.

### 2.4 Administrative Experience (`/admin/videos`)
A dedicated staff manager in `apps/admin` under granular RBAC:
- `videos:read`: Staff view all registered videos and preview their embeds.
- `videos:write`: Editors (`secretary`) and Owners (`admin`) add/edit video entries with live embed preview and toggle visibility (`is_active`, `is_public`).
- `videos:delete`: Destructive deletion is strictly restricted to Owner role (`admin`).

---

## 3. Consequences & Benefits

- **Zero Budget & Operational Overhead**: Eliminates external rendering service fees, GPU dependencies, and ffmpeg binary maintenance.
- **Zero-Auth Build Preserved (INV-01)**: The public `/about` page pre-renders statically with zero environment variables and renders an honest empty state when no videos exist.
- **Defense in Depth**: Prevents iframe injection attacks, cross-site scripting (XSS), and unauthorized external media loading.
- **Immediate Value**: Parishioners can access high-definition church services and sermons directly on the portal.
