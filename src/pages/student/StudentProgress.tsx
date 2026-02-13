import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { BarChart3, TrendingUp, Award, Target, BookOpen, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { studentApi, type StudentProgress } from '@/services/studentApi';
import { LoadingSkeleton } from '@/components/common/LoadingSkeleton';

export default function StudentProgressPage() {
  const [progress, setProgress] = useState<StudentProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchProgress();
  }, []);

  const fetchProgress = async () => {
    try {
      setLoading(true);
      const data = await studentApi.getProgress();
      setProgress(data);
    } catch (err) {
      console.error('Failed to fetch progress:', err);
      setError('Failed to load progress data');
    } finally {
      setLoading(false);
    }
  };

  const getProgressColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getGradeLevel = (score: number) => {
    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="page-transition">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold">Academic Progress</h1>
              <p className="text-muted-foreground">Track your academic performance and progress</p>
            </div>
          </div>
          <LoadingSkeleton />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="page-transition">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Academic Progress</h1>
            <p className="text-muted-foreground">Track your academic performance and progress</p>
          </div>
          {progress && (
            <Badge variant="outline" className="flex items-center gap-2">
              <Award className="h-4 w-4" />
              Grade: {getGradeLevel(progress.average_score)}
            </Badge>
          )}
        </div>

        {error && (
          <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        {!progress ? (
          <div className="bg-card rounded-xl border border-border p-6">
            <div className="text-center py-12">
              <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-medium mb-2">No Progress Data</h3>
              <p className="text-muted-foreground mb-4">
                No progress data available yet. Complete some assignments to see your progress.
              </p>
              <Button variant="outline" onClick={() => window.history.back()}>
                Back to Dashboard
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-card rounded-xl border border-border p-6">
                <div className="flex items-center gap-3 mb-2">
                  <Target className="h-5 w-5 text-blue-500" />
                  <h3 className="font-semibold">Total Projects</h3>
                </div>
                <p className="text-2xl font-bold">{progress.total_projects}</p>
                <p className="text-sm text-muted-foreground">Assigned projects</p>
              </div>

              <div className="bg-card rounded-xl border border-border p-6">
                <div className="flex items-center gap-3 mb-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <h3 className="font-semibold">Completed</h3>
                </div>
                <p className="text-2xl font-bold">{progress.completed_projects}</p>
                <p className="text-sm text-muted-foreground">Projects completed</p>
              </div>

              <div className="bg-card rounded-xl border border-border p-6">
                <div className="flex items-center gap-3 mb-2">
                  <Award className="h-5 w-5 text-yellow-500" />
                  <h3 className="font-semibold">Average Score</h3>
                </div>
                <p className={`text-2xl font-bold ${getProgressColor(progress.average_score)}`}>
                  {progress.average_score}%
                </p>
                <p className="text-sm text-muted-foreground">Overall performance</p>
              </div>

              <div className="bg-card rounded-xl border border-border p-6">
                <div className="flex items-center gap-3 mb-2">
                  <BookOpen className="h-5 w-5 text-purple-500" />
                  <h3 className="font-semibold">Tutorials</h3>
                </div>
                <p className="text-2xl font-bold">{progress.tutorials_completed}</p>
                <p className="text-sm text-muted-foreground">Tutorials completed</p>
              </div>
            </div>

            {/* Progress Details */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Project Completion Rate */}
              <div className="bg-card rounded-xl border border-border p-6">
                <div className="flex items-center gap-3 mb-4">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  <h3 className="text-lg font-semibold">Project Completion Rate</h3>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Completion Progress</span>
                      <span className="text-sm text-muted-foreground">
                        {progress.completed_projects}/{progress.total_projects}
                      </span>
                    </div>
                    <Progress 
                      value={progress.total_projects > 0 ? (progress.completed_projects / progress.total_projects) * 100 : 0} 
                      className="h-3" 
                    />
                  </div>
                  
                  <div className="pt-4 border-t border-border">
                    <p className="text-sm text-muted-foreground">
                      You have completed {progress.completed_projects} out of {progress.total_projects} assigned projects.
                      {progress.total_projects > progress.completed_projects && (
                        <span className="block mt-1 text-primary">
                          {progress.total_projects - progress.completed_projects} projects remaining.
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              </div>

              {/* Performance Analysis */}
              <div className="bg-card rounded-xl border border-border p-6">
                <div className="flex items-center gap-3 mb-4">
                  <BarChart3 className="h-5 w-5 text-primary" />
                  <h3 className="text-lg font-semibold">Performance Analysis</h3>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Overall Performance</span>
                      <Badge variant={progress.average_score >= 80 ? 'default' : progress.average_score >= 60 ? 'secondary' : 'destructive'}>
                        {getGradeLevel(progress.average_score)} Grade
                      </Badge>
                    </div>
                    <Progress value={progress.average_score} className="h-3" />
                  </div>
                  
                  <div className="pt-4 border-t border-border">
                    <p className="text-sm text-muted-foreground">
                      Your current average score is {progress.average_score}%, which corresponds to a {getGradeLevel(progress.average_score)} grade.
                      {progress.average_score < 80 && (
                        <span className="block mt-1 text-primary">
                          Keep working to improve your performance!
                        </span>
                      )}
                      {progress.average_score >= 80 && (
                        <span className="block mt-1 text-green-600">
                          Excellent work! Keep it up!
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Learning Progress */}
            <div className="bg-card rounded-xl border border-border p-6">
              <div className="flex items-center gap-3 mb-4">
                <BookOpen className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold">Learning Progress</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600 mb-1">{progress.tutorials_completed}</div>
                  <div className="text-sm text-muted-foreground">Tutorials Completed</div>
                </div>
                
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600 mb-1">{progress.completed_projects}</div>
                  <div className="text-sm text-muted-foreground">Projects Submitted</div>
                </div>
                
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <div className={`text-2xl font-bold mb-1 ${getProgressColor(progress.average_score)}`}>
                    {progress.average_score}%
                  </div>
                  <div className="text-sm text-muted-foreground">Average Score</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}