import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, Trash2, Send, Loader2 } from 'lucide-react';
import { useImageUpload } from '../../hooks/useImageUpload';
import { hapticMedium, hapticWarning } from '../../utils/haptics';

interface VoiceRecorderProps {
  onSendVoiceNote: (audioUrl: string) => void;
  onCancel: () => void;
}

export const VoiceRecorder: React.FC<VoiceRecorderProps> = ({ onSendVoiceNote, onCancel }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<any>(null);

  const { uploadImage, isUploading } = useImageUpload();

  useEffect(() => {
    startRecording();
    return () => {
      stopTimer();
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  const startTimer = () => {
    setRecordingSeconds(0);
    timerRef.current = setInterval(() => {
      setRecordingSeconds((prev) => prev + 1);
    }, 1000);
  };

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const startRecording = async () => {
    try {
      hapticMedium();
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        // Stop audio tracks
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      startTimer();
    } catch (err) {
      console.error('Failed to access microphone:', err);
      alert('Microphone access denied or not supported on this browser.');
      onCancel();
    }
  };

  const stopRecording = () => {
    hapticMedium();
    stopTimer();
    setIsRecording(false);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
  };

  const handleSend = async () => {
    if (!audioBlob) return;
    hapticMedium();

    const audioFile = new File([audioBlob], `voice_note_${Date.now()}.webm`, { type: 'audio/webm' });
    const uploadedUrl = await uploadImage(audioFile);

    if (uploadedUrl) {
      onSendVoiceNote(uploadedUrl);
    } else {
      alert('Failed to upload voice note. Please try again.');
    }
  };

  const handleCancel = () => {
    hapticWarning();
    stopTimer();
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    onCancel();
  };

  const formatSecs = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        padding: '10px 16px',
        backgroundColor: 'var(--bg-secondary)',
        borderRadius: '24px',
        border: '1px solid var(--border-color)',
      }}
    >
      {/* Live Recording Pulsing Dot & Timer */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        {isRecording ? (
          <span
            style={{
              width: 12,
              height: 12,
              borderRadius: '50%',
              backgroundColor: '#ef4444',
              boxShadow: '0 0 10px #ef4444',
              animation: 'pulse 1s infinite',
            }}
          />
        ) : (
          <Mic size={18} color="#38bdf8" />
        )}
        <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#fff' }}>
          {isRecording ? `Recording... ${formatSecs(recordingSeconds)}` : `Voice Note (${formatSecs(recordingSeconds)})`}
        </span>
      </div>

      {/* Action Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <button
          onClick={handleCancel}
          style={{
            background: 'none',
            border: 'none',
            color: '#ef4444',
            cursor: 'pointer',
            padding: '6px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
          }}
          title="Cancel Voice Note"
        >
          <Trash2 size={18} />
        </button>

        {isRecording ? (
          <button
            onClick={stopRecording}
            style={{
              backgroundColor: '#ef4444',
              color: '#fff',
              border: 'none',
              borderRadius: '50%',
              width: 36,
              height: 36,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
            title="Stop Recording"
          >
            <Square size={16} fill="#fff" />
          </button>
        ) : (
          <button
            onClick={handleSend}
            disabled={isUploading || !audioBlob}
            style={{
              backgroundColor: 'var(--accent-bright)',
              color: '#fff',
              border: 'none',
              borderRadius: '50%',
              width: 36,
              height: 36,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: isUploading || !audioBlob ? 'not-allowed' : 'pointer',
              opacity: isUploading || !audioBlob ? 0.5 : 1,
            }}
            title="Send Voice Note"
          >
            {isUploading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
          </button>
        )}
      </div>
    </div>
  );
};
