# Phase 3: Content Types Engine Architecture Specification

This document details the architectural design, domain specifications, data layer abstractions, and route implementations for the Phase 3 Content Types Engine of the Coptic Orthodox Parish Portal.

---

## 1. Executive Summary & Core Objectives

The Content Types Engine converts the parish portal into a high-performance, customizable CMS. Parish staff and priests can define dynamic content models (e.g., trips, spiritual publications, clinic specialties, retreat announcements) and custom field schemas directly from the administrative UI without writing code or redeploying the application.

### Invariants & Guarantees:
- **Zero-Auth Isolation (INV-01)**: The public web application (`apps/web`) requires zero authentication, zero server actions, and zero environment variables to build and run.
- **Zero New Dependencies**: Built entirely with native React 19 primitives, TypeScript standard libraries, native HTML sanitization, and `node:crypto`.
- **Dual-Driver Parity**: 100% feature and behavioral parity between the local JSON file store driver (`.data/church-store.json`) and the Supabase PostgREST relational driver.
- **Static-First Generation**: Dynamic content routes compile into static HTML via Next.js ISR/SSG with fallback support for uncredentialed environments.

---

## 2. Domain Model (`@church-site/domain`)

The domain model is implemented in `packages/domain/src/types.ts` and runtime validation utilities in `packages/domain/src/validation/dynamic-validator.ts`:

### 2.1 Metamodel Schema

```typescript
export type ContentFieldType =
  | "text"
  | "rich_text"
  | "number"
  | "boolean"
  | "date"
  | "media_ref"
  | "json";

export type ContentEntryStatus = "draft" | "published" | "archived";

export interface ContentType {
  id: string;
  slug: string;
  nameAr: string;
  nameEn: string;
  descriptionAr?: string;
  descriptionEn?: string;
  template: "default" | "article" | "index";
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ContentField {
  id: string;
  contentTypeId: string;
  nameAr: string;
  nameEn: string;
  slug: string;
  fieldType: ContentFieldType;
  isRequired: boolean;
  isTranslatable: boolean;
  defaultValue?: unknown;
  validationRules?: {
    minLength?: number;
    maxLength?: number;
    minValue?: number;
    maxValue?: number;
    regexPattern?: string;
    allowedOptions?: string[];
  };
  sortOrder: number;
}

export interface ContentEntry {
  id: string;
  contentTypeId: string;
  slug: string;
  titleAr: string;
  titleEn: string;
  status: ContentEntryStatus;
  data: Record<string, unknown>;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
}
```

### 2.2 Dynamic Runtime Validation

Because content fields are user-defined, runtime validation executes via `validateContentEntryData(fields, data)`:
- **Required Check**: Verifies mandatory fields are present and non-empty.
- **Type Coercion & Verification**:
  - `text` / `rich_text`: Verifies string type, checks `minLength` and `maxLength`, and runs regex pattern matches.
  - `number`: Verifies numeric type and enforces `minValue` / `maxValue` boundaries.
  - `boolean`: Ensures boolean primitive.
  - `date`: Validates ISO-8601 date strings.
  - `media_ref`: Ensures non-empty media URL or asset identifier.
  - `json`: Verifies JSON-serializable structures.
- **Option Allowlist**: If `allowedOptions` is specified, ensures the input value belongs to the configured enum.

### 2.3 Role-Based Access Control (RBAC)

The capabilities matrix in `packages/domain/src/capabilities.ts` integrates six new permissions:

| Capability | Description | Viewer | Editor | Owner |
| :--- | :--- | :---: | :---: | :---: |
| `content:read` | View content types and entries | Yes | Yes | Yes |
| `content:create` | Create new entries | No | Yes | Yes |
| `content:update` | Edit existing entries | No | Yes | Yes |
| `content:delete` | Delete entries | No | No | Yes |
| `content:publish` | Publish/unpublish entries | No | Yes | Yes |
| `content:manage` | Manage content types & fields | No | No | Yes |

---

## 3. Data Access & Dual-Driver Parity (`@church-site/data-access`)

Both drivers implement the canonical `ContentTypeRepository` contract:

```typescript
export interface ContentTypeRepository {
  listContentTypes(options?: { activeOnly?: boolean }): Promise<ContentType[]>;
  getContentTypeBySlug(slug: string): Promise<ContentType | null>;
  getContentTypeById(id: string): Promise<ContentType | null>;
  createContentType(type: Omit<ContentType, "id" | "createdAt" | "updatedAt">): Promise<ContentType>;
  updateContentType(id: string, patch: Partial<Omit<ContentType, "id" | "createdAt" | "updatedAt">>): Promise<ContentType>;
  deleteContentType(id: string): Promise<void>;

  listContentFields(contentTypeId: string): Promise<ContentField[]>;
  saveContentField(field: Omit<ContentField, "id"> & { id?: string }): Promise<ContentField>;
  deleteContentField(id: string): Promise<void>;

  listContentEntries(contentTypeSlug: string, options?: { status?: ContentEntryStatus }): Promise<ContentEntry[]>;
  getContentEntryBySlug(contentTypeSlug: string, entrySlug: string): Promise<ContentEntry | null>;
  getContentEntryById(id: string): Promise<ContentEntry | null>;
  createContentEntry(entry: Omit<ContentEntry, "id" | "createdAt" | "updatedAt">): Promise<ContentEntry>;
  updateContentEntry(id: string, patch: Partial<Omit<ContentEntry, "id" | "createdAt" | "updatedAt">>): Promise<ContentEntry>;
  deleteContentEntry(id: string): Promise<void>;
}
```

### 3.1 JSON File Store Driver (Schema v3)
- Stores types in `.data/church-store.json`.
- Automatic migration upgrade: when loading v1 or v2 stores, initializes `content_types: []`, `content_fields: []`, and `content_entries: []`, upgrading `version` to `3`.
- In-memory querying and immutable file flushing on mutations.

### 3.2 Supabase PostgREST Driver
- Queries PostgreSQL via `@supabase/supabase-js`.
- Translates between snake_case SQL columns and camelCase domain interfaces.
- Uses transaction-safe single or multi-row queries with relational joins.

---

## 4. Database Schema & Migration

Database schema is codified in `supabase/migrations/20260916130000_content_types.sql`:

```sql
-- Metamodels
CREATE TABLE content_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name_ar TEXT NOT NULL,
  name_en TEXT NOT NULL,
  description_ar TEXT,
  description_en TEXT,
  template TEXT NOT NULL DEFAULT 'default',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE content_fields (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type_id UUID NOT NULL REFERENCES content_types(id) ON DELETE CASCADE,
  name_ar TEXT NOT NULL,
  name_en TEXT NOT NULL,
  slug TEXT NOT NULL,
  field_type TEXT NOT NULL,
  is_required BOOLEAN NOT NULL DEFAULT false,
  is_translatable BOOLEAN NOT NULL DEFAULT false,
  default_value JSONB,
  validation_rules JSONB,
  sort_order INTEGER NOT NULL DEFAULT 0,
  UNIQUE(content_type_id, slug)
);

CREATE TABLE content_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type_id UUID NOT NULL REFERENCES content_types(id) ON DELETE CASCADE,
  slug TEXT NOT NULL,
  title_ar TEXT NOT NULL,
  title_en TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(content_type_id, slug)
);

-- Indexing
CREATE INDEX idx_content_entries_type_status ON content_entries(content_type_id, status);
CREATE INDEX gin_content_entries_data ON content_entries USING gin (data);

-- Row Level Security
ALTER TABLE content_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read active content types" ON content_types FOR SELECT USING (is_active = true);
CREATE POLICY "Public read fields of active types" ON content_fields FOR SELECT USING (
  EXISTS (SELECT 1 FROM content_types WHERE content_types.id = content_fields.content_type_id AND content_types.is_active = true)
);
CREATE POLICY "Public read published content entries" ON content_entries FOR SELECT USING (
  status = 'published' AND EXISTS (SELECT 1 FROM content_types WHERE content_types.id = content_entries.content_type_id AND content_types.is_active = true)
);
```

---

## 5. Administrative UI (`apps/admin`)

The admin interface offers full lifecycle management:
1. **Content Type Management** (`/content-types`):
   - Grid and table view of all defined models.
   - Dynamic schema editor (`/content-types/[id]/fields`) supporting drag-and-drop sort orders, field validation rules, and localization toggles.
2. **Dynamic Entry Management** (`/content/[type]`):
   - Dynamic table of entries displaying status badges, publishing timestamps, and localized titles.
   - Dynamic entry form generating appropriate input widgets based on field type:
     - `RichTextEditor`: Minimalist WYSIWYG editor supporting headings, formatting, lists, quotes, and links, backed by an allowlist HTML sanitizer.
     - `Date`: ISO calendar picker.
     - `Media`: Asset picker linked with media storage.
3. **Server Actions**:
   - `content-type-actions.ts`: `saveContentTypeAction`, `saveContentFieldAction`, `deleteContentTypeAction`, `deleteContentFieldAction`.
   - `content-entry-actions.ts`: `saveContentEntryAction`, `deleteContentEntryAction`, `publishContentEntryAction`.

---

## 6. Public Web Portal (`apps/web`)

### 6.1 Generic Dynamic Routes
- `/content/[type]/page.tsx`: Resolves content type by slug, fetches all entries matching `status: "published"`, and selects the appropriate presentation template (`default`, `article`, or `index`).
- `/content/[type]/[slug]/page.tsx`: Resolves the specific entry by slug, validates published status, and renders the detailed entry with custom field projections.

### 6.2 Layout Templates
- `templates/default.tsx`: Standard card-based layout for listings and clean hero + metadata for detail views.
- `templates/article.tsx`: Reading-optimized typography layout with Arabic font smoothing, date stamps, and publication author headers.
- `templates/index.tsx`: Clean tabular / compact directory list suitable for clinic schedules or document downloads.

### 6.3 Static Generation & Fallback
- `generateStaticParams` queries available content types and published entries when database connections exist.
- When building in zero-env or uncredentialed environments, catches errors gracefully and returns empty parameter arrays, allowing Next.js dynamic routing to serve pages on demand at runtime.

### 6.4 Client/Server HTML Sanitization
To prevent XSS without introducing heavy external npm libraries, `packages/data-access/src/client/sanitizer.ts` implements an allowlist HTML sanitizer:
- Allowed tags: `h1, h2, h3, h4, h5, h6, p, br, hr, b, i, strong, em, u, s, ul, ol, li, blockquote, pre, code, a, img, table, thead, tbody, tr, th, td`.
- Allowed attributes: `href, src, alt, title, target, rel, class`.
- Enforces `rel="noopener noreferrer"` on all outbound hyperlinks and strips `javascript:` URI schemes.
