/**
 * Academic Evaluation API Service
 * Handles all API calls for project titles, evaluations, and notifications
 */

import { api } from './api';

// Types
export interface Project {
  id: number;
  student_id: number;
  instructor_id: number;
  title: string;
  description: string;
  status: 'pending' | 'approved' | 'rejected';
  submitted_at: string;
  approved_at?: string;
  rejected_at?: string;
  created_at: string;
  updated_at: string;
}

export interface Evaluation {
  id: number;
  project_id: number;
  instructor_id: number;
  evaluation_type: 'proposal' | 'project_progress' | 'final_project' | 'tutorial_assignment';
  score: number;
  feedback: string;
  recommendation: string;
  status: 'Approved' | 'Needs Revision' | 'Rejected';
  created_at: string;
  updated_at: string;
}

export interface Notification {
  id: number;
  user_id: number;
  message: string;
  type: 'title_approved' | 'title_rejected' | 'evaluation_complete';
  is_read: boolean;
  created_at: string;
}

export interface ProjectFile {
  id: number;
  project_id: number;
  file_path: string;
  file_name: string;
  file_type: string;
  file_size: number;
  uploaded_at: string;
}

export interface EvaluationSummary {
  total_evaluations: number;
  average_score: number;
  by_type: Record<string, number>;
  by_status: Record<string, number>;
}

// Instructor API
export const instructorApi = {
  // Project title management
  requestTitleSubmission: (studentIds: number[]) =>
    api.post<void>('/api/instructor/project/request-title', { student_ids: studentIds }),

  getPendingProjects: async () => {
    const response = await api.get<{ success: boolean; data: { projects: Project[]; count: number } }>('/api/instructor/projects/pending');
    return response.data?.projects || [];
  },

  getAllProjects: async () => {
    const response = await api.get<{ success: boolean; data: { projects: Project[]; count: number } }>('/api/instructor/projects');
    return response.data?.projects || [];
  },

  approveTitle: (projectId: number) =>
    api.patch<Project>(`/api/instructor/project/${projectId}/approve`, {}),

  disapproveTitle: (projectId: number) =>
    api.patch<Project>(`/api/instructor/project/${projectId}/disapprove`, {}),

  // Evaluation management
  createEvaluation: (data: {
    project_id: number;
    evaluation_type: string;
    score: number;
    feedback: string;
    recommendation: string;
    status: string;
  }) =>
    api.post<Evaluation>('/api/instructor/evaluation/create', data),
};

// Student API
export const studentApi = {
  // Project title submission
  submitTitle: (data: {
    instructor_id: number;
    title: string;
    description: string;
  }) =>
    api.post<Project>('/student/project/title', data),

  getProjectStatus: async (projectId: number) => {
    const response = await api.get<{ success: boolean; data: Project }>(`/student/project/${projectId}/status`);
    return response.data;
  },

  // File upload
  uploadFile: (projectId: number, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    
    // Don't set Content-Type manually - let the browser set it with the boundary
    return api.post<{ success: boolean; data: ProjectFile }>(`/student/project/${projectId}/upload`, formData);
  },

  getProjectFiles: async (projectId: number) => {
    const response = await api.get<{ success: boolean; data: ProjectFile[] }>(`/student/project/${projectId}/files`);
    return response.data || [];
  },

  deleteFile: (fileId: number) =>
    api.delete<void>(`/student/project/file/${fileId}`),

  // Evaluations
  getEvaluations: async () => {
    const response = await api.get<{ success: boolean; data: Evaluation[] }>('/student/evaluations');
    return response.data || [];
  },

  // Notifications
  getNotifications: async () => {
    const response = await api.get<{ success: boolean; data: Notification[] }>('/student/notifications');
    return response.data || [];
  },

  markNotificationAsRead: (notificationId: number) =>
    api.patch<Notification>(`/student/notifications/${notificationId}/read`, {}),

  markAllNotificationsAsRead: () =>
    api.patch<void>('/student/notifications/read-all', {}),
};

// Department Head API
export const departmentHeadApi = {
  getEvaluationSummary: () =>
    api.get<EvaluationSummary>('/api/department-head/evaluations/summary'),

  getProjectOverview: () =>
    api.get<any>('/api/department-head/projects/overview'),

  getEvaluationDetails: () =>
    api.get<Evaluation[]>('/api/department-head/evaluations'),

  getProjectDetails: () =>
    api.get<Project[]>('/api/department-head/projects'),

  // Advisor Assignment
  assignAdvisor: (projectId: number, advisorId: number) =>
    api.post<Project>(`/api/department-head/projects/${projectId}/assign-advisor`, { advisorId }),

  removeAdvisor: (projectId: number) =>
    api.delete<Project>(`/api/department-head/projects/${projectId}/remove-advisor`),

  getAvailableInstructors: async () => {
    const response = await api.get<{ success: boolean; data: any[] }>('/api/department-head/instructors');
    return response.data || [];
  },

  getUnassignedProjects: async () => {
    const response = await api.get<{ success: boolean; data: any[] }>('/api/department-head/projects/unassigned');
    return response.data || [];
  },

  getProjectsWithAdvisors: async () => {
    const response = await api.get<{ success: boolean; data: any[] }>('/api/department-head/projects/with-advisors');
    return response.data || [];
  },
};

export default {
  instructorApi,
  studentApi,
  departmentHeadApi,
};
