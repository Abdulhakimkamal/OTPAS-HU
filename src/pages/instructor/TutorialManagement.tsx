import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { TutorialFileManager } from '@/components/tutorial/TutorialFileManager';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BookOpen, 
  Plus, 
  FileText, 
  Video, 
  Users, 
  Clock,
  Eye,
  Upload
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Tutorial {
  id: number;
  title: string;
  description?: string;
  course_title: string;
  course_code: string;
  difficulty_level?: string;
  duration_minutes?: number;
  is_published: boolean;
  views_count: number;
  created_at: string;
}

interface AssignedCourse {
  course_id: number;
  course_title: string;
  course_code: string;
  tutorial_count: number;
}

export default function TutorialManagement() {
  const [tutorials, setTutorials] = useState<Tutorial[]>([]);
  const [assignedCourses, setAssignedCourses] = useState<AssignedCourse[]>([]);
  const [selectedTutorial, setSelectedTutorial] = useState<Tutorial | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchTutorialData();
  }, []);

  const fetchTutorialData = async () => {
    try {
      setLoading(true);

      // Fetch instructor's tutorials
      try {
        const tutorialsResponse = await fetch('/api/instructor/tutorials', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        });

        if (tutorialsResponse.ok) {
          const tutorialsData = await tutorialsResponse.json();
          setTutorials(tutorialsData.tutorials || []);
        } else {
          setTutorials([]);
        }
      } catch (error) {
        setTutorials([]);
      }

      // Fetch assigned courses
      try {
        const coursesResponse = await fetch('/api/instructor/assigned-courses', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        });

        if (coursesResponse.ok) {
          const coursesData = await coursesResponse.json();
          setAssignedCourses(coursesData.courses || []);
        } else {
          setAssignedCourses([]);
        }
      } catch (error) {
        setAssignedCourses([]);
      }

    } catch (error) {
      console.error('Error fetching tutorial data:', error);
      toast({
        title: "Info",
        description: "Tutorial management features are being set up",
        variant: "default",
      });
    } finally {
      setLoading(false);
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

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="page-transition">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Tutorial Management</h1>
            <p className="text-muted-foreground">Manage your tutorial content and materials</p>
          </div>
          <Button onClick={() => navigate('/instructor/tutorials/create')}>
            <Plus className="h-4 w-4 mr-2" />
            Create Tutorial
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="tutorials">My Tutorials</TabsTrigger>
            <TabsTrigger value="materials" disabled={!selectedTutorial}>
              Materials {selectedTutorial && `(${selectedTutorial.title})`}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Statistics Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Tutorials</CardTitle>
                  <BookOpen className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{tutorials.length}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Published</CardTitle>
                  <Eye className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {tutorials.filter(t => t.is_published).length}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Assigned Courses</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{assignedCourses.length}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Views</CardTitle>
                  <Eye className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {tutorials.reduce((sum, t) => sum + t.views_count, 0)}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Assigned Courses */}
            <Card>
              <CardHeader>
                <CardTitle>Assigned Courses</CardTitle>
                <CardDescription>
                  Courses where you can create and manage tutorials
                </CardDescription>
              </CardHeader>
              <CardContent>
                {assignedCourses.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    No courses assigned yet
                  </p>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {assignedCourses.map((course) => (
                      <Card key={course.course_id} className="border-2">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-lg">{course.course_title}</CardTitle>
                          <CardDescription>{course.course_code}</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">
                              {course.tutorial_count} tutorials
                            </span>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => navigate(`/instructor/tutorials/create?courseId=${course.course_id}`)}
                            >
                              <Plus className="h-4 w-4 mr-1" />
                              Add Tutorial
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tutorials" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>My Tutorials</CardTitle>
                <CardDescription>
                  Manage your tutorial content and materials
                </CardDescription>
              </CardHeader>
              <CardContent>
                {tutorials.length === 0 ? (
                  <div className="text-center py-8">
                    <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground mb-4">No tutorials created yet</p>
                    <Button onClick={() => navigate('/instructor/tutorials/create')}>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Your First Tutorial
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {tutorials.map((tutorial) => (
                      <div key={tutorial.id} className="border rounded-lg p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h4 className="font-semibold text-lg">{tutorial.title}</h4>
                            <p className="text-sm text-muted-foreground">
                              {tutorial.course_title} ({tutorial.course_code})
                            </p>
                            {tutorial.description && (
                              <p className="text-sm text-muted-foreground mt-1">
                                {tutorial.description}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            {getDifficultyBadge(tutorial.difficulty_level)}
                            <Badge variant={tutorial.is_published ? 'default' : 'secondary'}>
                              {tutorial.is_published ? 'Published' : 'Draft'}
                            </Badge>
                          </div>
                        </div>
                        
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
                                setActiveTab('materials');
                              }}
                            >
                              <Upload className="h-4 w-4 mr-1" />
                              Manage Materials
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => navigate(`/instructor/tutorials/${tutorial.id}/edit`)}
                            >
                              Edit
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="materials" className="space-y-6">
            {selectedTutorial ? (
              <TutorialFileManager
                tutorialId={selectedTutorial.id}
                tutorialTitle={selectedTutorial.title}
                userRole="instructor"
                canUpload={true}
              />
            ) : (
              <Card>
                <CardContent className="text-center py-8">
                  <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    Select a tutorial from the "My Tutorials" tab to manage its materials
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}