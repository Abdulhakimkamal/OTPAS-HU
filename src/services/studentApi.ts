import { api } from './api';

export interface DashboardStats {
  enrolledCourses: number;
  activeProjects: number;
  tutorialsCompleted: number;
  overallProgress: number;
}

export interface Announcement {
  id: string;
  title: string;
  message: string;
  created_at: string;
  priority: 'low' | 'medium' | 'high';
  source: 'admin' | 'department_head' | 'instructor';
  source_name: string;
  course_name?: string;
  course_code?: string;
}

export interface CourseMaterial {
  id: string;
  title: string;
  description?: string;
  file_url: string;
  file_type: string;
  file_size?: number;
  course_name: string;
  course_code: string;
  instructor_name: string;
  uploaded_at: string;
}

export interface ProjectSubmission {
  id: string;
  title: string;
  description?: string;
  course_name: string;
  course_code: string;
  status: 'pending' | 'submitted' | 'approved' | 'revision' | 'overdue';
  submitted_at?: string;
  created_at: string;
  grade?: string;
  feedback?: string;
}

export interface Tutorial {
  id: number;
  title: string;
  description?: string;
  content?: string;
  course_id: number;
  instructor_id: number;
  file_url?: string;
  video_url?: string;
  duration_minutes?: number;
  difficulty_level?: string;
  views_count: number;
  created_at: string;
  course_title: string;
  course_code: string;
  instructor_name: string;
  is_completed?: boolean;
  progress_percentage?: number;
  completed_at?: string;
  time_spent_minutes?: number;
}

export interface StudentProgress {
  student_id: number;
  total_projects: number;
  completed_projects: number;
  average_score: number;
  tutorials_completed: number;
}

export interface Recommendation {
  id: string;
  type: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  created_at: string;
}

class StudentApiService {
  // Dashboard
  async getDashboardStats(): Promise<DashboardStats> {
    const response = await api.get<{ success: boolean; stats: DashboardStats }>('/student/dashboard');
    return response.stats;
  }

  // Announcements
  async getAnnouncements(): Promise<Announcement[]> {
    const response = await api.get<{ success: boolean; announcements: Announcement[] }>('/student/announcements');
    return response.announcements;
  }

  // Learning Materials (now through tutorials)
  async getLearningMaterials(): Promise<CourseMaterial[]> {
    // Materials are now accessed through tutorial files
    const response = await api.get<{ success: boolean; tutorials: Tutorial[] }>('/student/tutorials');
    
    // Transform tutorials with files into materials format for backward compatibility
    const materials: CourseMaterial[] = [];
    
    if (response.tutorials) {
      response.tutorials.forEach(tutorial => {
        // Each tutorial can have multiple files, treat each as a material
        materials.push({
          id: tutorial.id.toString(),
          title: tutorial.title,
          description: tutorial.description,
          file_url: tutorial.file_url || '',
          file_type: 'tutorial',
          course_name: tutorial.course_title || '',
          course_code: tutorial.course_code || '',
          instructor_name: tutorial.instructor_name || '',
          uploaded_at: tutorial.created_at || new Date().toISOString()
        });
      });
    }
    
    return materials;
  }

  // Project Submissions
  async getProjectSubmissions(): Promise<ProjectSubmission[]> {
    const response = await api.get<{ success: boolean; projects: ProjectSubmission[] }>('/student/project-submissions');
    return response.projects;
  }

  async submitProject(projectData: {
    title: string;
    description: string;
    course_id: number;
    file_url: string;
  }): Promise<ProjectSubmission> {
    const response = await api.post<{ success: boolean; project: ProjectSubmission }>('/student/projects/submit', projectData);
    return response.project;
  }

  // Tutorials
  async getTutorials(courseId?: number): Promise<Tutorial[]> {
    const endpoint = courseId ? `/student/tutorials?course_id=${courseId}` : '/student/tutorials';
    const response = await api.get<{ success: boolean; data: Tutorial[] }>(endpoint);
    return response.data || [];
  }

  async getTutorialById(id: number): Promise<Tutorial> {
    const response = await api.get<{ success: boolean; data: Tutorial }>(`/student/tutorials/${id}`);
    return response.data;
  }

  async updateTutorialProgress(id: number, progress: {
    progress_percentage: number;
    time_spent_minutes: number;
    is_completed: boolean;
  }): Promise<void> {
    await api.post(`/student/tutorials/${id}/progress`, progress);
  }

  async markTutorialComplete(id: number): Promise<void> {
    await api.post(`/student/tutorials/${id}/complete`, {});
  }

  // Progress
  async getProgress(): Promise<StudentProgress> {
    const response = await api.get<{ success: boolean; progress: StudentProgress }>('/student/progress');
    return response.progress;
  }

  // Recommendations
  async getRecommendations(): Promise<Recommendation[]> {
    const response = await api.get<{ success: boolean; recommendations: Recommendation[] }>('/student/recommendations');
    return response.recommendations;
  }

  // Feedback
  async submitFeedback(feedbackData: {
    content: string;
    rating: number;
    tutorial_id: number;
  }): Promise<void> {
    await api.post('/student/feedback', feedbackData);
  }

  // Projects
  async getProjects(): Promise<ProjectSubmission[]> {
    const response = await api.get<{ success: boolean; projects: ProjectSubmission[] }>('/student/projects');
    return response.projects;
  }

  // Evaluations
  async getEvaluations(): Promise<any[]> {
    const response = await api.get<{ success: boolean; evaluations: any[] }>('/student/evaluations');
    return response.evaluations;
  }
}

export const studentApi = new StudentApiService();