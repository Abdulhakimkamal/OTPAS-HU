import api from './api';

const BASE_URL = '/api/instructor';

// ============================================
// STUDENT MANAGEMENT (READ ONLY)
// ============================================

export const getAssignedStudents = async () => {
  const response = await api.get(`${BASE_URL}/students`);
  return response;
};

export const getStudentById = async (id: number) => {
  const response = await api.get(`${BASE_URL}/student/${id}`);
  return response;
};

export const getStudentProgress = async (id: number) => {
  const response = await api.get(`${BASE_URL}/student-progress/${id}`);
  return response;
};

// ============================================
// EVALUATIONS
// ============================================

export const createEvaluation = async (data: {
  student_id: number;
  course_id: number;
  score: number;
  feedback: string;
  evaluation_type?: string;
}) => {
  const response = await api.post(`${BASE_URL}/evaluation`, data);
  return response;
};

export const updateEvaluation = async (id: number, data: {
  score: number;
  feedback: string;
}) => {
  const response = await api.put(`${BASE_URL}/evaluation/${id}`, data);
  return response;
};

export const getEvaluations = async () => {
  const response = await api.get(`${BASE_URL}/evaluations`);
  return response;
};

// ============================================
// FEEDBACK & GUIDANCE
// ============================================

export const createFeedback = async (data: {
  student_id: number;
  course_id: number;
  feedback_text: string;
  feedback_type?: string;
}) => {
  const response = await api.post(`${BASE_URL}/feedback`, data);
  return response;
};

export const getFeedback = async () => {
  const response = await api.get(`${BASE_URL}/feedback`);
  return response;
};

// ============================================
// PROJECT COMMENTS (NEW)
// ============================================

export const addProjectComment = async (data: {
  project_id: number;
  student_id: number;
  comment_text: string;
}) => {
  const response = await api.post(`${BASE_URL}/project/comment`, data);
  return response;
};

export const getProjectComments = async (projectId: number) => {
  const response = await api.get(`${BASE_URL}/project/${projectId}/comments`);
  return response;
};

// ============================================
// ANNOUNCEMENTS (NEW)
// ============================================

export const createAnnouncement = async (formData: FormData) => {
  const token = localStorage.getItem('authToken');
  if (!token) {
    throw new Error('No authentication token found');
  }

  const response = await fetch('/api/instructor/announcement', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
    body: formData
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Failed to create announcement' }));
    throw new Error(errorData.message || 'Failed to create announcement');
  }

  return response.json();
};

export const getAnnouncements = async () => {
  const response = await api.get(`${BASE_URL}/announcements`);
  return response;
};

// ============================================
// COURSE MATERIALS (NEW)
// ============================================

export const uploadCourseMaterial = async (formData: FormData) => {
  const token = localStorage.getItem('authToken');
  if (!token) {
    throw new Error('No authentication token found');
  }

  const response = await fetch('/api/instructor/course-material', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
    body: formData
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Upload failed' }));
    throw new Error(errorData.message || 'Failed to upload course material');
  }

  return response.json();
};

export const getCourseMaterials = async (courseId?: number) => {
  const response = await api.get(`${BASE_URL}/course-materials`, {
    params: courseId ? { course_id: courseId } : {}
  });
  return response;
};

// ============================================
// REPORTING
// ============================================

export const getReports = async () => {
  const response = await api.get(`${BASE_URL}/reports`);
  return response;
};

export const getAnalytics = async () => {
  const response = await api.get(`${BASE_URL}/analytics`);
  return response;
};

// ============================================
// ACCOUNT MANAGEMENT
// ============================================

export const getProfile = async () => {
  const response = await api.get(`${BASE_URL}/profile`);
  return response;
};

export const updateProfile = async (data: {
  full_name: string;
  phone?: string;
  bio?: string;
}) => {
  const response = await api.put(`${BASE_URL}/profile`, data);
  return response;
};

export const changePassword = async (data: {
  current_password: string;
  new_password: string;
}) => {
  const response = await api.put(`${BASE_URL}/change-password`, data);
  return response;
};

// ============================================
// MY COURSES
// ============================================

export const getMyCourses = async () => {
  const response = await api.get(`${BASE_URL}/my-courses`);
  return response;
};

// ============================================
// GRADE CALCULATION (NEW)
// ============================================

export const calculateGrade = async (score: number) => {
  const response = await api.post(`${BASE_URL}/calculate-grade`, { score });
  return response;
};

// ============================================
// CUMULATIVE SCORE CALCULATION (NEW)
// ============================================

export const getCumulativeScore = async (studentId: number, courseId: number) => {
  const response = await api.get(`${BASE_URL}/cumulative-score/${studentId}/${courseId}`);
  return response;
};

// ============================================
// INSTRUCTOR RECOMMENDATIONS (NEW)
// ============================================

export const createRecommendation = async (data: {
  student_id: number;
  evaluation_id?: number;
  recommendation_type: string;
  title: string;
  description: string;
  priority_level?: string;
  status?: string;
}) => {
  const response = await api.post(`${BASE_URL}/recommendations`, data);
  return response;
};

export const getRecommendations = async (filters?: {
  student_id?: number;
  recommendation_type?: string;
  status?: string;
  priority_level?: string;
}) => {
  const response = await api.get(`${BASE_URL}/recommendations`, { params: filters });
  return response;
};

export const getRecommendationById = async (id: string) => {
  const response = await api.get(`${BASE_URL}/recommendations/${id}`);
  return response;
};

export const updateRecommendation = async (id: string, data: {
  title?: string;
  description?: string;
  recommendation_type?: string;
  priority_level?: string;
  status?: string;
}) => {
  const response = await api.put(`${BASE_URL}/recommendations/${id}`, data);
  return response;
};

export const deleteRecommendation = async (id: string) => {
  const response = await api.delete(`${BASE_URL}/recommendations/${id}`);
  return response;
};

export const getRecommendationStatistics = async () => {
  const response = await api.get(`${BASE_URL}/recommendations/stats/overview`);
  return response;
};

export const getAssignedStudentsForRecommendations = async () => {
  const response = await api.get(`${BASE_URL}/recommendations/students/assigned`);
  return response;
};

export default {
  getAssignedStudents,
  getStudentById,
  getStudentProgress,
  createEvaluation,
  updateEvaluation,
  getEvaluations,
  createFeedback,
  getFeedback,
  addProjectComment,
  getProjectComments,
  createAnnouncement,
  getAnnouncements,
  uploadCourseMaterial,
  getCourseMaterials,
  getReports,
  getAnalytics,
  getProfile,
  updateProfile,
  changePassword,
  getMyCourses,
  calculateGrade,
  getCumulativeScore,
  createRecommendation,
  getRecommendations,
  getRecommendationById,
  updateRecommendation,
  deleteRecommendation,
  getRecommendationStatistics,
  getAssignedStudentsForRecommendations,
};
