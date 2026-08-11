import React, { useState, useEffect } from 'react';
import { Message } from '../../types/chat';
import { useAuth } from '../../context/AuthContext';
import { formatTime } from '../../utils/format';
import { Avatar } from '../common/Avatar';
import { UserProfileModal } from '../profile/UserProfileModal';
import { Edit2, Check, X, CheckCheck } from 'lucide-react';

interface MessageItemProps {
  message: Message;
  onImageClick: (url: string) => void;
  onEditMessage?: (messageId: string, textContent: string) => void;
}

export const MessageItem: React.FC<MessageItemProps> = ({ message, onImageClick, onEditMessage }) => {
  const { user } = useAuth();
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(message.textContent || '');

  const isMe = message.senderId === user?.id;

  // Calculate 15-second countdown timer for editing
  const [remainingSeconds, setRemainingSeconds] = useState(() => {
    if (!isMe) return 0;
    const createdMs = new Date(message.createdAt).getTime();
    const elapsedMs = Date.now() - createdMs;
    return Math.max(0, Math.ceil((15000 - elapsedMs) / 1000));
  });

  useEffect(() => {
    if (!isMe || remainingSeconds <= 0) return;

    const timer = setInterval(() => {
      const createdMs = new Date(message.createdAt).getTime();
      const elapsedMs = Date.now() - createdMs;
      const leftSec = Math.max(0, Math.ceil((15000 - elapsedMs) / 1000));

      setRemainingSeconds(leftSec);
      if (leftSec <= 0) {
        setIsEditing(false);
        clearInterval(timer);
      }
    }, 500);

    return () => clearInterval(timer);
  }, [isMe, message.createdAt, remainingSeconds]);

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editText.trim() || !onEditMessage) return;

    onEditMessage(message.id, editText.trim());
    setIsEditing(false);
  };

  return (
    <>
      <div
        style={{
          display: 'flex',
          flexDirection: isMe ? 'row-reverse' : 'row',
          alignItems: 'flex-end',
          gap: '8px',
          marginBottom: '14px',
        }}
      >
        {!isMe && (
          <Avatar
            src={message.sender.avatarUrl}
            name={message.sender.username}
            size="sm"
            onClick={() => setIsProfileModalOpen(true)}
          />
        )}

        <div
          style={{
            maxWidth: '70%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: isMe ? 'flex-end' : 'flex-start',
          }}
        >
          <div
            style={{
              background: isMe ? 'var(--chat-bubble-sent-gradient)' : 'var(--chat-bubble-received)',
              color: '#fff',
              padding: message.imageUrl ? '6px' : '10px 14px',
              borderRadius: isMe ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
              wordBreak: 'break-word',
              fontSize: '0.92rem',
              border: isMe ? '1px solid rgba(18, 62, 140, 0.45)' : '1px solid rgba(255, 255, 255, 0.07)',
              boxShadow: isMe ? '0 4px 14px rgba(10, 42, 102, 0.4)' : '0 2px 6px rgba(0,0,0,0.3)',
            }}
          >
            {message.imageUrl && (
              <img
                src={message.imageUrl}
                alt="Attachment"
                onClick={() => onImageClick(message.imageUrl!)}
                style={{
                  maxWidth: '100%',
                  maxHeight: '300px',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  objectFit: 'cover',
                  display: 'block',
                  marginBottom: message.textContent ? '8px' : '0',
                }}
              />
            )}

            {isEditing ? (
              <form onSubmit={handleSaveEdit} style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                <input
                  type="text"
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  autoFocus
                  style={{
                    backgroundColor: 'rgba(3, 8, 28, 0.5)',
                    border: '1px solid rgba(255,255,255,0.25)',
                    color: '#fff',
                    borderRadius: 'var(--radius-sm)',
                    padding: '4px 8px',
                    fontSize: '0.88rem',
                    outline: 'none',
                  }}
                />
                <button
                  type="submit"
                  style={{ background: 'none', border: 'none', color: '#10b981', cursor: 'pointer', padding: '2px' }}
                  title="Save Edit"
                >
                  <Check size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '2px' }}
                  title="Cancel"
                >
                  <X size={16} />
                </button>
              </form>
            ) : (
              message.textContent && <div style={{ lineHeight: 1.45 }}>{message.textContent}</div>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px', padding: '0 4px' }}>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
              {formatTime(message.createdAt)}
            </span>

            {/* WhatsApp-style Double Checkmark for Sent Messages */}
            {isMe && (
              <span title="Delivered & Read" style={{ display: 'inline-flex', alignItems: 'center' }}>
                <CheckCheck size={14} color="#38bdf8" style={{ opacity: 0.9 }} />
              </span>
            )}

            {/* 15-Second Edit Timer Option for Sender */}
            {isMe && remainingSeconds > 0 && !isEditing && message.textContent && (
              <button
                onClick={() => setIsEditing(true)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#38bdf8',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '2px',
                  fontSize: '0.7rem',
                  fontWeight: 600,
                  marginLeft: '4px',
                }}
                title="Edit message (15s window)"
              >
                <Edit2 size={11} /> Edit ({remainingSeconds}s)
              </button>
            )}
          </div>
        </div>
      </div>

      {!isMe && (
        <UserProfileModal
          user={{
            id: message.sender.id,
            username: message.sender.username,
            email: '',
            avatarUrl: message.sender.avatarUrl,
          }}
          isOpen={isProfileModalOpen}
          onClose={() => setIsProfileModalOpen(false)}
        />
      )}
    </>
  );
};
