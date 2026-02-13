-- ============================================
-- Migration: Drop Legacy Tutorial Evaluation Tables
-- Description: Removes old tutorial evaluation system tables
--              as part of the transformation to Academic Evaluation Workflow
-- Requirements: 7.2
-- ============================================

-- ============================================
-- SAFETY CHECK
-- ============================================
-- This migration drops tables that are part of the legacy tutorial evaluation system.
-- Ensure you have a backup before running this migration.

-- ============================================
-- DROP LEGACY VIEWS (if they exist)
-- ============================================

-- Drop views that depend on tutorial evaluation tables
DROP VIEW IF EXISTS v_tutorial_evaluation_summary CASCADE;
DROP VIEW IF EXISTS v_student_tutorial_evaluations CASCADE;
DROP VIEW IF EXISTS v_instructor_tutorial_evaluations CASCADE;

-- ============================================
-- DROP LEGACY TRIGGERS (if they exist)
-- ============================================

-- Drop triggers related to tutorial evaluations
DROP TRIGGER IF EXISTS trigger_tutorial_evaluation_updated_at ON tutorial_evaluations CASCADE;
DROP TRIGGER IF EXISTS trigger_tutorial_evaluation_notification ON tutorial_evaluations CASCADE;

-- ============================================
-- DROP LEGACY TABLES
-- ============================================

-- Drop tutorial_evaluations table (if it exists)
-- This table stored evaluations specifically for tutorials
DROP TABLE IF EXISTS tutorial_evaluations CASCADE;

-- Drop tutorial_evaluation_criteria table (if it exists)
-- This table stored evaluation criteria for tutorials
DROP TABLE IF EXISTS tutorial_evaluation_criteria CASCADE;

-- Drop tutorial_evaluation_scores table (if it exists)
-- This table stored detailed scores for tutorial evaluations
DROP TABLE IF EXISTS tutorial_evaluation_scores CASCADE;

-- Drop tutorial_evaluation_feedback table (if it exists)
-- This table stored feedback for tutorial evaluations
DROP TABLE IF EXISTS tutorial_evaluation_feedback CASCADE;

-- Drop tutorial_evaluation_templates table (if it exists)
-- This table stored templates for tutorial evaluations
DROP TABLE IF EXISTS tutorial_evaluation_templates CASCADE;

-- ============================================
-- DROP LEGACY FUNCTIONS (if they exist)
-- ============================================

-- Drop functions related to tutorial evaluations
DROP FUNCTION IF EXISTS calculate_tutorial_evaluation_score(INTEGER) CASCADE;
DROP FUNCTION IF EXISTS get_tutorial_evaluation_summary(INTEGER) CASCADE;
DROP FUNCTION IF EXISTS create_tutorial_evaluation_notification(INTEGER, INTEGER) CASCADE;

-- ============================================
-- DROP LEGACY INDEXES (if they exist)
-- ============================================

-- Note: Indexes are automatically dropped when tables are dropped
-- This section is for documentation purposes

-- ============================================
-- CLEANUP LEGACY DATA FROM EXISTING TABLES
-- ============================================

-- Remove tutorial-specific evaluation types from the evaluations table
-- (Only if the evaluations table has tutorial-specific types that are no longer needed)
-- UPDATE evaluations SET evaluation_type = 'tutorial_assignment' 
-- WHERE evaluation_type IN ('tutorial_quiz', 'tutorial_exercise', 'tutorial_lab');

-- ============================================
-- COMMENTS
-- ============================================

-- Log the migration
DO $$
BEGIN
  RAISE NOTICE 'Legacy tutorial evaluation tables have been dropped successfully';
  RAISE NOTICE 'The system now uses the new Academic Evaluation Workflow';
END $$;

-- ============================================
-- END OF MIGRATION
-- ============================================
