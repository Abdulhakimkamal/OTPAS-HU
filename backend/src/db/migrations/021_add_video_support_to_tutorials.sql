-- Migration: Add Video Support to Tutorial Files System
-- Date: 2026-02-12
-- Description: Extend tutorial_files table to support video uploads and video links

-- Add new columns to tutorial_files table
ALTER TABLE tutorial_files ADD COLUMN IF NOT EXISTS file_type VARCHAR(50) DEFAULT 'document';
ALTER TABLE tutorial_files ADD COLUMN IF NOT EXISTS video_url TEXT;
ALTER TABLE tutorial_files ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;
ALTER TABLE tutorial_files ADD COLUMN IF NOT EXISTS duration_seconds INTEGER;
ALTER TABLE tutorial_files ADD COLUMN IF NOT EXISTS is_external BOOLEAN DEFAULT FALSE;

-- Create index for file_type for faster filtering
CREATE INDEX IF NOT EXISTS idx_tutorial_files_type ON tutorial_files(file_type);
CREATE INDEX IF NOT EXISTS idx_tutorial_files_external ON tutorial_files(is_external);

-- Add constraint to ensure either file_path or video_url is provided
ALTER TABLE tutorial_files ADD CONSTRAINT check_file_or_video 
  CHECK (file_path IS NOT NULL OR video_url IS NOT NULL);

-- Update existing files to have file_type based on their extension
UPDATE tutorial_files 
SET file_type = CASE 
  WHEN file_name ILIKE '%.mp4' OR file_name ILIKE '%.avi' OR file_name ILIKE '%.mov' THEN 'video'
  WHEN file_name ILIKE '%.pdf' THEN 'pdf'
  WHEN file_name ILIKE '%.doc' OR file_name ILIKE '%.docx' THEN 'doc'
  WHEN file_name ILIKE '%.ppt' OR file_name ILIKE '%.pptx' THEN 'ppt'
  WHEN file_name ILIKE '%.jpg' OR file_name ILIKE '%.jpeg' OR file_name ILIKE '%.png' OR file_name ILIKE '%.gif' THEN 'image'
  ELSE 'document'
END
WHERE file_type = 'document';

-- Create tutorial_videos table for external video links
CREATE TABLE IF NOT EXISTS tutorial_videos (
  id SERIAL PRIMARY KEY,
  tutorial_id INTEGER NOT NULL REFERENCES tutorials(id) ON DELETE CASCADE,
  title VARCHAR(500) NOT NULL,
  description TEXT,
  video_url TEXT NOT NULL,
  video_type VARCHAR(50) NOT NULL CHECK (video_type IN ('youtube', 'google_drive', 'vimeo', 'custom')),
  thumbnail_url TEXT,
  duration_seconds INTEGER,
  is_published BOOLEAN DEFAULT TRUE,
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for tutorial_videos
CREATE INDEX IF NOT EXISTS idx_tutorial_videos_tutorial ON tutorial_videos(tutorial_id);
CREATE INDEX IF NOT EXISTS idx_tutorial_videos_type ON tutorial_videos(video_type);
CREATE INDEX IF NOT EXISTS idx_tutorial_videos_published ON tutorial_videos(is_published);

-- Add comment to document the changes
COMMENT ON COLUMN tutorial_files.file_type IS 'Type of file: pdf, doc, ppt, image, video, document';
COMMENT ON COLUMN tutorial_files.video_url IS 'URL for external video links (YouTube, Google Drive, etc.)';
COMMENT ON COLUMN tutorial_files.thumbnail_url IS 'Thumbnail image URL for video files';
COMMENT ON COLUMN tutorial_files.duration_seconds IS 'Duration of video in seconds';
COMMENT ON COLUMN tutorial_files.is_external IS 'Whether this is an external link or uploaded file';
