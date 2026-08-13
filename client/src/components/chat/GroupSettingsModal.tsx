import React, { useState, useRef, useEffect } from 'react';
import { X, ShieldCheck, UserMinus, UserCheck, Edit2, Check, Image as ImageIcon, LogOut, UserPlus, Loader2, Trash2 } from 'lucide-react';
import { Conversation, User } from '../../types/chat';
import { useAuth } from '../../context/AuthContext';
import { useImageUpload } from '../../hooks/useImageUpload';
import { Avatar } from '../common/Avatar';
import { api } from '../../services/api';
import { hapticMedium, hapticLight, hapticWarning } from '../../utils/haptics';
import { ImageCropperModal } from '../profile/ImageCropperModal';
import { ImageLightbox } from './ImageLightbox';

interface GroupSettingsModalProps {
  conversation: Conversation | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateGroup: (conversationId: string, updates: { name?: string; description?: string; avatarUrl?: string }) => Promise<void>;
  onAddMembers: (conversationId: string, userIds: string[]) => Promise<void>;
  onRemoveMember: (conversationId: string, targetUserId: string) => Promise<void>;
  onUpdateMemberRole: (conversationId: string, targetUserId: string, role: 'admin' | 'member') => Promise<void>;
}

export const GroupSettingsModal: React.FC<GroupSettingsModalProps> = ({
  conversation,
  isOpen,
  onClose,
  onUpdateGroup,
  onAddMembers,
  onRemoveMember,
  onUpdateMemberRole,
}) => {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [currentAvatarUrl, setCurrentAvatarUrl] = useState<string | null>(null);

  // Invite more friends state
  const [showInviteSection, setShowInviteSection] = useState(false);
  const [availableFriends, setAvailableFriends] = useState<User[]>([]);
  const [selectedFriendIds, setSelectedFriendIds] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Cropper & Lightbox States
  const [cropperRawSrc, setCropperRawSrc] = useState<string | null>(null);
  const [isCropperOpen, setIsCropperOpen] = useState(false);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { uploadImage, isUploading } = useImageUpload();

  useEffect(() => {
    if (!conversation) return;
    setName(conversation.name || '');
    setDescription(conversation.description || '');
    setCurrentAvatarUrl(conversation.avatarUrl || null);
  }, [conversation]);

  // Check if current logged-in user is an Admin of this group
  const currentMember = conversation?.members.find((m) => m.user.id === user?.id);
  const isAdmin = currentMember?.role === 'admin' || !conversation?.members.some((m) => m.role === 'admin'); // Fallback if roles not yet migrated

  useEffect(() => {
    if (!showInviteSection || !conversation) return;

    const fetchFriends = async () => {
      try {
        const res = await api.get('/friends/list');
        const friendsList: User[] = res.data || [];
        const existingMemberIds = conversation.members.map((m) => m.user.id);
        const inviteable = friendsList.filter((f) => !existingMemberIds.includes(f.id));
        setAvailableFriends(inviteable);
      } catch (err) {
        console.error('Failed to load friends for invite:', err);
      }
    };

    fetchFriends();
  }, [showInviteSection, conversation]);

  if (!isOpen || !conversation) return null;

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
      setCurrentAvatarUrl(uploadedUrl);
    } else {
      alert('Failed to upload cropped group photo.');
    }
  };

  const handleSaveDetails = async () => {
    try {
      hapticMedium();
      setIsSubmitting(true);

      await onUpdateGroup(conversation.id, {
        name: name.trim(),
        description: description.trim(),
        avatarUrl: currentAvatarUrl || '',
      });

      setIsEditing(false);
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to update group settings');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveGroupPhoto = async () => {
    try {
      hapticMedium();
      setIsSubmitting(true);
      setCurrentAvatarUrl(null);
      await onUpdateGroup(conversation.id, { avatarUrl: '' });
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to remove group photo');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddSelectedFriends = async () => {
    if (selectedFriendIds.length === 0) return;
    try {
      hapticMedium();
      setIsSubmitting(true);
      await onAddMembers(conversation.id, selectedFriendIds);
      setSelectedFriendIds([]);
      setShowInviteSection(false);
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to add members');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleFriendCheck = (friendId: string) => {
    hapticLight();
    setSelectedFriendIds((prev) =>
      prev.includes(friendId) ? prev.filter((id) => id !== friendId) : [...prev, friendId]
    );
  };

  const handleRemoveUser = async (targetUserId: string, targetUsername: string) => {
    const isSelf = targetUserId === user?.id;
    const confirmMsg = isSelf
      ? 'Are you sure you want to leave this group?'
      : `Remove ${targetUsername} from group?`;

    if (!window.confirm(confirmMsg)) return;

    try {
      hapticWarning();
      await onRemoveMember(conversation.id, targetUserId);
      if (isSelf) {
        onClose();
      }
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to remove member');
    }
  };

  const handleToggleAdminRole = async (targetUserId: string, currentRole?: string) => {
    const newRole = currentRole === 'admin' ? 'member' : 'admin';
    try {
      hapticMedium();
      await onUpdateMemberRole(conversation.id, targetUserId, newRole);
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to update role');
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
          maxWidth: '480px',
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
        {/* Header Bar */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#fff', margin: 0 }}>
            Group Details & Settings
          </h3>
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

        {/* Scrollable Container */}
        <div style={{ padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Top Info Banner */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '10px' }}>
            <div style={{ position: 'relative' }}>
              <Avatar
                src={currentAvatarUrl || conversation.avatarUrl}
                name={conversation.name || 'Group'}
                size="lg"
                onClick={() => (currentAvatarUrl || conversation.avatarUrl) && setIsLightboxOpen(true)}
              />
              {isAdmin && isEditing && (
                <>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    style={{
                      position: 'absolute',
                      bottom: 0,
                      right: 0,
                      backgroundColor: '#38bdf8',
                      color: '#03081C',
                      border: 'none',
                      borderRadius: '50%',
                      width: 30,
                      height: 30,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
                    }}
                    title="Upload & Crop Group Photo"
                  >
                    {isUploading ? <Loader2 size={14} className="animate-spin" /> : <ImageIcon size={15} />}
                  </button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    onChange={handleAvatarFileSelected}
                    style={{ display: 'none' }}
                  />
                </>
              )}
            </div>

            {isAdmin && isEditing && (currentAvatarUrl || conversation.avatarUrl) && (
              <button
                type="button"
                onClick={handleRemoveGroupPhoto}
                disabled={isSubmitting}
                style={{
                  background: 'none',
                  border: '1px solid rgba(239, 68, 68, 0.4)',
                  color: '#ef4444',
                  borderRadius: '8px',
                  padding: '4px 10px',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  marginTop: '4px',
                }}
              >
                <Trash2 size={12} /> Remove Group Photo
              </button>
            )}

            {/* Editable Group Name & Description */}
            {isEditing ? (
              <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '8px' }}>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Group Name"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '10px',
                    border: '1px solid var(--border-color)',
                    backgroundColor: 'var(--bg-primary)',
                    color: '#fff',
                    textAlign: 'center',
                    fontSize: '1rem',
                    fontWeight: 600,
                  }}
                />
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Group Description"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '10px',
                    border: '1px solid var(--border-color)',
                    backgroundColor: 'var(--bg-primary)',
                    color: '#fff',
                    textAlign: 'center',
                    fontSize: '0.85rem',
                  }}
                />
                <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
                  <button
                    onClick={handleSaveDetails}
                    disabled={isSubmitting || isUploading || !name.trim()}
                    style={{
                      padding: '6px 16px',
                      borderRadius: '8px',
                      backgroundColor: '#10b981',
                      color: '#fff',
                      border: 'none',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontSize: '0.85rem',
                    }}
                  >
                    {isSubmitting || isUploading ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />} Save
                  </button>
                  <button
                    onClick={() => {
                      setIsEditing(false);
                      setName(conversation.name || '');
                      setDescription(conversation.description || '');
                    }}
                    style={{
                      padding: '6px 16px',
                      borderRadius: '8px',
                      backgroundColor: 'rgba(255,255,255,0.1)',
                      color: '#fff',
                      border: 'none',
                      fontWeight: 600,
                      cursor: 'pointer',
                      fontSize: '0.85rem',
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#fff', margin: 0 }}>
                    {conversation.name || 'Group Channel'}
                  </h2>
                  {isAdmin && (
                    <button
                      onClick={() => setIsEditing(true)}
                      style={{ background: 'none', border: 'none', color: '#38bdf8', cursor: 'pointer', padding: '4px' }}
                      title="Edit Group Info"
                    >
                      <Edit2 size={15} />
                    </button>
                  )}
                </div>
                {conversation.description && (
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '4px', margin: '4px 0 0 0' }}>
                    {conversation.description}
                  </p>
                )}
                <span style={{ fontSize: '0.75rem', color: '#38bdf8', fontWeight: 600, display: 'inline-block', marginTop: '6px' }}>
                  {conversation.members.length} Members
                </span>
              </div>
            )}
          </div>

          {/* Members List */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#fff', margin: 0 }}>
                Group Members
              </h4>
              {isAdmin && !showInviteSection && (
                <button
                  onClick={() => setShowInviteSection(true)}
                  style={{
                    backgroundColor: 'rgba(56, 189, 248, 0.15)',
                    border: '1px solid rgba(56, 189, 248, 0.3)',
                    color: '#38bdf8',
                    borderRadius: '10px',
                    padding: '4px 10px',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <UserPlus size={14} /> Add Members
                </button>
              )}
            </div>

            {/* Invite More Friends Sub-Section */}
            {showInviteSection && (
              <div
                style={{
                  padding: '12px',
                  borderRadius: '14px',
                  backgroundColor: 'var(--bg-primary)',
                  border: '1px solid var(--border-color)',
                  marginBottom: '12px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#fff' }}>
                    Select Friends to Add:
                  </span>
                  <button
                    onClick={() => setShowInviteSection(false)}
                    style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
                  >
                    <X size={14} />
                  </button>
                </div>

                {availableFriends.length === 0 ? (
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', padding: '6px 0' }}>
                    All your friends are already in this group!
                  </span>
                ) : (
                  <div style={{ maxHeight: '140px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {availableFriends.map((f) => {
                      const isSel = selectedFriendIds.includes(f.id);
                      return (
                        <div
                          key={f.id}
                          onClick={() => toggleFriendCheck(f.id)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '6px 10px',
                            borderRadius: '8px',
                            backgroundColor: isSel ? 'rgba(56, 189, 248, 0.15)' : 'transparent',
                            cursor: 'pointer',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Avatar src={f.avatarUrl} name={f.username} size="sm" />
                            <span style={{ fontSize: '0.82rem', color: '#fff' }}>{f.username}</span>
                          </div>
                          {isSel && <Check size={14} color="#38bdf8" />}
                        </div>
                      );
                    })}
                  </div>
                )}

                {availableFriends.length > 0 && (
                  <button
                    onClick={handleAddSelectedFriends}
                    disabled={selectedFriendIds.length === 0 || isSubmitting}
                    style={{
                      padding: '8px',
                      borderRadius: '8px',
                      border: 'none',
                      backgroundColor: '#38bdf8',
                      color: '#03081C',
                      fontWeight: 700,
                      fontSize: '0.82rem',
                      cursor: selectedFriendIds.length === 0 || isSubmitting ? 'not-allowed' : 'pointer',
                      opacity: selectedFriendIds.length === 0 || isSubmitting ? 0.5 : 1,
                    }}
                  >
                    Add {selectedFriendIds.length} Friends
                  </button>
                )}
              </div>
            )}

            {/* Existing Member List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {conversation.members.map((m) => {
                const isMemberAdmin = m.role === 'admin';
                const isMe = m.user.id === user?.id;

                return (
                  <div
                    key={m.user.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 14px',
                      borderRadius: '14px',
                      backgroundColor: 'var(--bg-primary)',
                      border: '1px solid var(--border-color)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <Avatar src={m.user.avatarUrl} name={m.user.username} size="sm" />
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontSize: '0.88rem', fontWeight: 600, color: '#fff' }}>
                            {m.user.username} {isMe && '(You)'}
                          </span>
                          {isMemberAdmin && (
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '3px',
                                backgroundColor: 'rgba(245, 158, 11, 0.15)',
                                color: '#f59e0b',
                                border: '1px solid rgba(245, 158, 11, 0.3)',
                                fontSize: '0.68rem',
                                fontWeight: 700,
                                padding: '1px 6px',
                                borderRadius: '8px',
                              }}
                            >
                              <ShieldCheck size={11} /> Admin
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Actions Menu */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {/* Appoint / Revoke Admin Role (Admin only, non-self) */}
                      {isAdmin && !isMe && (
                        <button
                          onClick={() => handleToggleAdminRole(m.user.id, m.role)}
                          style={{
                            background: 'none',
                            border: '1px solid var(--border-color)',
                            color: isMemberAdmin ? '#f59e0b' : 'var(--text-secondary)',
                            borderRadius: '8px',
                            padding: '4px 8px',
                            fontSize: '0.72rem',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                          title={isMemberAdmin ? 'Revoke Admin' : 'Appoint Admin'}
                        >
                          <UserCheck size={13} /> {isMemberAdmin ? 'Revoke Admin' : 'Make Admin'}
                        </button>
                      )}

                      {/* Remove Member / Leave Group */}
                      {(isAdmin || isMe) && (
                        <button
                          onClick={() => handleRemoveUser(m.user.id, m.user.username)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#ef4444',
                            cursor: 'pointer',
                            padding: '4px 6px',
                            borderRadius: '6px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontSize: '0.75rem',
                          }}
                          title={isMe ? 'Leave Group' : 'Remove Member'}
                        >
                          {isMe ? <LogOut size={14} /> : <UserMinus size={14} />}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
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
        imageUrl={isLightboxOpen ? currentAvatarUrl || conversation.avatarUrl || null : null}
        onClose={() => setIsLightboxOpen(false)}
      />
    </div>
  );
};
