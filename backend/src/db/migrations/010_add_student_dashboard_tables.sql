-- ============================================
-- Migration 010: Add Student Dashboard Tables
-- ============================================
-- This migration adds missing tables needed for the enhanced student dashboard
-- ============================================

-- Fix table name inconsistency: course_enrollments vs enrollments
-- The API uses 'enrollments' but schema has 'course_enrollments'
-- Create enrollments table as alias/view or rename existing table

-- First, check if enrollments table exists, if not create it
CREATE TABLE IF NOT EXISTS enrollments (
  id SERIAL PRIMARY KEY,
  student_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  grade VARCHAR(5),
  status VARCHAR(20) DEFAULT 'enrolled',
  progress_percentage DECIMAL(5, 2) DEFAULT 0,
  is_completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP,
  UNIQUE(student_id, course_id)
);

-- Create indexes for enrollments
CREATE INDEX IF NOT EXISTS idx_enrollments_student_id ON enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_course_id ON enrollments(course_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_status ON enrollments(status);

-- Course Progress Table (for individual course progress tracking)
CREATE TABLE IF NOT EXISTS course_progress (
  id SERIAL PRIMARY KEY,
  student_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  progress_percentage DECIMAL(5, 2) DEFAULT 0,
  last_accessed TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_modules INTEGER DEFAULT 0,
  total_modules INTEGER DEFAULT 0,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(student_id, course_id)
);

-- Create indexes for course_progress
CREATE INDEX IF NOT EXISTS idx_course_progress_student_id ON course_progress(student_id);
CREATE INDEX IF NOT EXISTS idx_course_progress_course_id ON course_progress(course_id);

-- Admin Announcements Table (for system-wide announcements)
CREATE TABLE IF NOT EXISTS admin_announcements (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  is_active BOOLEAN DEFAULT TRUE,
  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for admin_announcements
CREATE INDEX IF NOT EXISTS idx_admin_announcements_active ON admin_announcements(is_active);
CREATE INDEX IF NOT EXISTS idx_admin_announcements_created_at ON admin_announcements(created_at);
CREATE INDEX IF NOT EXISTS idx_admin_announcements_priority ON admin_announcements(priority);

-- Department Announcements Table (for department-specific announcements)
CREATE TABLE IF NOT EXISTS department_announcements (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  department_id INTEGER NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
  department_head_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for department_announcements
CREATE INDEX IF NOT EXISTS idx_dept_announcements_department_id ON department_announcements(department_id);
CREATE INDEX IF NOT EXISTS idx_dept_announcements_active ON department_announcements(is_active);
CREATE INDEX IF NOT EXISTS idx_dept_announcements_created_at ON department_announcements(created_at);

-- Instructor Announcements Table (for course-specific announcements)
CREATE TABLE IF NOT EXISTS instructor_announcements (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  instructor_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  course_id INTEGER REFERENCES courses(id) ON DELETE CASCADE, -- NULL means announcement for all instructor's courses
  priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for instructor_announcements
CREATE INDEX IF NOT EXISTS idx_instructor_announcements_instructor_id ON instructor_announcements(instructor_id);
CREATE INDEX IF NOT EXISTS idx_instructor_announcements_course_id ON instructor_announcements(course_id);
CREATE INDEX IF NOT EXISTS idx_instructor_announcements_active ON instructor_announcements(is_active);
CREATE INDEX IF NOT EXISTS idx_instructor_announcements_created_at ON instructor_announcements(created_at);

-- Course Materials Table (for file uploads and materials)
CREATE TABLE IF NOT EXISTS course_materials (
  id SERIAL PRIMARY KEY,
  instructor_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  file_url VARCHAR(500) NOT NULL,
  file_type VARCHAR(50) NOT NULL,
  file_size BIGINT,
  is_active BOOLEAN DEFAULT TRUE,
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for course_materials
CREATE INDEX IF NOT EXISTS idx_course_materials_instructor_id ON course_materials(instructor_id);
CREATE INDEX IF NOT EXISTS idx_course_materials_course_id ON course_materials(course_id);
CREATE INDEX IF NOT EXISTS idx_course_materials_active ON course_materials(is_active);
CREATE INDEX IF NOT EXISTS idx_course_materials_uploaded_at ON course_materials(uploaded_at);

-- Update student_progress table if it doesn't have all required columns
ALTER TABLE student_progress 
ADD COLUMN IF NOT EXISTS courses_enrolled INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS courses_completed INTEGER DEFAULT 0;

-- Insert sample data for testing

-- Sample admin announcements
INSERT INTO admin_announcements (title, message, priority, created_by) VALUES
('System Maintenance Notice', 'The system will undergo scheduled maintenance on Sunday from 2:00 AM to 6:00 AM. Please save your work before this time.', 'high', 1),
('New Feature: Enhanced Dashboard', 'We have launched an enhanced student dashboard with new widgets for better academic tracking.', 'medium', 1),
('Library Hours Extended', 'The university library will now be open 24/7 during the final exam period.', 'low', 1)
ON CONFLICT DO NOTHING;

-- Sample department announcements (assuming department_id 1 exists)
INSERT INTO department_announcements (title, message, department_id, department_head_id, priority) VALUES
('Department Meeting', 'All Computer Science faculty and students are invited to the monthly department meeting on Friday at 2 PM.', 1, 2, 'medium'),
('New Lab Equipment', 'The department has acquired new computer lab equipment. Students can now access high-performance workstations.', 1, 2, 'low'),
('Internship Opportunities', 'Several tech companies are offering internship positions for our students. Check the department notice board for details.', 1, 2, 'high')
ON CONFLICT DO NOTHING;

-- Sample instructor announcements (assuming instructor with id exists)
INSERT INTO instructor_announcements (title, message, instructor_id, course_id, priority) 
SELECT 'Assignment Deadline Extended', 'The deadline for Assignment 3 has been extended to next Friday due to technical issues.', u.id, c.id, 'high'
FROM users u, courses c 
WHERE u.role_id = (SELECT id FROM roles WHERE name = 'instructor') 
AND c.instructor_id = u.id 
LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO instructor_announcements (title, message, instructor_id, priority) 
SELECT 'Office Hours Update', 'My office hours have been changed to Tuesdays and Thursdays from 2-4 PM.', u.id, 'medium'
FROM users u 
WHERE u.role_id = (SELECT id FROM roles WHERE name = 'instructor') 
LIMIT 1
ON CONFLICT DO NOTHING;

-- Sample course materials (assuming instructor and course exist)
INSERT INTO course_materials (instructor_id, course_id, title, description, file_url, file_type, file_size)
SELECT 
  c.instructor_id,
  c.id,
  'Introduction to ' || c.title,
  'Course introduction and syllabus for ' || c.title,
  'https://example.com/materials/' || LOWER(REPLACE(c.code, ' ', '-')) || '-intro.pdf',
  'pdf',
  1024000
FROM courses c
WHERE c.is_active = TRUE
LIMIT 5
ON CONFLICT DO NOTHING;

-- Migrate data from course_enrollments to enrollments if course_enrollments exists
INSERT INTO enrollments (student_id, course_id, enrolled_at, progress_percentage, is_completed, completed_at)
SELECT 
  student_id, 
  course_id, 
  enrollment_date, 
  completion_percentage, 
  is_completed, 
  completed_at
FROM course_enrollments
WHERE NOT EXISTS (
  SELECT 1 FROM enrollments e 
  WHERE e.student_id = course_enrollments.student_id 
  AND e.course_id = course_enrollments.course_id
)
ON CONFLICT (student_id, course_id) DO NOTHING;

-- Create some sample enrollments for the test student if they don't exist
INSERT INTO enrollments (student_id, course_id, enrolled_at, status)
SELECT 
  u.id as student_id,
  c.id as course_id,
  CURRENT_TIMESTAMP,
  'enrolled'
FROM users u
CROSS JOIN courses c
WHERE u.role_id = (SELECT id FROM roles WHERE name = 'student')
AND u.email = 'student@test.com'
AND c.is_active = TRUE
LIMIT 3
ON CONFLICT (student_id, course_id) DO NOTHING;

-- Update student_progress for test student
INSERT INTO student_progress (student_id, total_projects, completed_projects, average_score, tutorials_completed, courses_enrolled, courses_completed)
SELECT 
  u.id,
  0, -- total_projects
  0, -- completed_projects
  0, -- average_score
  0, -- tutorials_completed
  (SELECT COUNT(*) FROM enrollments WHERE student_id = u.id), -- courses_enrolled
  0  -- courses_completed
FROM users u
WHERE u.role_id = (SELECT id FROM roles WHERE name = 'student')
AND u.email = 'student@test.com'
ON CONFLICT (student_id) DO UPDATE SET
  courses_enrolled = (SELECT COUNT(*) FROM enrollments WHERE student_id = student_progress.student_id),
  updated_at = CURRENT_TIMESTAMP;

-- Create course_progress entries for enrolled students
INSERT INTO course_progress (student_id, course_id, progress_percentage, total_modules, completed_modules)
SELECT 
  e.student_id,
  e.course_id,
  FLOOR(RANDOM() * 100), -- Random progress for demo
  10, -- total_modules
  FLOOR(RANDOM() * 10) -- completed_modules
FROM enrollments e
WHERE NOT EXISTS (
  SELECT 1 FROM course_progress cp 
  WHERE cp.student_id = e.student_id 
  AND cp.course_id = e.course_id
)
ON CONFLICT (student_id, course_id) DO NOTHING;

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE enrollments IS 'Student course enrollments with progress tracking';
COMMENT ON TABLE course_progress IS 'Detailed progress tracking for individual courses';
COMMENT ON TABLE admin_announcements IS 'System-wide announcements from administrators';
COMMENT ON TABLE department_announcements IS 'Department-specific announcements from department heads';
COMMENT ON TABLE instructor_announcements IS 'Course-specific announcements from instructors';
COMMENT ON TABLE course_materials IS 'Course materials and files uploaded by instructors';

-- ============================================
-- END OF MIGRATION 010
-- ============================================