import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, 
  Users, 
  BookOpen, 
  GraduationCap,
  AlertCircle,
  Award,
  Target
} from 'lucide-react';
import { 
  getEvaluationAnalytics, 
  getCoursePerformanceComparison, 
  getInstructorPerformanceComparison 
} from '@/services/departmentHeadApi';

export default function EvaluationAnalytics() {
  const [loading, setLoading] = useState(true);
  const [programMetrics, setProgramMetrics] = useState(null);
  const [courses, setCourses] = useState([]);
  const [instructors, setInstructors] = useState([]);
  const [trends, setTrends] = useState([]);
  const [selectedSemester, setSelectedSemester] = useState('all');
  const [selectedYear, setSelectedYear] = useState('2024');

  useEffect(() => {
    fetchAnalytics();
  }, [selectedSemester, selectedYear]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      
      const params = {
        semester: selectedSemester !== 'all' ? selectedSemester : undefined,
        year: selectedYear !== 'all' ? parseInt(selectedYear) : undefined
      };

      const [analyticsData, courseData, instructorData] = await Promise.all([
        getEvaluationAnalytics(params),
        getCoursePerformanceComparison(params),
        getInstructorPerformanceComparison(params)
      ]);

      setProgramMetrics(analyticsData.programMetrics);
      setTrends(analyticsData.trends || []);
      setCourses(courseData.courses || []);
      setInstructors(instructorData.instructors || []);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPerformanceColor = (value, type) => {
    if (type === 'grade') {
      if (value >= 3.5) return 'text-green-600';
      if (value >= 3.0) return 'text-blue-600';
      if (value >= 2.5) return 'text-yellow-600';
      return 'text-red-600';
    } else {
      if (value >= 80) return 'text-green-600';
      if (value >= 70) return 'text-blue-600';
      if (value >= 60) return 'text-yellow-600';
      return 'text-red-600';
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-slate-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 bg-slate-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Evaluation Analytics</h1>
        <p className="text-slate-600 mt-2">Strategic oversight and program quality metrics</p>
      </div>

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          This dashboard provides aggregated, read-only analytics for strategic decision-making. 
          Individual student data is not accessible.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-4">
          <div className="w-48">
            <label className="text-sm font-medium mb-2 block">Semester</label>
            <Select value={selectedSemester} onValueChange={setSelectedSemester}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Semesters</SelectItem>
                <SelectItem value="Semester 1">Semester 1</SelectItem>
                <SelectItem value="Semester 2">Semester 2</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="w-48">
            <label className="text-sm font-medium mb-2 block">Year</label>
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Years</SelectItem>
                <SelectItem value="2024">2024</SelectItem>
                <SelectItem value="2023">2023</SelectItem>
                <SelectItem value="2022">2022</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {programMetrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Students</CardTitle>
              <Users className="h-4 w-4 text-slate-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{programMetrics.totalStudents}</div>
              <p className="text-xs text-slate-600 mt-1">Active enrollments</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Courses</CardTitle>
              <BookOpen className="h-4 w-4 text-slate-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{programMetrics.totalCourses}</div>
              <p className="text-xs text-slate-600 mt-1">Offered this period</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Instructors</CardTitle>
              <GraduationCap className="h-4 w-4 text-slate-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{programMetrics.totalInstructors}</div>
              <p className="text-xs text-slate-600 mt-1">Teaching faculty</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Average GPA</CardTitle>
              <Award className="h-4 w-4 text-slate-600" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${getPerformanceColor(programMetrics.averageGPA, 'grade')}`}>
                {programMetrics.averageGPA.toFixed(2)}
              </div>
              <p className="text-xs text-slate-600 mt-1">Department average</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Pass Rate</CardTitle>
              <Target className="h-4 w-4 text-slate-600" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${getPerformanceColor(programMetrics.passRate, 'rate')}`}>
                {programMetrics.passRate.toFixed(1)}%
              </div>
              <p className="text-xs text-slate-600 mt-1">Students passing</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Retention Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-slate-600" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${getPerformanceColor(programMetrics.retentionRate, 'rate')}`}>
                {programMetrics.retentionRate.toFixed(1)}%
              </div>
              <p className="text-xs text-slate-600 mt-1">Student retention</p>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="courses" className="space-y-4">
        <TabsList>
          <TabsTrigger value="courses">Course Analytics</TabsTrigger>
          <TabsTrigger value="instructors">Instructor Analytics</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
        </TabsList>

        <TabsContent value="courses" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Course Performance</CardTitle>
              <CardDescription>Aggregated metrics by course</CardDescription>
            </CardHeader>
            <CardContent>
              {courses.length === 0 ? (
                <p className="text-slate-600 text-center py-8">No course data available</p>
              ) : (
                <div className="space-y-4">
                  {courses.map((course) => (
                    <div key={course.courseId} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-semibold">{course.courseName}</h3>
                          <p className="text-sm text-slate-600">{course.courseCode}</p>
                        </div>
                        <Badge variant="outline">{course.enrollmentCount} students</Badge>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                        <div>
                          <p className="text-xs text-slate-600">Avg Grade</p>
                          <p className={`text-lg font-semibold ${getPerformanceColor(course.averageGrade, 'grade')}`}>
                            {course.averageGrade.toFixed(2)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-600">Pass Rate</p>
                          <p className={`text-lg font-semibold ${getPerformanceColor(course.passRate, 'rate')}`}>
                            {course.passRate.toFixed(1)}%
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-600">Completion</p>
                          <p className={`text-lg font-semibold ${getPerformanceColor(course.completionRate, 'rate')}`}>
                            {course.completionRate.toFixed(1)}%
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-600">Satisfaction</p>
                          <p className="text-lg font-semibold">{course.satisfactionScore.toFixed(1)}/5</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="instructors" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Instructor Performance</CardTitle>
              <CardDescription>Aggregated teaching effectiveness metrics</CardDescription>
            </CardHeader>
            <CardContent>
              {instructors.length === 0 ? (
                <p className="text-slate-600 text-center py-8">No instructor data available</p>
              ) : (
                <div className="space-y-4">
                  {instructors.map((instructor) => (
                    <div key={instructor.instructorId} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-semibold">{instructor.instructorName}</h3>
                          <p className="text-sm text-slate-600">
                            {instructor.coursesCount} courses • {instructor.studentsCount} students
                          </p>
                        </div>
                        <Badge>{instructor.performanceRating}</Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-4 mt-4">
                        <div>
                          <p className="text-xs text-slate-600">Avg Grade</p>
                          <p className={`text-lg font-semibold ${getPerformanceColor(instructor.averageGrade, 'grade')}`}>
                            {instructor.averageGrade.toFixed(2)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-600">Satisfaction</p>
                          <p className="text-lg font-semibold">{instructor.satisfactionScore.toFixed(1)}/5</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Historical Trends</CardTitle>
              <CardDescription>Performance trends over time</CardDescription>
            </CardHeader>
            <CardContent>
              {trends.length === 0 ? (
                <p className="text-slate-600 text-center py-8">No trend data available</p>
              ) : (
                <div className="space-y-4">
                  {trends.map((trend, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <h3 className="font-semibold">{trend.semester} {trend.year}</h3>
                        </div>
                        <div className="flex gap-6">
                          <div>
                            <p className="text-xs text-slate-600">GPA</p>
                            <p className="text-lg font-semibold">{trend.averageGPA.toFixed(2)}</p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-600">Pass Rate</p>
                            <p className="text-lg font-semibold">{trend.passRate.toFixed(1)}%</p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-600">Enrollment</p>
                            <p className="text-lg font-semibold">{trend.enrollmentCount}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
