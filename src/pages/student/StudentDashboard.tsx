import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { WelcomeHeader } from '@/components/dashboard/WelcomeHeader';
import { StatCard } from '@/components/dashboard/StatCard';
import { RecentActivity } from '@/components/dashboard/RecentActivity';
import { QuickActions } from '@/components/dashboard/QuickActions';
import { AnnouncementCard } from '@/components/dashboard/AnnouncementCard';
import { BookOpen, FolderOpen, BarChart3, FileText, Lightbulb, Upload, Bell, Download, MessageSquare } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { studentApi, type DashboardStats } from '@/services/studentApi';
import { LoadingSkeleton } from '@/components/common/LoadingSkeleton';

const mockStats = [
  { title: 'Enrolled Courses', value: '3', icon: <BookOpen className="h-6 w-6" />, variant: 'primary' as const },
  { title: 'Active Projects', value: '0', icon: <FolderOpen className="h-6 w-6" />, variant: 'warning' as const },
  { title: 'Tutorials Completed', value: '0', icon: <FileText className="h-6 w-6" />, variant: 'success' as const, trend: { value: 15, isPositive: true } },
  { title: 'Overall Progress', value: '59%', icon: <BarChart3 className="h-6 w-6" />, variant: 'info' as const },
];

const mockActivities = [
  { id: '1', type: 'feedback' as const, title: 'New feedback received', description: 'Dr. Mulatu commented on your project', time: '2h ago' },
  { id: '2', type: 'tutorial' as const, title: 'Tutorial completed', description: 'Chapter 4: Advanced Algorithms', time: '1d ago' },
  { id: '3', type: 'project' as const, title: 'Project status updated', description: 'Research proposal approved', time: '2d ago' },
  { id: '4', type: 'announcement' as const, title: 'New announcement', description: 'Project submission deadline extended', time: '3d ago' },
];

const quickActions = [
  { label: 'Submit Project Title', description: 'Submit your project proposal', href: '/student/academic-projects', icon: <Upload className="h-5 w-5" />, variant: 'primary' as const },
  { label: 'View My Projects', description: 'Manage your academic projects', href: '/student/academic-projects', icon: <FolderOpen className="h-5 w-5" /> },
  { label: 'View Announcements', description: 'Check latest announcements', href: '/student/announcements', icon: <Bell className="h-5 w-5" /> },
  { label: 'Download Materials', description: 'Access course materials', href: '/student/tutorials', icon: <Download className="h-5 w-5" /> },
  { label: 'Message Instructor', description: 'Contact your instructors', href: '/student/messages', icon: <MessageSquare className="h-5 w-5" /> },
  { label: 'Track Progress', description: 'View your academic progress', href: '/student/progress', icon: <BarChart3 className="h-5 w-5" /> },
  { label: 'Recommendations', description: 'Get personalized suggestions', href: '/student/recommendations', icon: <Lightbulb className="h-5 w-5" /> },
];

const mockAnnouncements = [
  { id: '1', title: 'Project Deadline Extended', content: 'Final project submission deadline extended to April 1st.', author: 'Department Head', date: 'Today', isGlobal: false },
  { id: '2', title: 'Library Hours', content: 'Extended library hours during exam period.', author: 'Admin', date: '2 days ago', isGlobal: true },
];

const courseProgress = [
  { name: 'CS401 - Software Engineering', progress: 85 },
  { name: 'CS402 - Database Systems', progress: 72 },
  { name: 'CS403 - Computer Networks', progress: 60 },
  { name: 'CS404 - Machine Learning', progress: 45 },
];

export default function StudentDashboard() {
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null); // Clear any previous errors
      
      // Check if user is authenticated
      const token = localStorage.getItem('authToken');
      if (!token) {
        console.warn('No auth token found, using mock data');
        setDashboardStats({
          enrolledCourses: 3,
          activeProjects: 0,
          tutorialsCompleted: 0,
          overallProgress: 59
        });
        return;
      }
      
      const stats = await studentApi.getDashboardStats();
      setDashboardStats(stats);
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
      // Use mock data as fallback and don't show error to user
      setDashboardStats({
        enrolledCourses: 3,
        activeProjects: 0,
        tutorialsCompleted: 0,
        overallProgress: 59
      });
    } finally {
      setLoading(false);
    }
  };

  // Create stats array from API data or use mock data
  const statsData = dashboardStats ? [
    { 
      title: 'Enrolled Courses', 
      value: dashboardStats.enrolledCourses.toString(), 
      icon: <BookOpen className="h-6 w-6" />, 
      variant: 'primary' as const 
    },
    { 
      title: 'Active Projects', 
      value: dashboardStats.activeProjects.toString(), 
      icon: <FolderOpen className="h-6 w-6" />, 
      variant: 'warning' as const 
    },
    { 
      title: 'Tutorials Completed', 
      value: dashboardStats.tutorialsCompleted.toString(), 
      icon: <FileText className="h-6 w-6" />, 
      variant: 'success' as const, 
      trend: { value: 15, isPositive: true } 
    },
    { 
      title: 'Overall Progress', 
      value: `${dashboardStats.overallProgress}%`, 
      icon: <BarChart3 className="h-6 w-6" />, 
      variant: 'info' as const 
    },
  ] : mockStats;
  if (loading) {
    return (
      <DashboardLayout>
        <div className="page-transition">
          <WelcomeHeader />
          <LoadingSkeleton />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="page-transition">
        <WelcomeHeader />
        
        {error && (
          <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}
        
        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statsData.map((stat) => (
            <StatCard key={stat.title} {...stat} />
          ))}
        </div>



        {/* Main content grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Course Progress */}
            <div className="bg-card rounded-xl border border-border p-6">
              <h3 className="text-lg font-semibold mb-4">Course Progress</h3>
              <div className="space-y-4">
                {courseProgress.map((course) => (
                  <div key={course.name} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium truncate pr-4">{course.name}</span>
                      <span className="text-muted-foreground shrink-0">{course.progress}%</span>
                    </div>
                    <Progress value={course.progress} className="h-2" />
                  </div>
                ))}
              </div>
            </div>
            
            <RecentActivity activities={mockActivities} />
          </div>
          <div className="space-y-6">
            <QuickActions actions={quickActions} />
            <AnnouncementCard announcements={mockAnnouncements} />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
