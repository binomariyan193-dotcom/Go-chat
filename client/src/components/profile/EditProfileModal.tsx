import React, { useState, useRef, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { useAuth } from '../../context/AuthContext';
import { useImageUpload } from '../../hooks/useImageUpload';
import { api } from '../../services/api';
import { Camera, Loader2 } from 'lucide-react';
import { Avatar } from '../common/Avatar';
import { ImageCropperModal } from './ImageCropperModal';
import { ImageLightbox } from '../chat/ImageLightbox';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const EditProfileModal: React.FC<EditProfileModalProps> = ({ isOpen, onClose }) => {
  const { user, updateUser } = useAuth();
  const [username, setUsername] = useState(user?.username || '');
  const [status, setStatus] = useState(user?.status || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || '');
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Cropper Modal States
  const [cropperRawSrc, setCropperRawSrc] = useState<string | null>(null);
  const [isCropperOpen, setIsCropperOpen] = useState(false);
  const [isAvatarLightboxOpen, setIsAvatarLightboxOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { uploadImage, isUploading } = useImageUpload();

  useEffect(() => {
    if (user) {
      setUsername(user.username || '');
      setStatus(user.status || '');
      setAvatarUrl(user.avatarUrl || '');
    }
  }, [user]);

  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError('');
    const rawUrl = URL.createObjectURL(file);
    setCropperRawSrc(rawUrl);
    setIsCropperOpen(true);
    // reset file input
    e.target.value = '';
  };

  const handleCropComplete = async (croppedBlob: Blob) => {
    setIsCropperOpen(false);
    setError('');

    const croppedFile = new File([croppedBlob], `avatar_${Date.now()}.webp`, { type: 'image/webp' });
    const uploadedUrl = await uploadImage(croppedFile);

    if (uploadedUrl) {
      setAvatarUrl(uploadedUrl);
    } else {
      setError('Failed to upload cropped image.');
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      setError('Username cannot be empty');
      return;
    }

    setError('');
    setIsSaving(true);

    try {
      const response = await api.put('/auth/profile', {
        username: username.trim(),
        avatarUrl,
        status: status.trim() || undefined,
      });

      updateUser(response.data);
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} title="Edit Profile">
        {error && (
          <div
            style={{
              backgroundColor: 'rgba(239, 68, 68, 0.2)',
              color: '#f87171',
              padding: '10px 14px',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.85rem',
              marginBottom: '16px',
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Avatar Upload Section */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
            <div style={{ position: 'relative' }}>
              <Avatar
                src={avatarUrl}
                name={username || 'User'}
                size="lg"
                onClick={() => avatarUrl && setIsAvatarLightboxOpen(true)}
              />
              <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                onChange={handleFileSelected}
                style={{ display: 'none' }}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                style={{
                  position: 'absolute',
                  bottom: -2,
                  right: -2,
                  backgroundColor: 'var(--accent-color)',
                  color: '#fff',
                  border: '2px solid var(--bg-primary)',
                  borderRadius: '50%',
                  padding: '6px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                title="Upload new profile picture"
              >
                {isUploading ? <Loader2 size={14} className="animate-spin" /> : <Camera size={14} />}
              </button>
            </div>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
              Click camera icon to pick and crop profile picture
            </span>
          </div>

          {/* Username Input */}
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>
              Username
            </label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--glass-border)',
                backgroundColor: 'var(--bg-primary)',
                color: '#fff',
                outline: 'none',
                fontSize: '0.9rem',
              }}
            />
          </div>

          {/* Status Bio Input */}
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>
              Status / Bio
            </label>
            <input
              type="text"
              placeholder="What's on your mind? (e.g. Working remotely)"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--glass-border)',
                backgroundColor: 'var(--bg-primary)',
                color: '#fff',
                outline: 'none',
                fontSize: '0.9rem',
              }}
            />
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isSaving || isUploading}>
              Save Changes
            </Button>
          </div>
        </form>
      </Modal>

      {/* Image Cropper Modal */}
      <ImageCropperModal
        imageSrc={cropperRawSrc}
        isOpen={isCropperOpen}
        onClose={() => setIsCropperOpen(false)}
        onCropComplete={handleCropComplete}
      />

      {/* Avatar Lightbox */}
      <ImageLightbox
        imageUrl={isAvatarLightboxOpen ? avatarUrl || null : null}
        onClose={() => setIsAvatarLightboxOpen(false)}
      />
    </>
  );
};
