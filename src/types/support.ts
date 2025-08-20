import { Timestamp } from 'firebase/firestore';

export interface SupportThread {
  id: string;
  userId: string;
  status: 'open' | 'closed';
  lastMessageAt: Timestamp;
  lastMessageText: string;
  unreadForUser: boolean;
  unreadForAdmin: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface SupportMessage {
  id: string;
  threadId: string;
  sender: 'user' | 'admin';
  text: string;
  createdAt: Timestamp;
  attachments?: string[];
  read?: boolean;
}

export interface CreateThreadInput {
  userId: string;
  firstMessage: string;
}

export interface SendMessageInput {
  threadId: string;
  text: string;
  sender: 'user' | 'admin';
  attachments?: string[];
}