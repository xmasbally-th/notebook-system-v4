-- ============================================
-- V5 Baseline Migration: Layer 1 (Schema)
-- Date: 2026-02-24
-- Description: Consolidated tables, enums, and functions from 70+ migration files
-- ============================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Enums
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('admin', 'staff', 'user');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE user_status AS ENUM ('pending', 'approved', 'rejected');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE user_type AS ENUM ('student', 'lecturer', 'staff');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE equipment_status AS ENUM ('ready', 'borrowed', 'maintenance', 'retired');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE reservation_status AS ENUM (
        'pending', 'approved', 'ready', 'completed', 'rejected', 'cancelled', 'expired'
    );
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 2. Tables

-- Departments
CREATE TABLE IF NOT EXISTS departments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    code TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Equipment Types
CREATE TABLE IF NOT EXISTS equipment_types (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    icon TEXT DEFAULT '📦',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Profiles
CREATE TABLE IF NOT EXISTS profiles (
    id UUID REFERENCES auth.users(id) NOT NULL PRIMARY KEY,
    email TEXT NOT NULL,
    title TEXT,
    first_name TEXT,
    last_name TEXT,
    role user_role DEFAULT 'user',
    status user_status DEFAULT 'pending',
    user_type user_type,
    department_id UUID REFERENCES departments(id),
    phone_number TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Equipment
CREATE TABLE IF NOT EXISTS equipment (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    equipment_number TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    brand TEXT,
    model TEXT,
    equipment_type_id UUID REFERENCES equipment_types(id),
    status equipment_status DEFAULT 'ready',
    category JSONB DEFAULT '{}'::JSONB NOT NULL,
    images JSONB DEFAULT '[]'::JSONB NOT NULL,
    search_keywords TEXT[] DEFAULT '{}' NOT NULL,
    location JSONB DEFAULT '{}'::JSONB,
    specifications JSONB DEFAULT '{}'::JSONB,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Loan Requests
CREATE TABLE IF NOT EXISTS "loanRequests" (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    equipment_id UUID REFERENCES equipment(id) NOT NULL,
    start_date TIMESTAMPTZ NOT NULL,
    end_date TIMESTAMPTZ NOT NULL,
    reason TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'returned')),
    return_time TIME WITHOUT TIME ZONE,
    returned_at TIMESTAMPTZ,
    return_condition TEXT,
    return_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Reservations
CREATE TABLE IF NOT EXISTS reservations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    equipment_id UUID REFERENCES equipment(id) NOT NULL,
    start_date TIMESTAMPTZ NOT NULL,
    end_date TIMESTAMPTZ NOT NULL,
    pickup_time TIME,
    return_time TIME,
    status reservation_status DEFAULT 'pending',
    rejection_reason TEXT,
    loan_id UUID REFERENCES "loanRequests"(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    approved_at TIMESTAMPTZ,
    approved_by UUID REFERENCES auth.users(id),
    ready_at TIMESTAMPTZ,
    ready_by UUID REFERENCES auth.users(id),
    completed_at TIMESTAMPTZ,
    completed_by UUID REFERENCES auth.users(id)
);

-- Staff Activity Log
CREATE TABLE IF NOT EXISTS staff_activity_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    staff_id UUID REFERENCES auth.users(id) NOT NULL,
    staff_role TEXT NOT NULL,
    action_type TEXT NOT NULL,
    target_type TEXT NOT NULL,
    target_id TEXT NOT NULL, -- Changed to TEXT to support various ID formats
    target_user_id UUID REFERENCES auth.users(id),
    is_self_action BOOLEAN DEFAULT FALSE,
    details JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    related_entity_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Support
CREATE TABLE IF NOT EXISTS support_tickets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed')),
    subject TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS support_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    ticket_id UUID REFERENCES support_tickets(id) ON DELETE CASCADE NOT NULL,
    sender_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    message TEXT NOT NULL,
    is_staff_reply BOOLEAN DEFAULT FALSE,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Evaluations
CREATE TABLE IF NOT EXISTS evaluations (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    loan_id UUID NOT NULL REFERENCES "loanRequests"(id) ON DELETE CASCADE UNIQUE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    details JSONB NOT NULL DEFAULT '{}'::JSONB,
    suggestions TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Special Loans
CREATE TABLE IF NOT EXISTS special_loan_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    borrower_id UUID REFERENCES auth.users(id),
    borrower_name TEXT NOT NULL,
    borrower_phone TEXT,
    external_borrower_name TEXT,
    external_borrower_org TEXT,
    equipment_type_id UUID REFERENCES equipment_types(id),
    equipment_type_name TEXT NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    equipment_ids UUID[],
    equipment_numbers TEXT[],
    loan_date DATE NOT NULL,
    return_date DATE NOT NULL,
    purpose TEXT NOT NULL,
    notes TEXT,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'returned', 'cancelled')),
    created_by UUID REFERENCES auth.users(id) NOT NULL,
    returned_at TIMESTAMPTZ,
    returned_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT valid_date_range CHECK (return_date >= loan_date),
    CONSTRAINT check_borrower_presence CHECK (
        (borrower_id IS NOT NULL) OR 
        (external_borrower_name IS NOT NULL AND external_borrower_name <> '')
    )
);

-- System Config
CREATE TABLE IF NOT EXISTS system_config (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    key TEXT UNIQUE NOT NULL,
    value JSONB NOT NULL,
    -- Expanded columns for flat access if needed by old queries
    max_advance_booking_days INTEGER DEFAULT 30,
    reservation_expiry_minutes INTEGER DEFAULT 5,
    max_reservations_per_user INTEGER DEFAULT 3,
    discord_webhook_url TEXT,
    discord_notifications_enabled BOOLEAN DEFAULT FALSE,
    document_logo_url TEXT,
    document_template_id TEXT,
    evaluation_cutoff_date DATE,
    support_auto_reply_enabled BOOLEAN DEFAULT FALSE,
    support_auto_reply_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Data Backups
CREATE TABLE IF NOT EXISTS data_backups (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    filename TEXT NOT NULL,
    size_bytes BIGINT,
    record_counts JSONB,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Core Functions (Generic)

CREATE OR REPLACE FUNCTION check_combined_reservation_conflict(
    target_equipment_id UUID,
    new_start_date TIMESTAMPTZ,
    new_end_date TIMESTAMPTZ,
    exclude_reservation_id UUID DEFAULT NULL
) RETURNS BOOLEAN AS $$
DECLARE
    conflict_count INTEGER;
BEGIN
    -- Check reservations
    SELECT COUNT(*) INTO conflict_count
    FROM reservations 
    WHERE equipment_id = target_equipment_id
      AND status IN ('pending', 'approved', 'ready')
      AND (exclude_reservation_id IS NULL OR id != exclude_reservation_id)
      AND start_date <= new_end_date
      AND end_date >= new_start_date;
      
    IF conflict_count > 0 THEN RETURN TRUE; END IF;
    
    -- Check loan requests
    SELECT COUNT(*) INTO conflict_count
    FROM "loanRequests" 
    WHERE equipment_id = target_equipment_id
      AND status IN ('pending', 'approved')
      AND start_date <= new_end_date
      AND end_date >= new_start_date;
    
    IF conflict_count > 0 THEN RETURN TRUE; END IF;
    
    -- Check special loan requests
    SELECT COUNT(*) INTO conflict_count
    FROM special_loan_requests slr
    WHERE target_equipment_id = ANY(slr.equipment_ids)
      AND slr.status = 'active'
      AND slr.loan_date <= new_end_date::date
      AND slr.return_date >= new_start_date::date;
      
    RETURN conflict_count > 0;
END;
$$ LANGUAGE plpgsql;

-- 4. Indexes
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_equipment_type ON equipment(equipment_type_id);
CREATE INDEX IF NOT EXISTS idx_equipment_status ON equipment(status);
CREATE INDEX IF NOT EXISTS idx_loan_requests_user ON "loanRequests"(user_id);
CREATE INDEX IF NOT EXISTS idx_reservations_user_id ON reservations(user_id);
CREATE INDEX IF NOT EXISTS idx_reservations_equipment_id ON reservations(equipment_id);
CREATE INDEX IF NOT EXISTS idx_staff_activity_staff_id ON staff_activity_log(staff_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, is_read, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tickets_user ON support_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_ticket ON support_messages(ticket_id, created_at ASC);
CREATE GIN INDEX IF NOT EXISTS idx_special_loans_equipment_ids ON special_loan_requests(equipment_ids);
