import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { User } from '../../types/chat';
import { Avatar } from '../common/Avatar';
import { ImageLightbox } from '../chat/ImageLightbox';
import { Mail, ShieldCheck, User as UserIcon } from 'lucide-react';

interface UserProfileModalProps {
  user: User | null;
  isOpen: boolean;
  onClose: () => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({ user, isOpen, onClose }) => {
  const [isEnlargedAvatarOpen, setIsEnlargedAvatarOpen] = useState(false);

  if (!user || !isOpen) return null;

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} title="User Profile">
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', padding: '12px 0' }}>
          {/* Avatar with click-to-enlarge indicator */}
          <div
            onClick={() => user.avatarUrl && setIsEnlargedAvatarOpen(true)}
            style={{
              cursor: user.avatarUrl ? 'pointer' : 'default',
              position: 'relative',
              transition: 'transform 0.2s ease',
            }}
            title="Click to view full size image"
          >
            <Avatar src={user.avatarUrl} name={user.username} size="lg" status={user.status ? 'online' : 'offline'} />
          </div>

          <div style={{ textAlign: 'center' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#fff' }}>{user.username}</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
              {user.status || 'Active on Chat App'}
            </p>
          </div>

          {/* User Information Card */}
          <div
            style={{
              width: '100%',
              backgroundColor: 'var(--bg-primary)',
              borderRadius: 'var(--radius-md)',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              marginTop: '8px',
              border: '1px solid var(--border-color)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <UserIcon size={16} color="var(--accent-color)" />
              <div>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', display: 'block' }}>Username</span>
                <span style={{ fontSize: '0.88rem', fontWeight: 600 }}>@{user.username}</span>
              </div>
            </div>

            {user.email && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Mail size={16} color="var(--accent-color)" />
                <div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', display: 'block' }}>Email Address</span>
                  <span style={{ fontSize: '0.88rem', fontWeight: 600 }}>{user.email}</span>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <ShieldCheck size={16} color="#10b981" />
              <div>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', display: 'block' }}>Account Status</span>
                <span style={{ fontSize: '0.88rem', fontWeight: 600, color: '#10b981' }}>Verified Member</span>
              </div>
            </div>
          </div>
        </div>
      </Modal>

      {/* Full Screen Image Lightbox for Avatar */}
      <ImageLightbox
        imageUrl={isEnlargedAvatarOpen ? user.avatarUrl || null : null}
        onClose={() => setIsEnlargedAvatarOpen(false)}
      />
    </>
  );
};
