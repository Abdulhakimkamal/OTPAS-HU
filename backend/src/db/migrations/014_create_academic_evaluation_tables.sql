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
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='projects' AND column_name='instructor_id') THEN
    ALTER TABLE projects ADD COLUMN instructor_id INTEGER REFERENCES users(id) ON DELETE RESTRICT;
  END IF;
END $$;

-- Add rejected_at column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='projects' AND column_name='rejected_at') THEN
    ALTER TABLE projects ADD COLUMN rejected_at TIMESTAMP;
  END IF;
END $$;

-- Make description NOT NULL if it isn't already
DO $$
BEGIN
  ALTER TABLE projects ALTER COLUMN description SET NOT NULL;
EXCEPTION
  WHEN others THEN
    -- Column might already be NOT NULL or have NULL values
    RAISE NOTICE 'Could not set description to NOT NULL: %', SQLERRM;
END $$;

-- Add check constraints if they don't exist
DO $$
BEGIN
  ALTER TABLE projects ADD CONSTRAINT check_title_not_empty 
    CHECK (LENGTH(TRIM(title)) > 0);
EXCEPTION
  WHEN duplicate_object THEN
    NULL;
END $$;

DO $$
BEGIN
  -- First, update any existing projects with short descriptions
  UPDATE projects 
  SET description = COALESCE(description, '') || ' (Description updated for compliance with new requirements)'
  WHERE description IS NULL OR LENGTH(description) < 20;
  
  -- Then add the constraint
  ALTER TABLE projects ADD CONSTRAINT check_description_length 
    CHECK (LENGTH(description) >= 20);
EXCEPTION
  WHEN duplicate_object THEN
    NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE projects ADD CONSTRAINT unique_student_title 
    UNIQUE(student_id, title);
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
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='evaluations' AND column_name='evaluation_type') THEN
    ALTER TABLE evaluations ADD COLUMN evaluation_type VARCHAR(50) NOT NULL DEFAULT 'tutorial_assignment'
      CHECK (evaluation_type IN ('proposal', 'project_progress', 'final_project', 'tutorial_assignment'));
  END IF;
END $$;

-- Add recommendation column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='evaluations' AND column_name='recommendation') THEN
    ALTER TABLE evaluations ADD COLUMN recommendation TEXT NOT NULL DEFAULT 'No recommendation provided';
  END IF;
END $$;

-- Add status column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='evaluations' AND column_name='status') THEN
    ALTER TABLE evaluations ADD COLUMN status VARCHAR(20) NOT NULL DEFAULT 'Approved'
      CHECK (status IN ('Approved', 'Needs Revision', 'Rejected'));
  END IF;
END $$;

-- Make feedback NOT NULL if it isn't already
DO $$
BEGIN
  ALTER TABLE evaluations ALTER COLUMN feedback SET NOT NULL;
  ALTER TABLE evaluations ALTER COLUMN feedback SET DEFAULT '';
EXCEPTION
  WHEN others THEN
    RAISE NOTICE 'Could not set feedback to NOT NULL: %', SQLERRM;
END $$;

-- Update score constraint to be 0-100
DO $$
BEGIN
  ALTER TABLE evaluations DROP CONSTRAINT IF EXISTS check_score;
  ALTER TABLE evaluations ADD CONSTRAINT check_score 
    CHECK (score >= 0 AND score <= 100);
EXCEPTION
  WHEN others THEN
    RAISE NOTICE 'Score constraint update: %', SQLERRM;
END $$;

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
-- The notifications table already exists with title, message, notification_type, etc.
-- We need to ensure it has the columns we need for our notification system

-- Add user_id column if it doesn't exist (map from target_user_id)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='notifications' AND column_name='user_id') THEN
    -- Add user_id column
    ALTER TABLE notifications ADD COLUMN user_id INTEGER REFERENCES users(id) ON DELETE CASCADE;
    
    -- Copy data from target_user_id to user_id if target_user_id exists
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name='notifications' AND column_name='target_user_id') THEN
      UPDATE notifications SET user_id = target_user_id WHERE user_id IS NULL;
    END IF;
  END IF;
END $$;

-- Add type column if it doesn't exist (for backward compatibility)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='notifications' AND column_name='type') THEN
    -- Use notification_type as type if it exists
    ALTER TABLE notifications ADD COLUMN type VARCHAR(50);
    
    -- Copy data from notification_type to type if notification_type exists
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name='notifications' AND column_name='notification_type') THEN
      UPDATE notifications SET type = notification_type WHERE type IS NULL;
    END IF;
  END IF;
END $$;

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

-- Ensure message column exists (it already does)
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
-- VIEWS FOR COMMON QUERIES
-- ============================================

-- View: Student project status with evaluation summary
CREATE OR REPLACE VIEW v_student_project_status AS
SELECT 
  p.id as project_id,
  p.student_id,
  u.full_name as student_name,
  u.email as student_email,
  p.instructor_id,
  i.full_name as instructor_name,
  p.title,
  p.description,
  p.status,
  p.submitted_at,
  p.approved_at,
  p.rejected_at,
  COUNT(DISTINCT e.id) as evaluation_count,
  AVG(e.score) as average_score,
  COUNT(DISTINCT pf.id) as file_count
FROM projects p
JOIN users u ON p.student_id = u.id
LEFT JOIN users i ON p.instructor_id = i.id
LEFT JOIN evaluations e ON p.id = e.project_id
LEFT JOIN project_files pf ON p.id = pf.project_id
GROUP BY p.id, p.student_id, u.full_name, u.email, p.instructor_id, i.full_name, 
         p.title, p.description, p.status, p.submitted_at, p.approved_at, p.rejected_at;

-- View: Instructor pending projects
CREATE OR REPLACE VIEW v_instructor_pending_projects AS
SELECT 
  p.id as project_id,
  p.student_id,
  u.full_name as student_name,
  u.email as student_email,
  p.title,
  p.description,
  p.submitted_at,
  EXTRACT(DAY FROM (CURRENT_TIMESTAMP - p.submitted_at)) as days_pending
FROM projects p
JOIN users u ON p.student_id = u.id
WHERE p.status = 'pending'
ORDER BY p.submitted_at ASC;

-- View: Evaluation summary for department heads
CREATE OR REPLACE VIEW v_evaluation_summary AS
SELECT 
  e.id as evaluation_id,
  e.project_id,
  p.title as project_title,
  p.student_id,
  s.full_name as student_name,
  s.department_id,
  d.name as department_name,
  e.instructor_id,
  i.full_name as instructor_name,
  e.evaluation_type,
  e.score,
  e.status as evaluation_status,
  e.created_at as evaluated_at
FROM evaluations e
JOIN projects p ON e.project_id = p.id
JOIN users s ON p.student_id = s.id
JOIN users i ON e.instructor_id = i.id
LEFT JOIN departments d ON s.department_id = d.id
ORDER BY e.created_at DESC;

-- Comments on views
COMMENT ON VIEW v_student_project_status IS 'Comprehensive view of student projects with evaluation summary';
COMMENT ON VIEW v_instructor_pending_projects IS 'View of pending project titles for instructor approval';
COMMENT ON VIEW v_evaluation_summary IS 'Summary view of evaluations for department head monitoring';

-- ============================================
-- END OF MIGRATION
-- ============================================
