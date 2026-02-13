import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { BookOpen, Users, Calendar, GraduationCap, Plus, Trash2, AlertCircle, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Course {
  id: number;
  title: string;
  code: string;
  description: string;
  credits: number;
  semester: string;
  academic_year: number;
  department_name: string;
  instructor_name: string;
  instructor_email?: string;
  max_students?: number;
  enrolled_count?: number;
  is_enrolled?: boolean;
  enrollment_date?: string;
  completion_percentage?: number;
  is_completed?: boolean;
  tutorial_count?: number;
}

export default function StudentCourses() {
  const [enrolledCourses, setEnrolledCourses] = useState<Course[]>([]);
  const [availableCourses, setAvailableCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState<number | null>(null);
  const [unenrolling, setUnenrolling] = useState<number | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('authToken');
      
      const [enrolledResponse, availableResponse] = await Promise.all([
        fetch('/api/student/courses/enrolled', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }),
        fetch('/api/student/courses/available', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })
      ]);

      if (!enrolledResponse.ok || !availableResponse.ok) {
        throw new Error('Failed to fetch courses');
      }

      const enrolledData = await enrolledResponse.json();
      const availableData = await availableResponse.json();

      setEnrolledCourses(enrolledData.courses || []);
      setAvailableCourses(availableData.courses?.filter((course: Course) => !course.is_enrolled) || []);
    } catch (error) {
      console.error('Error fetching courses:', error);
      toast({
        title: "Error",
        description: "Failed to load courses",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const enrollInCourse = async (courseId: number) => {
    try {
      setEnrolling(courseId);
      const token = localStorage.getItem('authToken');
      
      const response = await fetch('/api/student/courses/enroll', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ course_id: courseId })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to enroll in course');
      }

      toast({
        title: "Success",
        description: data.message,
      });

      // Refresh courses
      fetchCourses();
    } catch (error) {
      console.error('Error enrolling in course:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to enroll in course",
        variant: "destructive",
      });
    } finally {
      setEnrolling(null);
    }
  };

  const unenrollFromCourse = async (courseId: number) => {
    try {
      setUnenrolling(courseId);
      const token = localStorage.getItem('authToken');
      
      const response = await fetch(`/api/student/courses/${courseId}/unenroll`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to unenroll from course');
      }

      toast({
        title: "Success",
        description: data.message,
      });

      // Refresh courses
      fetchCourses();
    } catch (error) {
      console.error('Error unenrolling from course:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to unenroll from course",
        variant: "destructive",
      });
    } finally {
      setUnenrolling(null);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading courses...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Courses</h1>
          <p className="text-gray-600">Manage your course enrollments and view course details</p>
        </div>

        <Tabs defaultValue="enrolled" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="enrolled" className="flex items-center space-x-2">
              <BookOpen className="h-4 w-4" />
              <span>Enrolled Courses ({enrolledCourses.length})</span>
            </TabsTrigger>
            <TabsTrigger value="available" className="flex items-center space-x-2">
              <Plus className="h-4 w-4" />
              <span>Available Courses ({availableCourses.length})</span>
            </TabsTrigger>
          </TabsList>

          {/* Enrolled Courses Tab */}
          <TabsContent value="enrolled" className="space-y-4">
            {enrolledCourses.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">You are not enrolled in any courses yet</p>
                  <p className="text-sm text-gray-500">Browse available courses to get started</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {enrolledCourses.map((course) => (
                  <Card key={course.id} className="hover:shadow-md transition-shadow">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg">{course.title}</CardTitle>
                          <CardDescription>{course.code}</CardDescription>
                        </div>
                        <Badge variant="secondary">{course.credits} Credits</Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-600 mb-3">{course.description}</p>
                      
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center space-x-2">
                          <Users className="h-4 w-4 text-gray-400" />
                          <span>Instructor: {course.instructor_name}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          <span>{course.semester} {course.academic_year}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <GraduationCap className="h-4 w-4 text-gray-400" />
                          <span>{course.department_name}</span>
                        </div>
                        {course.tutorial_count !== undefined && (
                          <div className="flex items-center space-x-2">
                            <BookOpen className="h-4 w-4 text-gray-400" />
                            <span>{course.tutorial_count} Tutorials Available</span>
                          </div>
                        )}
                      </div>

                      {course.completion_percentage !== undefined && (
                        <div className="mt-3">
                          <div className="flex justify-between text-sm mb-1">
                            <span>Progress</span>
                            <span>{course.completion_percentage}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full" 
                              style={{ width: `${course.completion_percentage}%` }}
                            ></div>
                          </div>
                        </div>
                      )}

                      <div className="flex justify-between items-center mt-4">
                        <div className="text-xs text-gray-500">
                          Enrolled: {new Date(course.enrollment_date || '').toLocaleDateString()}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => unenrollFromCourse(course.id)}
                          disabled={unenrolling === course.id}
                          className="text-red-600 hover:text-red-700"
                        >
                          {unenrolling === course.id ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                          ) : (
                            <>
                              <Trash2 className="h-4 w-4 mr-1" />
                              Unenroll
                            </>
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Available Courses Tab */}
          <TabsContent value="available" className="space-y-4">
            {availableCourses.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <CheckCircle className="h-12 w-12 text-green-400 mx-auto mb-4" />
                  <p className="text-gray-600">No more courses available for enrollment</p>
                  <p className="text-sm text-gray-500">You may already be enrolled in all available courses</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {availableCourses.map((course) => (
                  <Card key={course.id} className="hover:shadow-md transition-shadow">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg">{course.title}</CardTitle>
                          <CardDescription>{course.code}</CardDescription>
                        </div>
                        <Badge variant="outline">{course.credits} Credits</Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-600 mb-3">{course.description}</p>
                      
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center space-x-2">
                          <Users className="h-4 w-4 text-gray-400" />
                          <span>Instructor: {course.instructor_name}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          <span>{course.semester} {course.academic_year}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <GraduationCap className="h-4 w-4 text-gray-400" />
                          <span>{course.department_name}</span>
                        </div>
                        {course.max_students && (
                          <div className="flex items-center space-x-2">
                            <Users className="h-4 w-4 text-gray-400" />
                            <span>
                              {course.enrolled_count || 0} / {course.max_students} students enrolled
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="flex justify-end mt-4">
                        <Button
                          onClick={() => enrollInCourse(course.id)}
                          disabled={enrolling === course.id || (course.max_students && (course.enrolled_count || 0) >= course.max_students)}
                          size="sm"
                        >
                          {enrolling === course.id ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          ) : (
                            <>
                              <Plus className="h-4 w-4 mr-1" />
                              Enroll
                            </>
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}