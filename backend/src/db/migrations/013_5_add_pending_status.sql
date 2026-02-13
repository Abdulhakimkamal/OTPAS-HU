-- ============================================
-- Migration: Add 'pending' status to project_status enum
-- Description: Adds 'pending' value to the project_status enum type
--              This must be done in a separate migration before using it
-- ============================================

-- Add 'pending' to project_status enum if it doesn't exist
ALTER TYPE project_status ADD VALUE IF NOT EXISTS 'pending';

-- ============================================
-- END OF MIGRATION
-- ============================================
