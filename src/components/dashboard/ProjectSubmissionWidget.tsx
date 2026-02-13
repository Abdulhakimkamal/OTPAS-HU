import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FolderOpen, Upload, Clock, CheckCircle, AlertCircle, FileText, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { studentApi, type ProjectSubmission } from '@/services/studentApi';

interface ProjectSubmissionWidgetProps {
  className?: string;
}

const statusConfig = {
  pending: { 
    icon: Clock, 
    color: 'text-yellow-600', 
    bg: 'bg-yellow-50', 
    border: 'border-yellow-200',
    label: 'Pending'
  },
  submitted: { 
    icon: CheckCircle, 
    color: 'text-blue-600', 
    bg: 'bg-blue-50', 
    border: 'border-blue-200',
    label: 'Submitted'
  },
  approved: { 
    icon: CheckCircle, 
    color: 'text-green-600', 
    bg: 'bg-green-50', 
    border: 'border-green-200',
    label: 'Approved'
  },
  revision: { 
    icon: AlertCircle, 
    color: 'text-orange-600', 
    bg: 'bg-orange-50', 
    border: 'border-orange-200',
    label: 'Needs Revision'
  },
  overdue: { 
    icon: AlertCircle, 
    color: 'text-red-600', 
    bg: 'bg-red-50', 
    border: 'border-red-200',
    label: 'Overdue'
  },
};

export function ProjectSubmissionWidget({ className }: ProjectSubmissionWidgetProps) {
  const [projects, setProjects] = useState<(ProjectSubmission & { 
    dueDate?: string; 
    progress?: number; 
    attachments?: number 
  })[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchProjectSubmissions();
  }, []);

  const fetchProjectSubmissions = async () => {
    try {
      const data = await studentApi.getProjectSubmissions();
      // Add mock fields that aren't in the API yet
      const projectsWithMockData = data.map(project => ({
        ...project,
        dueDate: 'April 15, 2026', // Mock due date
        progress: project.status === 'submitted' || project.status === 'approved' ? 100 : 75,
        attachments: 3, // Mock attachment count
      }));
      setProjects(projectsWithMockData);
    } catch (error) {
      console.error('Failed to fetch project submissions:', error);
      // Fallback to mock data
      const mockProjects = [
        {
          id: '1',
          title: 'E-Commerce Web Application',
          course_name: 'Software Engineering',
          course_code: 'CS401',
          status: 'pending' as const,
          created_at: new Date().toISOString(),
          dueDate: 'April 15, 2026',
          progress: 75,
          attachments: 3,
        },
        {
          id: '2',
          title: 'Database Design Project',
          course_name: 'Database Systems',
          course_code: 'CS402',
          status: 'submitted' as const,
          submitted_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          dueDate: 'March 30, 2026',
          progress: 100,
          attachments: 5,
        },
      ];
      setProjects(mockProjects);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString?: string): string => {
    if (!dateString) return 'No date';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const handleUploadProject = () => {
    navigate('/student/projects');
  };

  const handleAttachFiles = (projectId: string) => {
    navigate(`/student/projects/${projectId}/edit`);
  };

  if (loading) {
    return (
      <div className={cn("bg-card rounded-xl border border-border p-6", className)}>
        <div className="animate-pulse">
          <div className="h-6 bg-muted rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            {[1, 2].map(i => (
              <div key={i} className="h-24 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const pendingProjects = projects.filter(p => p.status === 'pending' || p.status === 'revision');
  const recentSubmission = projects.find(p => p.status === 'submitted' || p.status === 'approved');

  return (
    <div className={cn("bg-card rounded-xl border border-border p-6", className)}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <FolderOpen className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">Project Submissions</h3>
        </div>
        <Button 
          size="sm" 
          onClick={handleUploadProject}
          className="flex items-center gap-2"
        >
          <Upload className="h-4 w-4" />
          Upload Project
        </Button>
      </div>

      <div className="space-y-4">
        {/* Pending Projects */}
        {pendingProjects.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-3">
              Pending Submissions ({pendingProjects.length})
            </h4>
            <div className="space-y-3">
              {pendingProjects.map((project) => {
                const statusInfo = statusConfig[project.status];
                const StatusIcon = statusInfo.icon;

                return (
                  <div
                    key={project.id}
                    className={cn(
                      "p-4 rounded-lg border transition-all duration-200",
                      statusInfo.bg,
                      statusInfo.border
                    )}
                  >
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <StatusIcon className={cn("h-4 w-4", statusInfo.color)} />
                          <h5 className="text-sm font-medium line-clamp-1">
                            {project.title}
                          </h5>
                        </div>
                        
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline" className="text-xs">
                            {project.course_code}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {project.course_name}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-3 text-xs text-muted-foreground mb-2">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            Due: {project.dueDate || 'No due date'}
                          </span>
                          <span className="flex items-center gap-1">
                            <FileText className="h-3 w-3" />
                            {project.attachments || 0} files
                          </span>
                        </div>
                        
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span>Progress</span>
                            <span>{project.progress || 0}%</span>
                          </div>
                          <Progress value={project.progress || 0} className="h-1.5" />
                        </div>
                        
                        {project.feedback && (
                          <p className="text-xs text-muted-foreground mt-2 p-2 bg-background rounded border">
                            {project.feedback}
                          </p>
                        )}
                      </div>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleAttachFiles(project.id)}
                        className="flex items-center gap-1 text-xs"
                      >
                        <FileText className="h-3 w-3" />
                        Attach Files
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Recent Submission */}
        {recentSubmission && (
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-3">
              Latest Submission
            </h4>
            <div className="p-4 rounded-lg border border-border bg-muted/30">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <h5 className="text-sm font-medium line-clamp-1">
                      {recentSubmission.title}
                    </h5>
                    {recentSubmission.grade && (
                      <Badge variant="secondary" className="text-xs">
                        Grade: {recentSubmission.grade}
                      </Badge>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline" className="text-xs">
                      {recentSubmission.course_code}
                    </Badge>
                    <Badge 
                      variant={recentSubmission.status === 'approved' ? 'default' : 'secondary'}
                      className="text-xs"
                    >
                      {statusConfig[recentSubmission.status].label}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span>Submitted: {formatDate(recentSubmission.submitted_at)}</span>
                    <span className="flex items-center gap-1">
                      <FileText className="h-3 w-3" />
                      {recentSubmission.attachments || 0} files
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {projects.length === 0 && (
          <div className="text-center py-8">
            <FolderOpen className="h-8 w-8 mx-auto text-muted-foreground/50 mb-2" />
            <p className="text-sm text-muted-foreground mb-3">No projects yet</p>
            <Button onClick={handleUploadProject} className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Upload Your First Project
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}