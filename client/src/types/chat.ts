export interface User {
  id: string;
  username: string;
  email: string;
  avatarUrl?: string;
  status?: 'online' | 'offline' | 'away';
  publicKey?: string;
}

export interface Reaction {
  emoji: string;
  count: number;
  userIds: string[];
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  textContent?: string;
  imageUrl?: string;
  audioUrl?: string;
  isEncrypted?: boolean;
  ciphertext?: string;
  iv?: string;
  createdAt: string;
  sender: {
    id: string;
    username: string;
    avatarUrl?: string;
    publicKey?: string;
  };
  reactions?: Reaction[];
}

export interface ConversationMember {
  user: User;
  role?: 'admin' | 'member';
}

export interface Conversation {
  id: string;
  name?: string;
  description?: string;
  avatarUrl?: string;
  isGroup: boolean;
  members: ConversationMember[];
  messages?: Message[];
  updatedAt: string;
  unreadCount?: number;
}
