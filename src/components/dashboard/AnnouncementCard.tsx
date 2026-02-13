import { Bell, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Announcement {
  id: string;
  title: string;
  content: string;
  author: string;
  date: string;
  isGlobal: boolean;
}

interface AnnouncementCardProps {
  announcements: Announcement[];
  onViewAll?: () => void;
}

export function AnnouncementCard({ announcements, onViewAll }: AnnouncementCardProps) {
  return (
    <div className="bg-card rounded-xl border border-border p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Announcements</h3>
        {onViewAll && (
          <Button variant="ghost" size="sm" onClick={onViewAll}>
            View all
          </Button>
        )}
      </div>
      <div className="space-y-4">
        {announcements.length === 0 ? (
          <div className="text-center py-8">
            <Bell className="h-8 w-8 mx-auto text-muted-foreground/50 mb-2" />
            <p className="text-sm text-muted-foreground">No announcements</p>
          </div>
        ) : (
          announcements.map((announcement) => (
            <div 
              key={announcement.id} 
              className="p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors cursor-pointer"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {announcement.isGlobal && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-accent text-accent-foreground">
                        Global
                      </span>
                    )}
                    <h4 className="text-sm font-medium truncate">{announcement.title}</h4>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">{announcement.content}</p>
                </div>
              </div>
              <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                <span>{announcement.author}</span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {announcement.date}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
