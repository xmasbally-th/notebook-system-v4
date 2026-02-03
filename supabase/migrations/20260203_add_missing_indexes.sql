-- ============================================
-- Migration: Performance Optimization - Part 1 (Indexes)
-- Date: 2026-02-03
-- Description: Add missing foreign key indexes for better JOIN and CASCADE performance
-- Safe: YES - CREATE INDEX IF NOT EXISTS is non-blocking with CONCURRENTLY
-- Impact: Performance improvement only, no breaking changes
-- ============================================

-- Note: Using IF NOT EXISTS for safety
-- These indexes improve query performance but don't affect existing data

-- ============================================
-- 1. loanRequests TABLE - Missing FK Indexes
-- ============================================
-- user_id is used in WHERE clauses and JOINs
CREATE INDEX IF NOT EXISTS idx_loan_requests_user_id 
  ON "loanRequests"(user_id);

-- equipment_id is used heavily in JOINs and conflict checks
CREATE INDEX IF NOT EXISTS idx_loan_requests_equipment_id 
  ON "loanRequests"(equipment_id);

-- status is frequently filtered
CREATE INDEX IF NOT EXISTS idx_loan_requests_status 
  ON "loanRequests"(status);

-- ============================================
-- 2. reservations TABLE - Missing FK Indexes
-- ============================================
-- These columns reference auth.users but were not indexed
CREATE INDEX IF NOT EXISTS idx_reservations_approved_by 
  ON reservations(approved_by) WHERE approved_by IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_reservations_ready_by 
  ON reservations(ready_by) WHERE ready_by IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_reservations_completed_by 
  ON reservations(completed_by) WHERE completed_by IS NOT NULL;

-- ============================================
-- 3. staff_activity_log TABLE - Missing FK Index
-- ============================================
CREATE INDEX IF NOT EXISTS idx_staff_activity_target_user 
  ON staff_activity_log(target_user_id) WHERE target_user_id IS NOT NULL;

-- ============================================
-- 4. notifications TABLE - Entity lookup index
-- ============================================
CREATE INDEX IF NOT EXISTS idx_notifications_entity 
  ON notifications(related_entity_id) WHERE related_entity_id IS NOT NULL;

-- ============================================
-- 5. PARTIAL INDEXES for frequently queried statuses
-- ============================================
-- Pending loans are queried frequently by staff
CREATE INDEX IF NOT EXISTS idx_loan_requests_pending 
  ON "loanRequests"(created_at DESC) WHERE status = 'pending';

-- Approved/active loans need quick lookup
CREATE INDEX IF NOT EXISTS idx_loan_requests_approved 
  ON "loanRequests"(created_at DESC) WHERE status = 'approved';

-- Pending reservations for staff queue
CREATE INDEX IF NOT EXISTS idx_reservations_pending_queue 
  ON reservations(created_at DESC) WHERE status = 'pending';

-- Active reservations for conflict checking  
CREATE INDEX IF NOT EXISTS idx_reservations_active 
  ON reservations(equipment_id, start_date, end_date) 
  WHERE status IN ('pending', 'approved', 'ready');

-- ============================================
-- VERIFICATION QUERY (run after migration)
-- ============================================
-- To verify indexes were created:
-- SELECT indexname, indexdef FROM pg_indexes WHERE schemaname = 'public' ORDER BY tablename, indexname;
