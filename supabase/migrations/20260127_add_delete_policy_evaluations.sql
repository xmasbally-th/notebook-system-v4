-- Migration: Add DELETE policy for evaluations
-- Date: 2026-01-27
-- Description: Allow admins to delete evaluations (required for data management soft delete)

CREATE POLICY "Admins can delete evaluations"
    ON public.evaluations FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );
