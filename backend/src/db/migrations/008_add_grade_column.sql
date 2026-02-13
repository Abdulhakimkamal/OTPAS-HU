-- ============================================
-- Migration 008: Add Grade Column to Course Evaluations
-- Adds automatic grade calculation support
-- ============================================

-- Add grade column to course_evaluations table
ALTER TABLE course_evaluations 
ADD COLUMN grade VARCHAR(3);

-- Add index for grade column for performance
CREATE INDEX IF NOT EXISTS idx_course_evaluations_grade ON course_evaluations(grade);

-- Update existing records with calculated grades (if any exist)
UPDATE course_evaluations 
SET grade = CASE 
    WHEN score >= 90 THEN 'A+'
    WHEN score >= 85 THEN 'A'
    WHEN score >= 80 THEN 'A-'
    WHEN score >= 75 THEN 'B+'
    WHEN score >= 70 THEN 'B'
    WHEN score >= 65 THEN 'B-'
    WHEN score >= 60 THEN 'C+'
    WHEN score >= 50 THEN 'C'
    WHEN score >= 45 THEN 'C-'
    WHEN score >= 40 THEN 'D'
    ELSE 'F'
END
WHERE grade IS NULL;