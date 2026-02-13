-- Migration 002: Add Super-Admin Role
-- Created: 2026-02-05
-- Description: Add super_admin role to the system

-- Add super_admin to user_role ENUM type if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_type t 
        JOIN pg_enum e ON t.oid = e.enumtypid  
        WHERE t.typname = 'user_role' AND e.enumlabel = 'super_admin'
    ) THEN
        ALTER TYPE user_role ADD VALUE 'super_admin';
    END IF;
END $$;

-- Insert super_admin role into roles table
INSERT INTO roles (name, description, permissions) VALUES
('super_admin', 'Super Administrator with full system access', '{"all": true}')
ON CONFLICT (name) DO NOTHING;
