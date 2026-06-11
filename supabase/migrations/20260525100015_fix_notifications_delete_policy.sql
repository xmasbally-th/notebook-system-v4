-- Migration: Add DELETE policy for public.notifications table to allow admin users to delete notifications.
-- Date: 2026-05-25

-- Drop existing delete policy if any
DROP POLICY IF EXISTS "notifications_delete_admin" ON public.notifications;

-- Create DELETE policy allowing only users with role 'admin' to delete notifications
CREATE POLICY "notifications_delete_admin" ON public.notifications 
FOR DELETE USING (public.get_my_role() = 'admin');
