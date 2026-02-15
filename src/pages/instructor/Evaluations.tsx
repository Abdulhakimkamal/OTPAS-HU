import { useState, useEffect, useMemo } from 'react';
import * as React from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, ClipboardList, Calendar, BookOpen, User, RefreshCw } from 'lucide-react';
import instructorApi from '@/services/instructorApi';
import { useToast } from '@/hooks/use-toast';
import { calculateGrade, getGradeInfo, getGradeBgColor, formatScore } from '@/utils/gradeCalculator';

interface Evaluation {
  id: number;
  student_name: string;
  course_title: string;
  course_code: string;
  score: number | string;
  grade: string;
  feedback: string;
  evaluation_type: string;
  created_at: string;
  cumulative_total?: number | string;
  breakdown?: {
    mid_exam: number;
    final_exam: number;
    project: number;
    quiz: number;
  };
}

interface Course {
  id: number;
  title: string;
  code: string;
}

interface Student {
  id: number;
  full_name: string;
  username: string;
}

export default function Evaluations() {
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    student_id: '',
    course_id: '',
    score: '',
    feedback: '',
    evaluation_type: 'quiz'
  });
  const [refreshKey, setRefreshKey] = useState(0);
  const { toast } = useToast();

  useEffect(() => {
    loadEvaluations();
    loadCourses();
    loadStudents();
  }, []);

  const loadEvaluations = async (forceRefresh = false) => {
    try {
      console.log('Loading evaluations...', forceRefresh ? '(FORCE REFRESH)' : '');
      setIsLoading(true);
      
      // Clear existing data first to prevent stale state
      setEvaluations([]);
      
      // Add cache-busting parameter to ensure fresh data
      const timestamp = Date.now();
      console.log(`Cache-busting timestamp: ${timestamp}`);
      
      const data = await instructorApi.getEvaluations() as { success: boolean; evaluations: Evaluation[] };
      console.log('Evaluations response:', data);
      
      if (data && data.evaluations) {
        // Remove any potential duplicates at the API level using multiple criteria
        const uniqueEvaluations = data.evaluations.filter((evaluation, index, self) => {
          // First check by ID (primary key)
          const firstOccurrenceById = self.findIndex(e => e.id === evaluation.id);
          if (firstOccurrenceById !== index) {
            console.log(`Removing duplicate by ID: ${evaluation.id}`);
            return false;
          }
          
          // Second check by content (student, course, type, score)
          const firstOccurrenceByContent = self.findIndex(e => 
            e.student_name === evaluation.student_name &&
            e.course_code === evaluation.course_code &&
            e.evaluation_type === evaluation.evaluation_type &&
            e.score === evaluation.score
          );
          
          if (firstOccurrenceByContent !== index) {
            console.log(`Removing duplicate by content: ${evaluation.student_name}-${evaluation.course_code}-${evaluation.evaluation_type}-${evaluation.score}`);
            return false;
          }
          
          return true;
        });
        
        console.log(`Original evaluations: ${data.evaluations.length}, After deduplication: ${uniqueEvaluations.length}`);
        
        // Sort by creation date for consistent display
        uniqueEvaluations.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        
        setEvaluations(uniqueEvaluations);
        console.log(`Successfully loaded ${uniqueEvaluations.length} unique evaluations`);
        
        if (forceRefresh) {
          toast({
            title: 'Success',
            description: `Refreshed ${uniqueEvaluations.length} evaluations`,
          });
        }
      } else {
        setEvaluations([]);
        console.log('No evaluations data received');
      }
    } catch (error: any) {
      console.error('Failed to load evaluations:', error);
      toast({
        title: 'Error',
        description: 'Failed to load evaluations',
        variant: 'destructive',
      });
      setEvaluations([]);
    } finally {
      setIsLoading(false);
    }
  };

  const loadCourses = async () => {
    try {
      console.log('Loading courses for evaluations...');
      const data = await instructorApi.getMyCourses() as any;
      console.log('Courses response:', data);
      
      // API returns { success, data: [...] }
      if (data && data.success) {
        const coursesList = data.data || data.courses || [];
        setCourses(Array.isArray(coursesList) ? coursesList : []);
      } else {
        setCourses([]);
      }
    } catch (error: any) {
      console.error('Failed to load courses:', error);
      setCourses([]);
    }
  };

  const loadStudents = async () => {
    try {
      console.log('Loading students for evaluations...');
      const data = await instructorApi.getAssignedStudents() as { success: boolean; students: Student[] };
      console.log('Students response:', data);
      
      if (data && data.students) {
        setStudents(data.students || []);
      } else {
        setStudents([]);
      }
    } catch (error: any) {
      console.error('Failed to load students:', error);
      setStudents([]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isSubmitting) {
      return;
    }
    
    setIsSubmitting(true);

    try {
      await instructorApi.createEvaluation({
        student_id: parseInt(formData.student_id),
        course_id: parseInt(formData.course_id),
        score: parseFloat(formData.score),
        feedback: formData.feedback,
        evaluation_type: formData.evaluation_type
      });

      toast({
        title: 'Success',
        description: 'Evaluation created successfully',
      });

      setIsDialogOpen(false);
      setFormData({ student_id: '', course_id: '', score: '', feedback: '', evaluation_type: 'quiz' });
      loadEvaluations();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to create evaluation',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // COMPLETELY REBUILD GROUPING LOGIC - NO DUPLICATES ALLOWED
  const groupedEvaluations = React.useMemo(() => {
    console.log('🔄 REBUILDING GROUPED EVALUATIONS');
    console.log('Input evaluations:', evaluations.length);
    
    // Step 1: Remove any duplicates by ID first
    const uniqueById = evaluations.filter((evaluation, index, self) => {
      const firstIndex = self.findIndex(e => e.id === evaluation.id);
      if (firstIndex !== index) {
        console.log(`❌ Removing duplicate by ID: ${evaluation.id}`);
        return false;
      }
      return true;
    });
    
    console.log('After ID deduplication:', uniqueById.length);
    
    // Step 2: Create a Map to ensure unique student-course combinations
    const studentCourseMap = new Map<string, {
      student_name: string;
      course_title: string;
      course_code: string;
      cumulative_total?: number | string;
      breakdown?: {
        mid_exam: number;
        final_exam: number;
        project: number;
        quiz: number;
      };
      allEvaluations: Evaluation[];
    }>();
    
    // Step 3: Process each evaluation
    uniqueById.forEach(evaluation => {
      const key = `${evaluation.student_name}|${evaluation.course_code}`;
      console.log(`Processing: ${key} (ID: ${evaluation.id}, Type: ${evaluation.evaluation_type})`);
      
      if (!studentCourseMap.has(key)) {
        console.log(`✅ Creating new group: ${key}`);
        studentCourseMap.set(key, {
          student_name: evaluation.student_name,
          course_title: evaluation.course_title,
          course_code: evaluation.course_code,
          cumulative_total: evaluation.cumulative_total,
          breakdown: evaluation.breakdown,
          allEvaluations: []
        });
      }
      
      const group = studentCourseMap.get(key)!;
      
      // Check if this evaluation already exists in the group
      const existsInGroup = group.allEvaluations.some(existing => 
        existing.id === evaluation.id ||
        (existing.evaluation_type === evaluation.evaluation_type && 
         existing.score === evaluation.score)
      );
      
      if (!existsInGroup) {
        group.allEvaluations.push(evaluation);
        console.log(`✅ Added evaluation to ${key}: ${evaluation.evaluation_type} (${evaluation.score})`);
      } else {
        console.log(`❌ Skipping duplicate in group ${key}: ${evaluation.evaluation_type} (${evaluation.score})`);
      }
    });
    
    // Step 4: Convert Map back to object
    const result: Record<string, any> = {};
    studentCourseMap.forEach((value, key) => {
      result[key] = value;
    });
    
    console.log('🎯 FINAL GROUPS:', Object.keys(result).map(key => ({
      key,
      student: result[key].student_name,
      course: result[key].course_code,
      evaluations: result[key].allEvaluations.length,
      types: result[key].allEvaluations.map((e: Evaluation) => e.evaluation_type)
    })));
    
    return result;
  }, [evaluations]);

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading evaluations...</p>
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
            <h1 className="text-3xl font-bold">Evaluations</h1>
            <p className="text-muted-foreground mt-2">
              Create and manage student evaluations and grades
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <Button 
              onClick={() => {
                console.log('🔄 HARD REFRESH - Clearing all state');
                setEvaluations([]);
                setCourses([]);
                setStudents([]);
                setRefreshKey(prev => prev + 1);
                setTimeout(() => {
                  loadEvaluations(true);
                  loadCourses();
                  loadStudents();
                }, 100);
              }} 
              variant="outline" 
              size="sm"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Hard Refresh
            </Button>
            
            <Button 
              onClick={() => window.location.reload()} 
              variant="outline" 
              size="sm"
            >
              🔄 Page Reload
            </Button>
            
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  New Evaluation
                </Button>
              </DialogTrigger>
            <DialogContent className="sm:max-w-[525px]">
              <DialogHeader>
                <DialogTitle>Create Evaluation</DialogTitle>
                <DialogDescription>
                  Add a new evaluation for a student
                </DialogDescription>
              </DialogHeader>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="student_id">Student *</Label>
                  <Select 
                    value={formData.student_id} 
                    onValueChange={(value) => setFormData({ ...formData, student_id: value })}
                    required
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a student" />
                    </SelectTrigger>
                    <SelectContent>
                      {students.length === 0 ? (
                        <SelectItem value="no-students" disabled>
                          No students available
                        </SelectItem>
                      ) : (
                        students.map((student) => (
                          <SelectItem key={student.id} value={student.id.toString()}>
                            {student.full_name} (@{student.username})
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="course_id">Course *</Label>
                  <Select 
                    value={formData.course_id} 
                    onValueChange={(value) => setFormData({ ...formData, course_id: value })}
                    required
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a course" />
                    </SelectTrigger>
                    <SelectContent>
                      {courses.length === 0 ? (
                        <SelectItem value="no-courses" disabled>
                          No courses available
                        </SelectItem>
                      ) : (
                        courses.map((course) => (
                          <SelectItem key={course.id} value={course.id.toString()}>
                            {course.code} - {course.title}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="evaluation_type">Evaluation Type *</Label>
                  <Select 
                    value={formData.evaluation_type} 
                    onValueChange={(value) => setFormData({ ...formData, evaluation_type: value })}
                    required
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mid_exam">📋 Mid Exam</SelectItem>
                      <SelectItem value="final_exam">📋 Final Exam</SelectItem>
                      <SelectItem value="project">🚀 Project</SelectItem>
                      <SelectItem value="quiz">❓ Quiz</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="score">Score *</Label>
                  <Input
                    id="score"
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={formData.score}
                    onChange={(e) => setFormData({ ...formData, score: e.target.value })}
                    placeholder="Enter score"
                    required
                    className="w-full"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="feedback">Feedback *</Label>
                  <Textarea
                    id="feedback"
                    value={formData.feedback}
                    onChange={(e) => setFormData({ ...formData, feedback: e.target.value })}
                    placeholder="Enter detailed evaluation feedback..."
                    rows={4}
                    required
                    className="w-full resize-none"
                  />
                </div>

                <div className="flex gap-4 pt-4">
                  <Button 
                    type="submit" 
                    disabled={isSubmitting || !formData.student_id || !formData.course_id || !formData.score || !formData.feedback} 
                    className="flex-1"
                  >
                    {isSubmitting ? 'Creating...' : 'Create Evaluation'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsDialogOpen(false);
                      setFormData({ student_id: '', course_id: '', score: '', feedback: '', evaluation_type: 'quiz' });
                    }}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
        </div>

        {evaluations.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <ClipboardList className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Evaluations</h3>
              <p className="text-muted-foreground text-center max-w-md">
                You haven't created any evaluations yet. Create your first evaluation to start grading your students.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4" key={refreshKey}>
            <Card className="border-blue-200 bg-blue-50">
              <CardHeader>
                <CardTitle className="text-sm text-blue-800">� Student-Course Summary</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-blue-700">
                <div className="grid grid-cols-1 gap-2">
                  <div>
                    <strong>Total Evaluations in Database:</strong> {evaluations.length}
                    <br />
                    <strong>Student-Course Combinations:</strong> {Object.keys(groupedEvaluations).length}
                    <br />
                    <strong>Refresh Key:</strong> {refreshKey}
                  </div>
                  <div>
                    <strong>Student-Course Breakdown:</strong>
                    <ul className="text-xs mt-1 space-y-1">
                      {Object.entries(groupedEvaluations).map(([key, group]) => (
                        <li key={key} className="flex justify-between">
                          <span><strong>{group.student_name}</strong> in <strong>{group.course_code}</strong> ({group.course_title})</span>
                          <span className="font-medium">{group.allEvaluations.length} evaluations</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
                <div className="mt-3 p-2 bg-blue-100 rounded text-xs">
                  <strong>Note:</strong> If you see the same student multiple times, they are enrolled in different courses. This is correct behavior.
                </div>
              </CardContent>
            </Card>

            {Object.values(groupedEvaluations).map((groupedEval, index) => (
              <Card key={`${groupedEval.student_name}-${groupedEval.course_code}-${refreshKey}-${index}`}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <User className="h-5 w-5" />
                        {groupedEval.student_name}
                        <Badge variant="outline" className="ml-2 text-xs">
                          {groupedEval.course_code}
                        </Badge>
                      </CardTitle>
                      <CardDescription className="flex items-center gap-4 mt-1">
                        <span className="flex items-center gap-1">
                          <BookOpen className="h-4 w-4" />
                          <strong>{groupedEval.course_code}</strong> - {groupedEval.course_title}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {groupedEval.allEvaluations.length} evaluation{groupedEval.allEvaluations.length !== 1 ? 's' : ''}
                        </span>
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-4">
                      {/* Show latest individual evaluation */}
                      <div className="text-right">
                        <div className="text-sm text-muted-foreground mb-1">Latest Evaluation</div>
                        {groupedEval.allEvaluations.length > 0 && (
                          <>
                            <div className="flex items-center gap-2">
                              <div className={`text-xl font-bold ${getGradeInfo(groupedEval.allEvaluations[0].score).color}`}>
                                {formatScore(groupedEval.allEvaluations[0].score)}
                              </div>
                              <Badge className={`${getGradeBgColor(groupedEval.allEvaluations[0].grade)} text-sm font-bold px-2 py-1`}>
                                {groupedEval.allEvaluations[0].grade}
                              </Badge>
                            </div>
                            <Badge variant="outline" className="capitalize mt-1">
                              {groupedEval.allEvaluations[0].evaluation_type.replace('_', ' ')}
                            </Badge>
                          </>
                        )}
                      </div>
                      {groupedEval.cumulative_total !== undefined && (
                        <div className="text-right border-l pl-4">
                          <div className="text-sm text-muted-foreground mb-1">Cumulative Total</div>
                          <div className="flex items-center gap-2">
                            <div className={`text-2xl font-bold ${getGradeInfo(groupedEval.cumulative_total).color}`}>
                              {formatScore(groupedEval.cumulative_total)}/100
                            </div>
                            <Badge className={`${getGradeBgColor(calculateGrade(groupedEval.cumulative_total))} text-lg font-bold px-3 py-1`}>
                              {calculateGrade(groupedEval.cumulative_total)}
                            </Badge>
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {getGradeInfo(groupedEval.cumulative_total).description}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {/* Show all individual evaluations */}
                  <div className="space-y-3">
                    <Label className="text-sm font-medium">Individual Evaluations:</Label>
                    <div className="grid gap-2">
                      {groupedEval.allEvaluations.map((evaluation) => (
                        <div key={evaluation.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="capitalize">
                              {evaluation.evaluation_type.replace('_', ' ')}
                            </Badge>
                            <span className="text-sm text-muted-foreground">
                              {formatDate(evaluation.created_at)}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`font-medium ${getGradeInfo(evaluation.score).color}`}>
                              {formatScore(evaluation.score)}
                            </span>
                            <Badge className={`${getGradeBgColor(evaluation.grade)} text-xs`}>
                              {evaluation.grade}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Cumulative Score Breakdown */}
                  {groupedEval.breakdown && (
                    <div className="mt-4 pt-4 border-t">
                      <Label className="text-sm font-medium mb-2 block">Score Breakdown:</Label>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                        <div className="text-center">
                          <div className="font-medium text-blue-600">{groupedEval.breakdown.mid_exam}/30</div>
                          <div className="text-muted-foreground">Mid Exam</div>
                        </div>
                        <div className="text-center">
                          <div className="font-medium text-green-600">{groupedEval.breakdown.final_exam}/50</div>
                          <div className="text-muted-foreground">Final Exam</div>
                        </div>
                        <div className="text-center">
                          <div className="font-medium text-purple-600">{groupedEval.breakdown.project}/15</div>
                          <div className="text-muted-foreground">Project</div>
                        </div>
                        <div className="text-center">
                          <div className="font-medium text-orange-600">{groupedEval.breakdown.quiz}/5</div>
                          <div className="text-muted-foreground">Quiz</div>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Summary Statistics */}
        {evaluations.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Evaluation Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-primary">{evaluations.length}</div>
                  <div className="text-sm text-muted-foreground">Total Evaluations</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-600">
                    {(evaluations.reduce((sum, e) => sum + (typeof e.score === 'string' ? parseFloat(e.score) : e.score), 0) / evaluations.length).toFixed(1)}%
                  </div>
                  <div className="text-sm text-muted-foreground">Average Score</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-blue-600">
                    {Math.max(...evaluations.map(e => typeof e.score === 'string' ? parseFloat(e.score) : e.score))}%
                  </div>
                  <div className="text-sm text-muted-foreground">Highest Score</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-orange-600">
                    {Math.min(...evaluations.map(e => typeof e.score === 'string' ? parseFloat(e.score) : e.score))}%
                  </div>
                  <div className="text-sm text-muted-foreground">Lowest Score</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}