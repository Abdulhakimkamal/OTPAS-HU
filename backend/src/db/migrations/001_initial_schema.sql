-- Migration 001: Initial Schema
-- Created: 2026-02-05
-- Description: Initial database schema for OTPAS-HU

-- Roles table already exists, just ensure all roles are present
INSERT INTO roles (name, description, permissions) VALUES
('admin', 'System Administrator with full access', '{"all": true}'),
('department_head', 'Department Head with department management access', '{"manage_department": true, "view_reports": true}'),
('instructor', 'Instructor/Faculty with course and tutorial management', '{"manage_courses": true, "manage_tutorials": true, "evaluate_students": true}'),
('student', 'Student with course enrollment and project submission', '{"enroll_courses": true, "submit_projects": true, "view_tutorials": true}')
ON CONFLICT (name) DO NOTHING;

-- Ensure skills exist
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

-- Ensure departments exist
INSERT INTO departments (name, code, description, contact_email, phone, location) VALUES
('Computer Science', 'CS', 'Department of Computer Science and Engineering', 'cs@haramaya.edu', '+251-911-234567', 'Building A, Floor 3'),
('Information Technology', 'IT', 'Department of Information Technology', 'it@haramaya.edu', '+251-911-234568', 'Building B, Floor 2'),
('Software Engineering', 'SE', 'Department of Software Engineering', 'se@haramaya.edu', '+251-911-234569', 'Building C, Floor 1'),
('Business Administration', 'BA', 'Department of Business Administration', 'ba@haramaya.edu', '+251-911-234570', 'Building D, Floor 2')
ON CONFLICT (code) DO NOTHING;


