import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Calendar, AlertCircle, Info, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { studentApi, type Announcement } from '@/services/studentApi';

interface AnnouncementWidgetProps {
  className?: string;
}

const priorityConfig = {
  low: { icon: Info, color: 'text-blue-500', bg: 'bg-blue-50', border: 'border-blue-200' },
  medium: { icon: AlertCircle, color: 'text-yellow-500', bg: 'bg-yellow-50', border: 'border-yellow-200' },
  high: { icon: AlertCircle, color: 'text-red-500', bg: 'bg-red-50', border: 'border-red-200' },
};

const sourceLabels = {
  admin: 'Admin',
  department_head: 'Department Head',
  instructor: 'Instructor',
};

export function AnnouncementWidget({ className }: AnnouncementWidgetProps) {
  const [announcements, setAnnouncements] = useState<(Announcement & { read: boolean })[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      const data = await studentApi.getAnnouncements();
      // Add read status to announcements (in a real app, this would come from the API)
      const announcementsWithReadStatus = data.map(announcement => ({
        ...announcement,
        read: Math.random() > 0.5, // Mock read status
        date: formatDate(announcement.created_at),
      }));
      setAnnouncements(announcementsWithReadStatus);
    } catch (error) {
      console.error('Failed to fetch announcements:', error);
      // Fallback to mock data
      const mockAnnouncements = [
        {
          id: '1',
          title: 'Project Submission Deadline Extended',
          message: 'The final project submission deadline has been extended to April 15th due to technical issues.',
          date: '2 hours ago',
          course_name: 'Software Engineering',
          course_code: 'CS401',
          priority: 'high' as const,
          source: 'instructor' as const,
          source_name: 'Dr. Ahmed Hassan',
          created_at: new Date().toISOString(),
          read: false,
        },
        {
          id: '2',
          title: 'New Course Materials Available',
          message: 'New lecture slides and assignments have been uploaded for Database Systems.',
          date: '1 day ago',
          course_name: 'Database Systems',
          course_code: 'CS402',
          priority: 'medium' as const,
          source: 'instructor' as const,
          source_name: 'Prof. Sarah Johnson',
          created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          read: false,
        },
      ];
      setAnnouncements(mockAnnouncements);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    if (diffInHours < 48) return '1 day ago';
    return `${Math.floor(diffInHours / 24)} days ago`;
  };

  const markAsRead = (id: string) => {
    setAnnouncements(prev => 
      prev.map(announcement => 
        announcement.id === id ? { ...announcement, read: true } : announcement
      )
    );
  };

  const unreadCount = announcements.filter(a => !a.read).length;

  if (loading) {
    return (
      <div className={cn("bg-card rounded-xl border border-border p-6", className)}>
        <div className="animate-pulse">
          <div className="h-6 bg-muted rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("bg-card rounded-xl border border-border p-6", className)}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">Recent Announcements</h3>
          {unreadCount > 0 && (
            <Badge variant="destructive" className="text-xs">
              {unreadCount} new
            </Badge>
          )}
        </div>
        <Button variant="ghost" size="sm" onClick={() => navigate('/student/announcements')}>
          View All
        </Button>
      </div>

      <div className="space-y-3 max-h-80 overflow-y-auto">
        {announcements.length === 0 ? (
          <div className="text-center py-8">
            <Bell className="h-8 w-8 mx-auto text-muted-foreground/50 mb-2" />
            <p className="text-sm text-muted-foreground">No announcements</p>
          </div>
        ) : (
          announcements.map((announcement) => {
            const priorityInfo = priorityConfig[announcement.priority];
            const PriorityIcon = priorityInfo.icon;

            return (
              <div
                key={announcement.id}
                className={cn(
                  "p-4 rounded-lg border transition-all duration-200 cursor-pointer hover:shadow-sm",
                  announcement.read 
                    ? "bg-muted/30 border-border" 
                    : "bg-card border-primary/20 shadow-sm"
                )}
                onClick={() => markAsRead(announcement.id)}
              >
                <div className="flex items-start gap-3">
                  <div className={cn(
                    "flex items-center justify-center w-8 h-8 rounded-full flex-shrink-0",
                    priorityInfo.bg
                  )}>
                    <PriorityIcon className={cn("h-4 w-4", priorityInfo.color)} />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h4 className={cn(
                        "text-sm font-medium line-clamp-1",
                        !announcement.read && "text-primary"
                      )}>
                        {announcement.title}
                      </h4>
                      {!announcement.read && (
                        <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-1" />
                      )}
                    </div>
                    
                    <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                      {announcement.message}
                    </p>
                    
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {announcement.date}
                      </span>
                      
                      <Badge variant="outline" className="text-xs">
                        {sourceLabels[announcement.source]}
                      </Badge>
                      
                      {announcement.course_name && (
                        <span className="truncate">{announcement.course_code} - {announcement.course_name}</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}