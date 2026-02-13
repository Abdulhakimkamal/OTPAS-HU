import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, BookOpen, GraduationCap, TrendingUp, AlertTriangle, FileText } from 'lucide-react';
import { getReports } from '@/services/departmentHeadApi';
import { toast } from 'sonner';
import { LoadingSkeleton } from '@/components/common/LoadingSkeleton';

interface DashboardStats {
  departmentStats: {
    total_students: number;
    total_instructors: number;
    active_users: number;
  };
  courseStats: {
    total_courses: number;
    active_courses: number;
    total_enrollments: number;
  };
  projectStats: {
    total_projects: number;
    submitted_projects: number;
    approved_projects: number;
    rejected_projects: number;
  };
  performanceStats: {
    avg_department_score: number;
    avg_completed_projects: number;
    avg_courses_completed: number;
  };
}

export default function DepartmentHeadDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Fetching dashboard data...');
      const response: any = await getReports();
      console.log('Dashboard response:', response);
      
      if (response && response.success) {
        setStats(response.reports);
      } else {
        const errorMsg = response?.message || 'Failed to load data - no success flag';
        setError(errorMsg);
        console.error('Dashboard API error:', errorMsg);
      }
    } catch (error: any) {
      console.error('Dashboard error:', error);
      const errorMsg = error.response?.data?.message || error.message || 'Failed to load dashboard data';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Header */}
      <div className="bg-white border-b border-slate-200 p-6 lg:p-8">
        <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-600 mt-2">Welcome to the Department Head Panel. Monitor your department's performance and activities.</p>
      </div>

      {/* Content */}
      <div className="p-6 lg:p-8">
      <div className="space-y-6">
        {loading && <LoadingSkeleton type="card" rows={6} />}
        
        {error && !loading && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800 font-semibold">Error loading dashboard</p>
          <p className="text-red-600 text-sm mt-1">{error}</p>
          <Button onClick={fetchDashboardData} className="mt-4" variant="outline">
            Retry
          </Button>
        </div>
        )}

        {!loading && !error && !stats && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800 font-semibold">No data available</p>
          <p className="text-yellow-600 text-sm mt-1">Dashboard statistics are not available yet.</p>
          <Button onClick={fetchDashboardData} className="mt-4" variant="outline">
            Retry
          </Button>
        </div>
        )}

        {!loading && stats && (
        <>
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {[
            {
              title: 'Total Students',
              value: stats.departmentStats.total_students || 0,
              description: `${stats.departmentStats.active_users || 0} active users`,
              icon: Users,
              color: 'bg-blue-500',
            },
            {
              title: 'Total Instructors',
              value: stats.departmentStats.total_instructors || 0,
              description: 'Faculty members',
              icon: GraduationCap,
              color: 'bg-green-500',
            },
            {
              title: 'Active Courses',
              value: stats.courseStats.active_courses || 0,
              description: `${stats.courseStats.total_courses || 0} total courses`,
              icon: BookOpen,
              color: 'bg-purple-500',
            },
            {
              title: 'Total Projects',
              value: stats.projectStats.total_projects || 0,
              description: `${stats.projectStats.approved_projects || 0} approved`,
              icon: FileText,
              color: 'bg-orange-500',
            },
            {
              title: 'Avg Department Score',
              value: stats.performanceStats.avg_department_score 
                ? `${parseFloat(stats.performanceStats.avg_department_score.toString()).toFixed(1)}%`
                : 'N/A',
              description: 'Student performance',
              icon: TrendingUp,
              color: 'bg-teal-500',
            },
            {
              title: 'Pending Reviews',
              value: stats.projectStats.submitted_projects || 0,
              description: 'Projects awaiting review',
              icon: AlertTriangle,
              color: 'bg-red-500',
            },
          ].map((stat, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <div className={`${stat.color} p-2 rounded-lg text-white`}>
                  <stat.icon className="h-6 w-6" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground mt-2">{stat.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Additional Info Cards */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Course Enrollment</CardTitle>
              <CardDescription>Total student enrollments across all courses</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.courseStats.total_enrollments || 0}</div>
              <p className="text-sm text-muted-foreground mt-2">
                Avg {stats.courseStats.total_courses > 0 
                  ? Math.round((stats.courseStats.total_enrollments || 0) / stats.courseStats.total_courses)
                  : 0} students per course
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Project Status</CardTitle>
              <CardDescription>Overview of project submissions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm">Approved:</span>
                  <span className="font-semibold text-green-600">
                    {stats.projectStats.approved_projects || 0}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Submitted:</span>
                  <span className="font-semibold text-yellow-600">
                    {stats.projectStats.submitted_projects || 0}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Rejected:</span>
                  <span className="font-semibold text-red-600">
                    {stats.projectStats.rejected_projects || 0}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Performance Metrics */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Department Performance Metrics</CardTitle>
            <CardDescription>Average student achievements</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <p className="text-sm text-muted-foreground">Avg Completed Projects</p>
                <p className="text-2xl font-bold">
                  {stats.performanceStats.avg_completed_projects 
                    ? parseFloat(stats.performanceStats.avg_completed_projects.toString()).toFixed(1)
                    : '0'}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Avg Courses Completed</p>
                <p className="text-2xl font-bold">
                  {stats.performanceStats.avg_courses_completed 
                    ? parseFloat(stats.performanceStats.avg_courses_completed.toString()).toFixed(1)
                    : '0'}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Department Score</p>
                <p className="text-2xl font-bold">
                  {stats.performanceStats.avg_department_score 
                    ? `${parseFloat(stats.performanceStats.avg_department_score.toString()).toFixed(1)}%`
                    : 'N/A'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        </>
        )}
      </div>
      </div>
    </>
  );
}
