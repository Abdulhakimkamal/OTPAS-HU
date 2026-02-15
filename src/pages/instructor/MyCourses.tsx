import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BookOpen, Users, Calendar, Plus, GraduationCap, Clock, MapPin, FileText } from 'lucide-react';
import instructorApi from '@/services/instructorApi';
import { useToast } from '@/hooks/use-toast';
import { CourseTutorialManager } from '@/components/courses/CourseTutorialManager';

interface Course {
  id: number;
  title: string;
  code: string;
  description: string;
  credits: number;
  semester: string;
  academic_year: number;
  enrolled_students: string; // API returns this as string
  max_students: number;
  department_name: string;
  is_active: boolean;
}

export default function MyCourses() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    try {
      const data = await instructorApi.getMyCourses() as any;
      
      // API returns { success, data: [...] }
      if (data && data.success) {
        const coursesList = data.data || data.courses || [];
        setCourses(Array.isArray(coursesList) ? coursesList : []);
      } else {
        setCourses([]);
      }
    } catch (error: any) {
      console.error('Error loading courses:', error);
      toast({
        title: 'Error',
        description: 'Failed to load courses',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewDetails = (course: Course) => {
    setSelectedCourse(course);
    setIsDetailsOpen(true);
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading courses...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">My Courses</h1>
            <p className="text-muted-foreground mt-2">
              Manage your assigned courses and track student progress
            </p>
          </div>
        </div>

        {courses.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Courses Assigned</h3>
              <p className="text-muted-foreground text-center max-w-md">
                You don't have any courses assigned yet. Contact your department head to get course assignments.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course) => (
              <Card key={course.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{course.title}</CardTitle>
                      <CardDescription className="font-mono text-sm">
                        {course.code}
                      </CardDescription>
                    </div>
                    <Badge variant={course.is_active ? 'default' : 'secondary'}>
                      {course.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {course.description || 'No description available'}
                  </p>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>{course.semester} {course.academic_year}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span>{course.enrolled_students}/{course.max_students}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <Badge variant="outline">
                      {course.credits} Credits
                    </Badge>
                    <div className="flex gap-2">
                      <Button 
                        variant="default"
                        size="sm"
                        onClick={() => handleViewDetails(course)}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-all duration-200 shadow-md hover:shadow-lg"
                      >
                        <FileText className="h-4 w-4 mr-1" />
                        Manage
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Course Details Dialog */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="sm:max-w-[900px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5" />
              {selectedCourse?.title}
            </DialogTitle>
            <DialogDescription>
              Course Code: {selectedCourse?.code} • {selectedCourse?.department_name}
            </DialogDescription>
          </DialogHeader>
          
          {selectedCourse && (
            <Tabs defaultValue="overview" className="space-y-4">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="tutorials">Tutorials</TabsTrigger>
                <TabsTrigger value="students">Students</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-6">
                {/* Course Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <h4 className="font-semibold flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Academic Period
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      {selectedCourse.semester} {selectedCourse.academic_year}
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="font-semibold flex items-center gap-2">
                      <BookOpen className="h-4 w-4" />
                      Credits
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      {selectedCourse.credits} Credit Hours
                    </p>
                  </div>
                </div>

                {/* Enrollment Info */}
                <div className="space-y-2">
                  <h4 className="font-semibold flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Enrollment Status
                  </h4>
                  <div className="flex items-center gap-4">
                    <div className="text-sm">
                      <span className="font-medium">{selectedCourse.enrolled_students}</span> enrolled
                    </div>
                    <div className="text-sm text-muted-foreground">
                      of <span className="font-medium">{selectedCourse.max_students}</span> maximum
                    </div>
                    <div className="flex-1">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ 
                            width: `${Math.min((parseInt(selectedCourse.enrolled_students) / selectedCourse.max_students) * 100, 100)}%` 
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <h4 className="font-semibold">Course Description</h4>
                  <p className="text-sm text-muted-foreground">
                    {selectedCourse.description || 'No description available for this course.'}
                  </p>
                </div>

                {/* Status */}
                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Status:</span>
                    <Badge variant={selectedCourse.is_active ? 'default' : 'secondary'}>
                      {selectedCourse.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="tutorials">
                <CourseTutorialManager
                  courseId={selectedCourse.id}
                  courseTitle={selectedCourse.title}
                  userRole="instructor"
                  canManage={true}
                />
              </TabsContent>

              <TabsContent value="students" className="space-y-4">
                <div className="text-center py-8">
                  <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground mb-4">Student management features</p>
                  <Button asChild>
                    <Link to="/instructor/students">
                      View All Students
                    </Link>
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}