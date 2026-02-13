import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, Megaphone, Calendar, BookOpen } from 'lucide-react';
import instructorApi from '@/services/instructorApi';
import { useToast } from '@/hooks/use-toast';

interface Announcement {
  id: number;
  title: string;
  message: string;
  course_title?: string;
  course_code?: string;
  attachment_url?: string;
  created_at: string;
  is_active: boolean;
}

export default function Announcements() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    course_id: ''
  });
  const { toast } = useToast();

  useEffect(() => {
    loadAnnouncements();
  }, []);

  const loadAnnouncements = async () => {
    try {
      const data = await instructorApi.getAnnouncements();
      setAnnouncements(data.announcements || []);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to load announcements',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Create FormData for file upload
      const uploadFormData = new FormData();
      uploadFormData.append('title', formData.title);
      uploadFormData.append('message', formData.message);
      if (formData.course_id) {
        uploadFormData.append('course_id', formData.course_id);
      }
      if (selectedFile) {
        uploadFormData.append('attachment', selectedFile);
      }

      // Import the API function
      const { createAnnouncement } = await import('@/services/instructorApi');
      const result = await createAnnouncement(uploadFormData);

      if (result.success) {
        toast({
          title: 'Success',
          description: 'Announcement posted successfully',
        });

        setIsDialogOpen(false);
        setFormData({ title: '', message: '', course_id: '' });
        setSelectedFile(null);
        loadAnnouncements();
      }
    } catch (error: any) {
      console.error('Create announcement error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to post announcement',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleViewAttachment = async (attachmentUrl: string) => {
    console.log('🔘 View Attachment clicked:', attachmentUrl);
    
    if (!attachmentUrl) {
      console.error('No attachment URL available');
      toast({
        title: 'Error',
        description: 'No attachment available',
        variant: 'destructive',
      });
      return;
    }

    try {
      // Fetch the file with authentication
      const token = localStorage.getItem('authToken');
      const response = await fetch(attachmentUrl, {
        method: 'GET',
        headers: token ? {
          'Authorization': `Bearer ${token}`
        } : {}
      });

      if (!response.ok) {
        throw new Error(`Failed to load attachment: ${response.status}`);
      }

      // Get the file blob
      const blob = await response.blob();
      
      // Create download URL and trigger download
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      // Extract filename from URL
      const filename = attachmentUrl.split('/').pop() || 'attachment';
      link.download = filename;
      
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      console.log('✅ Attachment downloaded');
    } catch (error) {
      console.error('View attachment error:', error);
      toast({
        title: 'Error',
        description: 'Failed to load attachment',
        variant: 'destructive',
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading announcements...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Announcements</h1>
            <p className="text-muted-foreground mt-2">
              Post announcements for your students and courses
            </p>
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Announcement
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[525px]">
              <DialogHeader>
                <DialogTitle>Create Announcement</DialogTitle>
                <DialogDescription>
                  Post a new announcement for your students
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Enter announcement title"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message">Message</Label>
                  <Textarea
                    id="message"
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    placeholder="Enter your announcement message"
                    rows={4}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="course_id">Course (Optional)</Label>
                  <Input
                    id="course_id"
                    type="number"
                    value={formData.course_id}
                    onChange={(e) => setFormData({ ...formData, course_id: e.target.value })}
                    placeholder="Course ID (leave empty for general announcement)"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="attachment">Attachment (Optional)</Label>
                  <Input
                    id="attachment"
                    type="file"
                    accept=".pdf,.doc,.docx,.ppt,.pptx,.zip,.jpg,.jpeg,.png"
                    onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Supported formats: PDF, Word, PowerPoint, ZIP, Images (max 10MB)
                  </p>
                </div>

                <div className="flex gap-4 pt-4">
                  <Button type="submit" disabled={isSubmitting} className="flex-1">
                    {isSubmitting ? 'Posting...' : 'Post Announcement'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {announcements.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Megaphone className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Announcements</h3>
              <p className="text-muted-foreground text-center max-w-md">
                You haven't posted any announcements yet. Create your first announcement to communicate with your students.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {announcements.map((announcement) => (
              <Card key={announcement.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{announcement.title}</CardTitle>
                      <CardDescription className="flex items-center gap-4 mt-1">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {formatDate(announcement.created_at)}
                        </span>
                        {announcement.course_title && (
                          <span className="flex items-center gap-1">
                            <BookOpen className="h-4 w-4" />
                            {announcement.course_code} - {announcement.course_title}
                          </span>
                        )}
                      </CardDescription>
                    </div>
                    <Badge variant={announcement.is_active ? 'default' : 'secondary'}>
                      {announcement.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm whitespace-pre-wrap">{announcement.message}</p>
                  {announcement.attachment_url && (
                    <div className="mt-4">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleViewAttachment(announcement.attachment_url!);
                        }}
                        className="relative z-10 cursor-pointer"
                        type="button"
                      >
                        View Attachment
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}