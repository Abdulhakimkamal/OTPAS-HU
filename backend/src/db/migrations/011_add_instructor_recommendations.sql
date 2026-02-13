-- Migration: Add Instructor Recommendations System
-- Description: Create recommendations table for instructor-to-student recommendations

-- Create recommendations table
CREATE TABLE IF NOT EXISTS instructor_recommendations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    instructor_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    student_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    evaluation_id INTEGER REFERENCES course_evaluations(id) ON DELETE SET NULL,
    recommendation_type VARCHAR(50) NOT NULL CHECK (recommendation_type IN ('Academic', 'Project', 'Skill', 'Performance', 'Career', 'Mentorship')),
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    priority_level VARCHAR(20) NOT NULL DEFAULT 'Medium' CHECK (priority_level IN ('Low', 'Medium', 'High')),
    status VARCHAR(20) NOT NULL DEFAULT 'Draft' CHECK (status IN ('Draft', 'Submitted', 'Reviewed')),
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX idx_instructor_recommendations_instructor_id ON instructor_recommendations(instructor_id);
CREATE INDEX idx_instructor_recommendations_student_id ON instructor_recommendations(student_id);
CREATE INDEX idx_instructor_recommendations_type ON instructor_recommendations(recommendation_type);
CREATE INDEX idx_instructor_recommendations_status ON instructor_recommendations(status);
CREATE INDEX idx_instructor_recommendations_priority ON instructor_recommendations(priority_level);
CREATE INDEX idx_instructor_recommendations_created_at ON instructor_recommendations(created_at);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_instructor_recommendations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_instructor_recommendations_updated_at
    BEFORE UPDATE ON instructor_recommendations
    FOR EACH ROW
    EXECUTE FUNCTION update_instructor_recommendations_updated_at();

-- Add some sample data for testing
INSERT INTO instructor_recommendations (instructor_id, student_id, recommendation_type, title, description, priority_level, status) VALUES
(
    (SELECT id FROM users WHERE role_id = (SELECT id FROM roles WHERE name = 'instructor') LIMIT 1),
    (SELECT id FROM users WHERE role_id = (SELECT id FROM roles WHERE name = 'student') LIMIT 1),
    'Academic',
    'Focus on Database Fundamentals',
    'Based on your recent project evaluation, I recommend spending more time on database normalization concepts. Consider reviewing the SQL tutorial materials and practicing with the sample datasets provided.',
    'High',
    'Submitted'
),
(
    (SELECT id FROM users WHERE role_id = (SELECT id FROM roles WHERE name = 'instructor') LIMIT 1),
    (SELECT id FROM users WHERE role_id = (SELECT id FROM roles WHERE name = 'student') LIMIT 1),
    'Project',
    'Consider Web Development Project',
    'Given your strong performance in programming fundamentals, I suggest taking on a full-stack web development project for your final assignment. This will help you integrate frontend and backend skills.',
    'Medium',
    'Submitted'
),
(
    (SELECT id FROM users WHERE role_id = (SELECT id FROM roles WHERE name = 'instructor') LIMIT 1),
    (SELECT id FROM users WHERE role_id = (SELECT id FROM roles WHERE name = 'student') LIMIT 1),
    'Career',
    'Software Engineering Career Path',
    'Based on your technical skills and problem-solving abilities, I recommend exploring software engineering roles in fintech or healthcare sectors. Consider building a portfolio with projects in these domains.',
    'Medium',
    'Submitted'
);

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON instructor_recommendations TO postgres;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO postgres;