-- =============================================================================
-- 10 / 11 — اشتراكات تنبيهات الفعاليات (Event-notification subscriptions)
-- Source: the subscription layer of the events feature (public subscribe form).
-- Apply order: 10th. Depends on file 01 (uuid-ossp) and file 08 (audit_action_enum),
--               and must run BEFORE file 11 (its RLS policies).
--
-- Schema only — no seed rows are inserted by any migration file.
--
-- NOTE ON E-MAIL DELIVERY: this table is a LIST, not an outbox. The application has no mail
-- provider: a subscription is stored so the parish office can see it, and the notification step
-- records a `notify` entry in audit_log saying what WOULD have been sent. Nothing in this schema
-- implies a message was delivered.
--
-- NOTE ON NORMALISATION: `email` is stored trimmed and lower-cased by the application
-- (src/lib/domain/subscribers.ts → normalizeSubscriberEmail), which is what makes the UNIQUE
-- constraint below mean "one subscription per address" rather than "one per spelling".
-- =============================================================================

-- -----------------------------------------------------------------------------
-- لغة السجل (locale_enum) — نفس نمط الملفات 01/08: كتلة محروسة
-- -----------------------------------------------------------------------------
DO $$
BEGIN
    CREATE TYPE locale_enum AS ENUM ('ar', 'en');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- -----------------------------------------------------------------------------
-- قيمة تدقيقية جديدة: 'notify'
-- سطر يسجّله محوّل البريد عديم الأثر (no-op mailer) ليقول «هذا ما كان سيُرسل» — وهو ليس إرسالاً.
-- -----------------------------------------------------------------------------
ALTER TYPE audit_action_enum ADD VALUE IF NOT EXISTS 'notify';

-- -----------------------------------------------------------------------------
-- 1. المشتركون (subscribers)
-- بريد واحد = اشتراك واحد (email فريد). لا مفاتيح أجنبية: المشترك من الشعب وليس من حسابات
-- الطاقم، فلا يربط بـ profiles.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS subscribers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(254) NOT NULL,
    name VARCHAR(120),
    locale locale_enum NOT NULL DEFAULT 'ar',
    -- سلاجات مصطلحات التصنيف التي يهمّه أمرها؛ مصفوفة فارغة تعني «كل الفعاليات».
    -- (لا يمكن التعبير عن قيد أجنبي فوق عناصر مصفوفة، فتتحقق منها الطبقة البرمجية كما في
    --  event_series.default_term_ids.)
    topics TEXT[] NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    -- لحظة تأكيد الاشتراك. تؤشَّر عند الإنشاء لأن رسالة الموقع نفسها هي التأكيد المتاح بلا مزوّد
    -- بريد؛ وأي تدفق تأكيد مزدوج لاحقاً يتركها NULL حتى يُفتح الرابط.
    confirmed_at TIMESTAMPTZ,
    -- الإيقاف لا يحذف الصف: القرار قابل للتراجع والسجل يبقى كاملاً.
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    CONSTRAINT subscribers_email_key UNIQUE (email),
    CONSTRAINT subscribers_email_not_blank CHECK (length(btrim(email)) >= 5),
    CONSTRAINT subscribers_topics_max CHECK (cardinality(topics) <= 24)
);

-- -----------------------------------------------------------------------------
-- الفهارس (Indexes)
-- الفريد على email مضمَّن في قيد UNIQUE أعلاه (subscribers_email_key)، فلا يُنشأ فهرس ثانٍ له.
-- -----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_subscribers_active_created ON subscribers (created_at DESC) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_subscribers_created ON subscribers (created_at DESC);
