-- Migration: Add pickup_time and return_time to reservations
-- Date: 2026-02-13
-- Description: Store pickup and return times for reservations 
--   so they can be transferred to loanRequests when converting

ALTER TABLE reservations ADD COLUMN IF NOT EXISTS pickup_time TIME;
ALTER TABLE reservations ADD COLUMN IF NOT EXISTS return_time TIME;
