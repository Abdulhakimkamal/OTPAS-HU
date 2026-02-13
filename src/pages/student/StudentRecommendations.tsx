import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Lightbulb, BookOpen, FolderOpen, Users, TrendingUp, Clock, CheckCircle, AlertCircle, User } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface InstructorRecommendation {
  id: string;
  instructor_name: string;
  instructor_email: string;
  recommendation_type: 'Academic' | 'Project' | 'Skill' | 'Performance' | 'Career' | 'Mentorship';
  title: string;
  description: string;
  priority_level: 'Low' | 'Medium' | 'High';
  status: 'Draft' | 'Submitted' | 'Reviewed';
  is_read: boolean;
  course_title?: string;
  course_code?: string;
  created_at: string;
  updated_at: string;
}

interface SystemRecommendation {
  id: string;
  type: 'tutorial' | 'project' | 'instructor' | 'skillPath';
  title: string;
  description: string;
  priority?: 'low' | 'medium' | 'high';
  category?: string;
  score?: number;
  course_title?: string;
  instructor_name?: string;
  views_count?: number;
  full_name?: string;
  email?: string;
  department?: string;
  avg_rating?: number;
  feedback_count?: string;
  subject?: string;
  currentScore?: number;
  recommendedTutorials?: any[];
}

interface RecommendationData {
  tutorials: SystemRecommendation[];
  projects: SystemRecommendation[];
  instructors: SystemRecommendation[];
  skillPaths: SystemRecommendation[];
}

export default function StudentRecommendations() {
  const [systemRecommendations, setSystemRecommendations] = useState<RecommendationData | null>(null);
  const [instructorRecommendations, setInstructorRecommendations] = useState<InstructorRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchRecommendations();
  }, []);

  const fetchRecommendations = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('authToken');
      
      // Fetch both system and instructor recommendations
      const [systemResponse, instructorResponse] = await Promise.all([
        fetch('/api/student/recommendations', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }),
        fetch('/api/student/instructor-recommendations', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })
      ]);

      if (!systemResponse.ok || !instructorResponse.ok) {
        throw new Error('Failed to fetch recommendations');
      }

      const systemData = await systemResponse.json();
      const instructorData = await instructorResponse.json();

      setSystemRecommendations(systemData.recommendations);
      setInstructorRecommendations(instructorData.recommendations || []);
    } catch (error) {
      console.error('Error fetching recommendations:', error);
      setError('Failed to load recommendations');
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (recommendationId: string) => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`/api/student/instructor-recommendations/${recommendationId}/read`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to mark as read');
      }

      // Update local state
      setInstructorRecommendations(prev => 
        prev.map(rec => 
          rec.id === recommendationId 
            ? { ...rec, is_read: true }
            : rec
        )
      );

      toast({
        title: "Success",
        description: "Recommendation marked as read",
      });
    } catch (error) {
      console.error('Error marking as read:', error);
      toast({
        title: "Error",
        description: "Failed to mark recommendation as read",
        variant: "destructive",
      });
    }
  };

  const getPriorityColor = (priority: string) => {
    if (!priority) return 'bg-gray-100 text-gray-800';
    
    switch (priority.toLowerCase()) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (type: string) => {
    if (!type) return <Lightbulb className="h-4 w-4" />;
    
    switch (type.toLowerCase()) {
      case 'academic': return <BookOpen className="h-4 w-4" />;
      case 'project': return <FolderOpen className="h-4 w-4" />;
      case 'skill': return <TrendingUp className="h-4 w-4" />;
      case 'performance': return <TrendingUp className="h-4 w-4" />;
      case 'career': return <Users className="h-4 w-4" />;
      case 'mentorship': return <User className="h-4 w-4" />;
      default: return <Lightbulb className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading recommendations...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <Alert className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Recommendations</h1>
          <p className="text-gray-600">Personalized guidance to enhance your learning journey</p>
        </div>

        <Tabs defaultValue="instructor" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="instructor" className="flex items-center space-x-2">
              <User className="h-4 w-4" />
              <span>Instructor Recommendations</span>
              {instructorRecommendations.filter(r => !r.is_read).length > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {instructorRecommendations.filter(r => !r.is_read).length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="system" className="flex items-center space-x-2">
              <Lightbulb className="h-4 w-4" />
              <span>System Recommendations</span>
            </TabsTrigger>
          </TabsList>

          {/* Instructor Recommendations Tab */}
          <TabsContent value="instructor" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="h-5 w-5 mr-2" />
                  Instructor Recommendations ({instructorRecommendations.length})
                </CardTitle>
                <CardDescription>
                  Personalized guidance from your instructors based on your performance and progress
                </CardDescription>
              </CardHeader>
              <CardContent>
                {instructorRecommendations.length === 0 ? (
                  <div className="text-center py-8">
                    <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No instructor recommendations yet</p>
                    <p className="text-sm text-gray-500">Your instructors will provide personalized guidance here</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {instructorRecommendations.map((recommendation) => (
                      <div 
                        key={recommendation.id} 
                        className={`border rounded-lg p-4 ${!recommendation.is_read ? 'bg-blue-50 border-blue-200' : 'hover:bg-gray-50'}`}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              {getTypeIcon(recommendation.recommendation_type)}
                              <h3 className="font-semibold text-gray-900">{recommendation.title}</h3>
                              <Badge className={getPriorityColor(recommendation.priority_level)}>
                                {recommendation.priority_level}
                              </Badge>
                              <Badge variant="outline">{recommendation.recommendation_type}</Badge>
                              {!recommendation.is_read && (
                                <Badge variant="destructive">New</Badge>
                              )}
                            </div>
                            <p className="text-sm text-gray-600 mb-2">
                              <strong>From:</strong> {recommendation.instructor_name}
                              {recommendation.course_title && (
                                <span> • <strong>Course:</strong> {recommendation.course_title} ({recommendation.course_code})</span>
                              )}
                            </p>
                            <p className="text-gray-700 mb-3">{recommendation.description}</p>
                            <p className="text-xs text-gray-500">
                              Received: {new Date(recommendation.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="ml-4">
                            {!recommendation.is_read && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => markAsRead(recommendation.id)}
                              >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Mark as Read
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* System Recommendations Tab */}
          <TabsContent value="system" className="space-y-4">
            {systemRecommendations && (
              <>
                {/* Tutorials Section */}
                {systemRecommendations.tutorials && systemRecommendations.tutorials.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <BookOpen className="h-5 w-5 mr-2" />
                        Recommended Tutorials
                      </CardTitle>
                      <CardDescription>
                        Tutorials that match your learning progress and interests
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-4 md:grid-cols-2">
                        {systemRecommendations.tutorials.map((tutorial) => (
                          <div key={tutorial.id} className="border rounded-lg p-4 hover:bg-gray-50">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h4 className="font-medium text-gray-900">{tutorial.title}</h4>
                                <p className="text-sm text-gray-600 mt-1">{tutorial.description}</p>
                                {tutorial.course_title && (
                                  <p className="text-sm text-gray-500 mt-1">
                                    <strong>Course:</strong> {tutorial.course_title}
                                  </p>
                                )}
                                {tutorial.instructor_name && (
                                  <p className="text-sm text-gray-500">
                                    <strong>Instructor:</strong> {tutorial.instructor_name}
                                  </p>
                                )}
                                <div className="flex items-center space-x-2 mt-2">
                                  {tutorial.score && (
                                    <Badge variant="secondary">
                                      Score: {tutorial.score}
                                    </Badge>
                                  )}
                                  {tutorial.views_count && (
                                    <Badge variant="outline">
                                      {tutorial.views_count} views
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Projects Section */}
                {systemRecommendations.projects && systemRecommendations.projects.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <FolderOpen className="h-5 w-5 mr-2" />
                        Recommended Projects
                      </CardTitle>
                      <CardDescription>
                        Project ideas to enhance your practical skills
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-4 md:grid-cols-2">
                        {systemRecommendations.projects.map((project) => (
                          <div key={project.id} className="border rounded-lg p-4 hover:bg-gray-50">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h4 className="font-medium text-gray-900">{project.title}</h4>
                                <p className="text-sm text-gray-600 mt-1">{project.description}</p>
                                <div className="flex items-center space-x-2 mt-2">
                                  <Badge className={getPriorityColor(project.priority)}>
                                    {project.priority}
                                  </Badge>
                                  <Badge variant="outline">{project.category}</Badge>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Instructors Section */}
                {systemRecommendations.instructors && systemRecommendations.instructors.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <Users className="h-5 w-5 mr-2" />
                        Recommended Instructors
                      </CardTitle>
                      <CardDescription>
                        Instructors who can help with your learning goals
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-4 md:grid-cols-2">
                        {systemRecommendations.instructors.map((instructor) => (
                          <div key={instructor.id} className="border rounded-lg p-4 hover:bg-gray-50">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h4 className="font-medium text-gray-900">{instructor.full_name || instructor.title}</h4>
                                <p className="text-sm text-gray-600 mt-1">{instructor.email}</p>
                                {instructor.department && (
                                  <p className="text-sm text-gray-500 mt-1">
                                    <strong>Department:</strong> {instructor.department}
                                  </p>
                                )}
                                <div className="flex items-center space-x-2 mt-2">
                                  {instructor.avg_rating && (
                                    <Badge variant="secondary">
                                      Rating: {Number(instructor.avg_rating).toFixed(1)}
                                    </Badge>
                                  )}
                                  {instructor.feedback_count && (
                                    <Badge variant="outline">
                                      {instructor.feedback_count} reviews
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Skill Paths Section */}
                {systemRecommendations.skillPaths && systemRecommendations.skillPaths.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <TrendingUp className="h-5 w-5 mr-2" />
                        Recommended Skill Paths
                      </CardTitle>
                      <CardDescription>
                        Learning paths to develop specific skills
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-4 md:grid-cols-2">
                        {systemRecommendations.skillPaths.map((skillPath) => (
                          <div key={skillPath.id || skillPath.subject} className="border rounded-lg p-4 hover:bg-gray-50">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h4 className="font-medium text-gray-900">{skillPath.subject || skillPath.title}</h4>
                                <p className="text-sm text-gray-600 mt-1">
                                  {skillPath.currentScore && (
                                    <>Current Score: {skillPath.currentScore.toFixed(1)}%</>
                                  )}
                                </p>
                                {skillPath.recommendedTutorials && skillPath.recommendedTutorials.length > 0 && (
                                  <div className="mt-2">
                                    <p className="text-sm font-medium text-gray-700">Recommended Tutorials:</p>
                                    <ul className="text-sm text-gray-600 mt-1">
                                      {skillPath.recommendedTutorials.slice(0, 3).map((tutorial, index) => (
                                        <li key={index}>• {tutorial.title}</li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                                <div className="flex items-center space-x-2 mt-2">
                                  <Badge variant="secondary">
                                    Skill Improvement
                                  </Badge>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Empty state for system recommendations */}
                {(!systemRecommendations.tutorials || systemRecommendations.tutorials.length === 0) &&
                 (!systemRecommendations.projects || systemRecommendations.projects.length === 0) &&
                 (!systemRecommendations.instructors || systemRecommendations.instructors.length === 0) &&
                 (!systemRecommendations.skillPaths || systemRecommendations.skillPaths.length === 0) && (
                  <Card>
                    <CardContent className="text-center py-8">
                      <Lightbulb className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">No system recommendations available</p>
                      <p className="text-sm text-gray-500">Complete more activities to receive personalized recommendations</p>
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}