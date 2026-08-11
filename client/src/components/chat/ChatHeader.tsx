import React, { useState } from 'react';
import { Conversation } from '../../types/chat';
import { Avatar } from '../common/Avatar';
import { useAuth } from '../../context/AuthContext';
import { UserProfileModal } from '../profile/UserProfileModal';
import { ArrowLeft, Trash2 } from 'lucide-react';

interface ChatHeaderProps {
  activeConversation: Conversation | null;
  onBack?: () => void;
  onDelete?: () => void;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({ activeConversation, onBack, onDelete }) => {
  const { user } = useAuth();
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  if (!activeConversation) return null;

  const otherMember = activeConversation.members.find((m) => m.user.id !== user?.id)?.user;
  const title = activeConversation.isGroup ? activeConversation.name : otherMember?.username || 'Chat';
  const status = (otherMember?.status as 'online' | 'offline' | 'away') || 'offline';

  return (
    <>
      <div
        style={{
          padding: '12px 16px',
          borderBottom: '1px solid var(--border-color)',
          backgroundColor: 'var(--bg-secondary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Mobile Back Button */}
          {onBack && (
            <button
              onClick={onBack}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-primary)',
                cursor: 'pointer',
                padding: '6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 'var(--radius-sm)',
              }}
              title="Back to Conversations"
            >
              <ArrowLeft size={22} />
            </button>
          )}

          <div
            onClick={() => otherMember && setIsProfileModalOpen(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              cursor: otherMember ? 'pointer' : 'default',
            }}
            title={otherMember ? 'Click to view user profile' : ''}
          >
            <Avatar src={otherMember?.avatarUrl} name={title || ''} status={status} size="md" />
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>{title}</h3>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                {status}
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        {onDelete && (
          <button
            onClick={() => {
              if (window.confirm(`Delete conversation with "${title}"? This action cannot be undone.`)) {
                onDelete();
              }
            }}
            title="Delete Chat Room"
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: 'var(--radius-sm)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#ef4444')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-secondary)')}
          >
            <Trash2 size={20} />
          </button>
        )}
      </div>

      {otherMember && (
        <UserProfileModal
          user={otherMember}
          isOpen={isProfileModalOpen}
          onClose={() => setIsProfileModalOpen(false)}
        />
      )}
    </>
  );
};
