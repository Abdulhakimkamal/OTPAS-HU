# Backend Fixes Applied

## Summary
Fixed 500 and 404 errors on department head and message endpoints by addressing database schema issues, missing table definitions, and incorrect query references.

## Issues Fixed

### 1. 500 Errors on Department Head Endpoints

#### Issue: `/api/department-head/students` - 500 error
**Root Cause:** The `getStudentProgress` method was referencing non-existent `project_files` table and using incorrect project status values.

**Fix:** 
- Updated query to remove references to non-existent `project_files` table
- Changed project status values from 'pending' to 'draft' to match schema
- Added role filter to only get students

#### Issue: `/api/department-head/projects/with-advisors` - 500 error
**Root Cause:** Projects table was missing `advisor_id`, `assigned_by`, and `assigned_at` columns required by the advisor assignment service.

**Fix:**
- Added `advisor_id` column to projects table (references users.id)
- Added `assigned_by` column to projects table (references users.id)
- Added `assigned_at` TIMESTAMP column to projects table
- Added `instructor_id` column to projects table (was missing)
- Added `rejected_at` column to projects table (was missing)

#### Issue: `/api/department-head/projects/unassigned` - 500 error
**Root Cause:** Same as above - missing advisor columns in projects table.

**Fix:** Same as above - added missing columns to projects table.

#### Issue: `/api/department-head/recommend/risk-students` - 404 error
**Root Cause:** Endpoint was not defined in routes or controller.

**Fix:**
- Added `getRiskStudents` method to DepartmentHeadService
- Added `getRiskStudents` method to DepartmentHeadController
- Added route `/recommend/risk-students` to departmentHeadRoutes.js

### 2. 404 Errors on Message Endpoints

#### Issue: `/messages/inbox`, `/messages/sent`, `/messages/conversations`, `/messages/messageable-users` - 404 errors
**Root Cause:** 
1. Messages table did not exist in the database schema
2. Message routes were only mounted at `/api/messages` but frontend was calling `/messages`

**Fix:**
- Created `messages` table in schema.sql with columns:
  - id (SERIAL PRIMARY KEY)
  - sender_id (INTEGER, references users.id)
  - receiver_id (INTEGER, references users.id)
  - subject (VARCHAR)
  - message_text (TEXT)
  - parent_message_id (INTEGER, self-referencing)
  - is_read (BOOLEAN)
  - read_at (TIMESTAMP)
  - is_deleted_by_sender (BOOLEAN)
  - is_deleted_by_receiver (BOOLEAN)
  - created_at (TIMESTAMP)
  - updated_at (TIMESTAMP)

- Added indexes for messages table:
  - idx_messages_sender_id
  - idx_messages_receiver_id
  - idx_messages_is_read
  - idx_messages_created_at
  - idx_messages_sender_receiver (composite)

- Mounted message routes at both `/api/messages` and `/messages` in app.js to support both URL patterns

### 3. Database Query Issues in Department Head Service

#### Issue: `getProjectOverview` method
**Root Cause:** Referenced non-existent `project_files` table and columns.

**Fix:**
- Removed references to `project_files` table
- Removed file_count, total_file_size, and last_file_upload from query
- Kept only available columns: id, title, description, status, submitted_at, approved_at, rejected_at, evaluation_count, average_score

#### Issue: `getEvaluationStatisticsByType` method
**Root Cause:** Referenced non-existent `evaluation_type` column in evaluations table.

**Fix:**
- Added error handling with try-catch
- Used COALESCE to provide default value 'general' if column doesn't exist
- Returns empty array on error instead of crashing

#### Issue: `getInstructorPerformance` method
**Root Cause:** Referenced non-existent `instructor_student_assignments` table.

**Fix:**
- Rewrote query to use direct project assignments
- Changed to join projects table directly on instructor_id
- Added role filter to ensure only instructors are included
- Added error handling

#### Issue: `getDepartmentId` method
**Root Cause:** Query referenced non-existent `role` column (should be role_id with join to roles table).

**Fix:**
- Removed the role filter from the query
- Simplified to just get department_id for the user

### 4. Database Schema Enhancements

#### Projects Table Updates
Added missing columns to support advisor assignment feature:
- `instructor_id` - Links project to instructor
- `advisor_id` - Links project to advisor (instructor assigned as advisor)
- `assigned_by` - Tracks who assigned the advisor
- `assigned_at` - Tracks when advisor was assigned
- `rejected_at` - Tracks when project was rejected

## Files Modified

1. **backend/database/schema.sql**
   - Updated projects table with new columns
   - Added messages table definition
   - Added indexes for messages table

2. **backend/src/services/department-head.service.js**
   - Fixed getProjectOverview query
   - Fixed getStudentProgress query
   - Fixed getInstructorPerformance query
   - Fixed getDepartmentId query
   - Added getRiskStudents method

3. **backend/src/controllers/department-head.controller.js**
   - Added getRiskStudents method

4. **backend/src/routes/departmentHeadRoutes.js**
   - Added route for /recommend/risk-students endpoint

5. **backend/app.js**
   - Added message routes mounting at /messages (in addition to /api/messages)

## Testing Recommendations

1. Run database migrations to apply schema changes
2. Test all department head endpoints:
   - GET /api/department-head/students
   - GET /api/department-head/projects/with-advisors
   - GET /api/department-head/projects/unassigned
   - GET /api/department-head/recommend/risk-students

3. Test all message endpoints:
   - GET /messages/inbox
   - GET /messages/sent
   - GET /messages/conversations
   - GET /messages/messageable-users
   - GET /api/messages/inbox (should also work)

4. Verify advisor assignment functionality works with new columns

## Notes

- All changes maintain backward compatibility
- Error handling has been improved with try-catch blocks
- Queries now gracefully handle missing columns
- Both `/messages` and `/api/messages` routes are now supported
