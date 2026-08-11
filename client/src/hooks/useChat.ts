import { useState, useEffect, useRef } from 'react';
import { api } from '../services/api';
import { Conversation, Message } from '../types/chat';
import { useSocketContext } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import { playNotificationSound } from '../utils/sound';

export const useChat = () => {
  const { user } = useAuth();
  const { socket } = useSocketContext();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversationState] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [unreadCounts, setUnreadCounts] = useState<{ [convId: string]: number }>({});

  // Client-side message cache for ZERO LAG (0ms switching) between conversations
  const messageCacheRef = useRef<{ [convId: string]: Message[] }>({});
  const activeConversationRef = useRef<Conversation | null>(activeConversation);

  useEffect(() => {
    activeConversationRef.current = activeConversation;
  }, [activeConversation]);

  // Fetch all user conversations (silent mode prevents flickering UI)
  const fetchConversations = async (silent = false) => {
    try {
      const response = await api.get('/chat/conversations');
      setConversations(response.data);
      if (response.data.length > 0 && !activeConversationRef.current && !silent) {
        setActiveConversationState(response.data[0]);
      }
    } catch (err) {
      if (!silent) {
        console.error('Failed to fetch conversations:', err);
      }
    }
  };

  // Initial load and periodic 15-second background auto-refresh
  useEffect(() => {
    if (!user) return;
    fetchConversations();

    // Auto-refresh in background every 15 seconds for zero-lag sync
    const autoRefreshInterval = setInterval(() => {
      fetchConversations(true);
    }, 15000);

    return () => clearInterval(autoRefreshInterval);
  }, [user]);

  // Socket reconnect auto-refresh & Join all conversation rooms
  useEffect(() => {
    if (!socket || conversations.length === 0) return;

    conversations.forEach((c) => {
      socket.emit('join_room', c.id);
    });

    const handleConnect = () => {
      fetchConversations(true);
      conversations.forEach((c) => {
        socket.emit('join_room', c.id);
      });
    };

    socket.on('connect', handleConnect);
    return () => {
      socket.off('connect', handleConnect);
    };
  }, [socket, conversations]);

  // Fetch messages for active conversation with ZERO-LAG instant cache
  useEffect(() => {
    if (!activeConversation) return;

    const convId = activeConversation.id;

    // ⚡ ZERO LAG: Immediately render cached messages if available
    if (messageCacheRef.current[convId]) {
      setMessages(messageCacheRef.current[convId]);
      setIsLoadingMessages(false);
    } else {
      setIsLoadingMessages(true);
    }

    const controller = new AbortController();

    const fetchMessages = async () => {
      try {
        const response = await api.get(`/chat/conversations/${convId}/messages`, {
          signal: controller.signal,
        });

        // Update in-memory cache & active messages state
        messageCacheRef.current[convId] = response.data;
        if (activeConversationRef.current?.id === convId) {
          setMessages(response.data);
        }
      } catch (err: any) {
        if (err.name !== 'CanceledError' && err.name !== 'AbortError') {
          console.error('Failed to fetch messages:', err);
        }
      } finally {
        if (!controller.signal.aborted && activeConversationRef.current?.id === convId) {
          setIsLoadingMessages(false);
        }
      }
    };

    fetchMessages();

    // Clear unread count for active conversation
    setUnreadCounts((prev) => ({ ...prev, [convId]: 0 }));

    return () => {
      controller.abort();
    };
  }, [activeConversation]);

  // Listen for real-time socket messages & edits
  useEffect(() => {
    if (!socket || !user) return;

    const handleNewMessage = (newMessage: Message) => {
      const convId = newMessage.conversationId;

      // Update message cache for instant room switching
      const existingCache = messageCacheRef.current[convId] || [];
      if (!existingCache.some((m) => m.id === newMessage.id)) {
        messageCacheRef.current[convId] = [...existingCache, newMessage];
      }

      // Don't trigger unread for own messages, but bump conversation to top
      if (newMessage.senderId === user.id) {
        if (activeConversationRef.current && convId === activeConversationRef.current.id) {
          setMessages((prev) => (prev.some((m) => m.id === newMessage.id) ? prev : [...prev, newMessage]));
        }
        setConversations((prev) => {
          const target = prev.find((c) => c.id === convId);
          if (!target) return prev;

          const updatedConv = { ...target, messages: [newMessage], updatedAt: newMessage.createdAt };
          const remaining = prev.filter((c) => c.id !== convId);
          return [updatedConv, ...remaining];
        });
        return;
      }

      // Play audio notification ONLY if user status is NOT offline
      if (user.status !== 'offline') {
        playNotificationSound();
      }

      if (activeConversationRef.current && convId === activeConversationRef.current.id) {
        setMessages((prev) => (prev.some((m) => m.id === newMessage.id) ? prev : [...prev, newMessage]));
      } else {
        // Increment unread count for non-active conversation
        setUnreadCounts((prev) => ({
          ...prev,
          [convId]: (prev[convId] || 0) + 1,
        }));
      }

      // Update conversation preview message and bump to top
      setConversations((prev) => {
        const target = prev.find((c) => c.id === convId);
        if (!target) return prev;

        const updatedConv = { ...target, messages: [newMessage], updatedAt: newMessage.createdAt };
        const remaining = prev.filter((c) => c.id !== convId);
        return [updatedConv, ...remaining];
      });
    };

    const handleMessageEdited = (updatedMessage: Message) => {
      const convId = updatedMessage.conversationId;
      if (messageCacheRef.current[convId]) {
        messageCacheRef.current[convId] = messageCacheRef.current[convId].map((m) =>
          m.id === updatedMessage.id ? updatedMessage : m
        );
      }
      setMessages((prev) =>
        prev.map((m) => (m.id === updatedMessage.id ? updatedMessage : m))
      );
    };

    const handleConversationDeleted = (data: { conversationId: string }) => {
      delete messageCacheRef.current[data.conversationId];
      setConversations((prev) => prev.filter((c) => c.id !== data.conversationId));
      setActiveConversationState((prev) => {
        if (prev?.id === data.conversationId) {
          setMessages([]);
          return null;
        }
        return prev;
      });
    };

    const handleMessageDeleted = (data: { messageId: string; conversationId: string }) => {
      const convId = data.conversationId;
      if (messageCacheRef.current[convId]) {
        messageCacheRef.current[convId] = messageCacheRef.current[convId].filter((m) => m.id !== data.messageId);
      }
      setMessages((prev) => prev.filter((m) => m.id !== data.messageId));
    };

    const handleUserStatusChanged = (data: { userId: string; status: 'online' | 'offline' }) => {
      setConversations((prev) =>
        prev.map((c) => ({
          ...c,
          members: c.members.map((m) =>
            m.user.id === data.userId ? { ...m, user: { ...m.user, status: data.status } } : m
          ),
        }))
      );

      setActiveConversationState((prev) => {
        if (!prev) return prev;
        const hasMember = prev.members.some((m) => m.user.id === data.userId);
        if (!hasMember) return prev;
        return {
          ...prev,
          members: prev.members.map((m) =>
            m.user.id === data.userId ? { ...m, user: { ...m.user, status: data.status } } : m
          ),
        };
      });
    };

    socket.on('new_message', handleNewMessage);
    socket.on('message_edited', handleMessageEdited);
    socket.on('conversation_deleted', handleConversationDeleted);
    socket.on('message_deleted', handleMessageDeleted);
    socket.on('user_status_changed', handleUserStatusChanged);

    return () => {
      socket.off('new_message', handleNewMessage);
      socket.off('message_edited', handleMessageEdited);
      socket.off('conversation_deleted', handleConversationDeleted);
      socket.off('message_deleted', handleMessageDeleted);
      socket.off('user_status_changed', handleUserStatusChanged);
    };
  }, [socket, user]);

  // Update document title for unread indicator (suppressed if user status is offline)
  useEffect(() => {
    const totalUnread = Object.values(unreadCounts).reduce((a, b) => a + b, 0);
    if (totalUnread > 0 && user?.status !== 'offline') {
      document.title = `(${totalUnread}) New Message - LoopIN`;
    } else {
      document.title = 'LoopIN - Real-Time Messaging & Photo Sharing';
    }
  }, [unreadCounts, user?.status]);

  const setActiveConversation = (conv: Conversation) => {
    setConversations((prev) => {
      const exists = prev.some((c) => c.id === conv.id);
      return exists ? prev : [conv, ...prev];
    });

    if (socket) {
      socket.emit('join_room', conv.id);
    }

    setActiveConversationState(conv);
    setUnreadCounts((prev) => ({ ...prev, [conv.id]: 0 }));
  };

  const sendMessage = (textContent?: string, imageUrl?: string) => {
    if (!socket || !activeConversation || !user) return;

    socket.emit('send_message', {
      conversationId: activeConversation.id,
      senderId: user.id,
      textContent,
      imageUrl,
    });
  };

  const editMessage = (messageId: string, textContent: string) => {
    if (!socket || !user) return;
    socket.emit('edit_message', {
      messageId,
      senderId: user.id,
      textContent,
    });
  };

  const deleteMessage = (messageId: string) => {
    if (!socket || !user) return;
    socket.emit('delete_message', {
      messageId,
      senderId: user.id,
    });
  };

  const deleteConversation = async (conversationId: string) => {
    try {
      await api.delete(`/chat/conversations/${conversationId}`);
      if (socket) {
        socket.emit('delete_conversation', { conversationId });
      }
      delete messageCacheRef.current[conversationId];
      setConversations((prev) => prev.filter((c) => c.id !== conversationId));
      setUnreadCounts((prev) => {
        const updated = { ...prev };
        delete updated[conversationId];
        return updated;
      });
      if (activeConversation?.id === conversationId) {
        const remaining = conversations.filter((c) => c.id !== conversationId);
        setActiveConversationState(remaining.length > 0 ? remaining[0] : null);
        setMessages([]);
      }
    } catch (err: any) {
      console.error('Failed to delete conversation:', err);
      alert(err.response?.data?.error || 'Failed to delete conversation');
    }
  };

  // Merge unreadCounts into conversations array
  const conversationsWithUnread = conversations.map((c) => ({
    ...c,
    unreadCount: unreadCounts[c.id] || 0,
  }));

  return {
    conversations: conversationsWithUnread,
    activeConversation,
    setActiveConversation,
    messages,
    isLoadingMessages,
    sendMessage,
    editMessage,
    deleteMessage,
    deleteConversation,
    refreshConversations: fetchConversations,
  };
};
