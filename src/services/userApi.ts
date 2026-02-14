/**
 * User API Service
 * Handles user-related API calls
 */

import { api } from './api';

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string;
  status: 'active' | 'inactive';
  joinDate: string;
}

export interface CreateUserData {
  name: string;
  email: string;
  role: string;
  department: string;
  password?: string;
}

export interface UpdateUserData {
  name?: string;
  email?: string;
  role?: string;
  department?: string;
  status?: 'active' | 'inactive';
}

export interface UsersResponse {
  users: User[];
  total: number;
}

export const userApi = {
  // Get all users
  getAll: async (): Promise<UsersResponse> => {
    const response = await api.get<any>('/api/admin/users');
    return {
      users: (response.users || []).map((user: any) => ({
        id: user.id,
        name: user.name || user.full_name || 'Unknown',
        email: user.email,
        role: user.role || user.role_name || 'Unknown',
        department: user.department || user.department_name || 'N/A',
        status: user.status || (user.is_active ? 'active' : 'inactive'),
        joinDate: user.joinDate 
          ? (typeof user.joinDate === 'string' ? user.joinDate.split('T')[0] : user.joinDate) 
          : new Date().toISOString().split('T')[0]
      })),
      total: response.total || response.users?.length || 0
    };
  },

  // Get user by ID
  getById: async (userId: string): Promise<User> => {
    return api.get<User>(`/api/admin/users/${userId}`);
  },

  // Create new user
  create: async (userData: CreateUserData): Promise<User> => {
    const response = await api.post<any>('/api/admin/users/create', userData);
    // api.post returns the full response, which should have a user property
    return response.user || response;
  },

  // Update user
  update: async (userId: string, userData: UpdateUserData): Promise<User> => {
    return api.put<User>(`/api/admin/users/${userId}`, userData);
  },

  // Delete user
  delete: async (userId: string): Promise<void> => {
    await api.delete(`/api/admin/users/${userId}`);
  },

  // Reset user password
  resetPassword: async (userId: string): Promise<{ temporaryPassword: string }> => {
    return api.post(`/api/admin/users/${userId}/reset-password`);
  },

  // Toggle user status
  toggleStatus: async (userId: string): Promise<User> => {
    return api.patch<User>(`/api/admin/users/${userId}/toggle-status`);
  },
};

export default userApi;
