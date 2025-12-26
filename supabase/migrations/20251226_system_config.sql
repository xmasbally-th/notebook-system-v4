-- Migration: Create system_config table for global settings
-- Stores configuration for loan limits, working hours, and feature toggles.

CREATE TABLE IF NOT EXISTS public.system_config (
    id INTEGER PRIMARY KEY DEFAULT 1,
    
    -- Loan Rules
    max_loan_days INTEGER DEFAULT 7 NOT NULL,
    max_items_per_user INTEGER DEFAULT 3 NOT NULL,
    
    -- Operations (Business Hours)
    opening_time TIME DEFAULT '09:00:00'::TIME,
    closing_time TIME DEFAULT '17:00:00'::TIME,
    closed_days JSONB DEFAULT '[]'::JSONB, -- Array of specific dates or days of week (0-6)
    
    -- Feature Toggles
    is_loan_system_active BOOLEAN DEFAULT TRUE,
    is_reservation_active BOOLEAN DEFAULT TRUE,
    
    -- Integrations
    discord_webhook_url TEXT,
    
    -- Announcements
    announcement_message TEXT,
    announcement_active BOOLEAN DEFAULT FALSE,
    
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Singleton Constraint: Ensure only one row exists (id=1)
    CONSTRAINT singleton_config CHECK (id = 1)
);

-- Enable RLS
ALTER TABLE public.system_config ENABLE ROW LEVEL SECURITY;

-- Policies
-- Everyone can read stats (public info) or maybe restricted to authenticated?
-- Let's allow authenticated users to read config (needed for validation client-side)
CREATE POLICY "Authenticated users can view config" 
ON public.system_config FOR SELECT 
TO authenticated 
USING (true);

-- Only Admins can update
CREATE POLICY "Admins can update config" 
ON public.system_config FOR UPDATE 
TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() 
        AND role = 'admin' 
        AND status = 'approved'
    )
);

-- Insert default row if not exists
INSERT INTO public.system_config (id) VALUES (1) ON CONFLICT (id) DO NOTHING;
