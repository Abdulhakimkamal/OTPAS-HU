import api from './api';

/**
 * Message API Service
 * Handles all messaging-related API calls
 */

export interface Message {
  id: number;
  sender_id: number;
  receiver_id: number;
  subject?: string;
  message_text: string;
  is_read: boolean;
  created_at: string;
  updated_at: string;
  read_at?: string;
  sender_name?: string;
  sender_email?: string;
  sender_role?: string;
  sender_picture?: string;
  receiver_name?: string;
  receiver_email?: string;
  receiver_role?: string;
  receiver_picture?: string;
}

export interface Conversation {
  other_user_id: number;
  other_user_name: string;
  other_user_role: string;
  other_user_picture?: string;
  last_message_text: string;
  last_message_time: string;
  unread_count: number;
}

export interface MessageableUser {
  id: number;
  full_name: string;
  email: string;
  role: string;
  profile_picture?: string;
  is_active: boolean;
}

/**
 * Send a new message
 */
export const sendMessage = async (data: {
  receiver_id: number;
  subject?: string;
  message_text: string;
  parent_message_id?: number;
}) => {
  // Build query string for params
  const queryParams = new URLSearchParams();
  const endpoint = '/messages/send';
  return await api.post(endpoint, data);
};

/**
 * Get inbox messages (received)
 */
export const getInbox = async (params?: {
  limit?: number;
  offset?: number;
  unreadOnly?: boolean;
}) => {
  const queryParams = new URLSearchParams();
  if (params?.limit) queryParams.append('limit', params.limit.toString());
  if (params?.offset) queryParams.append('offset', params.offset.toString());
  if (params?.unreadOnly) queryParams.append('unreadOnly', params.unreadOnly.toString());
  const queryString = queryParams.toString();
  const endpoint = queryString ? `/messages/inbox?${queryString}` : '/messages/inbox';
  return await api.get(endpoint);
};

/**
 * Get sent messages
 */
export const getSentMessages = async (params?: {
  limit?: number;
  offset?: number;
}) => {
  const queryParams = new URLSearchParams();
  if (params?.limit) queryParams.append('limit', params.limit.toString());
  if (params?.offset) queryParams.append('offset', params.offset.toString());
  const queryString = queryParams.toString();
  const endpoint = queryString ? `/messages/sent?${queryString}` : '/messages/sent';
  return await api.get(endpoint);
};

/**
 * Get all conversations list
 */
export const getConversationsList = async () => {
  return await api.get('/messages/conversations');
};

/**
 * Get conversation with specific user
 */
export const getConversation = async (
  userId: number,
  params?: { limit?: number; offset?: number }
) => {
  const queryParams = new URLSearchParams();
  if (params?.limit) queryParams.append('limit', params.limit.toString());
  if (params?.offset) queryParams.append('offset', params.offset.toString());
  const queryString = queryParams.toString();
  const endpoint = queryString ? `/messages/conversation/${userId}?${queryString}` : `/messages/conversation/${userId}`;
  return await api.get(endpoint);
};

/**
 * Get unread message count
 */
export const getUnreadCount = async () => {
  return await api.get('/messages/unread-count');
};

/**
 * Get users that current user can message
 */
export const getMessageableUsers = async () => {
  return await api.get('/messages/messageable-users');
};

/**
 * Get message by ID
 */
export const getMessageById = async (messageId: number) => {
  return await api.get(`/messages/${messageId}`);
};

/**
 * Mark message as read
 */
export const markAsRead = async (messageId: number) => {
  return await api.patch(`/messages/read/${messageId}`);
};

/**
 * Mark multiple messages as read
 */
export const markMultipleAsRead = async (messageIds: number[]) => {
  return await api.patch('/messages/read-multiple', { messageIds });
};

/**
 * Delete message (soft delete)
 */
export const deleteMessage = async (messageId: number) => {
  return await api.delete(`/messages/${messageId}`);
};
