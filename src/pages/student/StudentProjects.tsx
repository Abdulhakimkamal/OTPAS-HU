import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { FolderOpen, Upload, Plus, Calendar, CheckCircle, Clock, AlertCircle, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { studentApi, type ProjectSubmission } from '@/services/studentApi';
import { LoadingSkeleton } from '@/components/common/LoadingSkeleton';
import { useToast } from '@/hooks/use-toast';

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'submitted':
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    case 'pending':
      return <Clock className="h-4 w-4 text-yellow-500" />;
    case 'approved':
      return <CheckCircle className="h-4 w-4 text-green-600" />;
    case 'revision':
      return <AlertCircle className="h-4 w-4 text-orange-500" />;
    case 'overdue':
      return <AlertCircle className="h-4 w-4 text-red-500" />;
    default:
      return <FileText className="h-4 w-4 text-gray-500" />;
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'submitted':
      return 'default';
    case 'pending':
      return 'warning';
    case 'approved':
      return 'success';
    case 'revision':
      return 'warning';
    case 'overdue':
      return 'destructive';
    default:
      return 'secondary';
  }
};

export default function StudentProjects() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [projects, setProjects] = useState<ProjectSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [selectedProject, setSelectedProject] = useState<ProjectSubmission | null>(null);
  const [uploading, setUploading] = useState(false);
  
  // Form state
  const [projectTitle, setProjectTitle] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('');
  const [projectFile, setProjectFile] = useState<File | null>(null);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const data = await studentApi.getProjectSubmissions();
      setProjects(data);
    } catch (err) {
      console.error('Failed to fetch projects:', err);
      setError('Failed to load project submissions');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Not submitted';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleUploadProject = () => {
    setShowUploadDialog(true);
  };

  const handleBackToDashboard = () => {
    navigate('/student');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setProjectFile(e.target.files[0]);
    }
  };

  const handleSubmitProject = async () => {
    if (!projectTitle || !projectDescription || !selectedCourse) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      setUploading(true);
      
      // Create FormData to send file
      const formData = new FormData();
      formData.append('title', projectTitle);
      formData.append('description', projectDescription);
      formData.append('course_id', selectedCourse);
      
      if (projectFile) {
        formData.append('file', projectFile);
      }
      
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/student/projects/submit', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to submit project');
      }

      toast({
        title: "Success",
        description: "Project submitted successfully",
      });

      // Reset form
      setProjectTitle('');
      setProjectDescription('');
      setSelectedCourse('');
      setProjectFile(null);
      setShowUploadDialog(false);
      
      // Refresh projects list
      fetchProjects();
    } catch (error) {
      console.error('Failed to submit project:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to submit project. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleViewDetails = (project: ProjectSubmission) => {
    setSelectedProject(project);
    setShowDetailsDialog(true);
  };

  const handleViewFeedback = (project: ProjectSubmission) => {
    setSelectedProject(project);
    setShowDetailsDialog(true);
  };

  const handleDownloadFile = (fileUrl: string, fileName: string) => {
    // The backend serves static files at /uploads/... (no /api prefix)
    // If the URL already starts with http, use it as-is
    // Otherwise, ensure it doesn't have /api prefix
    let downloadUrl = fileUrl;
    
    if (!fileUrl.startsWith('http')) {
      // Remove /api prefix if it exists
      downloadUrl = fileUrl.startsWith('/api') ? fileUrl.substring(4) : fileUrl;
      
      // Encode the URL to handle spaces and special characters
      // Split by / to encode only the filename part
      const parts = downloadUrl.split('/');
      const encodedParts = parts.map((part, index) => 
        index === parts.length - 1 ? encodeURIComponent(part) : part
      );
      downloadUrl = encodedParts.join('/');
    }
    
    // Create a temporary anchor element to trigger download
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = fileName;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="page-transition">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold">My Projects</h1>
              <p className="text-muted-foreground">Manage your project submissions and track progress</p>
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
            <h1 className="text-2xl font-bold">My Projects</h1>
            <p className="text-muted-foreground">Manage your project submissions and track progress</p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="flex items-center gap-2">
              <FolderOpen className="h-4 w-4" />
              {projects.length} Projects
            </Badge>
            <Button className="flex items-center gap-2" onClick={handleUploadProject}>
              <Plus className="h-4 w-4" />
              New Project
            </Button>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        <div className="space-y-4">
          {projects.length === 0 ? (
            <div className="bg-card rounded-xl border border-border p-6">
              <div className="text-center py-12">
                <FolderOpen className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-medium mb-2">No Projects Yet</h3>
                <p className="text-muted-foreground mb-4">
                  You haven't submitted any projects yet. Start by uploading your first project.
                </p>
                <div className="flex gap-3 justify-center">
                  <Button className="flex items-center gap-2" onClick={handleUploadProject}>
                    <Upload className="h-4 w-4" />
                    Upload Your First Project
                  </Button>
                  <Button variant="outline" onClick={handleBackToDashboard}>
                    Back to Dashboard
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid gap-4">
              {projects.map((project) => (
                <div key={project.id} className="bg-card rounded-xl border border-border p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start gap-3">
                      {getStatusIcon(project.status)}
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold mb-1">{project.title}</h3>
                        {project.description && (
                          <p className="text-sm text-muted-foreground mb-2">{project.description}</p>
                        )}
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            <span>Created: {formatDate(project.created_at)}</span>
                          </div>
                          {project.submitted_at && (
                            <div className="flex items-center gap-1">
                              <CheckCircle className="h-3 w-3" />
                              <span>Submitted: {formatDate(project.submitted_at)}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">
                        {project.course_code}
                      </Badge>
                      <Badge variant={getStatusColor(project.status) as any}>
                        {project.status}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between pt-4 border-t border-border">
                    <div className="text-sm text-muted-foreground">
                      <strong>{project.course_name}</strong>
                      {project.grade && (
                        <span className="ml-2">• Grade: <strong>{project.grade}</strong></span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {project.feedback && (
                        <Button variant="outline" size="sm" onClick={() => handleViewFeedback(project)}>
                          View Feedback
                        </Button>
                      )}
                      <Button variant="outline" size="sm" onClick={() => handleViewDetails(project)}>
                        View Details
                      </Button>
                    </div>
                  </div>

                  {project.feedback && (
                    <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                      <h4 className="text-sm font-medium mb-1">Instructor Feedback:</h4>
                      <p className="text-sm text-muted-foreground">{project.feedback}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Upload Project Dialog */}
        <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Upload New Project</DialogTitle>
              <DialogDescription>
                Submit your project for evaluation. Fill in all the required information.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="title">Project Title *</Label>
                <Input
                  id="title"
                  placeholder="Enter project title"
                  value={projectTitle}
                  onChange={(e) => setProjectTitle(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="course">Course *</Label>
                <Select value={selectedCourse} onValueChange={setSelectedCourse}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a course" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Computer Security (CS301)</SelectItem>
                    <SelectItem value="2">Software Engineering (CS302)</SelectItem>
                    <SelectItem value="3">Database Systems (CS303)</SelectItem>
                    <SelectItem value="4">Web Development (CS304)</SelectItem>
                    <SelectItem value="5">Mobile App Development (CS305)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  placeholder="Describe your project..."
                  rows={4}
                  value={projectDescription}
                  onChange={(e) => setProjectDescription(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="file">Project File *</Label>
                <Input
                  id="file"
                  type="file"
                  accept=".pdf,.doc,.docx,.ppt,.pptx,.zip"
                  onChange={handleFileChange}
                  required
                />
                {projectFile && (
                  <p className="text-sm text-muted-foreground">
                    Selected: {projectFile.name} ({(projectFile.size / 1024 / 1024).toFixed(2)} MB)
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  Accepted formats: PDF, Word (DOC/DOCX), PowerPoint (PPT/PPTX), ZIP (Max 10MB)
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setShowUploadDialog(false)}
                disabled={uploading}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmitProject}
                disabled={uploading || !projectTitle || !projectDescription || !selectedCourse || !projectFile}
              >
                {uploading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Submitting...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Submit Project
                  </>
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Project Details Dialog */}
        <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Project Details</DialogTitle>
              <DialogDescription>
                Complete information about your project submission
              </DialogDescription>
            </DialogHeader>
            
            {selectedProject && (
              <div className="space-y-4 py-4">
                <div>
                  <h3 className="text-lg font-semibold mb-2">{selectedProject.title}</h3>
                  <div className="flex items-center gap-2 mb-4">
                    <Badge variant="outline">{selectedProject.course_code}</Badge>
                    <Badge variant={getStatusColor(selectedProject.status) as any}>
                      {selectedProject.status}
                    </Badge>
                    {selectedProject.grade && (
                      <Badge variant="secondary">Grade: {selectedProject.grade}</Badge>
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <Label className="text-sm font-medium">Course</Label>
                    <p className="text-sm text-muted-foreground">{selectedProject.course_name}</p>
                  </div>

                  <div>
                    <Label className="text-sm font-medium">Description</Label>
                    <p className="text-sm text-muted-foreground">{selectedProject.description}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium">Created</Label>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(selectedProject.created_at)}
                      </p>
                    </div>
                    {selectedProject.submitted_at && (
                      <div>
                        <Label className="text-sm font-medium">Submitted</Label>
                        <p className="text-sm text-muted-foreground">
                          {formatDate(selectedProject.submitted_at)}
                        </p>
                      </div>
                    )}
                  </div>

                  {selectedProject.feedback && (
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <Label className="text-sm font-medium mb-2 block">Instructor Feedback</Label>
                      <p className="text-sm text-muted-foreground">{selectedProject.feedback}</p>
                    </div>
                  )}

                  {selectedProject.file_url && (
                    <div>
                      <Label className="text-sm font-medium mb-2 block">Project File</Label>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleDownloadFile(selectedProject.file_url, selectedProject.title)}
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        Download Project File
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="flex justify-end">
              <Button onClick={() => setShowDetailsDialog(false)}>
                Close
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}