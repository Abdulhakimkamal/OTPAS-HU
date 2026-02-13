import { useEffect, useState } from 'react';
import { DepartmentHeadLayout } from '@/components/departmentHead/DepartmentHeadLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getStudentReports, getCourseReports, getDepartmentReport } from '@/services/departmentHeadApi';
import { toast } from 'sonner';
import { LoadingSkeleton } from '@/components/common/LoadingSkeleton';
import { Users, BookOpen, TrendingUp, Award } from 'lucide-react';

interface StudentReport {
  id: number;
  full_name: string;
  email: string;
  total_projects: number;
  completed_projects: number;
  average_score: number;
  courses_enrolled: number;
  courses_completed: number;
  tutorials_completed: number;
}

interface CourseReport {
  id: number;
  title: string;
  code: string;
  semester: string;
  academic_year: number;
  enrolled_count: number;
  max_students: number;
  instructor_name: string;
  tutorials_count: number;
  projects_count: number;
}

interface DepartmentReport {
  department: {
    id: number;
    name: string;
    code: string;
  };
  statistics: {
    total_students: number;
    total_instructors: number;
    total_courses: number;
    total_projects: number;
    avg_score: number;
  };
}

export default function Reports() {
  const [studentReports, setStudentReports] = useState<StudentReport[]>([]);
  const [courseReports, setCourseReports] = useState<CourseReport[]>([]);
  const [departmentReport, setDepartmentReport] = useState<DepartmentReport | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const [studentsRes, coursesRes, deptRes] = await Promise.all([
        getStudentReports(),
        getCourseReports(),
        getDepartmentReport()
      ]);
      if (studentsRes.success) setStudentReports(studentsRes.students);
      if (coursesRes.success) setCourseReports(coursesRes.courses);
      if (deptRes.success) setDepartmentReport(deptRes);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Header */}
      <div className="bg-white border-b border-slate-200 p-6 lg:p-8">
        <h1 className="text-3xl font-bold text-slate-900">Reports & Analytics</h1>
        <p className="text-slate-600 mt-2">Comprehensive department performance reports</p>
      </div>

      {/* Content */}
      <div className="p-6 lg:p-8">
      <div className="space-y-6">
        {loading && <LoadingSkeleton type="card" rows={6} />}
        {!loading && (
        <>
        {departmentReport && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Students</CardTitle>
              <Users className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{departmentReport.statistics.total_students || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Instructors</CardTitle>
              <Users className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{departmentReport.statistics.total_instructors || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Courses</CardTitle>
              <BookOpen className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{departmentReport.statistics.total_courses || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
              <TrendingUp className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{departmentReport.statistics.total_projects || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Score</CardTitle>
              <Award className="h-4 w-4 text-teal-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {departmentReport.statistics.avg_score 
                  ? `${parseFloat(departmentReport.statistics.avg_score.toString()).toFixed(1)}%`
                  : 'N/A'}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="students" className="space-y-4">
        <TabsList>
          <TabsTrigger value="students">Student Reports</TabsTrigger>
          <TabsTrigger value="courses">Course Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="students" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Student Performance Report</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Student Name</th>
                      <th className="text-left p-2">Email</th>
                      <th className="text-center p-2">Avg Score</th>
                      <th className="text-center p-2">Projects</th>
                      <th className="text-center p-2">Courses</th>
                      <th className="text-center p-2">Tutorials</th>
                    </tr>
                  </thead>
                  <tbody>
                    {studentReports.map((student) => (
                      <tr key={student.id} className="border-b hover:bg-muted/50">
                        <td className="p-2">{student.full_name}</td>
                        <td className="p-2 text-sm text-muted-foreground">{student.email}</td>
                        <td className="p-2 text-center font-medium">
                          {student.average_score ? `${parseFloat(student.average_score.toString()).toFixed(1)}%` : 'N/A'}
                        </td>
                        <td className="p-2 text-center">
                          {student.completed_projects || 0} / {student.total_projects || 0}
                        </td>
                        <td className="p-2 text-center">
                          {student.courses_completed || 0} / {student.courses_enrolled || 0}
                        </td>
                        <td className="p-2 text-center">{student.tutorials_completed || 0}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="courses" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Course Performance Report</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Course</th>
                      <th className="text-left p-2">Code</th>
                      <th className="text-left p-2">Instructor</th>
                      <th className="text-center p-2">Semester</th>
                      <th className="text-center p-2">Enrollment</th>
                      <th className="text-center p-2">Tutorials</th>
                      <th className="text-center p-2">Projects</th>
                    </tr>
                  </thead>
                  <tbody>
                    {courseReports.map((course) => (
                      <tr key={course.id} className="border-b hover:bg-muted/50">
                        <td className="p-2">{course.title}</td>
                        <td className="p-2 text-sm">{course.code}</td>
                        <td className="p-2 text-sm">{course.instructor_name || 'Not assigned'}</td>
                        <td className="p-2 text-center text-sm">
                          {course.semester} {course.academic_year}
                        </td>
                        <td className="p-2 text-center">
                          {course.enrolled_count || 0} / {course.max_students || '∞'}
                        </td>
                        <td className="p-2 text-center">{course.tutorials_count || 0}</td>
                        <td className="p-2 text-center">{course.projects_count || 0}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      </>
        )}
      </div>
      </div>
    </>
  );
}
