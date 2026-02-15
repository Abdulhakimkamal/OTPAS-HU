-- ============================================
-- Migration 013: Add instructor_student_assignments table
-- ============================================

-- Create instructor_student_assignments table
CREATE TABLE IF NOT EXISTS instructor_student_assignments (
  id SERIAL PRIMARY KEY,
  instructor_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  student_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  is_active BOOLEAN DEFAULT TRUE,
  assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(instructor_id, student_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_instructor_student_assignments_instructor ON instructor_student_assignments(instructor_id);
CREATE INDEX IF NOT EXISTS idx_instructor_student_assignments_student ON instructor_student_assignments(student_id);
CREATE INDEX IF NOT EXISTS idx_instructor_student_assignments_active ON instructor_student_assignments(is_active);

-- Populate the table with existing instructor-student relationships from course enrollments
-- Use course_enrollments if enrollments doesn't exist
INSERT INTO instructor_student_assignments (instructor_id, student_id, is_active)
SELECT DISTINCT 
  c.instructor_id,
  COALESCE(e.student_id, ce.student_id),
  TRUE
FROM courses c
LEFT JOIN enrollments e ON e.course_id = c.id
LEFT JOIN course_enrollments ce ON ce.course_id = c.id
WHERE c.instructor_id IS NOT NULL
AND (e.student_id IS NOT NULL OR ce.student_id IS NOT NULL)
ON CONFLICT (instructor_id, student_id) DO NOTHING;

-- Add comment
COMMENT ON TABLE instructor_student_assignments IS 'Tracks which students are assigned to which instructors for recommendations and supervision';