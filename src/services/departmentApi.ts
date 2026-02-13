/**
 * Department API Service
 * Handles department-related API calls
 */

import { api } from './api';

export interface Department {
  id: string;
  name: string;
  code: string;
  head: string;
  students: number;
  instructors: number;
  courses: number;
}

export interface CreateDepartmentData {
  name: string;
  code: string;
  head?: string;
}

export interface UpdateDepartmentData {
  name?: string;
  code?: string;
  head?: string;
}

export interface DepartmentsResponse {
  departments: Department[];
  total: number;
}

export const departmentApi = {
  // Get all departments
  getAll: async (): Promise<DepartmentsResponse> => {
    const response = await api.get<any>('/admin/departments');
    return {
      departments: response.departments || response || [],
      total: response.total || response.departments?.length || response.length || 0
    };
  },

  // Get department by ID
  getById: async (deptId: string): Promise<Department> => {
    return api.get<Department>(`/admin/departments/${deptId}`);
  },

  // Create new department
  create: async (deptData: CreateDepartmentData): Promise<Department> => {
    return api.post<Department>('/admin/departments', deptData);
  },

  // Update department
  update: async (deptId: string, deptData: UpdateDepartmentData): Promise<Department> => {
    return api.put<Department>(`/admin/departments/${deptId}`, deptData);
  },

  // Delete department
  delete: async (deptId: string): Promise<void> => {
    await api.delete(`/admin/departments/${deptId}`);
  },

  // Get department statistics
  getStats: async (deptId: string): Promise<any> => {
    return api.get(`/admin/departments/${deptId}/stats`);
  },
};

export default departmentApi;
