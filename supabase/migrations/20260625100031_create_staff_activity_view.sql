-- Migration: Create staff_activity_log_view for efficient single-query log retrieval
CREATE OR REPLACE VIEW public.staff_activity_log_view
WITH (security_invoker = true) AS
SELECT 
    l.id,
    l.staff_id,
    l.staff_role,
    l.action_type,
    l.target_type,
    l.target_id,
    l.target_user_id,
    l.is_self_action,
    l.details,
    l.created_at,
    -- Staff details
    sp.first_name AS staff_first_name,
    sp.last_name AS staff_last_name,
    sp.email AS staff_email,
    -- Target user details
    tp.first_name AS target_first_name,
    tp.last_name AS target_last_name,
    tp.email AS target_email,
    tp.user_id AS target_user_student_id,
    -- Equipment details
    COALESCE(
        le.name,
        re.name,
        (l.details->>'equipment_name'),
        (l.details->>'name'),
        CASE 
            WHEN l.target_type = 'special_loan' AND (l.details->>'equipment_type') IS NOT NULL
            THEN CONCAT(l.details->>'equipment_type', ' (', COALESCE(l.details->>'quantity', '1'), ' ชิ้น)')
            ELSE (l.details->>'equipment_type')
        END
    ) AS equipment_name,
    COALESCE(
        le.equipment_number,
        re.equipment_number,
        (l.details->>'equipment_number'),
        '-'
    ) AS equipment_number
FROM public.staff_activity_log l
LEFT JOIN public.profiles sp ON sp.id = l.staff_id
LEFT JOIN public.profiles tp ON tp.id = l.target_user_id
LEFT JOIN public."loanRequests" lr ON l.target_type = 'loan' AND l.target_id = lr.id::text
LEFT JOIN public.equipment le ON lr.equipment_id = le.id
LEFT JOIN public.reservations r ON l.target_type = 'reservation' AND l.target_id = r.id::text
LEFT JOIN public.equipment re ON r.equipment_id = re.id;

-- Grant permissions to authenticated users (RLS is enforced by security_invoker)
GRANT SELECT ON public.staff_activity_log_view TO authenticated;
GRANT SELECT ON public.staff_activity_log_view TO service_role;

-- Reload schema cache for PostgREST
NOTIFY pgrst, 'reload schema';
