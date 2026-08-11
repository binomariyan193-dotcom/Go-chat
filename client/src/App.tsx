import React, { useState, useEffect } from 'react';
import { useAuth } from './context/AuthContext';
import { LandingPage } from './components/landing/LandingPage';
import { LoginForm } from './components/auth/LoginForm';
import { RegisterForm } from './components/auth/RegisterForm';
import { ForgotPasswordForm } from './components/auth/ForgotPasswordForm';
import { Sidebar } from './components/chat/Sidebar';
import { ChatHeader } from './components/chat/ChatHeader';
import { MessageList } from './components/chat/MessageList';
import { MessageInput } from './components/chat/MessageInput';
import { ImageLightbox } from './components/chat/ImageLightbox';
import { useChat } from './hooks/useChat';
import { Conversation } from './types/chat';

export const MainChatView: React.FC = () => {
  const {
    conversations,
    activeConversation,
    setActiveConversation,
    messages,
    isLoadingMessages,
    sendMessage,
    editMessage,
    deleteMessage,
    deleteConversation,
    refreshConversations,
  } = useChat();
  const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);

  // Responsive Mobile View State
  const [isMobile, setIsMobile] = useState(() => window.innerWidth <= 768);
  const [showMobileChat, setShowMobileChat] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleSelectConversation = (conv: Conversation) => {
    setActiveConversation(conv);
    if (isMobile) {
      setShowMobileChat(true);
    }
  };

  const handleDeleteConversation = (convId: string) => {
    deleteConversation(convId);
    if (isMobile && activeConversation?.id === convId) {
      setShowMobileChat(false);
    }
  };

  // Mobile Touch Swipe Gesture (Swipe Right to return to sidebar)
  const [touchStart, setTouchStart] = useState<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setTouchStart(e.touches[0].clientX);
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStart !== null && e.changedTouches.length === 1) {
      const touchEnd = e.changedTouches[0].clientX;
      const swipeDistance = touchEnd - touchStart;
      if (isMobile && showMobileChat && swipeDistance > 80) {
        setShowMobileChat(false);
      }
    }
    setTouchStart(null);
  };

  return (
    <div style={{ display: 'flex', width: '100vw', height: '100dvh', overflow: 'hidden' }}>
      {/* Sidebar - Visible on Desktop or when mobile chat is not focused */}
      {(!isMobile || !showMobileChat) && (
        <div style={{ width: isMobile ? '100%' : '320px', height: '100%' }}>
          <Sidebar
            conversations={conversations}
            activeConversation={activeConversation}
            onSelectConversation={handleSelectConversation}
            onRefreshConversations={refreshConversations}
            onDeleteConversation={handleDeleteConversation}
          />
        </div>
      )}

      {/* Main Chat Thread Area - Visible on Desktop or when mobile chat is focused */}
      {(!isMobile || showMobileChat) && (
        <div
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          style={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-primary)', height: '100%' }}
        >
          {activeConversation ? (
            <>
              <ChatHeader
                activeConversation={activeConversation}
                onBack={isMobile ? () => setShowMobileChat(false) : undefined}
                onDelete={() => handleDeleteConversation(activeConversation.id)}
              />
              <MessageList
                messages={messages}
                isLoading={isLoadingMessages}
                onImageClick={(url) => setSelectedImageUrl(url)}
                onEditMessage={editMessage}
                onDeleteMessage={deleteMessage}
              />
              <MessageInput onSendMessage={sendMessage} />
            </>
          ) : (
            <div
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text-secondary)',
                padding: '20px',
                textAlign: 'center',
              }}
            >
              Select a conversation to start messaging
            </div>
          )}
        </div>
      )}

      <ImageLightbox imageUrl={selectedImageUrl} onClose={() => setSelectedImageUrl(null)} />
    </div>
  );
};

export const App: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const [authMode, setAuthMode] = useState<'landing' | 'login' | 'register' | 'forgot'>('landing');

  if (!isAuthenticated) {
    if (authMode === 'landing') {
      return <LandingPage onLaunchApp={() => setAuthMode('login')} />;
    }

    return (
      <div
        style={{
          minHeight: '100dvh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'var(--bg-primary)',
          padding: '16px',
          position: 'relative',
        }}
      >
        <button
          onClick={() => setAuthMode('landing')}
          style={{
            position: 'absolute',
            top: '24px',
            left: '24px',
            background: 'none',
            border: 'none',
            color: 'var(--accent-color)',
            fontSize: '0.9rem',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          ⬅️ Back to LoopIN Home
        </button>

        {authMode === 'register' && (
          <RegisterForm onToggleForm={() => setAuthMode('login')} />
        )}

        {authMode === 'forgot' && (
          <ForgotPasswordForm onBackToLogin={() => setAuthMode('login')} />
        )}

        {authMode === 'login' && (
          <LoginForm
            onToggleForm={() => setAuthMode('register')}
            onForgotPassword={() => setAuthMode('forgot')}
          />
        )}
      </div>
    );
  }

  return <MainChatView />;
};

export default App;
