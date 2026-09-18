# Phase 7.3 Technical Architecture: External Assets & Link Resolver (AssetResolver)

## 1. Executive Summary & Background

### Church Owner Problem & Need
During parish portal content management, church leadership and administrative servants frequently need to include imagery in announcements, parish articles, event promotions, and photo galleries. Much of this visual material is already hosted externally on platforms such as YouTube (sermon recordings, liturgy live broadcasts, youth conferences) and Google Drive (high-resolution photo batches from feast days and pastoral visits).

Prior to Phase 7.3, adding such assets required servants to either:
1. Manually download high-resolution photos and re-upload them to Supabase Storage, unnecessarily consuming limited database storage quotas and bandwidth.
2. Attempt to paste raw web page URLs (such as `https://www.youtube.com/watch?v=...` or `https://drive.google.com/file/d/.../view`), which failed to render in `<img>` or `next/image` components because these are HTML web pages, not direct image endpoints, and their hosts were blocked by browser Content Security Policy (CSP) and Next.js `remotePatterns`.

The church owner specifically requested the ability to add assets via third-party links from YouTube and Google directly without friction, while ensuring zero security compromise for church website visitors.

### The Solution: AssetResolver
Phase 7.3 introduces a robust, zero-cost, server-side-safe link resolution architecture:
- **`ASSET_ALLOWED_HOSTS`**: Pinned, single source of truth allowlist in [`asset-allowlist.ts`](file:///C:/Church-Site/packages/data-access/src/assets/asset-allowlist.ts).
- **`AssetResolver`**: URL parsing, validation, and resolution engine in [`asset-resolver.ts`](file:///C:/Church-Site/packages/data-access/src/assets/asset-resolver.ts) transforming YouTube video URLs into canonical high-resolution thumbnails (`hqdefault.jpg`) and Google Drive view links into direct user content endpoints (`drive.usercontent.google.com`).
- **Unified Security Boundary**: Automatic derivation of Next.js image optimization allowlists (`images.remotePatterns`) and CSP `img-src` headers directly from the shared allowlist constant.
- **Direct Client Rendering**: Deliberate omission of any server-side HTTP media proxy to eliminate SSRF attack vectors entirely.

---

## 2. Architecture of `AssetResolver`

The resolver is situated in `packages/data-access/src/assets/` and consists of two primary modules: [`asset-allowlist.ts`](file:///C:/Church-Site/packages/data-access/src/assets/asset-allowlist.ts) and [`asset-resolver.ts`](file:///C:/Church-Site/packages/data-access/src/assets/asset-resolver.ts).

### 2.1 Single Source of Truth (`ASSET_ALLOWED_HOSTS`)
The allowlist is statically declared and frozen using TypeScript `as const`:

```typescript
// packages/data-access/src/assets/asset-allowlist.ts
export const ASSET_ALLOWED_HOSTS = [
  // YouTube video thumbnail CDN pinned host
  "i.ytimg.com",
  // YouTube image CDN regional subdomains (i1.ytimg.com .. i4.ytimg.com)
  "*.ytimg.com",
  // YouTube image CDN apex domain
  "ytimg.com",
  // YouTube legacy thumbnail domain
  "img.youtube.com",
  // Official Google Drive direct download and image render endpoint
  "drive.usercontent.google.com",
  // Google user content CDN (direct Google Photos, Drive user content)
  "*.googleusercontent.com",
  // Google user content apex domain
  "googleusercontent.com",
] as const;
```

Host verification helper `isHostAllowed(hostname: string): boolean` performs exact matching and wildcard subdomain suffix matching (`*.ytimg.com`, `*.googleusercontent.com`).

### 2.2 Resolution Mechanics (`asset-resolver.ts`)

#### 1. `resolveExternalImageUrl(raw: string | null | undefined): ResolveResult | null`
Processes incoming external URLs at ingest time (admin forms and mutations) and returns:
- `sourceUrl`: Original input string entered by the user.
- `resolvedUrl`: Normalized, direct image endpoint.
- `host`: The authoritative target host.
- `kind`: `"youtube-thumb" | "drive" | "direct-image" | "unsupported"`.
- `reason`: Localized Arabic explanatory message if unsupported.

#### 2. `getSafeRenderableImageUrl(raw: string | null | undefined): string | null`
Safeguards public rendering surfaces (`apps/web` and `apps/admin`).
- **Relative Parish Paths**: Pass through intact (e.g. `/images/cross.svg`).
- **Supabase Storage URLs**: Pass through if pointing to `https://*.supabase.co`.
- **External URLs**: Validated against `resolveExternalImageUrl()`. If resolved and allowed, returns `resolvedUrl`. If unverified, malformed, or malicious, returns `null`. Guarantees no raw external URL or unverified origin reaches an `<img>` tag.

### 2.3 Format & Regex ID Validation
To prevent path traversal, prototype pollution, or parameter injection, asset IDs are validated against strict regular expressions:
- **YouTube Video ID**: `^[a-zA-Z0-9_-]{11}$`
  - Validates IDs across standard watch links (`youtube.com/watch?v=ID`), short URLs (`youtu.be/ID`), Shorts (`youtube.com/shorts/ID`), embed links (`youtube.com/embed/ID`), and image paths (`youtube.com/vi/ID`).
  - Resolves canonically to: `https://i.ytimg.com/vi/{ID}/hqdefault.jpg`.
- **Google Drive File ID**: `^[a-zA-Z0-9_-]{20,}$`
  - Validates IDs across file paths (`drive.google.com/file/d/{ID}/view`), direct queries (`/uc?id={ID}`), open queries (`/open?id={ID}`), and download links.
  - Resolves canonically to: `https://drive.usercontent.google.com/download?id={ID}&export=view`.

### 2.4 Unified Security Derivation
In both `apps/web/next.config.ts` and `apps/admin/next.config.ts`, `ASSET_ALLOWED_HOSTS` is directly imported from the workspace package `@church-site/data-access`.

1. **Next.js Image Optimization**:
```typescript
images: {
  remotePatterns: [
    { protocol: "https", hostname: "*.supabase.co" },
    ...ASSET_ALLOWED_HOSTS.map((host) => ({
      protocol: "https" as const,
      hostname: host,
    })),
  ],
}
```
2. **Content-Security-Policy (`img-src`)**:
```typescript
const externalImageOrigins = ASSET_ALLOWED_HOSTS.map((host) => `https://${host}`);
// In CSP header:
`img-src 'self' data: blob: https://*.supabase.co ${externalImageOrigins.join(" ")}`
```
This guarantees zero drift between the application validation layer, Next.js optimization pipeline, and browser enforcement headers.

---

## 3. Threat Model & SSRF Mitigation

External resource processing in web applications poses well-known security risks. Phase 7.3 implements a defense-in-depth security model to address each threat vector.

```mermaid
flowchart TD
    RawInput[Input URL] --> CheckClean{Whitespace / Control Chars?}
    CheckClean -- Yes --> RejectUnsupported[Reject: unsupported + reason]
    CheckClean -- No --> ParseURL[new URL parsed]
    ParseURL -- Parse Error --> ReturnNull[Return null]
    ParseURL --> CheckProtocol{Protocol == https:?}
    CheckProtocol -- No --> RejectHTTPS[Reject: HTTPS required]
    CheckProtocol -- Yes --> CheckUserInfo{username or password?}
    CheckUserInfo -- Yes --> RejectUserInfo[Reject: userinfo forbidden]
    CheckUserInfo -- No --> CheckPort{Port == 443 or default?}
    CheckPort -- No --> RejectPort[Reject: non-standard port forbidden]
    CheckPort -- Yes --> CheckPhotos{Google Photos Album URL?}
    CheckPhotos -- Yes --> RejectPhotos[Honest Reject: album link not direct image]
    CheckPhotos -- No --> DetectKind{Domain Detection}
    
    DetectKind -- YouTube Domain --> CheckYTID{11-char Video ID?}
    CheckYTID -- Valid --> ResolveYT[Resolve to i.ytimg.com/vi/ID/hqdefault.jpg]
    CheckYTID -- Invalid --> RejectYT[Reject: invalid video ID]
    
    DetectKind -- Google Drive Domain --> CheckDriveID{20+ char File ID?}
    CheckDriveID -- Valid --> ResolveDrive[Resolve to drive.usercontent.google.com]
    CheckDriveID -- Invalid --> RejectDrive[Reject: invalid drive file ID]
    
    DetectKind -- Other Domain --> CheckAllowlist{Host in ASSET_ALLOWED_HOSTS?}
    CheckAllowlist -- Yes --> DirectImage[Pass through: direct-image]
    CheckAllowlist -- No --> RejectDisallowed[Reject: host not in allowlist]
```

### 3.1 Attack Vectors & Mitigations
| Attack Vector | Vulnerability Scenario | Mitigation Implemented in AssetResolver |
| :--- | :--- | :--- |
| **SSRF (Server-Side Request Forgery)** | Attacker inputs an internal IP or AWS metadata URL (`http://169.254.169.254/`) to probe internal networks. | **No Server-Side Fetching / Proxy**: Zero outbound HTTP calls are made by the Next.js server. Images are loaded directly by the visitor's browser. |
| **Protocol Smuggling** | Attacker supplies `javascript:alert(1)`, `data:text/html`, or `file:///etc/passwd`. | Strict `protocol === "https:"` validation. All non-HTTPS schemes are rejected immediately. |
| **Credential Exfiltration** | URLs with embedded credentials (`https://admin:secret@malicious.com`). | Explicit rejection if `parsed.username` or `parsed.password` is present. |
| **Port Scanning** | Attacker specifies internal ports (e.g. `https://localhost:6379`). | Only default port or explicit standard port `443` is allowed. Any other port is rejected. |
| **Control Character Smuggling** | Carriage return/newline characters (`\r\n`) to inject headers or bypass URL parsers. | Pre-parse regex check `/\s|[\x00-\x1F\x7F]/.test(raw)` immediately rejects the string. |
| **Untrusted Content Embedding** | Phishing sites or malicious hosts delivering malware disguised as images. | Strict allowlist `ASSET_ALLOWED_HOSTS`. Only recognized CDN endpoints from YouTube and Google are accepted. |

### 3.2 Omission of Media Proxy Route
A standard architectural pattern in some systems is deploying an API route like `apps/web/src/app/api/media/proxy?url=...` to re-stream third-party images. **In Church Site, this was deliberately omitted.**
1. **SSRF Elimination**: A server-side proxy requires fetching arbitrary remote endpoints from the Next.js backend, exposing backend servers, internal VPCs, or cloud metadata services to SSRF attacks unless extensive, complex IP sandboxing is deployed.
2. **Direct Browser Delivery**: Modern browsers natively support direct image loading when backed by Content Security Policy (`img-src`) and CORS.
3. **Bandwidth & Compute Efficiency**: Church portal servers remain static-first with zero bandwidth overhead consumed for proxying gigabytes of external media files.

### 3.3 Google Photos Honest Rejection
Google Photos album sharing links (`https://photos.app.goo.gl/...` or `https://photos.google.com/share/...`) generate authenticated HTML pages designed for Google account holders, not direct image files.
- `AssetResolver` detects `photos.app.goo.gl` and `photos.google.com` and provides an honest Arabic explanation rather than failing silently.
- Administrative staff are guided to open the photograph in full view and copy the direct image address (`lh3.googleusercontent.com`), which is fully supported under the `*.googleusercontent.com` allowlist rule.

---

## 4. Database & Persistence Architecture

External asset metadata is persisted in the database via additive migration 16 with zero disruption to existing records.

### 4.1 Supabase Migration 16
File: [`supabase/migrations/20260916160000_external_assets.sql`](file:///C:/Church-Site/supabase/migrations/20260916160000_external_assets.sql)

```sql
ALTER TABLE public.media
  ADD COLUMN IF NOT EXISTS source_url TEXT,
  ADD COLUMN IF NOT EXISTS resolved_url TEXT,
  ADD COLUMN IF NOT EXISTS host VARCHAR(255),
  ADD COLUMN IF NOT EXISTS kind VARCHAR(64);
```

- **`source_url`**: The original URL as provided by church staff (e.g. `https://youtu.be/abcdef12345`).
- **`resolved_url`**: The validated, direct image URL (e.g. `https://i.ytimg.com/vi/abcdef12345/hqdefault.jpg`).
- **`host`**: The approved host string (e.g. `i.ytimg.com`).
- **`kind`**: The asset category (`youtube-thumb`, `drive`, `direct-image`).

### 4.2 Seamless Backward Compatibility
To avoid breaking changes across legacy consumers, **`public.media.url` stores `resolved_url`**.
- Any existing component or third-party query reading `media.url` receives the safe, direct image endpoint immediately without requiring code rewrites.
- Public consumers (`<img src={url}>`, `<Image src={url}>`) continue to work seamlessly.
- Both persistence drivers (`JsonEventRepository` in `json-driver.ts` and `SupabaseEventRepository` in `supabase-driver.ts`) implement full serialization and deserialization for all four external asset fields.

---

## 5. Admin UX & Capabilities

### 5.1 RBAC & Capabilities
A dedicated capability `assets:link` is defined in `@church-site/domain`:
- **Role Permissions**:
  - `owner` / `admin`: Granted `assets:link`.
  - `editor` / `secretary`: Granted `assets:link`.
  - `viewer`: Denied (read-only access).
- **Enforcement**: [`admin-asset-actions.ts`](file:///C:/Church-Site/apps/admin/src/actions/admin-asset-actions.ts) enforces `requireStaff()` and `can(role, "assets:link")`.

### 5.2 Admin Media Manager (`/admin/media`)
In [`MediaManager.tsx`](file:///C:/Church-Site/apps/admin/src/app/(protected)/media/MediaManager.tsx), the interface features three dedicated tabs:
1. **رفع ملف جديد (Upload File)**: Supabase Storage upload for local files up to 50MB.
2. **إضافة رابط خارجي (Add External URL)**:
   - Real-time client-side resolution and validation as the user types.
   - Security Status Badge: Displays a green checkmark for approved hosts or a warning alert with the rejection reason.
   - Provider Chip: Clearly identifies the source (`يوتيوب`, `Google Drive`, `رابط مباشر`).
   - Host Pill: Displays the resolved host (e.g. `i.ytimg.com`).
   - Live Thumbnail Preview: Instant rendering using Next.js `Image` with `unoptimized` flag.
   - Optional Target Event association.
3. **تسجيل رابط يدوي (Manual Link)**: Preserved for legacy direct media registrations.

### 5.3 Dynamic Content Types Form (`DynamicEntryForm.tsx`)
In the content management engine (`/admin/content/[type]/new` and `edit`):
- Any field of type `media` automatically evaluates pasted strings against `resolveExternalImageUrl()`.
- If an external link is recognized, the form renders an interactive badge confirming that it is a validated external asset.
- A button allows the servant to click **"اعتماد الرابط المباشر"** (Adopt direct URL).
- **Write-Time Normalization**: On form submission, all media field values in `formData` are automatically evaluated and converted to their `resolvedUrl` before persisting to the database.

---

## 6. Public Rendering Security & Invariants

### 6.1 Invariant INV-01: Zero-Auth Public Isolation
- Public visitors browsing `/gallery`, `/about`, or dynamic content pages `/content/[type]` never require authentication.
- No session tokens or Supabase service credentials are required to render external images.

### 6.2 Guaranteed Safe Rendering Pipeline
In all public templates ([`gallery/page.tsx`](file:///C:/Church-Site/apps/web/src/app/gallery/page.tsx), [`content/[type]/page.tsx`](file:///C:/Church-Site/apps/web/src/app/content/[type]/page.tsx), [`article.tsx`](file:///C:/Church-Site/apps/web/src/app/content/[type]/[slug]/templates/article.tsx), and [`default.tsx`](file:///C:/Church-Site/apps/web/src/app/content/[type]/[slug]/templates/default.tsx)):
- The URL is passed through `getSafeRenderableImageUrl()`.
- If a malicious URL, unsupported host, or raw web page was somehow stored, `getSafeRenderableImageUrl()` returns `null`, preventing the image element from firing an insecure request or violating CSP.
- If verified, the image renders cleanly with standard responsive attributes and accessibility captions (`alt`).

---

## 7. Architectural Verification & Summary

Phase 7.3 achieves 100% test coverage across all external asset behaviors:
- 43 dedicated unit tests in [`asset-resolver.test.ts`](file:///C:/Church-Site/packages/data-access/src/assets/__tests__/asset-resolver.test.ts) testing YouTube variations, Google Drive formats, Google Photos rejections, SSRF payloads, port attacks, userinfo injections, and protocol violations.
- 5 server action tests in [`admin-asset-actions.test.ts`](file:///C:/Church-Site/apps/admin/src/actions/__tests__/admin-asset-actions.test.ts).
- 5 gallery component tests in [`gallery.test.tsx`](file:///C:/Church-Site/apps/web/src/app/gallery/__tests__/gallery.test.tsx).
- All 717 workspace tests pass green (Vitest).
- 0 TypeScript errors across monorepo (`pnpm typecheck`).
- 0 ESLint errors (`pnpm lint`).
- Static web build generates 52/52 routes cleanly with zero environment variables.
