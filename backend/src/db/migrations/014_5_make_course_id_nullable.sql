-- ============================================
-- Migration: Make course_id nullable in projects table
-- Description: In the new academic evaluation workflow, projects may not
--              be tied to a specific course, so course_id should be optional
-- Requirements: 5.1
-- ============================================

-- Make course_id nullable (projects may not be tied to a specific course in new workflow)
ALTER TABLE projects ALTER COLUMN course_id DROP NOT NULL;

-- Add comment
COMMENT ON COLUMN projects.course_id IS 'Optional course ID - projects in academic evaluation workflow may not be tied to a specific course';
