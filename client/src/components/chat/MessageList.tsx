import React, { useRef, useEffect } from 'react';
import { Message } from '../../types/chat';
import { MessageItem } from './MessageItem';

interface MessageListProps {
  messages: Message[];
  isLoading: boolean;
  onImageClick: (url: string) => void;
  onEditMessage?: (messageId: string, textContent: string) => void;
  onDeleteMessage?: (messageId: string) => void;
}

export const MessageList: React.FC<MessageListProps> = ({
  messages,
  isLoading,
  onImageClick,
  onEditMessage,
  onDeleteMessage,
}) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (isLoading) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
        Loading messages...
      </div>
    );
  }

  return (
    <div className="chat-wallpaper" style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
      {messages.length === 0 ? (
        <div style={{ textAlign: 'center', color: 'var(--text-secondary)', marginTop: '80px' }}>
          Say 👋 to start the conversation!
        </div>
      ) : (
        messages.map((msg) => (
          <MessageItem
            key={msg.id}
            message={msg}
            onImageClick={onImageClick}
            onEditMessage={onEditMessage}
            onDeleteMessage={onDeleteMessage}
          />
        ))
      )}
      <div ref={bottomRef} />
    </div>
  );
};
