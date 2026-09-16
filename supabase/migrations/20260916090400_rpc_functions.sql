-- =============================================================================
-- 05 / 07 — دوال استدعاء عامة آمنة (SECURITY DEFINER RPCs)
-- Source: BACKEND_AND_DATA_SPEC.md §3.3 (tables 23)
-- Apply order: 5th. Depends on file 03 (condolence_bookings), file 04
--                        (bible_books / bible_verses) and file 02 (normalize_arabic).
--
-- Both functions are STABLE SECURITY DEFINER with a fixed
-- `SET search_path = public`, so they can be called by anon/authenticated
-- without granting table-level SELECT (track_condolence_booking replaces the
-- public read path on condolence_bookings, which has no SELECT policy).
-- =============================================================================

-- تتبع حجز العزاء برمز المرجع: بديل آمن عن فتح SELECT عام على الجدول
CREATE OR REPLACE FUNCTION track_condolence_booking(p_ref text)
RETURNS TABLE (
    booking_reference_code VARCHAR, event_date DATE, slot_time VARCHAR,
    hall_name VARCHAR, status booking_status_enum, rejection_reason TEXT
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT booking_reference_code, event_date, slot_time, hall_name, status, rejection_reason
  FROM condolence_bookings
  WHERE booking_reference_code = upper(btrim(p_ref))
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION track_condolence_booking(text) TO anon, authenticated;

-- البحث في الآيات مع تجاهل التشكيل والألفات
CREATE OR REPLACE FUNCTION search_bible(query text, limit_count int DEFAULT 20)
RETURNS TABLE (book_slug VARCHAR, book_name VARCHAR, chapter INT, verse INT, text_ar TEXT)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT b.slug, b.name_ar, v.chapter, v.verse, v.text_ar
  FROM bible_verses v
  JOIN bible_books b ON b.id = v.book_id
  WHERE v.text_normalized LIKE '%' || normalize_arabic(query) || '%'
  ORDER BY b.canonical_order, v.chapter, v.verse
  LIMIT limit_count;
$$;

GRANT EXECUTE ON FUNCTION search_bible(text, int) TO anon, authenticated;
