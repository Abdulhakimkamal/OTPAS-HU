import { FileText, Users, BookOpen, MessageSquare, Bell, FolderOpen } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ActivityItem {
  id: string;
  type: 'tutorial' | 'project' | 'feedback' | 'announcement' | 'user' | 'course';
  title: string;
  description: string;
  time: string;
}

const activityIcons = {
  tutorial: <FileText className="h-4 w-4" />,
  project: <FolderOpen className="h-4 w-4" />,
  feedback: <MessageSquare className="h-4 w-4" />,
  announcement: <Bell className="h-4 w-4" />,
  user: <Users className="h-4 w-4" />,
  course: <BookOpen className="h-4 w-4" />,
};

const activityColors = {
  tutorial: 'bg-info/10 text-info',
  project: 'bg-primary/10 text-primary',
  feedback: 'bg-success/10 text-success',
  announcement: 'bg-warning/10 text-warning',
  user: 'bg-purple-100 text-purple-600',
  course: 'bg-pink-100 text-pink-600',
};

interface RecentActivityProps {
  activities: ActivityItem[];
}

export function RecentActivity({ activities }: RecentActivityProps) {
  return (
    <div className="bg-card rounded-xl border border-border p-6">
      <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
      <div className="space-y-4">
        {activities.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            No recent activity
          </p>
        ) : (
          activities.map((activity) => (
            <div key={activity.id} className="flex items-start gap-4">
              <div className={cn(
                "flex items-center justify-center w-8 h-8 rounded-full shrink-0",
                activityColors[activity.type]
              )}>
                {activityIcons[activity.type]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{activity.title}</p>
                <p className="text-xs text-muted-foreground truncate">{activity.description}</p>
              </div>
              <span className="text-xs text-muted-foreground shrink-0">{activity.time}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
