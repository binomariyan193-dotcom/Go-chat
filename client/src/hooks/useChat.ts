import { useState, useEffect, useRef } from 'react';
import { api } from '../services/api';
import { Conversation, Message } from '../types/chat';
import { useSocketContext } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import { playNotificationSound } from '../utils/sound';
import { hapticNotification, hapticMedium, hapticWarning, hapticLight } from '../utils/haptics';
import {
  generateAESKey,
  exportAESKeyBase64,
  importAESKeyBase64,
  encryptPayload,
  decryptPayload,
} from '../utils/crypto';

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
  const aesKeysRef = useRef<{ [convId: string]: CryptoKey }>({});

  useEffect(() => {
    activeConversationRef.current = activeConversation;
  }, [activeConversation]);

  // E2EE Helper: Get or create AES-256 key for a conversation
  const getOrCreateAESKey = async (convId: string): Promise<CryptoKey> => {
    if (aesKeysRef.current[convId]) {
      return aesKeysRef.current[convId];
    }

    const storageKey = `loopin_aes_key_${convId}`;
    const storedBase64 = localStorage.getItem(storageKey);

    if (storedBase64) {
      try {
        const importedKey = await importAESKeyBase64(storedBase64);
        aesKeysRef.current[convId] = importedKey;
        return importedKey;
      } catch (err) {
        console.warn('Failed to import stored AES key, generating fresh key:', err);
      }
    }

    const newKey = await generateAESKey();
    const base64Key = await exportAESKeyBase64(newKey);
    localStorage.setItem(storageKey, base64Key);
    aesKeysRef.current[convId] = newKey;
    return newKey;
  };

  // E2EE Helper: Decrypt single message
  const processDecryptMessage = async (msg: Message, aesKey: CryptoKey): Promise<Message> => {
    if (!msg.isEncrypted || !msg.ciphertext || !msg.iv) {
      return msg;
    }

    try {
      const decryptedPayload = await decryptPayload(msg.ciphertext, msg.iv, aesKey);
      return {
        ...msg,
        textContent: decryptedPayload.textContent,
        imageUrl: decryptedPayload.imageUrl,
        audioUrl: decryptedPayload.audioUrl,
      };
    } catch (err) {
      return {
        ...msg,
        textContent: msg.textContent || '[🔒 Encrypted Message]',
      };
    }
  };

  // E2EE Helper: Decrypt array of messages
  const decryptMessageList = async (msgList: Message[], convId: string): Promise<Message[]> => {
    try {
      const aesKey = await getOrCreateAESKey(convId);
      return await Promise.all(msgList.map((m) => processDecryptMessage(m, aesKey)));
    } catch (err) {
      console.error('Failed to decrypt message list:', err);
      return msgList;
    }
  };

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

  // Fetch messages for active conversation with ZERO-LAG instant cache & E2EE Decryption
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

        // Decrypt messages with E2EE
        const decryptedMessages = await decryptMessageList(response.data, convId);

        // Update in-memory cache & active messages state
        messageCacheRef.current[convId] = decryptedMessages;
        if (activeConversationRef.current?.id === convId) {
          setMessages(decryptedMessages);
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

    const handleNewMessage = async (rawMessage: Message) => {
      const convId = rawMessage.conversationId;

      // E2EE Decrypt incoming real-time socket message
      const aesKey = await getOrCreateAESKey(convId);
      const newMessage = await processDecryptMessage(rawMessage, aesKey);

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
        hapticNotification();
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

    const handleReactionUpdated = (data: { messageId: string; conversationId: string; reactions: any[] }) => {
      const convId = data.conversationId;
      if (messageCacheRef.current[convId]) {
        messageCacheRef.current[convId] = messageCacheRef.current[convId].map((m) =>
          m.id === data.messageId ? { ...m, reactions: data.reactions } : m
        );
      }
      setMessages((prev) =>
        prev.map((m) => (m.id === data.messageId ? { ...m, reactions: data.reactions } : m))
      );
    };

    const handleNewGroupCreated = (data: { userId: string; conversation: Conversation }) => {
      if (user && data.userId === user.id) {
        setConversations((prev) => {
          if (prev.some((c) => c.id === data.conversation.id)) return prev;
          return [data.conversation, ...prev];
        });
        if (socket) socket.emit('join_room', data.conversation.id);
      }
    };

    const handleGroupInfoUpdated = (data: { conversationId: string; conversation: any }) => {
      setConversations((prev) =>
        prev.map((c) => (c.id === data.conversationId ? { ...c, ...data.conversation } : c))
      );
      setActiveConversationState((prev) =>
        prev?.id === data.conversationId ? { ...prev, ...data.conversation } : prev
      );
    };

    const handleGroupMembersChanged = (data: { conversationId: string; members: any[] }) => {
      setConversations((prev) =>
        prev.map((c) => (c.id === data.conversationId ? { ...c, members: data.members } : c))
      );
      setActiveConversationState((prev) =>
        prev?.id === data.conversationId ? { ...prev, members: data.members } : prev
      );
    };

    socket.on('new_message', handleNewMessage);
    socket.on('message_edited', handleMessageEdited);
    socket.on('conversation_deleted', handleConversationDeleted);
    socket.on('message_deleted', handleMessageDeleted);
    socket.on('user_status_changed', handleUserStatusChanged);
    socket.on('message_reaction_updated', handleReactionUpdated);
    socket.on('new_group_created', handleNewGroupCreated);
    socket.on('group_info_updated', handleGroupInfoUpdated);
    socket.on('group_members_changed', handleGroupMembersChanged);

    return () => {
      socket.off('new_message', handleNewMessage);
      socket.off('message_edited', handleMessageEdited);
      socket.off('conversation_deleted', handleConversationDeleted);
      socket.off('message_deleted', handleMessageDeleted);
      socket.off('user_status_changed', handleUserStatusChanged);
      socket.off('message_reaction_updated', handleReactionUpdated);
      socket.off('new_group_created', handleNewGroupCreated);
      socket.off('group_info_updated', handleGroupInfoUpdated);
      socket.off('group_members_changed', handleGroupMembersChanged);
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

  const sendMessage = async (textContent?: string, imageUrl?: string, audioUrl?: string) => {
    if (!socket || !activeConversation || !user) return;

    hapticMedium();

    try {
      // E2EE Payload Encryption
      const aesKey = await getOrCreateAESKey(activeConversation.id);
      const encryptedPayload = await encryptPayload({ textContent, imageUrl, audioUrl }, aesKey);

      socket.emit('send_message', {
        conversationId: activeConversation.id,
        senderId: user.id,
        isEncrypted: true,
        ciphertext: encryptedPayload.ciphertext,
        iv: encryptedPayload.iv,
        // Unencrypted fallbacks for legacy rendering compatibility
        textContent,
        imageUrl,
        audioUrl,
      });
    } catch (cryptoErr) {
      console.error('E2EE Encryption failed, falling back to standard send:', cryptoErr);
      socket.emit('send_message', {
        conversationId: activeConversation.id,
        senderId: user.id,
        textContent,
        imageUrl,
        audioUrl,
      });
    }
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
    hapticWarning();
    socket.emit('delete_message', {
      messageId,
      senderId: user.id,
    });
  };

  const deleteConversation = async (conversationId: string) => {
    try {
      hapticWarning();
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

  const reactToMessage = (messageId: string, emoji: string) => {
    if (!socket || !user) return;
    hapticLight();
    socket.emit('react_message', {
      messageId,
      userId: user.id,
      emoji,
    });
  };

  // Group Management Actions
  const createGroup = async (groupData: { name: string; description?: string; avatarUrl?: string; memberUserIds: string[] }) => {
    hapticMedium();
    const res = await api.post('/chat/groups', groupData);
    const newConv: Conversation = res.data;
    setConversations((prev) => [newConv, ...prev]);
    setActiveConversationState(newConv);

    if (socket) {
      socket.emit('join_room', newConv.id);
      socket.emit('group_created', { conversation: newConv, memberUserIds: [user?.id, ...groupData.memberUserIds] });
    }
  };

  const updateGroupDetails = async (conversationId: string, updates: { name?: string; description?: string; avatarUrl?: string }) => {
    hapticMedium();
    const res = await api.patch(`/chat/groups/${conversationId}`, updates);
    const updated = res.data;
    setConversations((prev) => prev.map((c) => (c.id === conversationId ? { ...c, ...updated } : c)));
    setActiveConversationState((prev) => (prev?.id === conversationId ? { ...prev, ...updated } : prev));

    if (socket) {
      socket.emit('group_updated', { conversationId, conversation: updated });
    }
  };

  const addGroupMembers = async (conversationId: string, userIds: string[]) => {
    hapticMedium();
    const res = await api.post(`/chat/groups/${conversationId}/members`, { userIds });
    const { members } = res.data;
    setConversations((prev) => prev.map((c) => (c.id === conversationId ? { ...c, members } : c)));
    setActiveConversationState((prev) => (prev?.id === conversationId ? { ...prev, members } : prev));

    if (socket) {
      socket.emit('group_members_updated', { conversationId, members });
    }
  };

  const removeGroupMember = async (conversationId: string, targetUserId: string) => {
    hapticWarning();
    await api.delete(`/chat/groups/${conversationId}/members/${targetUserId}`);
    if (targetUserId === user?.id) {
      // User left group
      delete messageCacheRef.current[conversationId];
      setConversations((prev) => prev.filter((c) => c.id !== conversationId));
      if (activeConversation?.id === conversationId) {
        const remaining = conversations.filter((c) => c.id !== conversationId);
        setActiveConversationState(remaining.length > 0 ? remaining[0] : null);
        setMessages([]);
      }
    } else {
      // Member removed
      setConversations((prev) =>
        prev.map((c) => (c.id === conversationId ? { ...c, members: c.members.filter((m) => m.user.id !== targetUserId) } : c))
      );
      setActiveConversationState((prev) =>
        prev?.id === conversationId ? { ...prev, members: prev.members.filter((m) => m.user.id !== targetUserId) } : prev
      );
    }

    if (socket) {
      socket.emit('group_members_updated', {
        conversationId,
        members: activeConversation?.members.filter((m) => m.user.id !== targetUserId) || [],
      });
    }
  };

  const updateMemberRole = async (conversationId: string, targetUserId: string, role: 'admin' | 'member') => {
    hapticMedium();
    const res = await api.patch(`/chat/groups/${conversationId}/members/${targetUserId}/role`, { role });
    const { members } = res.data;
    setConversations((prev) => prev.map((c) => (c.id === conversationId ? { ...c, members } : c)));
    setActiveConversationState((prev) => (prev?.id === conversationId ? { ...prev, members } : prev));

    if (socket) {
      socket.emit('group_members_updated', { conversationId, members });
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
    reactToMessage,
    createGroup,
    updateGroupDetails,
    addGroupMembers,
    removeGroupMember,
    updateMemberRole,
    refreshConversations: fetchConversations,
  };
};
