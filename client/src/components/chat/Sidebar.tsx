import React, { useState, useEffect } from 'react';
import { Conversation, User } from '../../types/chat';
import { Avatar } from '../common/Avatar';
import { useAuth } from '../../context/AuthContext';
import { LogOut, UserPlus, Check, X, Search, Clock, Settings, Trash2, Users, MessageSquare, UserMinus } from 'lucide-react';
import { Modal } from '../common/Modal';
import { EditProfileModal } from '../profile/EditProfileModal';
import { ImageLightbox } from './ImageLightbox';
import { api } from '../../services/api';
import { Button } from '../common/Button';
import { LoopInLogo } from '../common/LoopInLogo';

import { useSocketContext } from '../../context/SocketContext';
import { hapticLight, hapticMedium, hapticSuccess, hapticWarning } from '../../utils/haptics';

interface SidebarProps {
  conversations: Conversation[];
  activeConversation: Conversation | null;
  onSelectConversation: (conv: Conversation) => void;
  onRefreshConversations?: () => void;
  onDeleteConversation?: (convId: string) => void;
}

interface SearchedUser extends User {
  friendshipStatus: 'none' | 'pending_sent' | 'pending_received' | 'accepted';
  requestId?: string;
}

interface PendingRequest {
  id: string;
  senderId: string;
  createdAt: string;
  sender: User;
}

interface FriendItem {
  id: string;
  username: string;
  avatarUrl?: string;
  status?: string;
  requestId: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  conversations,
  activeConversation,
  onSelectConversation,
  onRefreshConversations,
  onDeleteConversation,
}) => {
  const { user, logout, updateUser } = useAuth();
  const { socket } = useSocketContext();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isMyAvatarLightboxOpen, setIsMyAvatarLightboxOpen] = useState(false);
  const [modalTab, setModalTab] = useState<'friends' | 'search' | 'requests'>('friends');

  const isOnline = user?.status !== 'offline';

  const handleToggleStatus = async () => {
    if (!user) return;
    hapticMedium();
    const nextStatus = isOnline ? 'offline' : 'online';
    try {
      const response = await api.put('/auth/profile', { status: nextStatus });
      updateUser(response.data);
      if (socket) {
        socket.emit('update_status', { userId: user.id, status: nextStatus });
      }
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  // Friends list state
  const [friendsList, setFriendsList] = useState<FriendItem[]>([]);
  const [isLoadingFriends, setIsLoadingFriends] = useState(false);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchedUser[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Pending requests state
  const [pendingRequests, setPendingRequests] = useState<PendingRequest[]>([]);

  const fetchFriendsList = async () => {
    setIsLoadingFriends(true);
    try {
      const response = await api.get('/friends/list');
      setFriendsList(response.data);
    } catch (err) {
      console.error('Failed to fetch friends list:', err);
    } finally {
      setIsLoadingFriends(false);
    }
  };

  const fetchPendingRequests = async () => {
    try {
      const response = await api.get('/friends/requests');
      setPendingRequests(response.data);
    } catch (err) {
      console.error('Failed to fetch pending requests:', err);
    }
  };

  useEffect(() => {
    if (user) {
      fetchPendingRequests();
      fetchFriendsList();
    }
  }, [user]);

  // Handle live user search
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const response = await api.get(`/friends/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchResults(response.data);
    } catch (err) {
      console.error('Search failed:', err);
    } finally {
      setIsSearching(false);
    }
  };

  // Send friend request
  const handleSendRequest = async (targetUserId: string) => {
    try {
      await api.post('/friends/request', { receiverId: targetUserId });
      // Update local state
      setSearchResults((prev) =>
        prev.map((u) => (u.id === targetUserId ? { ...u, friendshipStatus: 'pending_sent' } : u))
      );
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to send request');
    }
  };

  // Respond to request (accept / reject)
  const handleRespondRequest = async (requestId: string, action: 'accept' | 'reject') => {
    try {
      if (action === 'accept') hapticSuccess();
      const response = await api.post('/friends/respond', { requestId, action });
      fetchPendingRequests();
      fetchFriendsList();
      if (onRefreshConversations) onRefreshConversations();

      if (action === 'accept' && response.data.conversation) {
        setIsModalOpen(false);
        onSelectConversation(response.data.conversation);
      }
    } catch (err) {
      console.error('Failed to respond to request:', err);
    }
  };

  // Open / Re-open chat room with a friend (even if previously deleted)
  const handleOpenMessage = async (targetUserId: string) => {
    try {
      hapticLight();
      const response = await api.post('/chat/dm', { targetUserId });
      setIsModalOpen(false);
      onSelectConversation(response.data);
      if (onRefreshConversations) onRefreshConversations();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to open chat');
    }
  };

  // Unfriend user
  const handleUnfriend = async (targetUserId: string, username: string) => {
    if (!window.confirm(`Are you sure you want to unfriend "${username}"?`)) return;
    hapticWarning();
    try {
      await api.post('/friends/unfriend', { targetUserId });
      fetchFriendsList();
      fetchPendingRequests();
      if (onRefreshConversations) onRefreshConversations();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to unfriend user');
    }
  };

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        backgroundColor: 'var(--bg-secondary)',
        borderRight: '1px solid var(--border-color)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* User Profile Header */}
      <div
        style={{
          padding: '16px 20px',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Avatar
            src={user?.avatarUrl}
            name={user?.username || ''}
            status={isOnline ? 'online' : 'offline'}
            onClick={() => user?.avatarUrl && setIsMyAvatarLightboxOpen(true)}
          />
          <div style={{ minWidth: 0, flex: 1 }}>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user?.username}
            </h4>

            {/* Online / Offline Slide Switch */}
            <div
              onClick={handleToggleStatus}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                marginTop: '4px',
                cursor: 'pointer',
                userSelect: 'none',
              }}
              title={isOnline ? 'Slide to set Offline (Red mode & mute notifications)' : 'Slide to set Online (Green mode & active notifications)'}
            >
              {/* Slide Switch Track */}
              <div
                style={{
                  width: '36px',
                  height: '20px',
                  borderRadius: '12px',
                  backgroundColor: isOnline ? '#10b981' : '#ef4444',
                  boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.3)',
                  position: 'relative',
                  transition: 'background-color 0.25s ease',
                  display: 'flex',
                  alignItems: 'center',
                  padding: '2px',
                }}
              >
                {/* Sliding Circle Thumb */}
                <div
                  style={{
                    width: '16px',
                    height: '16px',
                    borderRadius: '50%',
                    backgroundColor: '#ffffff',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.4)',
                    transform: isOnline ? 'translateX(16px)' : 'translateX(0px)',
                    transition: 'transform 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                  }}
                />
              </div>

              {/* Status Label Text */}
              <span
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  color: isOnline ? '#10b981' : '#ef4444',
                }}
              >
                {isOnline ? 'Online' : 'Offline'}
              </span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={() => setIsProfileModalOpen(true)}
            title="Edit Profile"
            style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
          >
            <Settings size={18} />
          </button>

          <button
            onClick={logout}
            title="Logout"
            style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>

      {/* Action Bar */}
      <div
        style={{
          padding: '16px 20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <LoopInLogo size={26} />
        <button
          onClick={() => {
            setIsModalOpen(true);
            fetchFriendsList();
            fetchPendingRequests();
          }}
          style={{
            background: 'var(--bg-tertiary)',
            border: '1px solid var(--glass-border)',
            color: '#fff',
            borderRadius: 'var(--radius-md)',
            padding: '6px 12px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '0.82rem',
            fontWeight: 600,
            position: 'relative',
          }}
        >
          <UserPlus size={16} /> Add / Friends
          {pendingRequests.length > 0 && (
            <span
              style={{
                backgroundColor: '#ef4444',
                color: '#fff',
                borderRadius: '50%',
                width: 16,
                height: 16,
                fontSize: '0.7rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
              }}
            >
              {pendingRequests.length}
            </span>
          )}
        </button>
      </div>

      {/* Conversation List */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 8px' }}>
        {conversations.length === 0 ? (
          <p style={{ textAlign: 'center', color: 'var(--text-secondary)', marginTop: '40px', fontSize: '0.85rem' }}>
            No active chats. Click "Add / Friends" to message your contacts!
          </p>
        ) : (
          conversations.map((conv) => {
            const isSelected = activeConversation?.id === conv.id;
            const otherMember = conv.members.find((m) => m.user.id !== user?.id)?.user;
            const chatName = conv.isGroup ? conv.name : otherMember?.username || 'Chat';
            const lastMessage =
              conv.messages?.[0]?.textContent ||
              (conv.messages?.[0]?.imageUrl
                ? '📷 Image'
                : conv.messages?.[0]?.audioUrl
                ? '🎵 Voice Note'
                : 'No messages yet');

            return (
              <div
                key={conv.id}
                onClick={() => {
                  hapticLight();
                  onSelectConversation(conv);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px',
                  borderRadius: 'var(--radius-md)',
                  cursor: 'pointer',
                  backgroundColor: isSelected ? 'var(--bg-tertiary)' : 'transparent',
                  transition: 'background 0.2s ease',
                  marginBottom: '4px',
                  position: 'relative',
                }}
                className="conversation-item"
              >
                <Avatar
                  src={otherMember?.avatarUrl}
                  name={chatName || ''}
                  status={otherMember?.status || 'offline'}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h5 style={{ fontSize: '0.9rem', fontWeight: 600, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {chatName}
                    </h5>
                    {conv.unreadCount && conv.unreadCount > 0 ? (
                      <span
                        style={{
                          backgroundColor: '#ef4444',
                          color: '#fff',
                          borderRadius: '12px',
                          padding: '2px 8px',
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          marginLeft: '6px',
                        }}
                      >
                        {conv.unreadCount}
                      </span>
                    ) : null}
                  </div>
                  <p style={{ fontSize: '0.8rem', color: conv.unreadCount ? '#fff' : 'var(--text-secondary)', fontWeight: conv.unreadCount ? 600 : 400, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {lastMessage}
                  </p>
                </div>

                {/* Delete Conversation Button */}
                {onDeleteConversation && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (window.confirm(`Delete conversation with "${chatName}"? This action cannot be undone.`)) {
                        onDeleteConversation(conv.id);
                      }
                    }}
                    title="Delete Chat Room"
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--text-secondary)',
                      cursor: 'pointer',
                      padding: '4px',
                      borderRadius: 'var(--radius-sm)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = '#ef4444')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-secondary)')}
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Friend Search & Requests Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Friends & Contacts">
        {/* Navigation Tabs */}
        <div style={{ display: 'flex', gap: '6px', marginBottom: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
          <button
            onClick={() => {
              setModalTab('friends');
              fetchFriendsList();
            }}
            style={{
              flex: 1,
              padding: '8px 4px',
              borderRadius: 'var(--radius-sm)',
              border: 'none',
              backgroundColor: modalTab === 'friends' ? 'var(--accent-color)' : 'transparent',
              color: '#fff',
              fontWeight: 600,
              fontSize: '0.82rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
            }}
          >
            <Users size={15} /> Friends ({friendsList.length})
          </button>
          <button
            onClick={() => setModalTab('search')}
            style={{
              flex: 1,
              padding: '8px 4px',
              borderRadius: 'var(--radius-sm)',
              border: 'none',
              backgroundColor: modalTab === 'search' ? 'var(--accent-color)' : 'transparent',
              color: '#fff',
              fontWeight: 600,
              fontSize: '0.82rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
            }}
          >
            <Search size={15} /> Find Users
          </button>
          <button
            onClick={() => setModalTab('requests')}
            style={{
              flex: 1,
              padding: '8px 4px',
              borderRadius: 'var(--radius-sm)',
              border: 'none',
              backgroundColor: modalTab === 'requests' ? 'var(--accent-color)' : 'transparent',
              color: '#fff',
              fontWeight: 600,
              fontSize: '0.82rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
            }}
          >
            <Clock size={15} /> Requests {pendingRequests.length > 0 && `(${pendingRequests.length})`}
          </button>
        </div>

        {/* Tab 1: Friends List */}
        {modalTab === 'friends' && (
          <div style={{ maxHeight: '320px', overflowY: 'auto' }}>
            {isLoadingFriends ? (
              <p style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '20px 0', fontSize: '0.85rem' }}>
                Loading friends...
              </p>
            ) : friendsList.length === 0 ? (
              <p style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '20px 0', fontSize: '0.85rem' }}>
                No friends added yet. Use "Find Users" to search and add contacts!
              </p>
            ) : (
              friendsList.map((f) => (
                <div
                  key={f.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 12px',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'var(--bg-primary)',
                    marginBottom: '8px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Avatar src={f.avatarUrl} name={f.username} status={(f.status as 'online' | 'offline' | 'away') || 'offline'} size="sm" />
                    <div>
                      <h5 style={{ fontSize: '0.88rem', fontWeight: 600 }}>{f.username}</h5>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{f.status || 'Friend'}</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      onClick={() => handleOpenMessage(f.id)}
                      style={{
                        backgroundColor: 'var(--accent-color)',
                        color: '#fff',
                        border: 'none',
                        borderRadius: 'var(--radius-sm)',
                        padding: '6px 10px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '0.78rem',
                        fontWeight: 600,
                      }}
                      title="Open or restore chat room"
                    >
                      <MessageSquare size={14} /> Message
                    </button>

                    <button
                      onClick={() => handleUnfriend(f.id, f.username)}
                      style={{
                        backgroundColor: 'rgba(239, 68, 68, 0.2)',
                        color: '#ef4444',
                        border: '1px solid rgba(239, 68, 68, 0.4)',
                        borderRadius: 'var(--radius-sm)',
                        padding: '6px 8px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '0.78rem',
                        fontWeight: 600,
                      }}
                      title="Unfriend contact"
                    >
                      <UserMinus size={14} /> Unfriend
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Tab 1: Search Users */}
        {modalTab === 'search' && (
          <div>
            <form onSubmit={handleSearch} style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
              <input
                type="text"
                placeholder="Search username or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  flex: 1,
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--glass-border)',
                  backgroundColor: 'var(--bg-primary)',
                  color: '#fff',
                  outline: 'none',
                }}
              />
              <Button type="submit" isLoading={isSearching}>
                Search
              </Button>
            </form>

            <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
              {searchResults.length === 0 ? (
                <p style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '20px 0', fontSize: '0.85rem' }}>
                  {searchQuery ? 'No users found matching query.' : 'Type a username above to find friends.'}
                </p>
              ) : (
                searchResults.map((u) => (
                  <div
                    key={u.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 12px',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: 'var(--bg-primary)',
                      marginBottom: '8px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <Avatar src={u.avatarUrl} name={u.username} size="sm" />
                      <div>
                        <h5 style={{ fontSize: '0.88rem', fontWeight: 600 }}>{u.username}</h5>
                      </div>
                    </div>

                    {u.friendshipStatus === 'none' && (
                      <Button
                        onClick={() => handleSendRequest(u.id)}
                        style={{ padding: '6px 12px', fontSize: '0.78rem' }}
                      >
                        <UserPlus size={14} /> Add
                      </Button>
                    )}

                    {u.friendshipStatus === 'pending_sent' && (
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                        ⏳ Request Sent
                      </span>
                    )}

                    {u.friendshipStatus === 'accepted' && (
                      <span style={{ fontSize: '0.78rem', color: '#10b981', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Check size={14} /> Friends
                      </span>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Tab 2: Pending Requests */}
        {modalTab === 'requests' && (
          <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
            {pendingRequests.length === 0 ? (
              <p style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '20px 0', fontSize: '0.85rem' }}>
                No pending friend requests.
              </p>
            ) : (
              pendingRequests.map((req) => (
                <div
                  key={req.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 12px',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'var(--bg-primary)',
                    marginBottom: '8px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Avatar src={req.sender.avatarUrl} name={req.sender.username} size="sm" />
                    <div>
                      <h5 style={{ fontSize: '0.88rem', fontWeight: 600 }}>{req.sender.username}</h5>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Wants to be friends</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      onClick={() => handleRespondRequest(req.id, 'accept')}
                      style={{
                        backgroundColor: '#10b981',
                        color: '#fff',
                        border: 'none',
                        borderRadius: 'var(--radius-sm)',
                        padding: '6px 10px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                      }}
                    >
                      <Check size={14} /> Accept
                    </button>

                    <button
                      onClick={() => handleRespondRequest(req.id, 'reject')}
                      style={{
                        backgroundColor: '#ef4444',
                        color: '#fff',
                        border: 'none',
                        borderRadius: 'var(--radius-sm)',
                        padding: '6px 10px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                      }}
                    >
                      <X size={14} /> Decline
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </Modal>

      {/* Edit Profile Modal */}
      <EditProfileModal isOpen={isProfileModalOpen} onClose={() => setIsProfileModalOpen(false)} />

      {/* Own Avatar Lightbox */}
      <ImageLightbox
        imageUrl={isMyAvatarLightboxOpen ? user?.avatarUrl || null : null}
        onClose={() => setIsMyAvatarLightboxOpen(false)}
      />
    </div>
  );
};
