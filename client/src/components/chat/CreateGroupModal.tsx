import React, { useState, useEffect, useRef } from 'react';
import { X, Users, Image as ImageIcon, Check, Loader2, UserPlus, Trash2 } from 'lucide-react';
import { api } from '../../services/api';
import { useImageUpload } from '../../hooks/useImageUpload';
import { Avatar } from '../common/Avatar';
import { hapticMedium, hapticLight } from '../../utils/haptics';
import { ImageCropperModal } from '../profile/ImageCropperModal';
import { ImageLightbox } from './ImageLightbox';

interface Friend {
  id: string;
  username: string;
  avatarUrl?: string;
  status?: string;
}

interface CreateGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateGroup: (data: {
    name: string;
    description?: string;
    avatarUrl?: string;
    memberUserIds: string[];
  }) => Promise<void>;
}

export const CreateGroupModal: React.FC<CreateGroupModalProps> = ({
  isOpen,
  onClose,
  onCreateGroup,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [uploadedAvatarUrl, setUploadedAvatarUrl] = useState<string | null>(null);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [selectedFriendIds, setSelectedFriendIds] = useState<string[]>([]);
  const [isLoadingFriends, setIsLoadingFriends] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Cropper & Lightbox States
  const [cropperRawSrc, setCropperRawSrc] = useState<string | null>(null);
  const [isCropperOpen, setIsCropperOpen] = useState(false);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { uploadImage, isUploading } = useImageUpload();

  useEffect(() => {
    if (!isOpen) return;

    const fetchFriends = async () => {
      try {
        setIsLoadingFriends(true);
        const res = await api.get('/friends/list');
        setFriends(res.data || []);
      } catch (err) {
        console.error('Failed to fetch friends for group invite:', err);
      } finally {
        setIsLoadingFriends(false);
      }
    };

    fetchFriends();
  }, [isOpen]);

  if (!isOpen) return null;

  const handleAvatarFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const rawUrl = URL.createObjectURL(file);
    setCropperRawSrc(rawUrl);
    setIsCropperOpen(true);
    e.target.value = '';
  };

  const handleCropComplete = async (croppedBlob: Blob) => {
    setIsCropperOpen(false);
    const croppedFile = new File([croppedBlob], `group_avatar_${Date.now()}.webp`, { type: 'image/webp' });
    const uploadedUrl = await uploadImage(croppedFile);
    if (uploadedUrl) {
      setUploadedAvatarUrl(uploadedUrl);
    } else {
      alert('Failed to upload cropped group image.');
    }
  };

  const toggleFriendSelect = (friendId: string) => {
    hapticLight();
    setSelectedFriendIds((prev) =>
      prev.includes(friendId) ? prev.filter((id) => id !== friendId) : [...prev, friendId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      hapticMedium();
      setIsSubmitting(true);

      await onCreateGroup({
        name: name.trim(),
        description: description.trim() || undefined,
        avatarUrl: uploadedAvatarUrl || undefined,
        memberUserIds: selectedFriendIds,
      });

      // Reset form
      setName('');
      setDescription('');
      setUploadedAvatarUrl(null);
      setSelectedFriendIds([]);
      onClose();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to create group');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(3, 8, 28, 0.75)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
        padding: '16px',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '460px',
          backgroundColor: 'var(--bg-secondary)',
          border: '1px solid var(--glass-border)',
          borderRadius: '24px',
          boxShadow: '0 20px 40px rgba(0,0,0,0.6)',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '90vh',
          overflow: 'hidden',
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '18px 24px',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                backgroundColor: 'rgba(56, 189, 248, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#38bdf8',
              }}
            >
              <Users size={20} />
            </div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff', margin: 0 }}>
              Create Custom Group
            </h3>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '50%',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body / Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', overflowY: 'auto', padding: '20px 24px', gap: '16px' }}>
          {/* Avatar Upload */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ position: 'relative' }}>
              <Avatar
                src={uploadedAvatarUrl || undefined}
                name={name || 'Group'}
                size="lg"
                onClick={() => uploadedAvatarUrl && setIsLightboxOpen(true)}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                style={{
                  position: 'absolute',
                  bottom: -2,
                  right: -2,
                  backgroundColor: '#38bdf8',
                  color: '#03081C',
                  border: 'none',
                  borderRadius: '50%',
                  width: 28,
                  height: 28,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.4)',
                }}
                title="Upload & Crop Group Photo"
              >
                {isUploading ? <Loader2 size={14} className="animate-spin" /> : <ImageIcon size={14} />}
              </button>
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                onChange={handleAvatarFileSelected}
                style={{ display: 'none' }}
              />
            </div>
            <div>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 600, color: '#fff', margin: '0 0 4px 0' }}>
                Group Photo
              </h4>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                  Click camera to pick & crop photo
                </span>
                {uploadedAvatarUrl && (
                  <button
                    type="button"
                    onClick={() => setUploadedAvatarUrl(null)}
                    style={{
                      background: 'none',
                      border: '1px solid rgba(239, 68, 68, 0.4)',
                      color: '#ef4444',
                      borderRadius: '8px',
                      padding: '2px 8px',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                    title="Remove Photo"
                  >
                    <Trash2 size={12} /> Remove
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Group Name Input */}
          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
              Group Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Design Squad 🎨"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '12px',
                border: '1px solid var(--border-color)',
                backgroundColor: 'var(--bg-primary)',
                color: '#fff',
                outline: 'none',
                fontSize: '0.9rem',
              }}
            />
          </div>

          {/* Group Description Input */}
          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
              Description
            </label>
            <input
              type="text"
              placeholder="What's this group about?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '12px',
                border: '1px solid var(--border-color)',
                backgroundColor: 'var(--bg-primary)',
                color: '#fff',
                outline: 'none',
                fontSize: '0.9rem',
              }}
            />
          </div>

          {/* Friends Selection List */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                Invite Friends ({selectedFriendIds.length} selected)
              </label>
              <UserPlus size={16} color="var(--text-secondary)" />
            </div>

            <div
              style={{
                maxHeight: '180px',
                overflowY: 'auto',
                border: '1px solid var(--border-color)',
                borderRadius: '12px',
                backgroundColor: 'var(--bg-primary)',
                padding: '6px',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
              }}
            >
              {isLoadingFriends ? (
                <div style={{ padding: '12px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.82rem' }}>
                  Loading friends...
                </div>
              ) : friends.length === 0 ? (
                <div style={{ padding: '16px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.82rem' }}>
                  No friends found. Add friends first to invite them to custom groups!
                </div>
              ) : (
                friends.map((friend) => {
                  const isSelected = selectedFriendIds.includes(friend.id);
                  return (
                    <div
                      key={friend.id}
                      onClick={() => toggleFriendSelect(friend.id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '8px 12px',
                        borderRadius: '10px',
                        backgroundColor: isSelected ? 'rgba(56, 189, 248, 0.12)' : 'transparent',
                        cursor: 'pointer',
                        transition: 'background-color 0.15s ease',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Avatar src={friend.avatarUrl} name={friend.username} size="sm" />
                        <span style={{ fontSize: '0.88rem', color: '#fff', fontWeight: 500 }}>
                          {friend.username}
                        </span>
                      </div>
                      <div
                        style={{
                          width: 22,
                          height: 22,
                          borderRadius: '6px',
                          border: isSelected ? 'none' : '1px solid var(--border-color)',
                          backgroundColor: isSelected ? '#38bdf8' : 'transparent',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#03081C',
                        }}
                      >
                        {isSelected && <Check size={14} strokeWidth={3} />}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Submit Action Button */}
          <button
            type="submit"
            disabled={isSubmitting || isUploading || !name.trim()}
            style={{
              marginTop: '8px',
              padding: '12px',
              borderRadius: '14px',
              border: 'none',
              backgroundColor: '#38bdf8',
              color: '#03081C',
              fontWeight: 700,
              fontSize: '0.95rem',
              cursor: isSubmitting || isUploading || !name.trim() ? 'not-allowed' : 'pointer',
              opacity: isSubmitting || isUploading || !name.trim() ? 0.5 : 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: '0 4px 14px rgba(56, 189, 248, 0.4)',
            }}
          >
            {isSubmitting || isUploading ? (
              <>
                <Loader2 size={18} className="animate-spin" /> Creating Channel...
              </>
            ) : (
              'Create Group Channel'
            )}
          </button>
        </form>
      </div>

      {/* Image Cropper Modal */}
      <ImageCropperModal
        imageSrc={cropperRawSrc}
        isOpen={isCropperOpen}
        onClose={() => setIsCropperOpen(false)}
        onCropComplete={handleCropComplete}
      />

      {/* Group Avatar Lightbox */}
      <ImageLightbox
        imageUrl={isLightboxOpen ? uploadedAvatarUrl : null}
        onClose={() => setIsLightboxOpen(false)}
      />
    </div>
  );
};
