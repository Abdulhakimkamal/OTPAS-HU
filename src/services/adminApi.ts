/**
 * Admin API Service
 * Handles all admin-related API calls
 */

import api from './api';

const API_BASE_URL = '/admin';

// Types
export interface DashboardStats {
  totalUsers: number;
  totalStudents: number;
  totalInstructors: number;
  totalDepartments: number;
  activeProjects: number;
  pendingApprovals: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string;
  status: 'active' | 'inactive';
  joinDate: string;
}

export interface Department {
  id: string;
  name: string;
  code: string;
  head: string;
  students: number;
  instructors: number;
  courses: number;
}

export interface Project {
  id: string;
  title: string;
  student: string;
  course: string;
  status: 'approved' | 'pending' | 'rejected';
  submittedDate: string;
}

export interface ActivityLog {
  id: string;
  action: string;
  user: string;
  target: string;
  status: 'success' | 'failed';
  timestamp: string;
}

// Dashboard API
export const adminApi = {
  // Dashboard
  getDashboardStats: async (): Promise<DashboardStats> => {
    const response = await api.get<DashboardStats>(`${API_BASE_URL}/dashboard-stats`);
    return response;
  },

  // Users
  getUsers: async (): Promise<User[]> => {
    const data = await api.get<{ users: any[] }>(`${API_BASE_URL}/users`);
    // Map the response to match the User interface
    return (data.users || []).map((user: any) => ({
      id: user.id,
      name: user.name || user.full_name || 'Unknown',
      email: user.email,
      role: user.role || user.role_name || 'Unknown',
      department: user.department || user.department_name || 'N/A',
      status: user.status || (user.is_active ? 'active' : 'inactive'),
      joinDate: user.joinDate ? (typeof user.joinDate === 'string' ? user.joinDate.split('T')[0] : user.joinDate) : new Date().toISOString().split('T')[0]
    }));
  },

  createUser: async (userData: any): Promise<any> => {
    const data = await api.post<any>(`${API_BASE_URL}/users/create`, userData);
    return data;
  },

  updateUser: async (userId: string, userData: Partial<User>): Promise<User> => {
    const data = await api.put<User>(`${API_BASE_URL}/users/${userId}`, userData);
    return data;
  },

  deleteUser: async (userId: string): Promise<void> => {
    await api.delete(`${API_BASE_URL}/users/${userId}`);
  },

  // Departments
  getDepartments: async (): Promise<Department[]> => {
    const data = await api.get<Department[]>(`${API_BASE_URL}/departments`);
    return data;
  },

  createDepartment: async (deptData: Omit<Department, 'id' | 'students' | 'instructors' | 'courses'>): Promise<Department> => {
    const data = await api.post<Department>(`${API_BASE_URL}/departments`, deptData);
    return data;
  },

  updateDepartment: async (deptId: string, deptData: Partial<Department>): Promise<Department> => {
    const data = await api.put<Department>(`${API_BASE_URL}/departments/${deptId}`, deptData);
    return data;
  },

  deleteDepartment: async (deptId: string): Promise<void> => {
    await api.delete(`${API_BASE_URL}/departments/${deptId}`);
  },

  // Projects
  getProjects: async (): Promise<Project[]> => {
    const data = await api.get<Project[]>(`${API_BASE_URL}/projects`);
    return data;
  },

  approveProject: async (projectId: string): Promise<Project> => {
    const data = await api.put<Project>(`${API_BASE_URL}/projects/${projectId}`, { status: 'approved' });
    return data;
  },

  rejectProject: async (projectId: string, reason: string): Promise<Project> => {
    const data = await api.put<Project>(`${API_BASE_URL}/projects/${projectId}`, { status: 'rejected', reason });
    return data;
  },

  // Reports
  getReports: async (): Promise<any[]> => {
    const data = await api.get<any[]>(`${API_BASE_URL}/reports`);
    return data;
  },

  generateReport: async (reportType: string): Promise<any> => {
    const data = await api.post<any>(`${API_BASE_URL}/reports`, { type: reportType });
    return data;
  },

  // Logs
  getLogs: async (): Promise<ActivityLog[]> => {
    const data = await api.get<ActivityLog[]>(`${API_BASE_URL}/logs`);
    return data;
  },

  getLoginHistory: async (): Promise<any[]> => {
    const data = await api.get<any[]>(`${API_BASE_URL}/logs/login-history`);
    return data;
  },

  // Settings
  getSettings: async (): Promise<any> => {
    const data = await api.get<{ settings: any }>(`${API_BASE_URL}/settings`);
    return data.settings;
  },

  updateSettings: async (settings: any): Promise<any> => {
    const data = await api.put<any>(`${API_BASE_URL}/settings`, settings);
    return data;
  },

  // Change Password
  changePassword: async (data: { currentPassword: string; newPassword: string; confirmPassword: string }): Promise<any> => {
    const response = await api.post<any>('/auth/change-password', data);
    return response;
  },

  // Update Profile
  updateProfile: async (data: any): Promise<any> => {
    const response = await api.put<any>('/auth/profile', data);
    return response;
  },

  // Get Profile
  getProfile: async (): Promise<any> => {
    const response = await api.get<any>('/auth/profile');
    return response;
  },
};

export default adminApi;
