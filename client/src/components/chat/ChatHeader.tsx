import React, { useState } from 'react';
import { Conversation } from '../../types/chat';
import { Avatar } from '../common/Avatar';
import { useAuth } from '../../context/AuthContext';
import { UserProfileModal } from '../profile/UserProfileModal';
import { ArrowLeft, Trash2, Users, ShieldCheck } from 'lucide-react';

interface ChatHeaderProps {
  activeConversation: Conversation | null;
  onBack?: () => void;
  onDelete?: () => void;
  onOpenGroupSettings?: () => void;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({ 
  activeConversation, 
  onBack, 
  onDelete,
  onOpenGroupSettings,
}) => {
  const { user } = useAuth();
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  if (!activeConversation) return null;

  const isGroup = activeConversation.isGroup;
  const otherMember = activeConversation.members.find((m) => m.user.id !== user?.id)?.user;
  const title = isGroup ? activeConversation.name || 'Group Chat' : otherMember?.username || 'Chat';
  const avatarUrl = isGroup ? activeConversation.avatarUrl : otherMember?.avatarUrl;
  const status = isGroup ? `${activeConversation.members.length} members` : (otherMember?.status as 'online' | 'offline' | 'away') || 'offline';

  const handleHeaderClick = () => {
    if (isGroup) {
      if (onOpenGroupSettings) onOpenGroupSettings();
    } else if (otherMember) {
      setIsProfileModalOpen(true);
    }
  };

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
            onClick={handleHeaderClick}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              cursor: 'pointer',
            }}
            title={isGroup ? 'Click to open Group Settings & Member Roles' : 'Click to view profile'}
          >
            <Avatar src={avatarUrl} name={title} status={isGroup ? undefined : (status as any)} size="md" />
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: 0, color: '#fff' }}>{title}</h3>
                <span
                  title="End-to-End Encrypted Room"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '3px',
                    backgroundColor: 'rgba(16, 185, 129, 0.15)',
                    color: '#10b981',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    borderRadius: '10px',
                    padding: '1px 6px',
                    fontSize: '0.68rem',
                    fontWeight: 600,
                  }}
                >
                  <ShieldCheck size={11} color="#10b981" /> E2EE
                </span>
              </div>
              <span style={{ fontSize: '0.78rem', color: isGroup ? '#38bdf8' : 'var(--text-secondary)' }}>
                {activeConversation.description || status}
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {isGroup && onOpenGroupSettings && (
            <button
              onClick={onOpenGroupSettings}
              title="Group Settings & Members"
              style={{
                background: 'rgba(56, 189, 248, 0.12)',
                border: '1px solid rgba(56, 189, 248, 0.3)',
                color: '#38bdf8',
                cursor: 'pointer',
                padding: '6px 12px',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '0.82rem',
                fontWeight: 600,
              }}
            >
              <Users size={16} /> Members ({activeConversation.members.length})
            </button>
          )}

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
      </div>

      {!isGroup && otherMember && (
        <UserProfileModal
          user={otherMember}
          isOpen={isProfileModalOpen}
          onClose={() => setIsProfileModalOpen(false)}
        />
      )}
    </>
  );
};
