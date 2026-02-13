-- ============================================
-- Migration: Add Project Advisor Fields
-- Description: Adds advisor assignment fields to projects table
--              for Department Head to assign instructors as project advisors
-- ============================================

-- Add advisor_id column (FK to users table - instructor)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='projects' AND column_name='advisor_id') THEN
    ALTER TABLE projects ADD COLUMN advisor_id INTEGER REFERENCES users(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Add assigned_by column (FK to users table - department head who made the assignment)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='projects' AND column_name='assigned_by') THEN
    ALTER TABLE projects ADD COLUMN assigned_by INTEGER REFERENCES users(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Add assigned_at column (timestamp of advisor assignment)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='projects' AND column_name='assigned_at') THEN
    ALTER TABLE projects ADD COLUMN assigned_at TIMESTAMP;
  END IF;
END $$;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_projects_advisor ON projects(advisor_id);
CREATE INDEX IF NOT EXISTS idx_projects_assigned_by ON projects(assigned_by);

-- Comments
COMMENT ON COLUMN projects.advisor_id IS 'Instructor assigned as project advisor by department head';
COMMENT ON COLUMN projects.assigned_by IS 'Department head who assigned the advisor';
COMMENT ON COLUMN projects.assigned_at IS 'Timestamp when advisor was assigned';

-- ============================================
-- END OF MIGRATION
-- ============================================
