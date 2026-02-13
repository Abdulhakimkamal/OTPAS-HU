-- Migration: Add user account management fields
-- Created: 2026-02-06
-- Description: Adds must_change_password, welcome_email_sent, and created_by_admin_id fields to users table

-- Add must_change_password column
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN DEFAULT FALSE;

-- Add welcome_email_sent column
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS welcome_email_sent BOOLEAN DEFAULT FALSE;

-- Add created_by_admin_id column (tracks which admin created the user)
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS created_by_admin_id INTEGER REFERENCES users(id) ON DELETE SET NULL;

-- Add comments for documentation
COMMENT ON COLUMN users.must_change_password IS 'Whether user must change password on first login';
COMMENT ON COLUMN users.welcome_email_sent IS 'Whether welcome email has been sent to user';
COMMENT ON COLUMN users.created_by_admin_id IS 'ID of admin who created this user account';
