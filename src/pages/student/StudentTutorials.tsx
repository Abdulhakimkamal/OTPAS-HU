import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { BookOpen, Play, Calendar, User, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { studentApi, type Tutorial } from '@/services/studentApi';
import { LoadingSkeleton } from '@/components/common/LoadingSkeleton';

export default function StudentTutorials() {
  const navigate = useNavigate();
  const [tutorials, setTutorials] = useState<Tutorial[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTutorials();
  }, []);

  const fetchTutorials = async () => {
    try {
      setLoading(true);
      const data = await studentApi.getTutorials();
      setTutorials(data);
    } catch (err) {
      console.error('Failed to fetch tutorials:', err);
      setError('Failed to load tutorials');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleStartTutorial = (tutorial: Tutorial) => {
    // Navigate to tutorial viewer
    navigate(`/student/tutorials/${tutorial.id}`);
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="page-transition">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold">Tutorials</h1>
              <p className="text-muted-foreground">Access interactive tutorials and learning materials</p>
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
            <h1 className="text-2xl font-bold">Tutorials</h1>
            <p className="text-muted-foreground">Access interactive tutorials and learning materials</p>
          </div>
          <Badge variant="outline" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            {tutorials.length} Available
          </Badge>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        <div className="space-y-4">
          {tutorials.length === 0 ? (
            <div className="bg-card rounded-xl border border-border p-6">
              <div className="text-center py-12">
                <BookOpen className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-medium mb-2">No Tutorials Available</h3>
                <p className="text-muted-foreground mb-4">
                  No tutorials have been published yet. Check back later for new learning materials.
                </p>
                <Button variant="outline" onClick={() => window.history.back()}>
                  Back to Dashboard
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid gap-4">
              {tutorials.map((tutorial) => (
                <div key={tutorial.id} className="bg-card rounded-xl border border-border p-6 hover:shadow-lg hover:border-primary/20 transition-all duration-200 cursor-pointer group">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start gap-3 flex-1">
                      <BookOpen className="h-5 w-5 text-primary mt-1 group-hover:text-primary/80 transition-colors" />
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold mb-1 group-hover:text-primary transition-colors">{tutorial.title}</h3>
                        {tutorial.description && (
                          <p className="text-sm text-muted-foreground mb-3">{tutorial.description}</p>
                        )}
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            <span>{tutorial.instructor_name}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            <span>{formatDate(tutorial.created_at)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">
                        {tutorial.course_title}
                      </Badge>
                      <Button
                        size="sm"
                        onClick={() => handleStartTutorial(tutorial)}
                        className="flex items-center gap-2 group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
                      >
                        <Play className="h-4 w-4" />
                        Start Tutorial
                      </Button>
                    </div>
                  </div>
                  
                  {tutorial.content && (
                    <div className="pt-4 border-t border-border">
                      <div className="prose prose-sm max-w-none">
                        <p className="text-muted-foreground line-clamp-3">
                          {tutorial.content.substring(0, 200)}...
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}