-- =============================================================================
-- Migration 19: RPC Security Hardening & Search Path Hardening
-- Hardens search_path and execution privileges for core SECURITY DEFINER functions
-- =============================================================================

-- 1. handle_new_user()
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
ALTER FUNCTION public.handle_new_user() SET search_path = public, pg_temp;

-- 2. is_admin(), is_editor(), is_staff()
REVOKE EXECUTE ON FUNCTION public.is_admin() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_editor() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_staff() FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_editor() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_staff() TO authenticated;

ALTER FUNCTION public.is_admin() SET search_path = public, pg_temp;
ALTER FUNCTION public.is_editor() SET search_path = public, pg_temp;
ALTER FUNCTION public.is_staff() SET search_path = public, pg_temp;

-- 3. search_bible(query text, limit_count int)
CREATE OR REPLACE FUNCTION public.search_bible(query text, limit_count int DEFAULT 20)
RETURNS TABLE (book_slug VARCHAR, book_name VARCHAR, chapter INT, verse INT, text_ar TEXT)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
  SELECT b.slug, b.name_ar, v.chapter, v.verse, v.text_ar
  FROM bible_verses v
  JOIN bible_books b ON b.id = v.book_id
  WHERE length(btrim(query)) > 0
    AND length(btrim(query)) <= 200
    AND v.text_normalized LIKE '%' || normalize_arabic(query) || '%'
  ORDER BY b.canonical_order, v.chapter, v.verse
  LIMIT LEAST(GREATEST(COALESCE(limit_count, 20), 1), 100);
$$;

GRANT EXECUTE ON FUNCTION public.search_bible(text, int) TO anon, authenticated;

-- 4. track_condolence_booking(p_ref text)
-- Hardens reference code validation (bounds check: length 1-20, safe character set: alphanumeric, hyphen, underscore).
-- Rejects null, blank, whitespace-only, malformed, and overlong inputs without error.
-- Excludes all sensitive PII (applicant_name, applicant_phone, national_id, special_requests, staff notes).
CREATE OR REPLACE FUNCTION public.track_condolence_booking(p_ref text)
RETURNS TABLE (
    booking_reference_code VARCHAR,
    event_date DATE,
    slot_time VARCHAR,
    hall_name VARCHAR,
    status booking_status_enum,
    rejection_reason TEXT
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
  SELECT cb.booking_reference_code, cb.event_date, cb.slot_time, cb.hall_name, cb.status, cb.rejection_reason
  FROM condolence_bookings cb
  WHERE p_ref IS NOT NULL
    AND length(btrim(p_ref)) > 0
    AND length(btrim(p_ref)) <= 20
    AND btrim(p_ref) ~ '^[A-Za-z0-9_-]+$'
    AND cb.booking_reference_code = upper(btrim(p_ref))
  LIMIT 1;
$$;

REVOKE EXECUTE ON FUNCTION public.track_condolence_booking(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.track_condolence_booking(text) TO anon, authenticated;

-- 5. normalize_arabic(txt text)
ALTER FUNCTION public.normalize_arabic(text) SET search_path = pg_catalog, public, pg_temp;
