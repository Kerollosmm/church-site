-- =============================================================================
-- Migration 18: Atomic submission function for contact messages
-- Wraps contact_messages insertion and audit_log recording into a single
-- atomic transaction so neither can succeed without the other in production.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.submit_contact_message_atomic(
    p_sender_name text,
    p_sender_phone text,
    p_sender_email text,
    p_urgency contact_urgency_enum,
    p_assigned_priest_id uuid,
    p_message_content text
) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
    v_new_id uuid;
BEGIN
    INSERT INTO contact_messages (
        sender_name,
        sender_phone,
        sender_email,
        urgency,
        assigned_priest_id,
        message_content
    ) VALUES (
        p_sender_name,
        p_sender_phone,
        p_sender_email,
        p_urgency,
        p_assigned_priest_id,
        p_message_content
    ) RETURNING id INTO v_new_id;

    INSERT INTO audit_log (
        actor_id,
        actor_name,
        action,
        entity_type,
        entity_id,
        before,
        after,
        summary
    ) VALUES (
        NULL,
        'زائر الموقع (نموذج التواصل) — ' || p_sender_name,
        'create'::audit_action_enum,
        'contact_message',
        v_new_id::text,
        NULL,
        jsonb_build_object(
            'senderName', p_sender_name,
            'senderPhone', p_sender_phone,
            'senderEmail', p_sender_email,
            'urgency', p_urgency::text
        ),
        'رسالة تواصل جديدة من «' || p_sender_name || '» (الأهمية: ' || p_urgency::text || ')'
    );

    RETURN v_new_id;
END;
$$;

-- Security: Restrict execution to service_role only (server actions using createAdminClient)
REVOKE EXECUTE ON FUNCTION public.submit_contact_message_atomic(text, text, text, contact_urgency_enum, uuid, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.submit_contact_message_atomic(text, text, text, contact_urgency_enum, uuid, text) TO service_role;
