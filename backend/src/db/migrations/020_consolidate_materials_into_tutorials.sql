-- Migration 020: Consolidate Materials Module into Tutorial Management
-- This migration moves course materials functionality into the tutorial_files system

-- First, check if course_materials table exists and migrate data
DO $$
BEGIN
    -- Check if course_materials table exists
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'course_materials') THEN
        
        -- Migrate existing course materials to tutorial_files
        -- We'll create generic tutorials for each course that has materials
        INSERT INTO tutorials (
            title, 
            description, 
            course_id, 
            instructor_id, 
            is_published, 
            created_at
        )
        SELECT DISTINCT
            CONCAT(c.title, ' - Course Materials') as title,
            'Migrated course materials from Materials module' as description,
            cm.course_id,
            cm.instructor_id,
            true as is_published,
            NOW() as created_at
        FROM course_materials cm
        JOIN courses c ON c.id = cm.course_id
        WHERE cm.is_active = true
        AND NOT EXISTS (
            SELECT 1 FROM tutorials t 
            WHERE t.course_id = cm.course_id 
            AND t.title = CONCAT(c.title, ' - Course Materials')
        );

        -- Now migrate the actual files to tutorial_files
        INSERT INTO tutorial_files (
            tutorial_id,
            file_name,
            file_path,
            file_type,
            file_size,
            mime_type,
            uploaded_by,
            description,
            is_active,
            upload_date
        )
        SELECT 
            t.id as tutorial_id,
            COALESCE(cm.title, 'Migrated Material') as file_name,
            cm.file_url as file_path,
            cm.file_type,
            cm.file_size,
            CASE 
                WHEN cm.file_type = 'pdf' THEN 'application/pdf'
                WHEN cm.file_type IN ('doc', 'docx') THEN 'application/msword'
                WHEN cm.file_type IN ('ppt', 'pptx') THEN 'application/vnd.ms-powerpoint'
                ELSE 'application/octet-stream'
            END as mime_type,
            cm.instructor_id as uploaded_by,
            cm.description,
            cm.is_active,
            cm.uploaded_at as upload_date
        FROM course_materials cm
        JOIN courses c ON c.id = cm.course_id
        JOIN tutorials t ON t.course_id = cm.course_id 
            AND t.title = CONCAT(c.title, ' - Course Materials')
        WHERE cm.is_active = true;

        -- Log the migration
        RAISE NOTICE 'Migrated % course materials to tutorial_files', 
            (SELECT COUNT(*) FROM course_materials WHERE is_active = true);

        -- Drop the course_materials table after successful migration
        DROP TABLE IF EXISTS course_materials CASCADE;
        
        RAISE NOTICE 'Successfully consolidated Materials module into Tutorial Management';
        
    ELSE
        RAISE NOTICE 'No course_materials table found - Materials module already consolidated';
    END IF;
END $$;

-- Update any remaining references to ensure consistency
UPDATE tutorial_files 
SET is_active = true 
WHERE is_active IS NULL;

-- Add indexes for better performance if they don't exist
CREATE INDEX IF NOT EXISTS idx_tutorial_files_tutorial_id ON tutorial_files(tutorial_id);
CREATE INDEX IF NOT EXISTS idx_tutorial_files_uploaded_by ON tutorial_files(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_tutorial_files_active ON tutorial_files(is_active);