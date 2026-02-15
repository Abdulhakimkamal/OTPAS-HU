-- Migration 017: Add advisor assignment notification types to notifications table
-- This adds 'advisor_assigned' and 'advisor_removed' to the allowed notification types

-- Add check constraint for type to include advisor assignment types
DO $$
BEGIN
  ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
  ALTER TABLE notifications ADD CONSTRAINT notifications_type_check
    CHECK (type IN (
      'title_approved', 
      'title_rejected', 
      'evaluation_complete', 
      'info', 
      'warning', 
      'error', 
      'success',
      'advisor_assigned',
      'advisor_removed'
    ));
EXCEPTION
  WHEN duplicate_object THEN
    NULL;
END $$;

-- Update existing notifications if needed (optional)
-- No data migration needed, just constraint update
