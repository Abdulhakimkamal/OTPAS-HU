-- ============================================
-- Migration 006: Instructor Features
-- Adds project comments, announcements, and course materials
-- ============================================

-- Project Comments Table
CREATE TABLE IF NOT EXISTS project_comments (
  id SERIAL PRIMARY KEY,
  project_id INTEGER NOT NULL,
  instructor_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  student_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  comment_text TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT check_comment_length CHECK (LENGTH(comment_text) >= 10)
);

-- Instructor Announcements Table (separate from system announcements)
CREATE TABLE IF NOT EXISTS instructor_announcements (
  id SERIAL PRIMARY KEY,
  instructor_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  course_id INTEGER REFERENCES courses(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  attachment_url VARCHAR(500),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT check_title_length CHECK (LENGTH(title) >= 5),
  CONSTRAINT check_message_length CHECK (LENGTH(message) >= 10)
);

-- Course Materials Table
CREATE TABLE IF NOT EXISTS course_materials (
  id SERIAL PRIMARY KEY,
  instructor_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  file_url VARCHAR(500) NOT NULL,
  file_type VARCHAR(50) NOT NULL,
  file_size INTEGER,
  is_active BOOLEAN DEFAULT TRUE,
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT check_file_type CHECK (file_type IN ('pdf', 'docx', 'pptx', 'zip', 'doc', 'ppt', 'txt'))
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_project_comments_project ON project_comments(project_id);
CREATE INDEX IF NOT EXISTS idx_project_comments_instructor ON project_comments(instructor_id);
CREATE INDEX IF NOT EXISTS idx_project_comments_student ON project_comments(student_id);
CREATE INDEX IF NOT EXISTS idx_instructor_announcements_instructor ON instructor_announcements(instructor_id);
CREATE INDEX IF NOT EXISTS idx_instructor_announcements_course ON instructor_announcements(course_id);
CREATE INDEX IF NOT EXISTS idx_course_materials_instructor ON course_materials(instructor_id);
CREATE INDEX IF NOT EXISTS idx_course_materials_course ON course_materials(course_id);
