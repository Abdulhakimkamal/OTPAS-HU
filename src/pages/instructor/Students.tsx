import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Users, Search, Mail, Phone, GraduationCap, TrendingUp, Award, BookOpen } from 'lucide-react';
import instructorApi from '@/services/instructorApi';
import { useToast } from '@/hooks/use-toast';
import { calculateGrade } from '@/utils/gradeCalculator';

interface Student {
  id: number;
  full_name: string;
  email: string;
  username: string;
  phone?: string;
  department_name: string;
  is_active: boolean;
  created_at: string;
}

interface StudentProgress {
  student_id: number;
  student_name: string;
  course_code: string;
  course_title: string;
  cumulative_total: number;
  grade: string;
  breakdown: {
    mid_exam: number;
    final_exam: number;
    project: number;
    quiz: number;
  };
  evaluation_count: number;
}

export default function Students() {
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [studentProgress, setStudentProgress] = useState<StudentProgress[]>([]);
  const [isProgressDialogOpen, setIsProgressDialogOpen] = useState(false);
  const [isLoadingProgress, setIsLoadingProgress] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    loadStudents();
  }, []);

  const loadStudents = async () => {
    try {
      const data: any = await instructorApi.getAssignedStudents();
      // Handle both array and object responses
      if (Array.isArray(data)) {
        setStudents(data);
      } else if (data && Array.isArray(data.students)) {
        setStudents(data.students);
      } else {
        setStudents([]);
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to load students',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filteredStudents = students.filter(student =>
    student.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleViewProgress = async (student: Student) => {
    setSelectedStudent(student);
    setIsProgressDialogOpen(true);
    setIsLoadingProgress(true);
    
    try {
      // Fetch student's progress across all courses
      const response: any = await instructorApi.getEvaluations();
      const evaluations = response?.evaluations || [];
      
      // Filter evaluations for this student and group by course
      const studentEvals = evaluations.filter((e: any) => e.student_name === student.full_name);
      
      // Group by course
      const progressByCoursemap = new Map<string, StudentProgress>();
      
      studentEvals.forEach((evaluation: any) => {
        const key = `${evaluation.course_code}`;
        
        if (!progressByCoursemap.has(key)) {
          progressByCoursemap.set(key, {
            student_id: student.id,
            student_name: student.full_name,
            course_code: evaluation.course_code,
            course_title: evaluation.course_title,
            cumulative_total: evaluation.cumulative_total || 0,
            grade: evaluation.grade || 'N/A',
            breakdown: evaluation.breakdown || { mid_exam: 0, final_exam: 0, project: 0, quiz: 0 },
            evaluation_count: 0
          });
        }
        
        const progress = progressByCoursemap.get(key)!;
        progress.evaluation_count++;
        
        // Update with latest cumulative data
        if (evaluation.cumulative_total !== undefined) {
          progress.cumulative_total = evaluation.cumulative_total;
          progress.grade = calculateGrade(evaluation.cumulative_total);
        }
        if (evaluation.breakdown) {
          progress.breakdown = evaluation.breakdown;
        }
      });
      
      setStudentProgress(Array.from(progressByCoursemap.values()));
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to load student progress',
        variant: 'destructive',
      });
      setStudentProgress([]);
    } finally {
      setIsLoadingProgress(false);
    }
  };

  const handleSendMessage = (student: Student) => {
    // Navigate to messages page with student pre-selected
    navigate('/instructor/messages', { state: { recipientName: student.full_name, recipientId: student.id } });
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading students...</p>
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
            <h1 className="text-3xl font-bold">My Students</h1>
            <p className="text-muted-foreground mt-2">
              View and manage students assigned to your courses
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="flex items-center space-x-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search students..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {filteredStudents.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Users className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {searchTerm ? 'No Students Found' : 'No Students Assigned'}
              </h3>
              <p className="text-muted-foreground text-center max-w-md">
                {searchTerm 
                  ? 'No students match your search criteria. Try adjusting your search terms.'
                  : 'You don\'t have any students assigned to your courses yet.'
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredStudents.map((student) => (
              <Card key={student.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{student.full_name}</CardTitle>
                      <CardDescription className="font-mono text-sm">
                        @{student.username}
                      </CardDescription>
                    </div>
                    <Badge variant={student.is_active ? 'default' : 'secondary'}>
                      {student.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span className="truncate">{student.email}</span>
                    </div>
                    
                    {student.phone && (
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span>{student.phone}</span>
                      </div>
                    )}
                    
                    <div className="flex items-center gap-2 text-sm">
                      <GraduationCap className="h-4 w-4 text-muted-foreground" />
                      <span>{student.department_name}</span>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1"
                      onClick={() => handleViewProgress(student)}
                    >
                      <TrendingUp className="h-4 w-4 mr-1" />
                      View Progress
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1"
                      onClick={() => handleSendMessage(student)}
                    >
                      <Mail className="h-4 w-4 mr-1" />
                      Send Message
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Summary */}
        {students.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-primary">{students.length}</div>
                  <div className="text-sm text-muted-foreground">Total Students</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-600">
                    {students.filter(s => s.is_active).length}
                  </div>
                  <div className="text-sm text-muted-foreground">Active Students</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-orange-600">
                    {students.filter(s => !s.is_active).length}
                  </div>
                  <div className="text-sm text-muted-foreground">Inactive Students</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-blue-600">
                    {filteredStudents.length}
                  </div>
                  <div className="text-sm text-muted-foreground">Showing</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Student Progress Dialog */}
        <Dialog open={isProgressDialogOpen} onOpenChange={setIsProgressDialogOpen}>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Student Progress: {selectedStudent?.full_name}
              </DialogTitle>
              <DialogDescription>
                View detailed academic progress across all courses
              </DialogDescription>
            </DialogHeader>

            {isLoadingProgress ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-muted-foreground">Loading progress...</p>
                </div>
              </div>
            ) : studentProgress.length === 0 ? (
              <div className="text-center py-8">
                <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No evaluations found for this student yet.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {studentProgress.map((progress, index) => (
                  <Card key={index}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg">{progress.course_title}</CardTitle>
                          <CardDescription className="font-mono">{progress.course_code}</CardDescription>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-primary">
                            {typeof progress.cumulative_total === 'number' 
                              ? progress.cumulative_total.toFixed(1) 
                              : progress.cumulative_total}/100
                          </div>
                          <Badge className="mt-1" variant={
                            progress.grade.startsWith('A') ? 'default' :
                            progress.grade.startsWith('B') ? 'secondary' :
                            'outline'
                          }>
                            Grade: {progress.grade}
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div>
                          <div className="text-sm font-medium mb-2">Score Breakdown:</div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            <div className="text-center p-2 bg-blue-50 rounded">
                              <div className="font-bold text-blue-600">{progress.breakdown.mid_exam}/30</div>
                              <div className="text-xs text-muted-foreground">Mid Exam</div>
                            </div>
                            <div className="text-center p-2 bg-green-50 rounded">
                              <div className="font-bold text-green-600">{progress.breakdown.final_exam}/50</div>
                              <div className="text-xs text-muted-foreground">Final Exam</div>
                            </div>
                            <div className="text-center p-2 bg-purple-50 rounded">
                              <div className="font-bold text-purple-600">{progress.breakdown.project}/15</div>
                              <div className="text-xs text-muted-foreground">Project</div>
                            </div>
                            <div className="text-center p-2 bg-orange-50 rounded">
                              <div className="font-bold text-orange-600">{progress.breakdown.quiz}/5</div>
                              <div className="text-xs text-muted-foreground">Quiz</div>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Award className="h-4 w-4" />
                          <span>{progress.evaluation_count} evaluation{progress.evaluation_count !== 1 ? 's' : ''} recorded</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}