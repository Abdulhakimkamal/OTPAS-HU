/**
 * Notification Center Component
 * Displays and manages notifications for students
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { studentApi, Notification } from '@/services/academicApi';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertCircle, CheckCircle, Bell, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const notificationTypeConfig: Record<string, { icon: React.ReactNode; color: string; label: string }> = {
  'title_approved': {
    icon: <CheckCircle className="h-5 w-5" />,
    color: 'text-green-600',
    label: 'Title Approved',
  },
  'title_rejected': {
    icon: <AlertCircle className="h-5 w-5" />,
    color: 'text-red-600',
    label: 'Title Rejected',
  },
  'evaluation_complete': {
    icon: <CheckCircle className="h-5 w-5" />,
    color: 'text-blue-600',
    label: 'Evaluation Complete',
  },
};

export function NotificationCenter() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: notificationsData, isLoading, error } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => studentApi.getNotifications(),
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Ensure notifications is always an array
  const notifications = Array.isArray(notificationsData) ? notificationsData : [];

  const markAsReadMutation = useMutation({
    mutationFn: (notificationId: number) => studentApi.markNotificationAsRead(notificationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to mark notification as read',
        variant: 'destructive',
      });
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: () => studentApi.markAllNotificationsAsRead(),
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'All notifications marked as read',
      });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to mark all as read',
        variant: 'destructive',
      });
    },
  });

  const unreadCount = notifications.filter(n => !n.is_read).length;

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 text-red-700">
            <AlertCircle className="h-5 w-5" />
            <p>Failed to load notifications</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-gray-200 rounded animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle>Notifications</CardTitle>
            <CardDescription>
              {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
            </CardDescription>
          </div>
          {unreadCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => markAllAsReadMutation.mutate()}
              disabled={markAllAsReadMutation.isPending}
            >
              Mark all as read
            </Button>
          )}
        </CardHeader>
      </Card>

      {notifications.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <Bell className="h-12 w-12 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-600">No notifications yet</p>
              <p className="text-sm text-gray-500 mt-1">You'll see updates here</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {notifications.map((notification) => {
            const config = notificationTypeConfig[notification.type] || {
              icon: <Bell className="h-5 w-5" />,
              color: 'text-gray-600',
              label: 'Notification',
            };

            return (
              <Card
                key={notification.id}
                className={`cursor-pointer transition-colors ${
                  !notification.is_read ? 'bg-blue-50 border-blue-200' : 'hover:bg-gray-50'
                }`}
              >
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1">
                      <div className={`${config.color} mt-1 flex-shrink-0`}>
                        {config.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-sm">{config.label}</p>
                          {!notification.is_read && (
                            <Badge variant="default" className="text-xs">New</Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-700 mt-1 leading-relaxed">
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-500 mt-2">
                          {new Date(notification.created_at).toLocaleDateString()} at{' '}
                          {new Date(notification.created_at).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                    </div>
                    {!notification.is_read && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => markAsReadMutation.mutate(notification.id)}
                        disabled={markAsReadMutation.isPending}
                        className="text-blue-600 hover:text-blue-700 hover:bg-blue-100"
                      >
                        Mark as read
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
