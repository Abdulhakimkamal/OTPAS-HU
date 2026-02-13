-- ============================================
-- Migration 009: Update Evaluation Types
-- Updates evaluation type constraint to support new cumulative evaluation types
-- ============================================

-- Drop the old constraint
ALTER TABLE course_evaluations DROP CONSTRAINT IF EXISTS check_course_eval_type;

-- Add new constraint with updated evaluation types
ALTER TABLE course_evaluations ADD CONSTRAINT check_course_eval_type 
  CHECK (evaluation_type IN ('mid_exam', 'final_exam', 'project', 'quiz', 'assignment', 'exam', 'participation', 'homework', 'presentation'));

-- Update existing 'exam' types to 'mid_exam' for consistency (optional)
-- UPDATE course_evaluations SET evaluation_type = 'mid_exam' WHERE evaluation_type = 'exam';