-- ============================================
-- Fix Notification Types Constraint
-- Created: 2026-01-27
-- Purpose: Restore reservation_approved and reservation_rejected types to the notifications table constraint
-- ============================================

-- Drop the incomplete constraint (from 20260127_inventory_notifications.sql)
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;

-- Add the correct constraint with ALL required types
ALTER TABLE notifications ADD CONSTRAINT notifications_type_check CHECK (type IN (
  'loan_approved',
  'loan_rejected',
  'equipment_due_soon',
  'equipment_overdue',
  'reservation_confirmed',
  'reservation_ready',
  'reservation_approved', -- Restored
  'reservation_rejected', -- Restored
  'equipment_maintenance',
  'equipment_retired',
  'equipment_ready'
));
