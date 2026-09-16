-- =============================================================================
-- 06 / 07 — الفهارس ومحركات البحث السريع (Indexes & Performance Tuning)
-- Source: BACKEND_AND_DATA_SPEC.md §4
-- Apply order: 6th (after every table exists).
--
-- uq_condolence_active_date is the database-level guarantee of one live
-- booking per calendar day; src/actions/condolence-actions.ts matches that
-- exact index name on SQLSTATE 23505 to report a date clash.
-- =============================================================================

-- فهارس تحسين الاستعلامات الشائعة
CREATE INDEX IF NOT EXISTS idx_mass_day_altar ON mass_schedules (day_of_week, altar_id) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_condolence_date_status ON condolence_bookings (event_date, status);
CREATE INDEX IF NOT EXISTS idx_news_published ON news_articles (published_at DESC) WHERE is_published = TRUE;

-- فهارس البحث النصي الذكي (Trigram GIN)
CREATE INDEX IF NOT EXISTS idx_news_title_trgm ON news_articles USING gin (title_ar gin_trgm_ops);

-- جديد v1.1
CREATE UNIQUE INDEX IF NOT EXISTS uq_condolence_active_date
    ON condolence_bookings (event_date)
    WHERE status IN ('pending', 'approved');          -- منع التعارض: حجز واحد فعّال لليوم الواحد
CREATE INDEX IF NOT EXISTS idx_mass_exceptions_date ON mass_exceptions (exception_date);
CREATE INDEX IF NOT EXISTS idx_alerts_active_window ON site_alerts (starts_at, ends_at) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_stream_status ON stream_events (status, starts_at DESC);
CREATE INDEX IF NOT EXISTS idx_program_apps_status ON program_applications (status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_job_apps_status ON job_applications (status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_verses_normalized_trgm ON bible_verses USING gin (text_normalized gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_verses_book_chapter ON bible_verses (book_id, chapter, verse);
