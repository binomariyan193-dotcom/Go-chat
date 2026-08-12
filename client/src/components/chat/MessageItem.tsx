import React, { useState, useEffect } from 'react';
import { Message } from '../../types/chat';
import { useAuth } from '../../context/AuthContext';
import { formatTime } from '../../utils/format';
import { Avatar } from '../common/Avatar';
import { UserProfileModal } from '../profile/UserProfileModal';
import { Edit2, Check, X, CheckCheck, Trash2, Smile } from 'lucide-react';
import { AudioPlayer } from './AudioPlayer';

interface MessageItemProps {
  message: Message;
  onImageClick: (url: string) => void;
  onEditMessage?: (messageId: string, textContent: string) => void;
  onDeleteMessage?: (messageId: string) => void;
  onReactToMessage?: (messageId: string, emoji: string) => void;
}

export const MessageItem: React.FC<MessageItemProps> = ({
  message,
  onImageClick,
  onEditMessage,
  onDeleteMessage,
  onReactToMessage,
}) => {
  const { user } = useAuth();
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(message.textContent || '');
  const [showPicker, setShowPicker] = useState(false);

  const isMe = message.senderId === user?.id;
  const EMOJI_OPTIONS = ['❤️', '👍', '😂', '🔥', '😮', '😢'];

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

  const handleEmojiClick = (emoji: string) => {
    if (onReactToMessage) {
      onReactToMessage(message.id, emoji);
    }
    setShowPicker(false);
  };

  return (
    <>
      <div
        onMouseEnter={() => setShowPicker(true)}
        onMouseLeave={() => setShowPicker(false)}
        style={{
          display: 'flex',
          flexDirection: isMe ? 'row-reverse' : 'row',
          alignItems: 'flex-end',
          gap: '8px',
          marginBottom: '14px',
          position: 'relative',
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
            position: 'relative',
          }}
        >
          {/* Quick Emoji Reaction Picker Toolbar */}
          {showPicker && onReactToMessage && (
            <div
              style={{
                position: 'absolute',
                top: '-36px',
                [isMe ? 'right' : 'left']: '0px',
                backgroundColor: 'var(--bg-secondary)',
                border: '1px solid var(--glass-border)',
                borderRadius: '20px',
                padding: '4px 8px',
                display: 'flex',
                gap: '6px',
                alignItems: 'center',
                boxShadow: '0 4px 14px rgba(0,0,0,0.4)',
                zIndex: 10,
                backdropFilter: 'blur(10px)',
              }}
            >
              {EMOJI_OPTIONS.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => handleEmojiClick(emoji)}
                  style={{
                    background: 'none',
                    border: 'none',
                    fontSize: '1.1rem',
                    cursor: 'pointer',
                    padding: '2px 4px',
                    borderRadius: '50%',
                    transition: 'transform 0.15s ease',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.3)')}
                  onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}

          {/* Message Bubble Container */}
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
              position: 'relative',
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

            {message.audioUrl && <AudioPlayer audioUrl={message.audioUrl} isMe={isMe} />}

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

          {/* Live Reaction Badges Display */}
          {message.reactions && message.reactions.length > 0 && (
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '4px',
                marginTop: '4px',
                justifyContent: isMe ? 'flex-end' : 'flex-start',
              }}
            >
              {message.reactions.map((r) => {
                const hasReacted = user && r.userIds.includes(user.id);
                return (
                  <button
                    key={r.emoji}
                    onClick={() => handleEmojiClick(r.emoji)}
                    style={{
                      backgroundColor: hasReacted ? 'var(--bg-tertiary)' : 'var(--bg-secondary)',
                      border: hasReacted ? '1px solid var(--accent-bright)' : '1px solid var(--glass-border)',
                      color: hasReacted ? '#38bdf8' : 'var(--text-primary)',
                      borderRadius: '12px',
                      padding: '2px 8px',
                      fontSize: '0.75rem',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      cursor: 'pointer',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
                    }}
                    title={hasReacted ? 'Click to remove reaction' : 'Click to add reaction'}
                  >
                    <span>{r.emoji}</span>
                    <span style={{ fontWeight: 600 }}>{r.count}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Message Metadata Bar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px', padding: '0 4px' }}>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
              {formatTime(message.createdAt)}
            </span>

            {/* Double Checkmark Status */}
            {isMe && (
              <span title="Delivered & Read" style={{ display: 'inline-flex', alignItems: 'center' }}>
                <CheckCheck size={14} color="#38bdf8" style={{ opacity: 0.9 }} />
              </span>
            )}

            {/* Reaction Trigger Icon */}
            {onReactToMessage && (
              <button
                onClick={() => setShowPicker((prev) => !prev)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  padding: '2px',
                  marginLeft: '2px',
                }}
                title="Add reaction"
              >
                <Smile size={13} />
              </button>
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

            {/* Delete Message Button for Sender */}
            {isMe && onDeleteMessage && (
              <button
                onClick={() => {
                  if (window.confirm('Delete this message?')) {
                    onDeleteMessage(message.id);
                  }
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  padding: '2px',
                  marginLeft: '4px',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = '#ef4444')}
                onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-secondary)')}
                title="Delete message"
              >
                <Trash2 size={12} />
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
