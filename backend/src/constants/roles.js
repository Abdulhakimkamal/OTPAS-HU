export const ROLES = {
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
  DEPARTMENT_HEAD: 'department_head',
  INSTRUCTOR: 'instructor',
  STUDENT: 'student',
};

export const ROLE_HIERARCHY = {
  super_admin: 5,
  admin: 4,
  department_head: 3,
  instructor: 2,
  student: 1,
};

export const ROLE_PERMISSIONS = {
  super_admin: ['*'], // All permissions
  admin: [
    'manage_users',
    'manage_departments',
    'manage_courses',
    'view_reports',
    'manage_admins',
  ],
  department_head: [
    'manage_department',
    'view_students',
    'approve_projects',
    'view_reports',
  ],
  instructor: [
    'create_tutorials',
    'evaluate_projects',
    'view_students',
    'create_recommendations',
  ],
  student: [
    'view_tutorials',
    'submit_projects',
    'view_recommendations',
    'submit_feedback',
  ],
};

export default ROLES;
