import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Bell, Calendar, AlertCircle, Info, User } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { studentApi, type Announcement } from '@/services/studentApi';
import { LoadingSkeleton } from '@/components/common/LoadingSkeleton';

const getPriorityIcon = (priority: string) => {
  switch (priority) {
    case 'high':
      return <AlertCircle className="h-4 w-4 text-red-500" />;
    case 'medium':
      return <Info className="h-4 w-4 text-yellow-500" />;
    default:
      return <Bell className="h-4 w-4 text-blue-500" />;
  }
};

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'high':
      return 'destructive';
    case 'medium':
      return 'warning';
    default:
      return 'secondary';
  }
};

export default function StudentAnnouncements() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      const data = await studentApi.getAnnouncements();
      setAnnouncements(data);
    } catch (err) {
      console.error('Failed to fetch announcements:', err);
      setError('Failed to load announcements');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="page-transition">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold">Announcements</h1>
              <p className="text-muted-foreground">Stay updated with the latest news and updates</p>
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
            <h1 className="text-2xl font-bold">Announcements</h1>
            <p className="text-muted-foreground">Stay updated with the latest news and updates</p>
          </div>
          <Badge variant="outline" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            {announcements.length} Total
          </Badge>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        <div className="space-y-4">
          {announcements.length === 0 ? (
            <div className="bg-card rounded-xl border border-border p-6">
              <div className="text-center py-12">
                <Bell className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-medium mb-2">No Announcements</h3>
                <p className="text-muted-foreground mb-4">
                  There are no announcements at this time. Check back later for updates.
                </p>
                <Button variant="outline" onClick={() => window.history.back()}>
                  Back to Dashboard
                </Button>
              </div>
            </div>
          ) : (
            announcements.map((announcement) => (
              <div key={announcement.id} className="bg-card rounded-xl border border-border p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    {getPriorityIcon(announcement.priority)}
                    <div>
                      <h3 className="text-lg font-semibold">{announcement.title}</h3>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <User className="h-3 w-3" />
                        <span>{announcement.source_name}</span>
                        {announcement.course_name && (
                          <>
                            <span>•</span>
                            <span>{announcement.course_name} ({announcement.course_code})</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={getPriorityColor(announcement.priority) as any}>
                      {announcement.priority}
                    </Badge>
                    <Badge variant="outline" className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {formatDate(announcement.created_at)}
                    </Badge>
                  </div>
                </div>
                
                <div className="prose prose-sm max-w-none">
                  <p className="text-muted-foreground leading-relaxed">
                    {announcement.message}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}