import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  BookOpen, 
  Plus, 
  FileText, 
  Video, 
  Clock,
  Eye,
  Upload,
  Download,
  Edit,
  Trash2,
  Play
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { VideoPlayer } from '@/components/tutorial/VideoPlayer';
import { VideoUploadDialog } from '@/components/tutorial/VideoUploadDialog';

interface Tutorial {
  id: number;
  title: string;
  description?: string;
  difficulty_level?: string;
  duration_minutes?: number;
  is_published: boolean;
  views_count: number;
  created_at: string;
}

interface TutorialFile {
  id: number;
  tutorial_id: number;
  file_name: string;
  file_path?: string;
  file_type: string;
  file_size?: number;
  video_url?: string;
  video_type?: string;
  thumbnail_url?: string;
  duration_seconds?: number;
  is_external?: boolean;
  uploaded_at: string;
}

interface CourseTutorialManagerProps {
  courseId: number;
  courseTitle: string;
  userRole: 'instructor' | 'student' | 'department_head';
  canManage?: boolean;
}

export function CourseTutorialManager({ 
  courseId, 
  courseTitle, 
  userRole, 
  canManage = false 
}: CourseTutorialManagerProps) {
  const [tutorials, setTutorials] = useState<Tutorial[]>([]);
  const [tutorialFiles, setTutorialFiles] = useState<TutorialFile[]>([]);
  const [selectedTutorial, setSelectedTutorial] = useState<Tutorial | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('tutorials');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [editingTutorial, setEditingTutorial] = useState<Tutorial | null>(null);
  const [editFormData, setEditFormData] = useState({
    title: '',
    description: '',
    difficulty_level: 'beginner',
    duration_minutes: 30,
    is_published: false
  });
  const [showVideoUploadDialog, setShowVideoUploadDialog] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<TutorialFile | null>(null);
  const [showVideoPlayer, setShowVideoPlayer] = useState(false);
  const [fileFilter, setFileFilter] = useState<'all' | 'videos' | 'documents'>('all');
  const [isUploadingVideo, setIsUploadingVideo] = useState(false);
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchCourseTutorials();
  }, [courseId]);

  useEffect(() => {
    // Track form state changes
  }, [showCreateForm]);

  const fetchCourseTutorials = async () => {
    try {
      setLoading(true);
      
      const response = await fetch(`/api/instructor/courses/${courseId}/tutorials`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setTutorials(data.tutorials || []);
      } else {
        setTutorials([]);
      }
    } catch (error) {
      console.error('Error fetching course tutorials:', error);
      toast({
        title: "Info",
        description: "Course tutorial features are being set up",
        variant: "default",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchTutorialFiles = async (tutorialId: number) => {
    try {
      const response = await fetch(`/api/instructor/courses/${courseId}/tutorials/${tutorialId}/files`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setTutorialFiles(data.files || []);
      }
    } catch (error) {
      console.error('Error fetching tutorial files:', error);
    }
  };

  const getDifficultyBadge = (level?: string) => {
    if (!level) return null;
    
    const variants = {
      'beginner': 'default',
      'intermediate': 'secondary',
      'advanced': 'destructive'
    } as const;

    return (
      <Badge variant={variants[level as keyof typeof variants] || 'outline'}>
        {level.charAt(0).toUpperCase() + level.slice(1)}
      </Badge>
    );
  };

  const formatDuration = (minutes?: number) => {
    if (!minutes) return 'Not specified';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const formatFileSize = (bytes: number) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const handleCreateTutorial = async (tutorialData: any) => {
    try {
      setIsCreating(true);
      
      const response = await fetch(`/api/instructor/courses/${courseId}/tutorials`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(tutorialData),
      });

      const data = await response.json();
      
      if (data.success) {
        toast({
          title: "Success",
          description: "Tutorial created successfully",
        });
        setShowCreateForm(false);
        fetchCourseTutorials(); // Refresh the list
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to create tutorial",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error creating tutorial:', error);
      toast({
        title: "Error",
        description: "Failed to create tutorial",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleShowCreateForm = () => {
    console.log('=== CREATE TUTORIAL BUTTON CLICKED ===');
    console.log('Current showCreateForm state:', showCreateForm);
    
    try {
      setShowCreateForm(true);
      console.log('State update called - should be true now');
      
      // Force a re-render check
      setTimeout(() => {
        console.log('After timeout - showCreateForm should be:', showCreateForm);
      }, 100);
      
    } catch (error) {
      console.error('Error in handleShowCreateForm:', error);
    }
  };

  const handleFileUpload = async (files: FileList, tutorialId: number) => {
    try {
      console.log('Starting file upload for tutorial:', tutorialId);
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        console.log(`Uploading file ${i + 1}/${files.length}:`, file.name, `(${file.size} bytes)`);
        
        const formData = new FormData();
        formData.append('file', file);
        
        const token = localStorage.getItem('authToken');
        console.log('Auth token present:', !!token);
        console.log('Upload URL:', `/api/instructor/courses/${courseId}/tutorials/${tutorialId}/files`);
        
        const response = await fetch(`/api/instructor/courses/${courseId}/tutorials/${tutorialId}/files`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          body: formData,
        });
        
        console.log('Response status:', response.status);
        console.log('Response headers:', {
          'content-type': response.headers.get('content-type'),
        });
        
        const data = await response.json();
        console.log('Response data:', data);
        
        if (data.success) {
          console.log('File uploaded successfully:', file.name);
          toast({
            title: "Success",
            description: `File "${file.name}" uploaded successfully`,
          });
        } else {
          console.error('File upload failed:', data.message);
          toast({
            title: "Error",
            description: `Failed to upload "${file.name}": ${data.message}`,
            variant: "destructive",
          });
        }
      }
      
      // Refresh the file list
      if (selectedTutorial) {
        fetchTutorialFiles(selectedTutorial.id);
      }
      
    } catch (error) {
      console.error('File upload error:', error);
      console.error('Error details:', {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
      toast({
        title: "Error",
        description: "Failed to upload files: " + (error instanceof Error ? error.message : String(error)),
        variant: "destructive",
      });
    }
  };

  const triggerFileUpload = () => {
    console.log('Trigger file upload clicked');
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.currentTarget.files;
    if (files && files.length > 0 && selectedTutorial) {
      console.log('Files selected:', files.length);
      
      // Check file sizes before upload
      const maxSize = 100 * 1024 * 1024; // 100MB
      const oversizedFiles = Array.from(files).filter(file => file.size > maxSize);
      
      if (oversizedFiles.length > 0) {
        toast({
          title: "File Too Large",
          description: `Files must be smaller than 100MB. Large files: ${oversizedFiles.map(f => f.name).join(', ')}`,
          variant: "destructive",
        });
        return;
      }
      
      await handleFileUpload(files, selectedTutorial.id);
      
      // Reset the input
      e.currentTarget.value = '';
    }
  };

  const handleEditTutorial = (tutorial: Tutorial) => {
    setEditingTutorial(tutorial);
    setEditFormData({
      title: tutorial.title,
      description: tutorial.description || '',
      difficulty_level: tutorial.difficulty_level || 'beginner',
      duration_minutes: tutorial.duration_minutes || 30,
      is_published: tutorial.is_published
    });
  };

  const handleSaveEdit = async () => {
    if (!editingTutorial) return;
    
    try {
      const response = await fetch(`/api/instructor/courses/${courseId}/tutorials/${editingTutorial.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editFormData)
      });

      const data = await response.json();
      
      if (data.success) {
        toast({
          title: "Success",
          description: "Tutorial updated successfully",
        });
        setEditingTutorial(null);
        fetchCourseTutorials();
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to update tutorial",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error updating tutorial:', error);
      toast({
        title: "Error",
        description: "Failed to update tutorial",
        variant: "destructive",
      });
    }
  };

  const handleCancelEdit = () => {
    setEditingTutorial(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Helper functions - defined before render
  const handleUploadVideo = async (file: File) => {
    if (!selectedTutorial) return;
    
    try {
      setIsUploadingVideo(true);
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch(`/api/instructor/courses/${courseId}/tutorials/${selectedTutorial.id}/files`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
        body: formData,
      });

      const data = await response.json();
      
      if (data.success) {
        toast({
          title: "Success",
          description: `Video "${file.name}" uploaded successfully`,
        });
        fetchTutorialFiles(selectedTutorial.id);
        setShowVideoUploadDialog(false);
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to upload video",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Video upload error:', error);
      toast({
        title: "Error",
        description: "Failed to upload video",
        variant: "destructive",
      });
    } finally {
      setIsUploadingVideo(false);
    }
  };

  const handleAddVideoLink = async (videoUrl: string, videoType: string, title: string) => {
    if (!selectedTutorial) return;
    
    try {
      setIsUploadingVideo(true);
      const response = await fetch(`/api/instructor/courses/${courseId}/tutorials/${selectedTutorial.id}/video-link`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          video_url: videoUrl,
          video_type: videoType,
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        toast({
          title: "Success",
          description: "Video link added successfully",
        });
        fetchTutorialFiles(selectedTutorial.id);
        setShowVideoUploadDialog(false);
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to add video link",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Add video link error:', error);
      toast({
        title: "Error",
        description: "Failed to add video link",
        variant: "destructive",
      });
    } finally {
      setIsUploadingVideo(false);
    }
  };

  const getVideoType = (url: string): 'youtube' | 'google_drive' | 'vimeo' | 'custom' => {
    if (url.includes('youtube.com') || url.includes('youtu.be')) return 'youtube';
    if (url.includes('drive.google.com')) return 'google_drive';
    if (url.includes('vimeo.com')) return 'vimeo';
    return 'custom';
  };

  const getFilteredFiles = () => {
    if (fileFilter === 'all') return tutorialFiles;
    if (fileFilter === 'videos') return tutorialFiles.filter(f => f.file_type === 'video' || f.video_url);
    if (fileFilter === 'documents') return tutorialFiles.filter(f => f.file_type !== 'video' && !f.video_url);
    return tutorialFiles;
  };

  const getFileIcon = (fileType: string) => {
    if (fileType === 'video') return '🎥';
    if (fileType === 'pdf') return '📄';
    if (fileType === 'doc') return '📝';
    if (fileType === 'ppt') return '📊';
    if (fileType === 'image') return '🖼️';
    return '📎';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Course Tutorials</h3>
          <p className="text-sm text-muted-foreground">{courseTitle}</p>
        </div>
        {canManage && (
          <div className="flex gap-2">
            <Button 
              onClick={() => {
                console.log('=== DIRECT CREATE TUTORIAL CLICK ===');
                setShowCreateForm(true);
                console.log('Direct state set to true');
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Tutorial
            </Button>
            <Button 
              variant="outline" 
              onClick={() => {
                alert('Test button clicked!');
                console.log('Test button clicked - this should work');
              }}
            >
              Test
            </Button>
          </div>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="tutorials">Tutorials</TabsTrigger>
          <TabsTrigger value="files" disabled={!selectedTutorial}>
            Files {selectedTutorial && `(${selectedTutorial.title})`}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="tutorials" className="space-y-4">
          {tutorials.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-4">No tutorials available for this course</p>
                {canManage && (
                  <Button onClick={() => {
                    console.log('=== CREATE FIRST TUTORIAL CLICK ===');
                    setShowCreateForm(true);
                    console.log('First tutorial state set to true');
                  }}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create First Tutorial
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {tutorials.map((tutorial) => (
                <Card key={tutorial.id} className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-base">{tutorial.title}</CardTitle>
                        {tutorial.description && (
                          <CardDescription className="mt-1">
                            {tutorial.description}
                          </CardDescription>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {getDifficultyBadge(tutorial.difficulty_level)}
                        <Badge variant={tutorial.is_published ? 'default' : 'secondary'}>
                          {tutorial.is_published ? 'Published' : 'Draft'}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDuration(tutorial.duration_minutes)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Eye className="h-3 w-3" />
                          {tutorial.views_count} views
                        </span>
                        <span>{new Date(tutorial.created_at).toLocaleDateString()}</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedTutorial(tutorial);
                            fetchTutorialFiles(tutorial.id);
                            setActiveTab('files');
                          }}
                        >
                          <FileText className="h-4 w-4 mr-1" />
                          View Files
                        </Button>
                        {canManage && (
                          <>
                            <Button variant="outline" size="sm" onClick={() => {
                              handleEditTutorial(tutorial);
                            }}>
                              <Edit className="h-4 w-4 mr-1" />
                              Edit
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => {
                              setSelectedTutorial(tutorial);
                              fetchTutorialFiles(tutorial.id);
                              setActiveTab('files');
                              // Trigger file upload after switching to files tab
                              setTimeout(() => {
                                if (fileInputRef.current) {
                                  fileInputRef.current.click();
                                }
                              }, 100);
                            }}>
                              <Upload className="h-4 w-4 mr-1" />
                              Upload
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="files" className="space-y-4">
          {selectedTutorial ? (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Tutorial Files</CardTitle>
                  <CardDescription>
                    Files for: {selectedTutorial.title}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* File Filter */}
                  <div className="flex gap-2">
                    <Button
                      variant={fileFilter === 'all' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setFileFilter('all')}
                    >
                      All Files
                    </Button>
                    <Button
                      variant={fileFilter === 'videos' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setFileFilter('videos')}
                    >
                      <Video className="h-4 w-4 mr-1" />
                      Videos
                    </Button>
                    <Button
                      variant={fileFilter === 'documents' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setFileFilter('documents')}
                    >
                      <FileText className="h-4 w-4 mr-1" />
                      Documents
                    </Button>
                  </div>

                  {/* Upload Section */}
                  {canManage && (
                    <div className="flex gap-2 pt-2 border-t">
                      <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        accept=".pdf,.doc,.docx,.txt,.ppt,.pptx,.xls,.xlsx,.zip,.rar,.jpg,.jpeg,.png,.gif,.mp4,.avi,.mov,.mkv"
                        onChange={handleFileInputChange}
                        style={{ display: 'none' }}
                      />
                      <Button 
                        size="sm" 
                        onClick={triggerFileUpload}
                        disabled={isUploadingVideo}
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        {isUploadingVideo ? 'Uploading...' : 'Upload Files'}
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => setShowVideoUploadDialog(true)}
                        disabled={isUploadingVideo}
                      >
                        <Video className="h-4 w-4 mr-2" />
                        Add Video Link
                      </Button>
                    </div>
                  )}

                  {/* Files List */}
                  {getFilteredFiles().length === 0 ? (
                    <div className="text-center py-8">
                      {fileFilter === 'videos' ? (
                        <>
                          <Video className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                          <p className="text-muted-foreground mb-4">No videos uploaded yet</p>
                        </>
                      ) : fileFilter === 'documents' ? (
                        <>
                          <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                          <p className="text-muted-foreground mb-4">No documents uploaded yet</p>
                        </>
                      ) : (
                        <>
                          <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                          <p className="text-muted-foreground mb-4">No files uploaded yet</p>
                        </>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {getFilteredFiles().map((file) => (
                        <div key={file.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                          <div className="flex items-center gap-3 flex-1">
                            {file.video_url || file.file_type === 'video' ? (
                              <Video className="h-5 w-5 text-blue-500" />
                            ) : (
                              <FileText className="h-5 w-5 text-muted-foreground" />
                            )}
                            <div className="flex-1">
                              <p className="font-medium">{file.file_name}</p>
                              <p className="text-sm text-muted-foreground">
                                {file.file_size ? formatFileSize(file.file_size) : 'External'} • {new Date(file.uploaded_at).toLocaleDateString()}
                                {file.duration_seconds && ` • ${Math.floor(file.duration_seconds / 60)}m`}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {file.video_url || file.file_type === 'video' ? (
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => {
                                  setSelectedVideo(file);
                                  setShowVideoPlayer(true);
                                }}
                              >
                                <Play className="h-4 w-4 mr-1" />
                                Play
                              </Button>
                            ) : (
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => {
                                  const token = localStorage.getItem('authToken');
                                  const downloadUrl = `/api/tutorial-files/files/${file.id}/download`;
                                  
                                  // Use fetch with authorization header
                                  fetch(downloadUrl, {
                                    headers: {
                                      'Authorization': `Bearer ${token}`,
                                    },
                                  })
                                    .then(response => {
                                      if (!response.ok) {
                                        return response.json().then(data => {
                                          throw new Error(data.message || 'Download failed');
                                        });
                                      }
                                      return response.blob();
                                    })
                                    .then(blob => {
                                      const url = window.URL.createObjectURL(blob);
                                      const link = document.createElement('a');
                                      link.href = url;
                                      link.download = file.file_name;
                                      link.click();
                                      window.URL.revokeObjectURL(url);
                                    })
                                    .catch(error => {
                                      console.error('Download error:', error);
                                      toast({
                                        title: "Error",
                                        description: error.message || "Failed to download file",
                                        variant: "destructive",
                                      });
                                    });
                                }}
                              >
                                <Download className="h-4 w-4 mr-1" />
                                Download
                              </Button>
                            )}
                            {canManage && (
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={async () => {
                                  if (confirm(`Are you sure you want to delete "${file.file_name}"?`)) {
                                    try {
                                      const response = await fetch(`/api/instructor/courses/${courseId}/tutorials/${selectedTutorial?.id}/files/${file.id}`, {
                                        method: 'DELETE',
                                        headers: {
                                          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
                                        },
                                      });
                                      
                                      const data = await response.json();
                                      
                                      if (data.success) {
                                        toast({
                                          title: "Success",
                                          description: `File "${file.file_name}" deleted successfully`,
                                        });
                                        if (selectedTutorial) {
                                          fetchTutorialFiles(selectedTutorial.id);
                                        }
                                      } else {
                                        toast({
                                          title: "Error",
                                          description: data.message || "Failed to delete file",
                                          variant: "destructive",
                                        });
                                      }
                                    } catch (error) {
                                      console.error('Delete file error:', error);
                                      toast({
                                        title: "Error",
                                        description: "Failed to delete file",
                                        variant: "destructive",
                                      });
                                    }
                                  }
                                }}
                              >
                                <Trash2 className="h-4 w-4 mr-1" />
                                Delete
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-8">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  Select a tutorial from the "Tutorials" tab to view its files
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Tutorial Creation Dialog */}
      {showCreateForm && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          style={{ zIndex: 9999 }}
        >
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-green-600">✅ CREATE NEW TUTORIAL</h2>
              <button 
                onClick={() => {
                  console.log('Closing dialog');
                  setShowCreateForm(false);
                }}
                className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
              >
                ✕
              </button>
            </div>
            <p className="text-gray-600 mb-4">Create a new tutorial for {courseTitle}</p>
            <div className="bg-green-100 p-4 rounded mb-4">
              <p className="text-green-800 font-semibold">🎉 SUCCESS! The dialog is working!</p>
              <p className="text-green-700">The Create Tutorial button is now functional.</p>
            </div>
            <TutorialCreateForm
              onSubmit={handleCreateTutorial}
              onCancel={() => setShowCreateForm(false)}
              isLoading={isCreating}
            />
          </div>
        </div>
      )}

      {/* Original Dialog (commented out for testing) */}
      {/* 
      <Dialog open={showCreateForm} onOpenChange={setShowCreateForm}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Create New Tutorial</DialogTitle>
            <DialogDescription>
              Create a new tutorial for {courseTitle}
            </DialogDescription>
          </DialogHeader>
          <TutorialCreateForm
            onSubmit={handleCreateTutorial}
            onCancel={() => setShowCreateForm(false)}
            isLoading={isCreating}
          />
        </DialogContent>
      </Dialog>
      */}

      {/* Debug info */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-4 right-4 bg-black text-white p-2 text-xs rounded">
          showCreateForm: {showCreateForm.toString()}
        </div>
      )}

      {/* Video Player Dialog */}
      {showVideoPlayer && selectedVideo && (
        <VideoPlayer 
          isOpen={showVideoPlayer}
          onClose={() => setShowVideoPlayer(false)}
          videoUrl={selectedVideo.video_url || selectedVideo.file_path || ''}
          videoType={selectedVideo.video_type as any}
          title={selectedVideo.file_name}
          thumbnail={selectedVideo.thumbnail_url}
        />
      )}

      {/* Video Upload Dialog */}
      {showVideoUploadDialog && selectedTutorial && (
        <VideoUploadDialog
          isOpen={showVideoUploadDialog}
          onClose={() => setShowVideoUploadDialog(false)}
          onUpload={handleUploadVideo}
          onAddLink={handleAddVideoLink}
          isLoading={isUploadingVideo}
        />
      )}

      {/* Edit Tutorial Dialog */}
      {editingTutorial && (
        <Dialog open={!!editingTutorial} onOpenChange={(open) => {
          if (!open) handleCancelEdit();
        }}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Edit Tutorial</DialogTitle>
              <DialogDescription>
                Update tutorial details for {editingTutorial.title}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-title">Tutorial Title</Label>
                <Input
                  id="edit-title"
                  value={editFormData.title}
                  onChange={(e) => setEditFormData({...editFormData, title: e.target.value})}
                  placeholder="Enter tutorial title"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  value={editFormData.description}
                  onChange={(e) => setEditFormData({...editFormData, description: e.target.value})}
                  placeholder="Brief description of the tutorial"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-difficulty">Difficulty Level</Label>
                  <Select value={editFormData.difficulty_level} onValueChange={(value) => setEditFormData({...editFormData, difficulty_level: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="beginner">Beginner</SelectItem>
                      <SelectItem value="intermediate">Intermediate</SelectItem>
                      <SelectItem value="advanced">Advanced</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-duration">Duration (minutes)</Label>
                  <Input
                    id="edit-duration"
                    type="number"
                    value={editFormData.duration_minutes}
                    onChange={(e) => setEditFormData({...editFormData, duration_minutes: parseInt(e.target.value) || 0})}
                    min="1"
                    max="300"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="edit-published"
                  checked={editFormData.is_published}
                  onChange={(e) => setEditFormData({...editFormData, is_published: e.target.checked})}
                  className="rounded border-gray-300"
                />
                <Label htmlFor="edit-published">Publish</Label>
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button variant="outline" onClick={handleCancelEdit}>
                  Cancel
                </Button>
                <Button onClick={handleSaveEdit}>
                  Save Changes
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

// Tutorial Creation Form Component
interface TutorialCreateFormProps {
  onSubmit: (data: any) => void;
  onCancel: () => void;
  isLoading: boolean;
}

function TutorialCreateForm({ onSubmit, onCancel, isLoading }: TutorialCreateFormProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    content: '',
    difficulty_level: 'beginner',
    duration_minutes: 30,
    is_published: false
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="title">Tutorial Title</Label>
        <Input
          id="title"
          value={formData.title}
          onChange={(e) => handleChange('title', e.target.value)}
          placeholder="Enter tutorial title"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => handleChange('description', e.target.value)}
          placeholder="Brief description of the tutorial"
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="content">Content</Label>
        <Textarea
          id="content"
          value={formData.content}
          onChange={(e) => handleChange('content', e.target.value)}
          placeholder="Tutorial content and instructions"
          rows={5}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="difficulty">Difficulty Level</Label>
          <Select value={formData.difficulty_level} onValueChange={(value) => handleChange('difficulty_level', value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="beginner">Beginner</SelectItem>
              <SelectItem value="intermediate">Intermediate</SelectItem>
              <SelectItem value="advanced">Advanced</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="duration">Duration (minutes)</Label>
          <Input
            id="duration"
            type="number"
            value={formData.duration_minutes}
            onChange={(e) => handleChange('duration_minutes', parseInt(e.target.value) || 0)}
            min="1"
            max="300"
          />
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="published"
          checked={formData.is_published}
          onChange={(e) => handleChange('is_published', e.target.checked)}
          className="rounded border-gray-300"
        />
        <Label htmlFor="published">Publish immediately</Label>
      </div>

      <div className="flex justify-end space-x-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Creating...' : 'Create Tutorial'}
        </Button>
      </div>
    </form>
  );
}

export default CourseTutorialManager;
