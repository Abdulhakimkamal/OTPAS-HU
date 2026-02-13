import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { 
  BookOpen, 
  FileText, 
  Video, 
  Users, 
  TrendingUp,
  Eye,
  Calendar,
  User,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface CourseStats {
  course_id: number;
  course_title: string;
  course_code: string;
  tutorial_count: number;
  file_count: number;
  video_count: number;
  instructor_name: string;
}

interface DashboardStats {
  total_courses: number;
  total_tutorials: number;
  total_files: number;
  total_videos: number;
  total_instructors: number;
}

interface RecentActivity {
  type: 'file' | 'video';
  title: string;
  tutorial_title: string;
  course_title: string;
  uploaded_by: string;
  created_at: string;
}

interface CourseMaterialsDashboardProps {
  departmentId?: number;
}

export function CourseMaterialsDashboard({ departmentId }: CourseMaterialsDashboardProps) {
  const [courses, setCourses] = useState<CourseStats[]>([]);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchDashboardData();
  }, [departmentId]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch course materials overview
      const overviewResponse = await fetch('/api/tutorial-files/department/course-materials-overview', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (overviewResponse.ok) {
        const overviewData = await overviewResponse.json();
        setCourses(overviewData.courses || []);
      }

      // Fetch dashboard statistics
      const dashboardResponse = await fetch('/api/department-head/course-materials/dashboard', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (dashboardResponse.ok) {
        const dashboardData = await dashboardResponse.json();
        setDashboardStats(dashboardData.dashboard.statistics);
        setRecentActivity(dashboardData.dashboard.recent_activity || []);
      }

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast({
        title: "Error",
        description: "Failed to load dashboard data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getActivityIcon = (type: string) => {
    return type === 'video' ? <Video className="h-4 w-4 text-red-500" /> : <FileText className="h-4 w-4 text-blue-500" />;
  };

  const getCourseStatusBadge = (course: CourseStats) => {
    const totalMaterials = course.tutorial_count + course.file_count + course.video_count;
    
    if (totalMaterials === 0) {
      return <Badge variant="destructive">No Materials</Badge>;
    } else if (totalMaterials < 5) {
      return <Badge variant="secondary">Limited Materials</Badge>;
    } else {
      return <Badge variant="default">Well Equipped</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Course Materials Overview</h2>
          <p className="text-muted-foreground">Monitor tutorial materials across your department</p>
        </div>
        <Badge variant="outline" className="flex items-center gap-2">
          <Eye className="h-4 w-4" />
          Read-Only Access
        </Badge>
      </div>

      {/* Statistics Cards */}
      {dashboardStats && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Courses</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboardStats.total_courses}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tutorials</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboardStats.total_tutorials}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Files</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboardStats.total_files}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Videos</CardTitle>
              <Video className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboardStats.total_videos}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Instructors</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboardStats.total_instructors}</div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Courses Overview */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Courses & Materials</CardTitle>
              <CardDescription>
                Overview of tutorial materials by course
              </CardDescription>
            </CardHeader>
            <CardContent>
              {courses.length === 0 ? (
                <div className="text-center py-8">
                  <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No courses found</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {courses.map((course) => (
                    <div key={course.course_id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-semibold">{course.course_title}</h4>
                          <p className="text-sm text-muted-foreground">{course.course_code}</p>
                          {course.instructor_name && (
                            <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                              <User className="h-3 w-3" />
                              {course.instructor_name}
                            </p>
                          )}
                        </div>
                        {getCourseStatusBadge(course)}
                      </div>
                      
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div className="text-center">
                          <div className="font-medium">{course.tutorial_count}</div>
                          <div className="text-muted-foreground">Tutorials</div>
                        </div>
                        <div className="text-center">
                          <div className="font-medium">{course.file_count}</div>
                          <div className="text-muted-foreground">Files</div>
                        </div>
                        <div className="text-center">
                          <div className="font-medium">{course.video_count}</div>
                          <div className="text-muted-foreground">Videos</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Recent Activity
              </CardTitle>
              <CardDescription>
                Latest material uploads
              </CardDescription>
            </CardHeader>
            <CardContent>
              {recentActivity.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">No recent activity</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentActivity.slice(0, 10).map((activity, index) => (
                    <div key={index} className="flex items-start gap-3">
                      {getActivityIcon(activity.type)}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{activity.title}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {activity.tutorial_title} • {activity.course_title}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                          <span>{activity.uploaded_by}</span>
                          <span>•</span>
                          <span>{new Date(activity.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Information Panel */}
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-800">
            <AlertCircle className="h-5 w-5" />
            Department Head Permissions
          </CardTitle>
        </CardHeader>
        <CardContent className="text-blue-700">
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              <span>View all course materials in your department</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              <span>Monitor tutorial content availability</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              <span>Manage course structure and instructor assignments</span>
            </div>
            <Separator className="my-2 bg-blue-200" />
            <div className="flex items-center gap-2 text-blue-600">
              <AlertCircle className="h-4 w-4" />
              <span>Note: Only instructors can upload tutorial materials</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}