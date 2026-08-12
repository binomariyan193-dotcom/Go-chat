import React, { useState, useRef } from 'react';
import { Image, Send, X, Loader2, Mic } from 'lucide-react';
import { useImageUpload } from '../../hooks/useImageUpload';
import { hapticMedium } from '../../utils/haptics';
import { VoiceRecorder } from './VoiceRecorder';

interface MessageInputProps {
  onSendMessage: (text?: string, imageUrl?: string, audioUrl?: string) => void;
}

export const MessageInput: React.FC<MessageInputProps> = ({ onSendMessage }) => {
  const [text, setText] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isRecordingVoiceNote, setIsRecordingVoiceNote] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { uploadImage, isUploading } = useImageUpload();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const clearFile = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() && !selectedFile) return;

    hapticMedium();

    let imageUrl: string | undefined = undefined;

    if (selectedFile) {
      const uploaded = await uploadImage(selectedFile);
      if (uploaded) {
        imageUrl = uploaded;
      } else {
        alert('Failed to upload image. Please try again.');
        return;
      }
    }

    onSendMessage(text.trim() || undefined, imageUrl);
    setText('');
    clearFile();
  };

  const handleSendVoiceNote = (audioUrl: string) => {
    onSendMessage(undefined, undefined, audioUrl);
    setIsRecordingVoiceNote(false);
  };

  return (
    <div style={{ padding: '14px 20px', backgroundColor: 'var(--bg-secondary)', borderTop: '1px solid var(--border-color)' }}>
      {/* Voice Recorder View */}
      {isRecordingVoiceNote ? (
        <VoiceRecorder
          onSendVoiceNote={handleSendVoiceNote}
          onCancel={() => setIsRecordingVoiceNote(false)}
        />
      ) : (
        <>
          {/* Attached image preview banner */}
          {previewUrl && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
              <div style={{ position: 'relative' }}>
                <img
                  src={previewUrl}
                  alt="Upload Preview"
                  style={{ width: 60, height: 60, borderRadius: 'var(--radius-sm)', objectFit: 'cover', border: '1px solid var(--border-color)' }}
                />
                <button
                  onClick={clearFile}
                  style={{
                    position: 'absolute',
                    top: -6,
                    right: -6,
                    background: '#ef4444',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '50%',
                    cursor: 'pointer',
                    padding: '3px',
                  }}
                >
                  <X size={12} />
                </button>
              </div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Image ready for lossless send</span>
            </div>
          )}

          <form onSubmit={handleSend} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              style={{
                background: 'rgba(15, 28, 71, 0.6)',
                border: '1px solid var(--border-color)',
                color: selectedFile ? '#38bdf8' : 'var(--text-secondary)',
                cursor: 'pointer',
                padding: '10px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              title="Attach Image"
            >
              <Image size={20} />
            </button>

            <input
              type="text"
              placeholder="Type a message..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              style={{
                flex: 1,
                padding: '12px 18px',
                borderRadius: '24px',
                border: '1px solid var(--border-color)',
                backgroundColor: 'var(--bg-primary)',
                color: '#fff',
                outline: 'none',
                fontSize: '0.92rem',
              }}
            />

            {/* If text input is empty and no file attached, show Voice Record Mic Button */}
            {!text.trim() && !selectedFile ? (
              <button
                type="button"
                onClick={() => {
                  hapticMedium();
                  setIsRecordingVoiceNote(true);
                }}
                style={{
                  backgroundColor: 'var(--accent-color)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '50%',
                  width: 44,
                  height: 44,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 12px rgba(18, 62, 140, 0.5)',
                }}
                title="Record Voice Note 🎙️"
              >
                <Mic size={20} color="#fff" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={isUploading}
                style={{
                  backgroundColor: 'var(--accent-bright)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '50%',
                  width: 44,
                  height: 44,
                  cursor: isUploading ? 'not-allowed' : 'pointer',
                  opacity: isUploading ? 0.4 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 12px rgba(37, 99, 235, 0.4)',
                }}
              >
                {isUploading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
              </button>
            )}
          </form>
        </>
      )}
    </div>
  );
};
