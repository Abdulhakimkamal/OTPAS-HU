import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  BookOpen, 
  User, 
  Calendar, 
  Clock, 
  Star, 
  ArrowLeft, 
  CheckCircle,
  AlertCircle,
  Play,
  Eye,
  Download,
  Video
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { VideoPlayer } from '@/components/tutorial/VideoPlayer';

interface Tutorial {
  id: number;
  title: string;
  description: string;
  content: string;
  course_title: string;
  instructor_name: string;
  duration_minutes: number;
  difficulty_level: string;
  views_count: number;
  created_at: string;
  video_url?: string;
  file_url?: string;
}

export default function TutorialViewer() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  
  const [tutorial, setTutorial] = useState<Tutorial | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState('');
  const [rating, setRating] = useState(0);
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
  const [tutorialFiles, setTutorialFiles] = useState<any[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<any | null>(null);
  const [showVideoPlayer, setShowVideoPlayer] = useState(false);

  useEffect(() => {
    if (id) {
      fetchTutorial(parseInt(id));
    }
  }, [id]);

  const fetchTutorial = async (tutorialId: number) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('authToken');
      
      const response = await fetch(`/api/student/tutorials`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch tutorial');
      }

      const data = await response.json();
      // Fix: Use data.data instead of data.tutorials
      const foundTutorial = data.data?.find((t: Tutorial) => t.id === tutorialId);
      
      if (!foundTutorial) {
        throw new Error('Tutorial not found');
      }

      setTutorial(foundTutorial);
      
      // Fetch tutorial files
      await fetchTutorialFiles(tutorialId, token);
    } catch (error) {
      console.error('Error fetching tutorial:', error);
      setError('Failed to load tutorial');
    } finally {
      setLoading(false);
    }
  };

  const fetchTutorialFiles = async (tutorialId: number, token: string) => {
    try {
      const response = await fetch(`/api/tutorial-files/tutorials/${tutorialId}/files`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setTutorialFiles(data.files || []);
      }
    } catch (error) {
      console.error('Error fetching tutorial files:', error);
    }
  };

  const submitFeedback = async () => {
    // Client-side validation
    if (!tutorial || !feedback.trim() || rating === 0) {
      toast({
        title: "Error",
        description: "Please provide both feedback and rating",
        variant: "destructive",
      });
      return;
    }

    if (feedback.trim().length < 5) {
      toast({
        title: "Error",
        description: "Feedback must be at least 5 characters long",
        variant: "destructive",
      });
      return;
    }

    if (feedback.trim().length > 1000) {
      toast({
        title: "Error",
        description: "Feedback must not exceed 1000 characters",
        variant: "destructive",
      });
      return;
    }

    try {
      setSubmittingFeedback(true);
      const token = localStorage.getItem('authToken');
      
      const response = await fetch('/api/student/feedback', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          feedback_text: feedback.trim(),
          rating: rating,
          tutorial_id: tutorial.id
        })
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle validation errors from backend
        if (data.errors && Array.isArray(data.errors)) {
          const errorMessages = data.errors.map((err: any) => err.message).join(', ');
          toast({
            title: "Validation Error",
            description: errorMessages,
            variant: "destructive",
          });
        } else {
          toast({
            title: "Error",
            description: data.message || "Failed to submit feedback",
            variant: "destructive",
          });
        }
        return;
      }

      toast({
        title: "Success",
        description: "Feedback submitted successfully",
      });

      setFeedback('');
      setRating(0);
    } catch (error) {
      console.error('Error submitting feedback:', error);
      toast({
        title: "Error",
        description: "Failed to submit feedback. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmittingFeedback(false);
    }
  };

  const getDifficultyColor = (level: string) => {
    switch (level.toLowerCase()) {
      case 'beginner': return 'bg-green-100 text-green-800';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'advanced': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getVideoThumbnail = (file: any) => {
    // If thumbnail_url exists, use it
    if (file.thumbnail_url) {
      return file.thumbnail_url;
    }
    
    // If it's a YouTube video, generate thumbnail URL
    if (file.video_url && (file.video_url.includes('youtube.com') || file.video_url.includes('youtu.be'))) {
      const youtubeRegex = /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/;
      const match = file.video_url.match(youtubeRegex);
      if (match && match[1]) {
        return `https://img.youtube.com/vi/${match[1]}/mqdefault.jpg`;
      }
    }
    
    return null;
  };

  const handlePlayVideo = (file: any) => {
    setSelectedVideo(file);
    setShowVideoPlayer(true);
  };

  const handleDownloadFile = async (fileId: number, fileName: string) => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`/api/tutorial-files/files/${fileId}/download`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      });

      if (!response.ok) {
        // Check if it's a JSON error response
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const errorData = await response.json();
          toast({
            title: "Download Error",
            description: errorData.message || "Failed to download file",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Download Error",
            description: `Server returned ${response.status}: ${response.statusText}`,
            variant: "destructive",
          });
        }
        return;
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast({
        title: "Success",
        description: `${fileName} downloaded successfully`,
      });
    } catch (error) {
      console.error('Download error:', error);
      toast({
        title: "Download Error",
        description: "Failed to download file. Please try again.",
        variant: "destructive",
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading tutorial...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !tutorial) {
    return (
      <DashboardLayout>
        <Alert className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error || 'Tutorial not found'}</AlertDescription>
        </Alert>
        <Button onClick={() => navigate('/student/tutorials')} variant="outline">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Tutorials
        </Button>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 overflow-x-hidden">
        {/* Video Player Modal */}
        {selectedVideo && (
          <VideoPlayer
            isOpen={showVideoPlayer}
            onClose={() => {
              setShowVideoPlayer(false);
              setSelectedVideo(null);
            }}
            videoUrl={selectedVideo.video_url}
            videoType={selectedVideo.video_type}
            title={selectedVideo.file_name}
            thumbnail={getVideoThumbnail(selectedVideo)}
          />
        )}

        {/* Header */}
        <div className="flex items-center justify-between">
          <Button onClick={() => navigate('/student/tutorials')} variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Tutorials
          </Button>
          <div className="flex items-center space-x-2">
            <Badge className={getDifficultyColor(tutorial.difficulty_level)}>
              {tutorial.difficulty_level}
            </Badge>
            <Badge variant="outline">
              <Eye className="h-3 w-3 mr-1" />
              {tutorial.views_count} views
            </Badge>
          </div>
        </div>

        {/* Tutorial Header */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="text-2xl mb-2">{tutorial.title}</CardTitle>
                <CardDescription className="text-base mb-4">
                  {tutorial.description}
                </CardDescription>
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <div className="flex items-center space-x-1">
                    <User className="h-4 w-4" />
                    <span>{tutorial.instructor_name}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <BookOpen className="h-4 w-4" />
                    <span>{tutorial.course_title}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Clock className="h-4 w-4" />
                    <span>{tutorial.duration_minutes} minutes</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Calendar className="h-4 w-4" />
                    <span>{formatDate(tutorial.created_at)}</span>
                  </div>
                </div>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Video Player (if video_url exists) */}
        {tutorial.video_url && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Play className="h-5 w-5 mr-2" />
                Video Tutorial
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
                <p className="text-gray-600">Video player would be implemented here</p>
                <p className="text-sm text-gray-500 ml-2">({tutorial.video_url})</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tutorial Content */}
        <Card>
          <CardHeader>
            <CardTitle>Tutorial Content</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose max-w-none">
              <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">
                {tutorial.content}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tutorial Files */}
        {tutorialFiles.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Tutorial Materials</CardTitle>
              <CardDescription>
                Videos and documents for this tutorial
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Video Files Grid */}
              {tutorialFiles.filter(file => file.video_url).length > 0 && (
                <div className="mb-6">
                  <h4 className="font-medium mb-3 text-gray-900">Videos</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {tutorialFiles.filter(file => file.video_url).map((file) => (
                      <div key={file.id} className="group cursor-pointer" onClick={() => handlePlayVideo(file)}>
                        <div className="relative w-full aspect-video bg-gray-100 rounded-lg overflow-hidden">
                          {getVideoThumbnail(file) ? (
                            <>
                              <img 
                                src={getVideoThumbnail(file)} 
                                alt={`${file.file_name} thumbnail`}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                                onError={(e) => {
                                  const target = e.currentTarget;
                                  target.style.display = 'none';
                                  const fallback = target.parentElement?.querySelector('.thumbnail-fallback') as HTMLElement;
                                  if (fallback) fallback.style.display = 'flex';
                                }}
                              />
                              <div className="absolute inset-0 bg-black bg-opacity-30 group-hover:bg-opacity-40 flex items-center justify-center transition-all duration-200">
                                <div className="bg-white bg-opacity-90 rounded-full p-3 group-hover:scale-110 transition-transform duration-200">
                                  <Play className="h-6 w-6 text-gray-800" />
                                </div>
                              </div>
                              <div className="thumbnail-fallback absolute inset-0 bg-gray-100 flex items-center justify-center" style={{display: 'none'}}>
                                <Video className="h-8 w-8 text-gray-600" />
                              </div>
                            </>
                          ) : (
                            <div className="absolute inset-0 bg-gray-100 flex items-center justify-center group-hover:bg-gray-200 transition-colors duration-200">
                              <Video className="h-8 w-8 text-gray-600" />
                            </div>
                          )}
                          
                          {/* Duration Badge */}
                          {file.duration_seconds && (
                            <div className="absolute bottom-2 right-2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded">
                              {Math.floor(file.duration_seconds / 60)}:{(file.duration_seconds % 60).toString().padStart(2, '0')}
                            </div>
                          )}
                        </div>
                        
                        <div className="mt-2">
                          <p className="font-medium text-sm truncate group-hover:text-blue-600 transition-colors duration-200">
                            {file.file_name}
                          </p>
                          <p className="text-xs text-gray-600">
                            🎥 Video
                            {file.file_size && ` • ${(file.file_size / 1024 / 1024).toFixed(2)} MB`}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Document Files List */}
              {tutorialFiles.filter(file => !file.video_url).length > 0 && (
                <div>
                  <h4 className="font-medium mb-3 text-gray-900">Documents</h4>
                  <div className="space-y-3">
                    {tutorialFiles.filter(file => !file.video_url).map((file) => (
                      <div key={file.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                        <div className="flex items-center space-x-3 flex-1 min-w-0 pr-4">
                          <div className="w-12 h-12 bg-gray-100 rounded flex items-center justify-center flex-shrink-0">
                            <div className="text-2xl">📄</div>
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{file.file_name}</p>
                            <p className="text-sm text-gray-600">
                              📄 Document
                              {file.file_size && ` • ${(file.file_size / 1024 / 1024).toFixed(2)} MB`}
                            </p>
                          </div>
                        </div>
                        
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleDownloadFile(file.id, file.file_name)}
                          className="whitespace-nowrap flex-shrink-0"
                        >
                          <Download className="h-4 w-4 mr-1" />
                          Download
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* File Download (if file_url exists) */}
        {tutorial.file_url && (
          <Card>
            <CardHeader>
              <CardTitle>Additional Resources</CardTitle>
            </CardHeader>
            <CardContent>
              <Button 
                variant="outline" 
                onClick={() => {
                  // Handle direct file URL download
                  const link = document.createElement('a');
                  link.href = tutorial.file_url;
                  link.setAttribute('download', `${tutorial.title}_materials`);
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                }}
              >
                <Download className="h-4 w-4 mr-2" />
                Download Tutorial Materials
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Feedback Section */}
        <Card>
          <CardHeader>
            <CardTitle>Provide Feedback</CardTitle>
            <CardDescription>
              Help improve this tutorial by sharing your thoughts and rating
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Rating */}
            <div>
              <label className="block text-sm font-medium mb-2">Rating</label>
              <div className="flex items-center space-x-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setRating(star)}
                    className={`p-1 ${
                      star <= rating ? 'text-yellow-400' : 'text-gray-300'
                    } hover:text-yellow-400 transition-colors`}
                  >
                    <Star className="h-5 w-5 fill-current" />
                  </button>
                ))}
                <span className="ml-2 text-sm text-gray-600">
                  {rating > 0 ? `${rating}/5` : 'Select rating'}
                </span>
              </div>
            </div>

            {/* Feedback Text */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium">Feedback</label>
                <span className={`text-xs ${
                  feedback.length < 5 ? 'text-red-500' : 
                  feedback.length > 1000 ? 'text-red-500' : 
                  'text-gray-500'
                }`}>
                  {feedback.length}/1000 characters {feedback.length < 5 && feedback.length > 0 ? '(minimum 5)' : ''}
                </span>
              </div>
              <Textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Share your thoughts about this tutorial... (minimum 5 characters)"
                rows={4}
                maxLength={1000}
                className={
                  feedback.length > 0 && feedback.length < 5 ? 'border-red-300 focus:border-red-500' : ''
                }
              />
              {feedback.length > 0 && feedback.length < 5 && (
                <p className="text-xs text-red-500 mt-1">
                  Please write at least 5 characters
                </p>
              )}
            </div>

            <Button 
              onClick={submitFeedback}
              disabled={submittingFeedback || !feedback.trim() || rating === 0 || feedback.trim().length < 5}
            >
              {submittingFeedback ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              ) : (
                <CheckCircle className="h-4 w-4 mr-2" />
              )}
              Submit Feedback
            </Button>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}