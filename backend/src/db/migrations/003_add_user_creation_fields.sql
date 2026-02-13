-- Migration: Add user creation tracking fields
-- Purpose: Track which admin created each user and password change requirements

-- Add columns if they don't exist
ALTER TABLE users
ADD COLUMN IF NOT EXISTS created_by_admin_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN DEFAULT FALSE;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_created_by_admin_id ON users(created_by_admin_id);
CREATE INDEX IF NOT EXISTS idx_users_must_change_password ON users(must_change_password);

-- Add comment
COMMENT ON COLUMN users.created_by_admin_id IS 'Admin user who created this account';
COMMENT ON COLUMN users.must_change_password IS 'Flag to force password change on first login';
