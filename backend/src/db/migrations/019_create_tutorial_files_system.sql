-- Migration 019: Create Tutorial Files System
-- Create tutorial_files table for file sharing with proper RBAC

CREATE TABLE IF NOT EXISTS tutorial_files (
    id SERIAL PRIMARY KEY,
    tutorial_id INTEGER NOT NULL REFERENCES tutorials(id) ON DELETE CASCADE,
    file_name VARCHAR(500) NOT NULL,
    file_path VARCHAR(1000) NOT NULL,
    file_type VARCHAR(100) NOT NULL,
    file_size BIGINT,
    mime_type VARCHAR(255),
    uploaded_by INTEGER NOT NULL REFERENCES users(id),
    upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    download_count INTEGER DEFAULT 0,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_tutorial_files_tutorial_id ON tutorial_files(tutorial_id);
CREATE INDEX IF NOT EXISTS idx_tutorial_files_uploaded_by ON tutorial_files(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_tutorial_files_active ON tutorial_files(is_active);

-- Create tutorial_videos table for video sharing
CREATE TABLE IF NOT EXISTS tutorial_videos (
    id SERIAL PRIMARY KEY,
    tutorial_id INTEGER NOT NULL REFERENCES tutorials(id) ON DELETE CASCADE,
    video_title VARCHAR(500) NOT NULL,
    video_url VARCHAR(1000) NOT NULL,
    video_type VARCHAR(100) DEFAULT 'mp4',
    duration_seconds INTEGER,
    file_size BIGINT,
    thumbnail_url VARCHAR(1000),
    uploaded_by INTEGER NOT NULL REFERENCES users(id),
    upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    view_count INTEGER DEFAULT 0,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for tutorial_videos
CREATE INDEX IF NOT EXISTS idx_tutorial_videos_tutorial_id ON tutorial_videos(tutorial_id);
CREATE INDEX IF NOT EXISTS idx_tutorial_videos_uploaded_by ON tutorial_videos(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_tutorial_videos_active ON tutorial_videos(is_active);

-- Add course management permissions to existing tables
-- Update tutorials table to track who can manage it
ALTER TABLE tutorials ADD COLUMN IF NOT EXISTS created_by INTEGER REFERENCES users(id);
ALTER TABLE tutorials ADD COLUMN IF NOT EXISTS last_modified_by INTEGER REFERENCES users(id);
ALTER TABLE tutorials ADD COLUMN IF NOT EXISTS department_id INTEGER REFERENCES departments(id);

-- Create course_instructors table for instructor-course assignments
CREATE TABLE IF NOT EXISTS course_instructors (
    id SERIAL PRIMARY KEY,
    course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    instructor_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    assigned_by INTEGER NOT NULL REFERENCES users(id),
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    UNIQUE(course_id, instructor_id)
);

-- Create indexes for course_instructors
CREATE INDEX IF NOT EXISTS idx_course_instructors_course_id ON course_instructors(course_id);
CREATE INDEX IF NOT EXISTS idx_course_instructors_instructor_id ON course_instructors(instructor_id);
CREATE INDEX IF NOT EXISTS idx_course_instructors_active ON course_instructors(is_active);

-- Insert sample course-instructor assignments
INSERT INTO course_instructors (course_id, instructor_id, assigned_by, assigned_at, is_active)
SELECT 
    c.id as course_id,
    c.instructor_id,
    c.instructor_id as assigned_by, -- Use the instructor as the one who assigned themselves
    CURRENT_TIMESTAMP,
    true
FROM courses c
WHERE c.instructor_id IS NOT NULL
ON CONFLICT (course_id, instructor_id) DO NOTHING;

-- Update existing tutorials with department and creator info
UPDATE tutorials 
SET 
    created_by = instructor_id,
    last_modified_by = instructor_id,
    department_id = (
        SELECT c.department_id 
        FROM courses c 
        WHERE c.id = tutorials.course_id
    )
WHERE created_by IS NULL;