-- ============================================
-- Migration: Create Academic Evaluation Workflow Tables
-- Description: Alters existing tables and creates new tables for
--              project title approval workflow, academic evaluations,
--              notifications, and project files
-- Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7
-- ============================================

-- ============================================
-- ALTER PROJECTS TABLE
-- ============================================
-- Note: The 'pending' status was added to project_status enum in migration 013_5

-- Add instructor_id column if it doesn't exist
ALTER TABLE projects ADD COLUMN IF NOT EXISTS instructor_id INTEGER REFERENCES users(id) ON DELETE RESTRICT;

-- Add rejected_at column if it doesn't exist
ALTER TABLE projects ADD COLUMN IF NOT EXISTS rejected_at TIMESTAMP;

-- Add check constraints if they don't exist
DO $$
BEGIN
  ALTER TABLE projects ADD CONSTRAINT check_title_not_empty 
    CHECK (LENGTH(TRIM(title)) > 0);
EXCEPTION
  WHEN duplicate_object THEN
    NULL;
END $$;

-- Add indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_projects_student ON projects(student_id);
CREATE INDEX IF NOT EXISTS idx_projects_instructor ON projects(instructor_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_submitted_at ON projects(submitted_at);
CREATE INDEX IF NOT EXISTS idx_projects_student_status ON projects(student_id, status);

-- Comments
COMMENT ON TABLE projects IS 'Stores student project titles with approval workflow';
COMMENT ON COLUMN projects.status IS 'Project title status: pending, draft, submitted, under_review, approved, rejected';
COMMENT ON COLUMN projects.submitted_at IS 'Timestamp when project title was submitted';
COMMENT ON COLUMN projects.approved_at IS 'Timestamp when project title was approved';
COMMENT ON COLUMN projects.rejected_at IS 'Timestamp when project title was rejected';

-- ============================================
-- ALTER EVALUATIONS TABLE
-- ============================================
-- Add evaluation_type column if it doesn't exist
ALTER TABLE evaluations ADD COLUMN IF NOT EXISTS evaluation_type VARCHAR(50) NOT NULL DEFAULT 'tutorial_assignment'
  CHECK (evaluation_type IN ('proposal', 'project_progress', 'final_project', 'tutorial_assignment'));

-- Add recommendation column if it doesn't exist
ALTER TABLE evaluations ADD COLUMN IF NOT EXISTS recommendation TEXT NOT NULL DEFAULT 'No recommendation provided';

-- Add status column if it doesn't exist
ALTER TABLE evaluations ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'Approved'
  CHECK (status IN ('Approved', 'Needs Revision', 'Rejected'));

-- Add check constraints
DO $$
BEGIN
  ALTER TABLE evaluations ADD CONSTRAINT check_feedback_length 
    CHECK (LENGTH(feedback) >= 10);
EXCEPTION
  WHEN duplicate_object THEN
    NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE evaluations ADD CONSTRAINT check_recommendation_not_empty 
    CHECK (LENGTH(TRIM(recommendation)) > 0);
EXCEPTION
  WHEN duplicate_object THEN
    NULL;
END $$;

-- Add indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_evaluations_project ON evaluations(project_id);
CREATE INDEX IF NOT EXISTS idx_evaluations_instructor ON evaluations(instructor_id);
CREATE INDEX IF NOT EXISTS idx_evaluations_type ON evaluations(evaluation_type);
CREATE INDEX IF NOT EXISTS idx_evaluations_status ON evaluations(status);
CREATE INDEX IF NOT EXISTS idx_evaluations_created_at ON evaluations(created_at);

-- Comments
COMMENT ON TABLE evaluations IS 'Stores academic evaluations with scores, feedback, and recommendations';
COMMENT ON COLUMN evaluations.evaluation_type IS 'Type of evaluation: proposal, project_progress, final_project, tutorial_assignment';
COMMENT ON COLUMN evaluations.score IS 'Evaluation score between 0 and 100';
COMMENT ON COLUMN evaluations.status IS 'Evaluation status: Approved, Needs Revision, Rejected';

-- ============================================
-- ALTER NOTIFICATIONS TABLE
-- ============================================
-- Add user_id column if it doesn't exist (map from target_user_id)
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id) ON DELETE CASCADE;

-- Add type column if it doesn't exist (for backward compatibility)
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS type VARCHAR(50);

-- Add check constraint for type
DO $$
BEGIN
  ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
  ALTER TABLE notifications ADD CONSTRAINT notifications_type_check
    CHECK (type IN ('title_approved', 'title_rejected', 'evaluation_complete', 'info', 'warning', 'error', 'success'));
EXCEPTION
  WHEN duplicate_object THEN
    NULL;
END $$;

-- Add check constraint for message
DO $$
BEGIN
  ALTER TABLE notifications ADD CONSTRAINT check_message_not_empty 
    CHECK (LENGTH(TRIM(message)) > 0);
EXCEPTION
  WHEN duplicate_object THEN
    NULL;
END $$;

-- Add indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_target_user ON notifications(target_user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);

-- Comments
COMMENT ON TABLE notifications IS 'Stores automated notifications for project and evaluation events';
COMMENT ON COLUMN notifications.type IS 'Notification type: title_approved, title_rejected, evaluation_complete, info, warning, error, success';
COMMENT ON COLUMN notifications.is_read IS 'Whether the notification has been read by the user';

-- ============================================
-- PROJECT_FILES TABLE
-- ============================================
-- Stores project file metadata
CREATE TABLE IF NOT EXISTS project_files (
  id SERIAL PRIMARY KEY,
  project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  file_path VARCHAR(500) NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  file_type VARCHAR(50) NOT NULL,
  file_size BIGINT NOT NULL,
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Constraints
  CONSTRAINT check_file_path_not_empty CHECK (LENGTH(TRIM(file_path)) > 0),
  CONSTRAINT check_file_size_positive CHECK (file_size > 0)
);

-- Indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_project_files_project ON project_files(project_id);
CREATE INDEX IF NOT EXISTS idx_project_files_uploaded_at ON project_files(uploaded_at);

-- Comments
COMMENT ON TABLE project_files IS 'Stores metadata for files uploaded to projects';
COMMENT ON COLUMN project_files.file_path IS 'Path to the uploaded file on the server';
COMMENT ON COLUMN project_files.file_size IS 'File size in bytes';

-- ============================================
-- INSTRUCTOR_STUDENT_ASSIGNMENTS TABLE
-- ============================================
-- Stores instructor-student assignment relationships
-- (This table may already exist, creating if not exists)
CREATE TABLE IF NOT EXISTS instructor_student_assignments (
  id SERIAL PRIMARY KEY,
  instructor_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  student_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(instructor_id, student_id)
);

-- Indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_instructor_student_assignments_instructor ON instructor_student_assignments(instructor_id);
CREATE INDEX IF NOT EXISTS idx_instructor_student_assignments_student ON instructor_student_assignments(student_id);

-- Comments
COMMENT ON TABLE instructor_student_assignments IS 'Stores instructor-student assignment relationships for authorization';

-- ============================================
-- TRIGGERS FOR AUTOMATIC TIMESTAMP UPDATES
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for projects table
DROP TRIGGER IF EXISTS trigger_projects_updated_at ON projects;
CREATE TRIGGER trigger_projects_updated_at
BEFORE UPDATE ON projects
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Trigger for evaluations table
DROP TRIGGER IF EXISTS trigger_evaluations_updated_at ON evaluations;
CREATE TRIGGER trigger_evaluations_updated_at
BEFORE UPDATE ON evaluations
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- END OF MIGRATION
-- ============================================
