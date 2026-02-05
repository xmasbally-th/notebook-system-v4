-- ============================================
-- Migration: Performance Optimization - Part 2 (Composite Indexes)
-- Date: 2026-02-06
-- Description: Add composite indexes for filtered queries and realtime performance
-- ============================================

-- 1. loanRequests: Composite index for Status + CreatedAt (Sorting/Filtering)
-- Used by: Admin Dashboard, User History
CREATE INDEX IF NOT EXISTS idx_loan_requests_status_created 
  ON "loanRequests"(status, created_at DESC);

-- 2. reservations: Composite index for Status + CreatedAt
-- Used by: Admin Dashboard, Reservation Queue
CREATE INDEX IF NOT EXISTS idx_reservations_status_created 
  ON reservations(status, created_at DESC);

-- 3. notifications: Composite index for User + Read Status + CreatedAt
-- Used by: User Notification Bell (fetching unread/recent)
CREATE INDEX IF NOT EXISTS idx_notifications_user_read_created 
  ON notifications(user_id, is_read, created_at DESC);

-- 4. notifications: Index for cleanup/expiration if needed (optional but good practice)
CREATE INDEX IF NOT EXISTS idx_notifications_created_at 
  ON notifications(created_at);
