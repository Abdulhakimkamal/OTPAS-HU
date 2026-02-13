-- Migration: Add video_type column to tutorial_files
-- Date: 2026-02-12
-- Description: Add video_type column to store the type of external video (youtube, google_drive, vimeo, custom)

ALTER TABLE tutorial_files ADD COLUMN IF NOT EXISTS video_type VARCHAR(50);

-- Create index for video_type for faster filtering
CREATE INDEX IF NOT EXISTS idx_tutorial_files_video_type ON tutorial_files(video_type);
