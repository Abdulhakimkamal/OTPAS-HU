import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  getInbox,
  getSentMessages,
  getConversationsList,
  sendMessage,
  markAsRead,
  getMessageableUsers,
  deleteMessage,
  type Message,
  type Conversation,
  type MessageableUser
} from '@/services/messageApi';
import { toast } from 'sonner';
import { LoadingSkeleton } from '@/components/common/LoadingSkeleton';
import { FormError } from '@/components/common/FormError';
import { useSimpleFormValidation } from '@/hooks/useFormValidation';
import { Plus, Send, Inbox, Mail, MessageSquare, Trash2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function InstructorMessages() {
  const [loading, setLoading] = useState(true);
  const [inbox, setInbox] = useState<Message[]>([]);
  const [sentMessages, setSentMessages] = useState<Message[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messageableUsers, setMessageableUsers] = useState<MessageableUser[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  
  const [composeDialogOpen, setComposeDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);

  const [composeForm, setComposeForm] = useState({
    receiver_id: '',
    subject: '',
    message_text: ''
  });

  const composeValidation = useSimpleFormValidation();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [inboxRes, sentRes, conversationsRes, usersRes] = await Promise.all([
        getInbox(),
        getSentMessages(),
        getConversationsList(),
        getMessageableUsers()
      ]);

      if (inboxRes.success) {
        setInbox(inboxRes.messages);
        setUnreadCount(inboxRes.unreadCount);
      }
      if (sentRes.success) setSentMessages(sentRes.messages);
      if (conversationsRes.success) setConversations(conversationsRes.conversations);
      if (usersRes.success) setMessageableUsers(usersRes.users);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to load messages');
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    composeValidation.clearErrors();

    if (!composeForm.receiver_id) {
      composeValidation.setFieldError('receiver_id', 'Please select a recipient');
      return;
    }

    if (!composeForm.message_text.trim()) {
      composeValidation.setFieldError('message_text', 'Message cannot be empty');
      return;
    }

    try {
      const response = await sendMessage({
        receiver_id: parseInt(composeForm.receiver_id),
        subject: composeForm.subject,
        message_text: composeForm.message_text
      });

      if (response.success) {
        toast.success('Message sent successfully');
        setComposeDialogOpen(false);
        resetComposeForm();
        fetchData();
      }
    } catch (error: any) {
      composeValidation.handleApiError(error);
      toast.error(error.response?.data?.message || 'Failed to send message');
    }
  };

  const handleViewMessage = async (message: Message) => {
    setSelectedMessage(message);
    setViewDialogOpen(true);

    if (!message.is_read && message.receiver_id) {
      try {
        await markAsRead(message.id);
        fetchData();
      } catch (error) {
        console.error('Failed to mark as read:', error);
      }
    }
  };

  const handleDeleteMessage = async (messageId: number) => {
    if (!confirm('Are you sure you want to delete this message?')) return;

    try {
      const response = await deleteMessage(messageId);
      if (response.success) {
        toast.success('Message deleted');
        setViewDialogOpen(false);
        fetchData();
      }
    } catch (error: any) {
      toast.error('Failed to delete message');
    }
  };

  const resetComposeForm = () => {
    setComposeForm({
      receiver_id: '',
      subject: '',
      message_text: ''
    });
    composeValidation.clearErrors();
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'department_head': return 'bg-purple-100 text-purple-800';
      case 'instructor': return 'bg-blue-100 text-blue-800';
      case 'student': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return <LoadingSkeleton type="table" rows={8} />;
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Messages</h1>
          <p className="text-muted-foreground mt-2">
            Communicate with department head and students
          </p>
        </div>
        <Dialog open={composeDialogOpen} onOpenChange={setComposeDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetComposeForm}>
              <Plus className="mr-2 h-4 w-4" />
              Compose Message
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Compose New Message</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSendMessage} className="space-y-4">
              <div>
                <Label htmlFor="receiver">To *</Label>
                <Select
                  value={composeForm.receiver_id}
                  onValueChange={(value) => {
                    setComposeForm({ ...composeForm, receiver_id: value });
                    composeValidation.clearFieldError('receiver_id');
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select recipient" />
                  </SelectTrigger>
                  <SelectContent>
                    {messageableUsers.map((user) => (
                      <SelectItem key={user.id} value={user.id.toString()}>
                        <div className="flex items-center gap-2">
                          <span>{user.full_name}</span>
                          <Badge className={getRoleBadgeColor(user.role)} variant="secondary">
                            {user.role.replace('_', ' ')}
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormError error={composeValidation.getError('receiver_id')} />
              </div>

              <div>
                <Label htmlFor="subject">Subject</Label>
                <Input
                  id="subject"
                  value={composeForm.subject}
                  onChange={(e) => setComposeForm({ ...composeForm, subject: e.target.value })}
                  placeholder="Enter subject (optional)"
                />
              </div>

              <div>
                <Label htmlFor="message">Message *</Label>
                <Textarea
                  id="message"
                  value={composeForm.message_text}
                  onChange={(e) => {
                    setComposeForm({ ...composeForm, message_text: e.target.value });
                    composeValidation.clearFieldError('message_text');
                  }}
                  placeholder="Type your message here..."
                  rows={8}
                  required
                />
                <FormError error={composeValidation.getError('message_text')} />
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setComposeDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  <Send className="mr-2 h-4 w-4" />
                  Send Message
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {unreadCount > 0 && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-blue-600" />
              <span className="font-semibold text-blue-900">
                You have {unreadCount} unread message{unreadCount !== 1 ? 's' : ''}
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="inbox" className="space-y-4">
        <TabsList>
          <TabsTrigger value="inbox" className="gap-2">
            <Inbox className="h-4 w-4" />
            Inbox
            {unreadCount > 0 && (
              <Badge variant="destructive" className="ml-1">
                {unreadCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="sent" className="gap-2">
            <Send className="h-4 w-4" />
            Sent
          </TabsTrigger>
          <TabsTrigger value="conversations" className="gap-2">
            <MessageSquare className="h-4 w-4" />
            Conversations
          </TabsTrigger>
        </TabsList>

        <TabsContent value="inbox">
          <Card>
            <CardHeader>
              <CardTitle>Inbox</CardTitle>
            </CardHeader>
            <CardContent>
              {inbox.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Mail className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No messages in your inbox</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {inbox.map((message) => (
                    <div
                      key={message.id}
                      className={`p-4 border rounded-lg cursor-pointer hover:bg-accent transition-colors ${
                        !message.is_read ? 'bg-blue-50 border-blue-200' : ''
                      }`}
                      onClick={() => handleViewMessage(message)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3 flex-1">
                          <Avatar>
                            <AvatarFallback>{getInitials(message.sender_name || 'U')}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold">{message.sender_name}</span>
                              <Badge className={getRoleBadgeColor(message.sender_role || '')} variant="secondary">
                                {message.sender_role?.replace('_', ' ')}
                              </Badge>
                              {!message.is_read && (
                                <Badge variant="default">New</Badge>
                              )}
                            </div>
                            {message.subject && (
                              <p className="font-medium mt-1">{message.subject}</p>
                            )}
                            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                              {message.message_text}
                            </p>
                            <p className="text-xs text-muted-foreground mt-2">
                              {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sent">
          <Card>
            <CardHeader>
              <CardTitle>Sent Messages</CardTitle>
            </CardHeader>
            <CardContent>
              {sentMessages.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Send className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No sent messages</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {sentMessages.map((message) => (
                    <div
                      key={message.id}
                      className="p-4 border rounded-lg cursor-pointer hover:bg-accent transition-colors"
                      onClick={() => handleViewMessage(message)}
                    >
                      <div className="flex items-start gap-3">
                        <Avatar>
                          <AvatarFallback>{getInitials(message.receiver_name || 'U')}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">To: {message.receiver_name}</span>
                            <Badge className={getRoleBadgeColor(message.receiver_role || '')} variant="secondary">
                              {message.receiver_role?.replace('_', ' ')}
                            </Badge>
                          </div>
                          {message.subject && (
                            <p className="font-medium mt-1">{message.subject}</p>
                          )}
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                            {message.message_text}
                          </p>
                          <p className="text-xs text-muted-foreground mt-2">
                            {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="conversations">
          <Card>
            <CardHeader>
              <CardTitle>Conversations</CardTitle>
            </CardHeader>
            <CardContent>
              {conversations.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No conversations yet</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {conversations.map((conversation) => (
                    <div
                      key={conversation.other_user_id}
                      className="p-4 border rounded-lg"
                    >
                      <div className="flex items-start gap-3">
                        <Avatar>
                          <AvatarFallback>{getInitials(conversation.other_user_name)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold">{conversation.other_user_name}</span>
                              <Badge className={getRoleBadgeColor(conversation.other_user_role)} variant="secondary">
                                {conversation.other_user_role.replace('_', ' ')}
                              </Badge>
                            </div>
                            {conversation.unread_count > 0 && (
                              <Badge variant="destructive">{conversation.unread_count}</Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
                            {conversation.last_message_text}
                          </p>
                          <p className="text-xs text-muted-foreground mt-2">
                            {formatDistanceToNow(new Date(conversation.last_message_time), { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Message Details</DialogTitle>
          </DialogHeader>
          {selectedMessage && (
            <div className="space-y-4">
              <div className="flex items-start gap-3 pb-4 border-b">
                <Avatar>
                  <AvatarFallback>
                    {getInitials(selectedMessage.sender_name || selectedMessage.receiver_name || 'U')}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">
                      {selectedMessage.sender_name || selectedMessage.receiver_name}
                    </span>
                    <Badge
                      className={getRoleBadgeColor(
                        selectedMessage.sender_role || selectedMessage.receiver_role || ''
                      )}
                      variant="secondary"
                    >
                      {(selectedMessage.sender_role || selectedMessage.receiver_role)?.replace('_', ' ')}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {selectedMessage.sender_email || selectedMessage.receiver_email}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatDistanceToNow(new Date(selectedMessage.created_at), { addSuffix: true })}
                  </p>
                </div>
              </div>

              {selectedMessage.subject && (
                <div>
                  <Label>Subject</Label>
                  <p className="font-medium mt-1">{selectedMessage.subject}</p>
                </div>
              )}

              <div>
                <Label>Message</Label>
                <div className="mt-2 p-4 bg-muted rounded-lg whitespace-pre-wrap">
                  {selectedMessage.message_text}
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => handleDeleteMessage(selectedMessage.id)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </Button>
                <Button onClick={() => setViewDialogOpen(false)}>Close</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      </div>
    </DashboardLayout>
  );
}
