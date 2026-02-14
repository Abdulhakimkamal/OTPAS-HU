import api from './api';

// ============================================
// STUDENT MANAGEMENT
// ============================================

export const getStudents = async (params?: { page?: number; limit?: number; search?: string }) => {
  // Build query string manually since api.get doesn't support params option
  const queryParams = new URLSearchParams();
  if (params?.page) queryParams.append('page', params.page.toString());
  if (params?.limit) queryParams.append('limit', params.limit.toString());
  if (params?.search) queryParams.append('search', params.search);
  const queryString = queryParams.toString();
  const endpoint = queryString ? `/api/department-head/students?${queryString}` : '/api/department-head/students';
  
  return await api.get(endpoint);
};

export const getStudentById = async (id: number) => {
  return await api.get(`/api/department-head/students/${id}`);
};

export const createStudent = async (data: {
  email: string;
  full_name: string;
  username: string;
  password: string;
  phone?: string;
}) => {
  return await api.post('/api/department-head/students', data);
};

export const updateStudent = async (id: number, data: {
  full_name?: string;
  email?: string;
  phone?: string;
  is_active?: boolean;
}) => {
  return await api.put(`/api/department-head/students/${id}`, data);
};

export const updateStudentStatus = async (id: number, is_active: boolean) => {
  return await api.patch(`/api/department-head/students/${id}/status`, { is_active });
};

export const resetStudentPassword = async (id: number, new_password: string) => {
  return await api.patch(`/api/department-head/students/${id}/reset-password`, { new_password });
};

export const getStudentProgress = async () => {
  return await api.get('/api/department-head/students/progress');
};

export const getStudentProgressById = async (studentId: number) => {
  return await api.get(`/api/department-head/progress/${studentId}`);
};

// ============================================
// COURSE MANAGEMENT
// ============================================

export const getCourses = async () => {
  return await api.get('/api/department-head/courses');
};

export const createCourse = async (data: {
  title: string;
  code: string;
  description?: string;
  instructor_id: number;
  credits: number;
  semester: string;
  academic_year: number;
  max_students?: number;
}) => {
  return await api.post('/api/department-head/courses', data);
};

export const updateCourse = async (id: number, data: {
  title?: string;
  description?: string;
  instructor_id?: number;
  credits?: number;
  semester?: string;
  academic_year?: number;
  max_students?: number;
  is_active?: boolean;
}) => {
  return await api.put(`/api/department-head/courses/${id}`, data);
};

export const assignInstructor = async (data: {
  course_id: number;
  instructor_id: number;
}) => {
  return await api.post('/api/department-head/courses/assign-instructor', data);
};

// ============================================
// INSTRUCTOR MANAGEMENT
// ============================================

export const getInstructors = async () => {
  return await api.get('/api/department-head/instructors');
};

// ============================================
// EVALUATION
// ============================================

export const getEvaluations = async () => {
  return await api.get('/api/department-head/evaluations');
};

export const createEvaluation = async (data: {
  project_id: number;
  student_id: number;
  instructor_id: number;
  score: number;
  max_score?: number;
  feedback?: string;
}) => {
  return await api.post('/api/department-head/evaluations', data);
};

// ============================================
// REPORTING
// ============================================

export const getReports = async () => {
  try {
    console.log('getReports: Making API call to /api/department-head/dashboard (v2)');
    console.log('getReports: Auth token:', localStorage.getItem('authToken')?.substring(0, 20) + '...');
    
    const response = await api.get('/api/department-head/dashboard');
    console.log('getReports: Raw response received:', response);
    console.log('getReports: Response type:', typeof response);
    console.log('getReports: Response keys:', response ? Object.keys(response) : 'null/undefined');
    
    return response; // api.get already returns the parsed JSON
  } catch (error) {
    console.error('getReports: API error caught:', error);
    console.error('getReports: Error details:', {
      message: error.message,
      status: error.status,
      data: error.data
    });
    throw error;
  }
};

export const getStudentReports = async () => {
  return await api.get('/api/department-head/statistics/evaluations');
};

export const getCourseReports = async () => {
  return await api.get('/api/department-head/statistics/evaluations/by-type');
};

export const getDepartmentReport = async () => {
  return await api.get('/api/department-head/dashboard');
};

// ============================================
// RECOMMENDATION ENGINE
// ============================================

export const getAdvisorRecommendation = async (studentId: number) => {
  return await api.get(`/api/department-head/recommend/advisor/${studentId}`);
};

export const getCourseRecommendation = async (studentId: number) => {
  return await api.get(`/api/department-head/recommend/course/${studentId}`);
};

export const getRiskStudents = async () => {
  return await api.get('/api/department-head/recommend/risk-students');
};

// ============================================
// FEEDBACK
// ============================================

export const getFeedback = async () => {
  return await api.get('/api/department-head/feedback');
};

export const createFeedback = async (data: {
  student_id: number;
  course_id?: number;
  tutorial_id?: number;
  content: string;
  rating: number;
  is_anonymous?: boolean;
}) => {
  return await api.post('/api/department-head/feedback', data);
};

// ============================================
// PROFILE MANAGEMENT
// ============================================

export const getProfile = async () => {
  return await api.get('/auth/profile');
};

export const updateProfile = async (data: {
  full_name?: string;
  phone?: string;
  bio?: string;
  profile_picture?: string;
}) => {
  return await api.put('/auth/profile', data);
};

// ============================================
// CHANGE PASSWORD
// ============================================

export const changePassword = async (data: {
  currentPassword: string;
  newPassword: string;
}) => {
  return await api.put('/auth/change-password', data);
};


// ============================================
// EVALUATION ANALYTICS (OVERSIGHT LEVEL)
// ============================================

export const getProgramEvaluationAnalytics = () => {
  return api.get('/api/department-head/evaluation-analytics/program');
};

export const getCourseEvaluationAnalytics = () => {
  return api.get('/api/department-head/evaluation-analytics/courses');
};

export const getInstructorEvaluationAnalytics = () => {
  return api.get('/api/department-head/evaluation-analytics/instructors');
};

export const getTrendAnalytics = () => {
  return api.get('/api/department-head/evaluation-analytics/trends');
};

export const getQualityMetrics = () => {
  return api.get('/api/department-head/evaluation-analytics/quality');
};

// ============================================
// EVALUATION ANALYTICS (Department Head Oversight)
// ============================================
export const getEvaluationAnalytics = () => api.get('/api/department-head/evaluation-analytics');

export const getCoursePerformanceComparison = (params?: { semester?: string; academic_year?: number }) => 
  api.get('/api/department-head/course-performance-comparison', { params });

export const getInstructorPerformanceComparison = () => 
  api.get('/api/department-head/instructor-performance-comparison');
