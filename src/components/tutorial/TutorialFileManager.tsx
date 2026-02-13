import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Upload, 
  FileText, 
  Video, 
  Download, 
  Trash2, 
  AlertCircle,
  CheckCircle,
  Clock,
  User
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface TutorialFile {
  id: number;
  file_name: string;
  file_type: string;
  file_size: number;
  description?: string;
  uploaded_by_name: string;
  upload_date: string;
  download_count: number;
}

interface TutorialVideo {
  id: number;
  video_title: string;
  video_type: string;
  file_size: number;
  duration_seconds?: number;
  description?: string;
  uploaded_by_name: string;
  upload_date: string;
  view_count: number;
}

interface TutorialFileManagerProps {
  tutorialId: number;
  tutorialTitle: string;
  userRole: string;
  canUpload: boolean;
}

export function TutorialFileManager({ 
  tutorialId, 
  tutorialTitle, 
  userRole, 
  canUpload 
}: TutorialFileManagerProps) {
  const [files, setFiles] = useState<TutorialFile[]>([]);
  const [videos, setVideos] = useState<TutorialVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<File | null>(null);
  const [fileDescription, setFileDescription] = useState('');
  const [videoDescription, setVideoDescription] = useState('');
  const [videoTitle, setVideoTitle] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    fetchTutorialMaterials();
  }, [tutorialId]);

  const fetchTutorialMaterials = async () => {
    try {
      setLoading(true);
      
      // Fetch files
      const filesResponse = await fetch(`/api/tutorial-files/tutorials/${tutorialId}/files`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      
      if (filesResponse.ok) {
        const filesData = await filesResponse.json();
        setFiles(filesData.files || []);
      }

      // Fetch videos
      const videosResponse = await fetch(`/api/tutorial-files/tutorials/${tutorialId}/videos`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      
      if (videosResponse.ok) {
        const videosData = await videosResponse.json();
        setVideos(videosData.videos || []);
      }

    } catch (error) {
      console.error('Error fetching tutorial materials:', error);
      toast({
        title: "Error",
        description: "Failed to load tutorial materials",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async () => {
    if (!selectedFile) return;

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('description', fileDescription);

      const response = await fetch(`/api/tutorial-files/tutorials/${tutorialId}/files`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "Success",
          description: "File uploaded successfully",
        });
        setSelectedFile(null);
        setFileDescription('');
        fetchTutorialMaterials();
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to upload file",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      toast({
        title: "Error",
        description: "Failed to upload file",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleVideoUpload = async () => {
    if (!selectedVideo) return;

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('video', selectedVideo);
      formData.append('video_title', videoTitle || selectedVideo.name);
      formData.append('description', videoDescription);

      const response = await fetch(`/api/tutorial-files/tutorials/${tutorialId}/videos`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "Success",
          description: "Video uploaded successfully",
        });
        setSelectedVideo(null);
        setVideoTitle('');
        setVideoDescription('');
        fetchTutorialMaterials();
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to upload video",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error uploading video:', error);
      toast({
        title: "Error",
        description: "Failed to upload video",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (fileId: number, fileName: string) => {
    try {
      const response = await fetch(`/api/tutorial-files/files/${fileId}/download`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        toast({
          title: "Error",
          description: "Failed to download file",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error downloading file:', error);
      toast({
        title: "Error",
        description: "Failed to download file",
        variant: "destructive",
      });
    }
  };

  const handleDeleteFile = async (fileId: number) => {
    if (!confirm('Are you sure you want to delete this file?')) return;

    try {
      const response = await fetch(`/api/tutorial-files/files/${fileId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "File deleted successfully",
        });
        fetchTutorialMaterials();
      } else {
        const data = await response.json();
        toast({
          title: "Error",
          description: data.message || "Failed to delete file",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error deleting file:', error);
      toast({
        title: "Error",
        description: "Failed to delete file",
        variant: "destructive",
      });
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Tutorial Materials</h2>
          <p className="text-muted-foreground">{tutorialTitle}</p>
        </div>
        {userRole === 'department_head' && (
          <Badge variant="outline" className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            Read-Only Access
          </Badge>
        )}
      </div>

      {/* Upload Section - Only for Instructors and Admins */}
      {canUpload && (
        <div className="grid gap-6 md:grid-cols-2">
          {/* File Upload */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Upload File
              </CardTitle>
              <CardDescription>
                Upload documents, PDFs, presentations, and other files
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="file-upload">Select File</Label>
                <Input
                  id="file-upload"
                  type="file"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,.zip,.rar"
                />
              </div>
              <div>
                <Label htmlFor="file-description">Description (Optional)</Label>
                <Textarea
                  id="file-description"
                  placeholder="Describe the file content..."
                  value={fileDescription}
                  onChange={(e) => setFileDescription(e.target.value)}
                />
              </div>
              <Button 
                onClick={handleFileUpload}
                disabled={!selectedFile || uploading}
                className="w-full"
              >
                {uploading ? (
                  <>
                    <Clock className="h-4 w-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload File
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Video Upload */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Video className="h-5 w-5" />
                Upload Video
              </CardTitle>
              <CardDescription>
                Upload tutorial videos and lectures
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="video-upload">Select Video</Label>
                <Input
                  id="video-upload"
                  type="file"
                  onChange={(e) => setSelectedVideo(e.target.files?.[0] || null)}
                  accept=".mp4,.avi,.mov,.wmv,.flv"
                />
              </div>
              <div>
                <Label htmlFor="video-title">Video Title</Label>
                <Input
                  id="video-title"
                  placeholder="Enter video title..."
                  value={videoTitle}
                  onChange={(e) => setVideoTitle(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="video-description">Description (Optional)</Label>
                <Textarea
                  id="video-description"
                  placeholder="Describe the video content..."
                  value={videoDescription}
                  onChange={(e) => setVideoDescription(e.target.value)}
                />
              </div>
              <Button 
                onClick={handleVideoUpload}
                disabled={!selectedVideo || uploading}
                className="w-full"
              >
                {uploading ? (
                  <>
                    <Clock className="h-4 w-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Video
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Files List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Files ({files.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {files.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No files uploaded yet</p>
          ) : (
            <div className="space-y-4">
              {files.map((file) => (
                <div key={file.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <FileText className="h-8 w-8 text-blue-500" />
                    <div>
                      <h4 className="font-medium">{file.file_name}</h4>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {file.uploaded_by_name}
                        </span>
                        <span>{formatFileSize(file.file_size)}</span>
                        <span>{new Date(file.upload_date).toLocaleDateString()}</span>
                        <span>{file.download_count} downloads</span>
                      </div>
                      {file.description && (
                        <p className="text-sm text-muted-foreground mt-1">{file.description}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownload(file.id, file.file_name)}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    {canUpload && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteFile(file.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Videos List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Video className="h-5 w-5" />
            Videos ({videos.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {videos.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No videos uploaded yet</p>
          ) : (
            <div className="space-y-4">
              {videos.map((video) => (
                <div key={video.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Video className="h-8 w-8 text-red-500" />
                    <div>
                      <h4 className="font-medium">{video.video_title}</h4>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {video.uploaded_by_name}
                        </span>
                        <span>{formatFileSize(video.file_size)}</span>
                        {video.duration_seconds && (
                          <span>{formatDuration(video.duration_seconds)}</span>
                        )}
                        <span>{new Date(video.upload_date).toLocaleDateString()}</span>
                        <span>{video.view_count} views</span>
                      </div>
                      {video.description && (
                        <p className="text-sm text-muted-foreground mt-1">{video.description}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownload(video.id, video.video_title)}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    {canUpload && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteFile(video.id)}
                      >
                        <Trash2 className="h-4 w-4" />
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
  );
}