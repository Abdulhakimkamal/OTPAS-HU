-- ============================================
-- Migration 007: Course Evaluations
-- Adds course evaluation functionality for instructors
-- ============================================

-- Course Evaluations Table (separate from project evaluations)
CREATE TABLE IF NOT EXISTS course_evaluations (
  id SERIAL PRIMARY KEY,
  student_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  instructor_id INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  score DECIMAL(5, 2) NOT NULL,
  feedback TEXT NOT NULL,
  evaluation_type VARCHAR(50) DEFAULT 'assignment',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT check_course_eval_score CHECK (score >= 0 AND score <= 100),
  CONSTRAINT check_course_eval_feedback CHECK (LENGTH(feedback) >= 10),
  CONSTRAINT check_course_eval_type CHECK (evaluation_type IN ('assignment', 'quiz', 'exam', 'project', 'participation', 'homework', 'presentation'))
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_course_evaluations_student ON course_evaluations(student_id);
CREATE INDEX IF NOT EXISTS idx_course_evaluations_course ON course_evaluations(course_id);
CREATE INDEX IF NOT EXISTS idx_course_evaluations_instructor ON course_evaluations(instructor_id);
CREATE INDEX IF NOT EXISTS idx_course_evaluations_type ON course_evaluations(evaluation_type);