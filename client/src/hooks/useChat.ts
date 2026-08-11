import { useState, useEffect } from 'react';
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

  // Fetch all user conversations
  const fetchConversations = async () => {
    try {
      const response = await api.get('/chat/conversations');
      setConversations(response.data);
      if (response.data.length > 0 && !activeConversation) {
        setActiveConversationState(response.data[0]);
      }
    } catch (err) {
      console.error('Failed to fetch conversations:', err);
    }
  };

  useEffect(() => {
    if (!user) return;
    fetchConversations();
  }, [user]);

  // Join all conversation rooms via socket
  useEffect(() => {
    if (!socket || conversations.length === 0) return;
    conversations.forEach((c) => {
      socket.emit('join_room', c.id);
    });
  }, [socket, conversations]);

  // Fetch messages for active conversation
  useEffect(() => {
    if (!activeConversation) return;

    const fetchMessages = async () => {
      setIsLoadingMessages(true);
      try {
        const response = await api.get(`/chat/conversations/${activeConversation.id}/messages`);
        setMessages(response.data);
      } catch (err) {
        console.error('Failed to fetch messages:', err);
      } finally {
        setIsLoadingMessages(false);
      }
    };

    fetchMessages();

    // Clear unread count for active conversation
    setUnreadCounts((prev) => ({ ...prev, [activeConversation.id]: 0 }));
  }, [activeConversation]);

  // Listen for real-time socket messages & edits
  useEffect(() => {
    if (!socket || !user) return;

    const handleNewMessage = (newMessage: Message) => {
      // Don't trigger unread for own messages, but bump conversation to top
      if (newMessage.senderId === user.id) {
        if (activeConversation && newMessage.conversationId === activeConversation.id) {
          setMessages((prev) => [...prev, newMessage]);
        }
        setConversations((prev) => {
          const target = prev.find((c) => c.id === newMessage.conversationId);
          if (!target) return prev;

          const updatedConv = { ...target, messages: [newMessage], updatedAt: newMessage.createdAt };
          const remaining = prev.filter((c) => c.id !== newMessage.conversationId);
          return [updatedConv, ...remaining];
        });
        return;
      }

      // Play audio notification
      playNotificationSound();

      if (activeConversation && newMessage.conversationId === activeConversation.id) {
        setMessages((prev) => [...prev, newMessage]);
      } else {
        // Increment unread count for non-active conversation
        setUnreadCounts((prev) => ({
          ...prev,
          [newMessage.conversationId]: (prev[newMessage.conversationId] || 0) + 1,
        }));
      }

      // Update conversation preview message and bump to top
      setConversations((prev) => {
        const target = prev.find((c) => c.id === newMessage.conversationId);
        if (!target) return prev;

        const updatedConv = { ...target, messages: [newMessage], updatedAt: newMessage.createdAt };
        const remaining = prev.filter((c) => c.id !== newMessage.conversationId);
        return [updatedConv, ...remaining];
      });
    };

    const handleMessageEdited = (updatedMessage: Message) => {
      setMessages((prev) =>
        prev.map((m) => (m.id === updatedMessage.id ? updatedMessage : m))
      );
    };

    socket.on('new_message', handleNewMessage);
    socket.on('message_edited', handleMessageEdited);

    return () => {
      socket.off('new_message', handleNewMessage);
      socket.off('message_edited', handleMessageEdited);
    };
  }, [socket, activeConversation, user]);

  // Update document title for unread indicator
  useEffect(() => {
    const totalUnread = Object.values(unreadCounts).reduce((a, b) => a + b, 0);
    if (totalUnread > 0) {
      document.title = `(${totalUnread}) New Message - Chat App`;
    } else {
      document.title = 'Real-Time Chat Application';
    }
  }, [unreadCounts]);

  const setActiveConversation = (conv: Conversation) => {
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
    refreshConversations: fetchConversations,
  };
};
