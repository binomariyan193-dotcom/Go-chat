export interface User {
  id: string;
  username: string;
  email: string;
  avatarUrl?: string;
  status?: 'online' | 'offline' | 'away';
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  textContent?: string;
  imageUrl?: string;
  createdAt: string;
  sender: {
    id: string;
    username: string;
    avatarUrl?: string;
  };
}

export interface Conversation {
  id: string;
  name?: string;
  isGroup: boolean;
  members: {
    user: User;
  }[];
  messages?: Message[];
  updatedAt: string;
  unreadCount?: number;
}
