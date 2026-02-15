-- ============================================
-- OTPAS-HU Database Schema (v2.0)
-- Online Tutorial & Project Advising System
-- Haramaya University
-- ============================================
-- Normalized to 3NF, Production-Ready
-- ============================================

-- ============================================
-- ENUM TYPES
-- ============================================

CREATE TYPE user_role AS ENUM ('super_admin', 'admin', 'department_head', 'instructor', 'student');
CREATE TYPE project_status AS ENUM ('draft', 'submitted', 'under_review', 'approved', 'rejected');
CREATE TYPE recommendation_type AS ENUM ('tutorial', 'project', 'instructor', 'skill');
CREATE TYPE login_status AS ENUM ('success', 'failed', 'locked');

-- ============================================
-- CORE TABLES
-- ============================================

-- Roles Table (Reference)
CREATE TABLE IF NOT EXISTS roles (
  id SERIAL PRIMARY KEY,
  name user_role NOT NULL UNIQUE,
  description TEXT,
  permissions JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Departments Table
CREATE TABLE IF NOT EXISTS departments (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  code VARCHAR(50) NOT NULL UNIQUE,
  description TEXT,
  head_id INTEGER,
  budget DECIMAL(12, 2),
  contact_email VARCHAR(255),
  phone VARCHAR(20),
  location VARCHAR(255),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT check_dept_code CHECK (code ~ '^[A-Z]{2,4}$')
);

-- Users Table (Normalized)
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  full_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  username VARCHAR(100) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role_id INTEGER NOT NULL REFERENCES roles(id) ON DELETE RESTRICT,
  department_id INTEGER REFERENCES departments(id) ON DELETE SET NULL,
  phone VARCHAR(20),
  profile_picture VARCHAR(500),
  bio TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  must_change_password BOOLEAN DEFAULT FALSE,
  welcome_email_sent BOOLEAN DEFAULT FALSE,
  created_by_admin_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  last_login TIMESTAMP,
  failed_login_attempts INTEGER DEFAULT 0,
  locked_until TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT check_email CHECK (email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$'),
  CONSTRAINT check_phone CHECK (phone ~ '^\+?[0-9\s\-()]{7,}$' OR phone IS NULL)
);

-- Skills Table (Reference)
CREATE TABLE IF NOT EXISTS skills (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  category VARCHAR(50),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Courses Table
CREATE TABLE IF NOT EXISTS courses (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  code VARCHAR(50) NOT NULL UNIQUE,
  description TEXT,
  department_id INTEGER NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
  instructor_id INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  credits INTEGER NOT NULL,
  semester VARCHAR(20) NOT NULL,
  academic_year INTEGER NOT NULL,
  max_students INTEGER,
  enrolled_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT check_credits CHECK (credits > 0 AND credits <= 6),
  CONSTRAINT check_year CHECK (academic_year >= 2020 AND academic_year <= 2100)
);

-- Course Enrollments (Junction Table)
CREATE TABLE IF NOT EXISTS course_enrollments (
  id SERIAL PRIMARY KEY,
  course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  student_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  enrollment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completion_percentage DECIMAL(5, 2) DEFAULT 0,
  is_completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP,
  UNIQUE(course_id, student_id)
);

-- Add missing columns to course_enrollments if they don't exist
ALTER TABLE course_enrollments ADD COLUMN IF NOT EXISTS completion_percentage DECIMAL(5, 2) DEFAULT 0;
ALTER TABLE course_enrollments ADD COLUMN IF NOT EXISTS is_completed BOOLEAN DEFAULT FALSE;
ALTER TABLE course_enrollments ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP;

-- Tutorials Table
CREATE TABLE IF NOT EXISTS tutorials (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  content TEXT,
  course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  instructor_id INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  file_url VARCHAR(500),
  video_url VARCHAR(500),
  duration_minutes INTEGER,
  difficulty_level VARCHAR(20) CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')),
  is_published BOOLEAN DEFAULT FALSE,
  views_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add missing columns to tutorials if they don't exist
ALTER TABLE tutorials ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT FALSE;

-- Tutorial Progress (Tracking)
CREATE TABLE IF NOT EXISTS tutorial_progress (
  id SERIAL PRIMARY KEY,
  tutorial_id INTEGER NOT NULL REFERENCES tutorials(id) ON DELETE CASCADE,
  student_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  viewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completion_percentage DECIMAL(5, 2) DEFAULT 0,
  is_completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP,
  UNIQUE(tutorial_id, student_id)
);

-- Add missing columns to tutorial_progress if they don't exist
ALTER TABLE tutorial_progress ADD COLUMN IF NOT EXISTS completion_percentage DECIMAL(5, 2) DEFAULT 0;

-- Projects Table
CREATE TABLE IF NOT EXISTS projects (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  student_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  instructor_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  advisor_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  assigned_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  assigned_at TIMESTAMP,
  file_url VARCHAR(500),
  status project_status DEFAULT 'draft',
  feedback TEXT,
  submitted_at TIMESTAMP,
  approved_at TIMESTAMP,
  rejected_at TIMESTAMP,
  rejected_reason TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add missing columns to projects if they don't exist
ALTER TABLE projects ADD COLUMN IF NOT EXISTS advisor_id INTEGER REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS assigned_by INTEGER REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS assigned_at TIMESTAMP;

-- Evaluations Table
CREATE TABLE IF NOT EXISTS evaluations (
  id SERIAL PRIMARY KEY,
  project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  student_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  instructor_id INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  score DECIMAL(5, 2) NOT NULL,
  max_score DECIMAL(5, 2) DEFAULT 100,
  feedback TEXT,
  evaluated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT check_score CHECK (score >= 0 AND score <= max_score)
);

-- Course Evaluations Table (for course-based evaluations)
CREATE TABLE IF NOT EXISTS course_evaluations (
  id SERIAL PRIMARY KEY,
  student_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  instructor_id INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  score DECIMAL(5, 2) NOT NULL,
  grade VARCHAR(2),
  feedback TEXT,
  evaluation_type VARCHAR(50) DEFAULT 'quiz' CHECK (evaluation_type IN ('quiz', 'mid_exam', 'final_exam', 'project', 'assignment')),
  status VARCHAR(50) DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'reviewed')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT check_course_eval_score CHECK (score >= 0 AND score <= 100)
);

-- Feedback Table (Tutorial/Course Feedback)
CREATE TABLE IF NOT EXISTS feedback (
  id SERIAL PRIMARY KEY,
  student_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tutorial_id INTEGER REFERENCES tutorials(id) ON DELETE CASCADE,
  course_id INTEGER REFERENCES courses(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  is_anonymous BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Student Skills (Junction Table)
CREATE TABLE IF NOT EXISTS student_skills (
  id SERIAL PRIMARY KEY,
  student_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  skill_id INTEGER NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  proficiency_level VARCHAR(20) CHECK (proficiency_level IN ('beginner', 'intermediate', 'advanced', 'expert')),
  acquired_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(student_id, skill_id)
);

-- Student Progress Table (Aggregated)
CREATE TABLE IF NOT EXISTS student_progress (
  id SERIAL PRIMARY KEY,
  student_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  total_projects INTEGER DEFAULT 0,
  completed_projects INTEGER DEFAULT 0,
  average_score DECIMAL(5, 2),
  tutorials_completed INTEGER DEFAULT 0,
  courses_enrolled INTEGER DEFAULT 0,
  courses_completed INTEGER DEFAULT 0,
  total_skills INTEGER DEFAULT 0,
  last_activity TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Recommendations Table
CREATE TABLE IF NOT EXISTS recommendations (
  id SERIAL PRIMARY KEY,
  student_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tutorial_id INTEGER REFERENCES tutorials(id) ON DELETE SET NULL,
  project_id INTEGER REFERENCES projects(id) ON DELETE SET NULL,
  instructor_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  skill_id INTEGER REFERENCES skills(id) ON DELETE SET NULL,
  recommendation_type recommendation_type NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  score DECIMAL(5, 2),
  reason TEXT,
  is_viewed BOOLEAN DEFAULT FALSE,
  viewed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Activity Logs Table (Audit Trail)
CREATE TABLE IF NOT EXISTS activity_logs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action VARCHAR(255) NOT NULL,
  entity_type VARCHAR(50),
  entity_id INTEGER,
  old_values JSONB,
  new_values JSONB,
  ip_address VARCHAR(45),
  user_agent TEXT,
  details TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Login History Table
CREATE TABLE IF NOT EXISTS login_history (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  login_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  logout_time TIMESTAMP,
  ip_address VARCHAR(45),
  user_agent TEXT,
  status login_status DEFAULT 'success',
  failure_reason TEXT
);

-- Reports Table
CREATE TABLE IF NOT EXISTS reports (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  report_type VARCHAR(50) NOT NULL,
  generated_by INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  department_id INTEGER REFERENCES departments(id) ON DELETE SET NULL,
  data JSONB,
  file_url VARCHAR(500),
  is_scheduled BOOLEAN DEFAULT FALSE,
  schedule_frequency VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Messages Table
CREATE TABLE IF NOT EXISTS messages (
  id SERIAL PRIMARY KEY,
  sender_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  receiver_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subject VARCHAR(255),
  message_text TEXT NOT NULL,
  parent_message_id INTEGER REFERENCES messages(id) ON DELETE CASCADE,
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP,
  is_deleted_by_sender BOOLEAN DEFAULT FALSE,
  is_deleted_by_receiver BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  notification_type VARCHAR(50),
  related_entity_type VARCHAR(50),
  related_entity_id INTEGER,
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- INDEXES FOR PERFORMANCE OPTIMIZATION
-- ============================================

-- User Indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role_id ON users(role_id);
CREATE INDEX IF NOT EXISTS idx_users_department_id ON users(department_id);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);

-- Department Indexes
CREATE INDEX IF NOT EXISTS idx_departments_code ON departments(code);
CREATE INDEX IF NOT EXISTS idx_departments_is_active ON departments(is_active);

-- Course Indexes
CREATE INDEX IF NOT EXISTS idx_courses_department_id ON courses(department_id);
CREATE INDEX IF NOT EXISTS idx_courses_instructor_id ON courses(instructor_id);
CREATE INDEX IF NOT EXISTS idx_courses_code ON courses(code);
CREATE INDEX IF NOT EXISTS idx_courses_academic_year ON courses(academic_year);
CREATE INDEX IF NOT EXISTS idx_courses_is_active ON courses(is_active);

-- Course Enrollment Indexes
CREATE INDEX IF NOT EXISTS idx_course_enrollments_course_id ON course_enrollments(course_id);
CREATE INDEX IF NOT EXISTS idx_course_enrollments_student_id ON course_enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_course_enrollments_is_completed ON course_enrollments(is_completed);

-- Tutorial Indexes
CREATE INDEX IF NOT EXISTS idx_tutorials_course_id ON tutorials(course_id);
CREATE INDEX IF NOT EXISTS idx_tutorials_instructor_id ON tutorials(instructor_id);
CREATE INDEX IF NOT EXISTS idx_tutorials_is_published ON tutorials(is_published);
CREATE INDEX IF NOT EXISTS idx_tutorials_difficulty_level ON tutorials(difficulty_level);

-- Tutorial Progress Indexes
CREATE INDEX IF NOT EXISTS idx_tutorial_progress_tutorial_id ON tutorial_progress(tutorial_id);
CREATE INDEX IF NOT EXISTS idx_tutorial_progress_student_id ON tutorial_progress(student_id);
CREATE INDEX IF NOT EXISTS idx_tutorial_progress_is_completed ON tutorial_progress(is_completed);

-- Project Indexes
CREATE INDEX IF NOT EXISTS idx_projects_course_id ON projects(course_id);
CREATE INDEX IF NOT EXISTS idx_projects_student_id ON projects(student_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_created_at ON projects(created_at);

-- Evaluation Indexes
CREATE INDEX IF NOT EXISTS idx_evaluations_project_id ON evaluations(project_id);
CREATE INDEX IF NOT EXISTS idx_evaluations_student_id ON evaluations(student_id);
CREATE INDEX IF NOT EXISTS idx_evaluations_instructor_id ON evaluations(instructor_id);

-- Course Evaluation Indexes
CREATE INDEX IF NOT EXISTS idx_course_evaluations_student_id ON course_evaluations(student_id);
CREATE INDEX IF NOT EXISTS idx_course_evaluations_course_id ON course_evaluations(course_id);
CREATE INDEX IF NOT EXISTS idx_course_evaluations_instructor_id ON course_evaluations(instructor_id);
CREATE INDEX IF NOT EXISTS idx_course_evaluations_evaluation_type ON course_evaluations(evaluation_type);
CREATE INDEX IF NOT EXISTS idx_course_evaluations_status ON course_evaluations(status);

-- Feedback Indexes
CREATE INDEX IF NOT EXISTS idx_feedback_student_id ON feedback(student_id);
CREATE INDEX IF NOT EXISTS idx_feedback_tutorial_id ON feedback(tutorial_id);
CREATE INDEX IF NOT EXISTS idx_feedback_course_id ON feedback(course_id);
CREATE INDEX IF NOT EXISTS idx_feedback_rating ON feedback(rating);

-- Skills Indexes
CREATE INDEX IF NOT EXISTS idx_skills_name ON skills(name);
CREATE INDEX IF NOT EXISTS idx_skills_category ON skills(category);

-- Student Skills Indexes
CREATE INDEX IF NOT EXISTS idx_student_skills_student_id ON student_skills(student_id);
CREATE INDEX IF NOT EXISTS idx_student_skills_skill_id ON student_skills(skill_id);

-- Recommendations Indexes
CREATE INDEX IF NOT EXISTS idx_recommendations_student_id ON recommendations(student_id);
CREATE INDEX IF NOT EXISTS idx_recommendations_type ON recommendations(recommendation_type);
CREATE INDEX IF NOT EXISTS idx_recommendations_created_at ON recommendations(created_at);
CREATE INDEX IF NOT EXISTS idx_recommendations_is_viewed ON recommendations(is_viewed);

-- Activity Logs Indexes
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_entity_type ON activity_logs(entity_type);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at);

-- Login History Indexes
CREATE INDEX IF NOT EXISTS idx_login_history_user_id ON login_history(user_id);
CREATE INDEX IF NOT EXISTS idx_login_history_login_time ON login_history(login_time);
CREATE INDEX IF NOT EXISTS idx_login_history_status ON login_history(status);

-- Reports Indexes
CREATE INDEX IF NOT EXISTS idx_reports_generated_by ON reports(generated_by);
CREATE INDEX IF NOT EXISTS idx_reports_department_id ON reports(department_id);
CREATE INDEX IF NOT EXISTS idx_reports_created_at ON reports(created_at);

-- Notifications Indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);

-- Messages Indexes
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver_id ON messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_is_read ON messages(is_read);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);
CREATE INDEX IF NOT EXISTS idx_messages_sender_receiver ON messages(sender_id, receiver_id);

-- ============================================
-- COMPOSITE INDEXES FOR COMMON QUERIES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_projects_student_status ON projects(student_id, status);
CREATE INDEX IF NOT EXISTS idx_evaluations_student_score ON evaluations(student_id, score);
CREATE INDEX IF NOT EXISTS idx_course_enrollments_student_completed ON course_enrollments(student_id, is_completed);
CREATE INDEX IF NOT EXISTS idx_tutorials_course_published ON tutorials(course_id, is_published);

-- ============================================
-- INSERT INITIAL DATA
-- ============================================

-- Insert Roles
INSERT INTO roles (name, description, permissions) VALUES
('super_admin', 'Super Administrator with complete system access', '{"all": true}'),
('admin', 'System Administrator with full access', '{"all": true}'),
('department_head', 'Department Head with department management access', '{"manage_department": true, "view_reports": true}'),
('instructor', 'Instructor/Faculty with course and tutorial management', '{"manage_courses": true, "manage_tutorials": true, "evaluate_students": true}'),
('student', 'Student with course enrollment and project submission', '{"enroll_courses": true, "submit_projects": true, "view_tutorials": true}')
ON CONFLICT (name) DO NOTHING;

-- Insert Skills (Sample)
INSERT INTO skills (name, description, category) VALUES
('Python', 'Python Programming Language', 'Programming'),
('JavaScript', 'JavaScript Programming Language', 'Programming'),
('Database Design', 'Database Design and Optimization', 'Database'),
('Web Development', 'Full Stack Web Development', 'Web'),
('Data Analysis', 'Data Analysis and Visualization', 'Data Science'),
('Project Management', 'Project Management Skills', 'Management'),
('Communication', 'Effective Communication', 'Soft Skills'),
('Problem Solving', 'Problem Solving and Critical Thinking', 'Soft Skills')
ON CONFLICT (name) DO NOTHING;

-- Insert Departments
INSERT INTO departments (name, code, description, contact_email, phone, location) VALUES
('Computer Science', 'CS', 'Department of Computer Science and Engineering', 'cs@haramaya.edu', '+251-911-234567', 'Building A, Floor 3'),
('Information Technology', 'IT', 'Department of Information Technology', 'it@haramaya.edu', '+251-911-234568', 'Building B, Floor 2'),
('Software Engineering', 'SE', 'Department of Software Engineering', 'se@haramaya.edu', '+251-911-234569', 'Building C, Floor 1'),
('Business Administration', 'BA', 'Department of Business Administration', 'ba@haramaya.edu', '+251-911-234570', 'Building D, Floor 2')
ON CONFLICT (code) DO NOTHING;

-- Insert Admin User (password: admin123 - bcrypt hash)
INSERT INTO users (full_name, email, username, password_hash, role_id, department_id, is_active) 
SELECT 'System Administrator', 'admin@haramaya.edu', 'admin', '$2a$10$YIjlrHxVxJ5.5.5.5.5.5.5.5.5.5.5.5.5.5.5.5.5.5.5.5.5.5.5', r.id, 1, TRUE
FROM roles r WHERE r.name = 'admin'
ON CONFLICT (email) DO NOTHING;

-- Insert Super Admin User (password: superadmin123 - bcrypt hash)
INSERT INTO users (full_name, email, username, password_hash, role_id, department_id, is_active) 
SELECT 'Super Administrator', 'superadmin@haramaya.edu', 'superadmin', '$2a$10$0bqkkyVAkjjBkLQgpNEpeevHV/Q8qu7w196jh9StCQyC/mnYpEarG', r.id, NULL, TRUE
FROM roles r WHERE r.name = 'super_admin'
ON CONFLICT (email) DO NOTHING;

-- Insert Sample Department Head
INSERT INTO users (full_name, email, username, password_hash, role_id, department_id, is_active)
SELECT 'Dr. John Doe', 'john.doe@haramaya.edu', 'johndoe', '$2a$10$YIjlrHxVxJ5.5.5.5.5.5.5.5.5.5.5.5.5.5.5.5.5.5.5.5.5.5.5', r.id, 1, TRUE
FROM roles r WHERE r.name = 'department_head'
ON CONFLICT (email) DO NOTHING;

-- Insert Sample Instructors
INSERT INTO users (full_name, email, username, password_hash, role_id, department_id, is_active)
SELECT 'Prof. Jane Smith', 'jane.smith@haramaya.edu', 'janesmith', '$2a$10$YIjlrHxVxJ5.5.5.5.5.5.5.5.5.5.5.5.5.5.5.5.5.5.5.5.5.5.5', r.id, 1, TRUE
FROM roles r WHERE r.name = 'instructor'
ON CONFLICT (email) DO NOTHING;

INSERT INTO users (full_name, email, username, password_hash, role_id, department_id, is_active)
SELECT 'Dr. Ahmed Hassan', 'ahmed.hassan@haramaya.edu', 'ahmedhassan', '$2a$10$YIjlrHxVxJ5.5.5.5.5.5.5.5.5.5.5.5.5.5.5.5.5.5.5.5.5.5.5', r.id, 1, TRUE
FROM roles r WHERE r.name = 'instructor'
ON CONFLICT (email) DO NOTHING;

-- Insert Sample Students
INSERT INTO users (full_name, email, username, password_hash, role_id, department_id, is_active)
SELECT 'Abebe Kebede', 'abebe.kebede@student.haramaya.edu', 'abebek', '$2a$10$YIjlrHxVxJ5.5.5.5.5.5.5.5.5.5.5.5.5.5.5.5.5.5.5.5.5.5.5', r.id, 1, TRUE
FROM roles r WHERE r.name = 'student'
ON CONFLICT (email) DO NOTHING;

INSERT INTO users (full_name, email, username, password_hash, role_id, department_id, is_active)
SELECT 'Almaz Tekle', 'almaz.tekle@student.haramaya.edu', 'almazt', '$2a$10$YIjlrHxVxJ5.5.5.5.5.5.5.5.5.5.5.5.5.5.5.5.5.5.5.5.5.5.5', r.id, 1, TRUE
FROM roles r WHERE r.name = 'student'
ON CONFLICT (email) DO NOTHING;

-- ============================================
-- FOREIGN KEY CONSTRAINTS
-- ============================================

ALTER TABLE departments ADD CONSTRAINT fk_dept_head 
FOREIGN KEY (head_id) REFERENCES users(id) ON DELETE SET NULL;

-- ============================================
-- VIEWS FOR COMMON QUERIES
-- ============================================

-- Student Dashboard View
CREATE OR REPLACE VIEW v_student_dashboard AS
SELECT 
  u.id,
  u.full_name,
  u.email,
  sp.total_projects,
  sp.completed_projects,
  sp.average_score,
  sp.tutorials_completed,
  sp.courses_enrolled,
  sp.courses_completed,
  sp.total_skills,
  sp.last_activity,
  COUNT(DISTINCT r.id) as pending_recommendations
FROM users u
LEFT JOIN student_progress sp ON u.id = sp.student_id
LEFT JOIN recommendations r ON u.id = r.student_id AND r.is_viewed = FALSE
WHERE u.role_id = (SELECT id FROM roles WHERE name = 'student')
GROUP BY u.id, u.full_name, u.email, sp.total_projects, sp.completed_projects, sp.average_score, sp.tutorials_completed, sp.courses_enrolled, sp.courses_completed, sp.total_skills, sp.last_activity;

-- Instructor Dashboard View
CREATE OR REPLACE VIEW v_instructor_dashboard AS
SELECT 
  u.id,
  u.full_name,
  u.email,
  COUNT(DISTINCT c.id) as courses_taught,
  COUNT(DISTINCT t.id) as tutorials_created,
  COUNT(DISTINCT e.id) as evaluations_completed,
  AVG(e.score) as avg_student_score
FROM users u
LEFT JOIN courses c ON u.id = c.instructor_id
LEFT JOIN tutorials t ON u.id = t.instructor_id
LEFT JOIN evaluations e ON u.id = e.instructor_id
WHERE u.role_id = (SELECT id FROM roles WHERE name = 'instructor')
GROUP BY u.id, u.full_name, u.email;

-- Department Statistics View
CREATE OR REPLACE VIEW v_department_stats AS
SELECT 
  d.id,
  d.name,
  d.code,
  COUNT(DISTINCT u.id) as total_users,
  COUNT(DISTINCT CASE WHEN u.role_id = (SELECT id FROM roles WHERE name = 'student') THEN u.id END) as total_students,
  COUNT(DISTINCT CASE WHEN u.role_id = (SELECT id FROM roles WHERE name = 'instructor') THEN u.id END) as total_instructors,
  COUNT(DISTINCT c.id) as total_courses,
  COUNT(DISTINCT p.id) as total_projects
FROM departments d
LEFT JOIN users u ON d.id = u.department_id
LEFT JOIN courses c ON d.id = c.department_id
LEFT JOIN projects p ON c.id = p.course_id
GROUP BY d.id, d.name, d.code;

-- ============================================
-- MISSING TABLES - CRITICAL FOR APPLICATION
-- ============================================

-- Tutorial Files Table (File uploads for tutorials)
CREATE TABLE IF NOT EXISTS tutorial_files (
  id SERIAL PRIMARY KEY,
  tutorial_id INTEGER NOT NULL REFERENCES tutorials(id) ON DELETE CASCADE,
  file_name VARCHAR(255) NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  file_type VARCHAR(50),
  file_size INTEGER,
  mime_type VARCHAR(100),
  uploaded_by INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  download_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_tutorial_files_tutorial_id ON tutorial_files(tutorial_id);
CREATE INDEX IF NOT EXISTS idx_tutorial_files_uploaded_by ON tutorial_files(uploaded_by);

-- Tutorial Videos Table (Video uploads for tutorials)
CREATE TABLE IF NOT EXISTS tutorial_videos (
  id SERIAL PRIMARY KEY,
  tutorial_id INTEGER NOT NULL REFERENCES tutorials(id) ON DELETE CASCADE,
  video_title VARCHAR(255) NOT NULL,
  video_url VARCHAR(500) NOT NULL,
  video_type VARCHAR(50),
  duration_seconds INTEGER,
  file_size INTEGER,
  uploaded_by INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_tutorial_videos_tutorial_id ON tutorial_videos(tutorial_id);
CREATE INDEX IF NOT EXISTS idx_tutorial_videos_uploaded_by ON tutorial_videos(uploaded_by);

-- Instructor Student Assignments Table
CREATE TABLE IF NOT EXISTS instructor_student_assignments (
  id SERIAL PRIMARY KEY,
  instructor_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  student_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  is_active BOOLEAN DEFAULT TRUE,
  assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(instructor_id, student_id)
);

CREATE INDEX IF NOT EXISTS idx_instructor_student_assignments_instructor_id ON instructor_student_assignments(instructor_id);
CREATE INDEX IF NOT EXISTS idx_instructor_student_assignments_student_id ON instructor_student_assignments(student_id);

-- Enrollments Table (Alternative/Alias for course_enrollments)
CREATE TABLE IF NOT EXISTS enrollments (
  id SERIAL PRIMARY KEY,
  student_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  enrollment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(student_id, course_id)
);

CREATE INDEX IF NOT EXISTS idx_enrollments_student_id ON enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_course_id ON enrollments(course_id);

-- Course Progress Table (Tracks student progress in courses)
CREATE TABLE IF NOT EXISTS course_progress (
  id SERIAL PRIMARY KEY,
  student_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  progress_percentage DECIMAL(5, 2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(student_id, course_id)
);

CREATE INDEX IF NOT EXISTS idx_course_progress_student_id ON course_progress(student_id);
CREATE INDEX IF NOT EXISTS idx_course_progress_course_id ON course_progress(course_id);

-- Admin Announcements Table
CREATE TABLE IF NOT EXISTS admin_announcements (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  priority VARCHAR(20) DEFAULT 'normal',
  is_active BOOLEAN DEFAULT TRUE
);

CREATE INDEX IF NOT EXISTS idx_admin_announcements_created_at ON admin_announcements(created_at);
CREATE INDEX IF NOT EXISTS idx_admin_announcements_is_active ON admin_announcements(is_active);

-- Department Announcements Table
CREATE TABLE IF NOT EXISTS department_announcements (
  id SERIAL PRIMARY KEY,
  department_head_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  department_id INTEGER NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  priority VARCHAR(20) DEFAULT 'normal',
  is_active BOOLEAN DEFAULT TRUE
);

CREATE INDEX IF NOT EXISTS idx_department_announcements_department_head_id ON department_announcements(department_head_id);
CREATE INDEX IF NOT EXISTS idx_department_announcements_department_id ON department_announcements(department_id);
CREATE INDEX IF NOT EXISTS idx_department_announcements_created_at ON department_announcements(created_at);

-- Instructor Announcements Table
CREATE TABLE IF NOT EXISTS instructor_announcements (
  id SERIAL PRIMARY KEY,
  instructor_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  course_id INTEGER REFERENCES courses(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  attachment_url VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  priority VARCHAR(20) DEFAULT 'medium',
  is_active BOOLEAN DEFAULT TRUE
);

CREATE INDEX IF NOT EXISTS idx_instructor_announcements_instructor_id ON instructor_announcements(instructor_id);
CREATE INDEX IF NOT EXISTS idx_instructor_announcements_course_id ON instructor_announcements(course_id);
CREATE INDEX IF NOT EXISTS idx_instructor_announcements_created_at ON instructor_announcements(created_at);

-- Course Instructors Table (Maps instructors to courses)
CREATE TABLE IF NOT EXISTS course_instructors (
  id SERIAL PRIMARY KEY,
  course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  instructor_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  is_active BOOLEAN DEFAULT TRUE,
  assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(course_id, instructor_id)
);

CREATE INDEX IF NOT EXISTS idx_course_instructors_course_id ON course_instructors(course_id);
CREATE INDEX IF NOT EXISTS idx_course_instructors_instructor_id ON course_instructors(instructor_id);

-- Project Files Table (Stores project file uploads)
CREATE TABLE IF NOT EXISTS project_files (
  id SERIAL PRIMARY KEY,
  project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  file_path VARCHAR(500) NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  file_type VARCHAR(50),
  file_size INTEGER,
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_project_files_project_id ON project_files(project_id);

-- ============================================
-- ADMIN MODULE - ADDITIONAL SCHEMA
-- ============================================
-- Admin-specific tables and features for user management,
-- system administration, and reporting
-- ============================================

-- Activity Logs Table (Admin Audit Trail)
CREATE TABLE IF NOT EXISTS activity_logs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50),
  entity_id INTEGER,
  details JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_action ON activity_logs(action);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_activity_logs_entity ON activity_logs(entity_type, entity_id);

-- Login History Table (Security Tracking)
CREATE TABLE IF NOT EXISTS login_history (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  login_time TIMESTAMP DEFAULT NOW(),
  logout_time TIMESTAMP,
  ip_address INET,
  user_agent TEXT,
  status VARCHAR(20) DEFAULT 'success',
  failure_reason TEXT,
  session_duration INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_login_history_user_id ON login_history(user_id);
CREATE INDEX IF NOT EXISTS idx_login_history_login_time ON login_history(login_time);
CREATE INDEX IF NOT EXISTS idx_login_history_status ON login_history(status);

-- System Settings Table (Admin Configuration)
CREATE TABLE IF NOT EXISTS system_settings (
  id SERIAL PRIMARY KEY,
  setting_key VARCHAR(100) UNIQUE NOT NULL,
  setting_value TEXT,
  setting_type VARCHAR(50) DEFAULT 'string',
  description TEXT,
  is_public BOOLEAN DEFAULT FALSE,
  updated_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_system_settings_key ON system_settings(setting_key);
CREATE INDEX IF NOT EXISTS idx_system_settings_public ON system_settings(is_public);

-- Notifications Table (Admin Announcements)
CREATE TABLE IF NOT EXISTS notifications (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  notification_type VARCHAR(50) DEFAULT 'info',
  target_role VARCHAR(50),
  target_user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP,
  priority VARCHAR(20) DEFAULT 'normal',
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  
  CONSTRAINT check_notification_type CHECK (notification_type IN ('info', 'warning', 'error', 'success')),
  CONSTRAINT check_priority CHECK (priority IN ('low', 'normal', 'high', 'urgent'))
);

CREATE INDEX IF NOT EXISTS idx_notifications_target_user ON notifications(target_user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_target_role ON notifications(target_role);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);

-- User Sessions Table (Active Session Management)
CREATE TABLE IF NOT EXISTS user_sessions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  session_token VARCHAR(255) UNIQUE NOT NULL,
  ip_address INET,
  user_agent TEXT,
  expires_at TIMESTAMP NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  last_activity TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_user_sessions_active ON user_sessions(is_active);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires ON user_sessions(expires_at);

-- Email Queue Table (Admin Email Management)
CREATE TABLE IF NOT EXISTS email_queue (
  id SERIAL PRIMARY KEY,
  recipient_email VARCHAR(255) NOT NULL,
  recipient_name VARCHAR(255),
  subject VARCHAR(500) NOT NULL,
  body TEXT NOT NULL,
  email_type VARCHAR(50) DEFAULT 'general',
  status VARCHAR(20) DEFAULT 'pending',
  attempts INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 3,
  error_message TEXT,
  sent_at TIMESTAMP,
  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  
  CONSTRAINT check_email_status CHECK (status IN ('pending', 'sent', 'failed', 'cancelled'))
);

CREATE INDEX IF NOT EXISTS idx_email_queue_status ON email_queue(status);
CREATE INDEX IF NOT EXISTS idx_email_queue_created_at ON email_queue(created_at);
CREATE INDEX IF NOT EXISTS idx_email_queue_recipient ON email_queue(recipient_email);

-- Backup History Table (System Backups)
CREATE TABLE IF NOT EXISTS backup_history (
  id SERIAL PRIMARY KEY,
  backup_name VARCHAR(255) NOT NULL,
  backup_type VARCHAR(50) DEFAULT 'full',
  file_path TEXT,
  file_size BIGINT,
  status VARCHAR(20) DEFAULT 'completed',
  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  
  CONSTRAINT check_backup_type CHECK (backup_type IN ('full', 'incremental', 'differential')),
  CONSTRAINT check_backup_status CHECK (status IN ('pending', 'in_progress', 'completed', 'failed'))
);

CREATE INDEX IF NOT EXISTS idx_backup_history_created_at ON backup_history(created_at);
CREATE INDEX IF NOT EXISTS idx_backup_history_status ON backup_history(status);

-- ============================================
-- ADMIN VIEWS
-- ============================================

-- View: User Statistics for Admin Dashboard
CREATE OR REPLACE VIEW v_admin_user_stats AS
SELECT 
  r.name as role,
  COUNT(u.id) as total_users,
  COUNT(CASE WHEN u.is_active = TRUE THEN 1 END) as active_users,
  COUNT(CASE WHEN u.is_active = FALSE THEN 1 END) as inactive_users,
  COUNT(CASE WHEN u.created_at > NOW() - INTERVAL '30 days' THEN 1 END) as new_users_30d,
  COUNT(CASE WHEN u.last_login > NOW() - INTERVAL '7 days' THEN 1 END) as active_7d
FROM roles r
LEFT JOIN users u ON r.id = u.role_id
GROUP BY r.name;

-- View: Department Statistics for Admin
CREATE OR REPLACE VIEW v_admin_department_stats AS
SELECT 
  d.id,
  d.name,
  d.code,
  COUNT(DISTINCT u.id) as total_users,
  COUNT(DISTINCT CASE WHEN u.role_id = (SELECT id FROM roles WHERE name = 'student') THEN u.id END) as total_students,
  COUNT(DISTINCT CASE WHEN u.role_id = (SELECT id FROM roles WHERE name = 'instructor') THEN u.id END) as total_instructors,
  COUNT(DISTINCT c.id) as total_courses,
  d.is_active
FROM departments d
LEFT JOIN users u ON d.id = u.department_id
LEFT JOIN courses c ON d.id = c.department_id
GROUP BY d.id, d.name, d.code, d.is_active;

-- View: Recent Activity for Admin Dashboard
CREATE OR REPLACE VIEW v_admin_recent_activity AS
SELECT 
  al.id,
  al.action,
  al.entity_type,
  al.entity_id,
  al.created_at,
  u.username,
  u.full_name,
  u.email,
  r.name as user_role
FROM activity_logs al
LEFT JOIN users u ON al.user_id = u.id
LEFT JOIN roles r ON u.role_id = r.id
ORDER BY al.created_at DESC
LIMIT 100;

-- View: System Health Metrics
CREATE OR REPLACE VIEW v_admin_system_health AS
SELECT 
  (SELECT COUNT(*) FROM users WHERE is_active = TRUE) as active_users,
  (SELECT COUNT(*) FROM users WHERE last_login > NOW() - INTERVAL '24 hours') as users_24h,
  (SELECT COUNT(*) FROM login_history WHERE login_time > NOW() - INTERVAL '1 hour') as logins_1h,
  (SELECT COUNT(*) FROM activity_logs WHERE created_at > NOW() - INTERVAL '1 hour') as activities_1h,
  (SELECT COUNT(*) FROM email_queue WHERE status = 'pending') as pending_emails,
  (SELECT COUNT(*) FROM notifications WHERE is_read = FALSE) as unread_notifications,
  (SELECT COUNT(*) FROM user_sessions WHERE is_active = TRUE AND expires_at > NOW()) as active_sessions;

-- ============================================
-- ADMIN FUNCTIONS
-- ============================================

-- Function: Log Admin Activity
CREATE OR REPLACE FUNCTION log_admin_activity()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO activity_logs (user_id, action, entity_type, entity_id, details, created_at)
    VALUES (NEW.created_by_admin_id, 'CREATE', TG_TABLE_NAME, NEW.id, row_to_json(NEW), NOW());
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO activity_logs (user_id, action, entity_type, entity_id, details, created_at)
    VALUES (NEW.updated_by_admin_id, 'UPDATE', TG_TABLE_NAME, NEW.id, row_to_json(NEW), NOW());
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO activity_logs (user_id, action, entity_type, entity_id, details, created_at)
    VALUES (OLD.created_by_admin_id, 'DELETE', TG_TABLE_NAME, OLD.id, row_to_json(OLD), NOW());
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Function: Clean Old Sessions
CREATE OR REPLACE FUNCTION clean_expired_sessions()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM user_sessions 
  WHERE expires_at < NOW() OR (is_active = FALSE AND last_activity < NOW() - INTERVAL '7 days');
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Function: Get User Activity Summary
CREATE OR REPLACE FUNCTION get_user_activity_summary(p_user_id INTEGER, p_days INTEGER DEFAULT 30)
RETURNS TABLE (
  total_logins BIGINT,
  total_actions BIGINT,
  last_login TIMESTAMP,
  last_activity TIMESTAMP,
  most_common_action TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    (SELECT COUNT(*) FROM login_history WHERE user_id = p_user_id AND login_time > NOW() - (p_days || ' days')::INTERVAL),
    (SELECT COUNT(*) FROM activity_logs WHERE user_id = p_user_id AND created_at > NOW() - (p_days || ' days')::INTERVAL),
    (SELECT MAX(login_time) FROM login_history WHERE user_id = p_user_id),
    (SELECT MAX(created_at) FROM activity_logs WHERE user_id = p_user_id),
    (SELECT action FROM activity_logs WHERE user_id = p_user_id GROUP BY action ORDER BY COUNT(*) DESC LIMIT 1);
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- ADMIN TRIGGERS
-- ============================================

-- Trigger: Update last_activity on user_sessions
CREATE OR REPLACE FUNCTION update_session_activity()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_activity = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_session_activity
BEFORE UPDATE ON user_sessions
FOR EACH ROW
EXECUTE FUNCTION update_session_activity();

-- Trigger: Auto-expire old sessions
CREATE OR REPLACE FUNCTION auto_expire_sessions()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.expires_at < NOW() THEN
    NEW.is_active = FALSE;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auto_expire_sessions
BEFORE INSERT OR UPDATE ON user_sessions
FOR EACH ROW
EXECUTE FUNCTION auto_expire_sessions();

-- ============================================
-- ADMIN INDEXES FOR PERFORMANCE
-- ============================================

-- Composite indexes for common admin queries
CREATE INDEX IF NOT EXISTS idx_users_role_active ON users(role_id, is_active);
CREATE INDEX IF NOT EXISTS idx_users_dept_role ON users(department_id, role_id);
CREATE INDEX IF NOT EXISTS idx_users_created_active ON users(created_at, is_active);
CREATE INDEX IF NOT EXISTS idx_users_last_login ON users(last_login);

-- Full-text search indexes
CREATE INDEX IF NOT EXISTS idx_users_fulltext ON users USING gin(to_tsvector('english', full_name || ' ' || email || ' ' || username));
CREATE INDEX IF NOT EXISTS idx_activity_logs_fulltext ON activity_logs USING gin(to_tsvector('english', action || ' ' || COALESCE(details::text, '')));

-- ============================================
-- ADMIN INITIAL DATA
-- ============================================

-- Insert default system settings
INSERT INTO system_settings (setting_key, setting_value, setting_type, description, is_public) VALUES
  ('site_name', 'Academic Compass', 'string', 'Name of the application', TRUE),
  ('site_description', 'Online Tutorial and Project Advising System', 'string', 'Site description', TRUE),
  ('max_login_attempts', '5', 'integer', 'Maximum failed login attempts before account lock', FALSE),
  ('session_timeout', '3600', 'integer', 'Session timeout in seconds', FALSE),
  ('password_min_length', '8', 'integer', 'Minimum password length', FALSE),
  ('enable_email_notifications', 'true', 'boolean', 'Enable email notifications', FALSE),
  ('maintenance_mode', 'false', 'boolean', 'Enable maintenance mode', FALSE),
  ('max_file_upload_size', '10485760', 'integer', 'Max file upload size in bytes (10MB)', FALSE)
ON CONFLICT (setting_key) DO NOTHING;

-- ============================================
-- ADMIN COMMENTS FOR DOCUMENTATION
-- ============================================

COMMENT ON TABLE activity_logs IS 'Audit trail of all admin and user actions';
COMMENT ON TABLE login_history IS 'Track all login attempts and sessions';
COMMENT ON TABLE system_settings IS 'Configurable system-wide settings';
COMMENT ON TABLE notifications IS 'System and admin notifications to users';
COMMENT ON TABLE user_sessions IS 'Active user sessions for security tracking';
COMMENT ON TABLE email_queue IS 'Queue for outgoing emails';
COMMENT ON TABLE backup_history IS 'History of system backups';

COMMENT ON VIEW v_admin_user_stats IS 'User statistics by role for admin dashboard';
COMMENT ON VIEW v_admin_department_stats IS 'Department statistics for admin overview';
COMMENT ON VIEW v_admin_recent_activity IS 'Recent system activity for admin monitoring';
COMMENT ON VIEW v_admin_system_health IS 'System health metrics for admin dashboard';

COMMENT ON FUNCTION log_admin_activity() IS 'Automatically log admin actions to activity_logs';
COMMENT ON FUNCTION clean_expired_sessions() IS 'Clean up expired and inactive sessions';
COMMENT ON FUNCTION get_user_activity_summary(INTEGER, INTEGER) IS 'Get summary of user activity for specified period';

-- ============================================
-- END OF ADMIN SCHEMA
-- ============================================


-- ============================================
-- DEPARTMENT HEAD MODULE - ADDITIONAL SCHEMA
-- ============================================
-- Department Head specific tables, views, and functions
-- for managing students, courses, instructors, and evaluations
-- ============================================

-- Note: Core tables (users, roles, departments, courses, etc.) already exist above
-- This section adds Department Head specific views, functions, and additional tables

-- ============================================
-- DEPARTMENT HEAD SPECIFIC VIEWS
-- ============================================

-- View: Department Statistics (Enhanced for Department Head)
CREATE OR REPLACE VIEW v_department_statistics AS
SELECT 
  d.id as department_id,
  d.name as department_name,
  d.code as department_code,
  COUNT(DISTINCT CASE WHEN u.role_id = (SELECT id FROM roles WHERE name = 'student') THEN u.id END) as total_students,
  COUNT(DISTINCT CASE WHEN u.role_id = (SELECT id FROM roles WHERE name = 'instructor') THEN u.id END) as total_instructors,
  COUNT(DISTINCT c.id) as total_courses,
  COUNT(DISTINCT CASE WHEN c.is_active = TRUE THEN c.id END) as active_courses,
  COUNT(DISTINCT p.id) as total_projects,
  COUNT(DISTINCT CASE WHEN p.status = 'submitted' THEN p.id END) as submitted_projects,
  COUNT(DISTINCT CASE WHEN p.status = 'approved' THEN p.id END) as approved_projects
FROM departments d
LEFT JOIN users u ON d.id = u.department_id
LEFT JOIN courses c ON d.id = c.department_id
LEFT JOIN projects p ON c.id = p.course_id
GROUP BY d.id, d.name, d.code;

-- View: At-Risk Students (For Department Head Monitoring)
CREATE OR REPLACE VIEW v_at_risk_students AS
SELECT 
  u.id,
  u.full_name,
  u.email,
  u.department_id,
  d.name as department_name,
  sp.average_score,
  sp.completed_projects,
  sp.total_projects,
  sp.courses_completed,
  sp.courses_enrolled,
  sp.last_activity,
  CASE 
    WHEN sp.average_score < 50 THEN 'Low Performance'
    WHEN sp.completed_projects < sp.total_projects * 0.5 THEN 'Low Completion Rate'
    WHEN sp.last_activity < NOW() - INTERVAL '30 days' THEN 'Inactive'
    ELSE 'At Risk'
  END as risk_reason
FROM users u
LEFT JOIN student_progress sp ON u.id = sp.student_id
LEFT JOIN departments d ON u.department_id = d.id
WHERE u.role_id = (SELECT id FROM roles WHERE name = 'student')
  AND (
    sp.average_score < 50 
    OR sp.completed_projects < sp.total_projects * 0.5
    OR sp.last_activity < NOW() - INTERVAL '30 days'
  );

-- ============================================
-- DEPARTMENT HEAD INDEXES FOR PERFORMANCE
-- ============================================

-- Composite indexes for common department head queries
CREATE INDEX IF NOT EXISTS idx_users_dept_role_active ON users(department_id, role_id, is_active);
CREATE INDEX IF NOT EXISTS idx_courses_dept_active_year ON courses(department_id, is_active, academic_year);
CREATE INDEX IF NOT EXISTS idx_projects_student_status_date ON projects(student_id, status, created_at);
CREATE INDEX IF NOT EXISTS idx_evaluations_student_score_date ON evaluations(student_id, score, evaluated_at);
CREATE INDEX IF NOT EXISTS idx_course_enrollments_student_completed ON course_enrollments(student_id, is_completed);

-- ============================================
-- DEPARTMENT HEAD COMMENTS
-- ============================================

COMMENT ON VIEW v_department_statistics IS 'Comprehensive department statistics for department head dashboard';
COMMENT ON VIEW v_at_risk_students IS 'Identifies students who need attention based on performance and activity';

-- ============================================
-- END OF DEPARTMENT HEAD SCHEMA
-- ============================================
