import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause } from 'lucide-react';
import { hapticLight } from '../../utils/haptics';

interface AudioPlayerProps {
  audioUrl: string;
  isMe?: boolean;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({ audioUrl, isMe = false }) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);

  // Generate 26 visual waveform height values
  const waveformHeights = [
    30, 45, 70, 90, 60, 40, 80, 100, 75, 50, 85, 95, 65, 40, 70, 85, 90, 60, 45, 80,
    95, 70, 50, 65, 40, 30,
  ];

  useEffect(() => {
    const audio = new Audio(audioUrl);
    audioRef.current = audio;

    const handleLoadedMetadata = () => {
      setDuration(audio.duration || 0);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime || 0);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.pause();
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [audioUrl]);

  const togglePlay = () => {
    hapticLight();
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.playbackRate = playbackRate;
      audio.play().catch((err) => console.error('Audio playback failed:', err));
      setIsPlaying(true);
    }
  };

  const toggleSpeed = () => {
    hapticLight();
    const nextRate = playbackRate === 1 ? 1.5 : playbackRate === 1.5 ? 2 : 1;
    setPlaybackRate(nextRate);
    if (audioRef.current) {
      audioRef.current.playbackRate = nextRate;
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    setCurrentTime(newTime);
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
    }
  };

  const formatAudioTime = (sec: number) => {
    if (isNaN(sec) || !isFinite(sec)) return '0:00';
    const mins = Math.floor(sec / 60);
    const secs = Math.floor(sec % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '10px 14px',
        minWidth: '240px',
        maxWidth: '300px',
        borderRadius: '16px',
        backgroundColor: isMe ? 'rgba(3, 8, 28, 0.4)' : 'rgba(8, 16, 43, 0.6)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        userSelect: 'none',
      }}
    >
      {/* Play/Pause Button */}
      <button
        onClick={togglePlay}
        style={{
          width: '38px',
          height: '38px',
          borderRadius: '50%',
          backgroundColor: '#38bdf8',
          border: 'none',
          color: '#03081C',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          boxShadow: '0 3px 10px rgba(56, 189, 248, 0.4)',
          flexShrink: 0,
        }}
        title={isPlaying ? 'Pause Voice Note' : 'Play Voice Note'}
      >
        {isPlaying ? <Pause size={18} fill="#03081C" /> : <Play size={18} fill="#03081C" style={{ marginLeft: '2px' }} />}
      </button>

      {/* Waveform & Scrubber Center Container */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {/* Interactive Waveform Bar Array */}
        <div
          style={{
            height: '24px',
            display: 'flex',
            alignItems: 'center',
            gap: '2px',
            position: 'relative',
            cursor: 'pointer',
          }}
        >
          {waveformHeights.map((h, i) => {
            const barPercent = (i / waveformHeights.length) * 100;
            const isPlayed = barPercent <= progressPercent;

            return (
              <div
                key={i}
                style={{
                  flex: 1,
                  height: `${h}%`,
                  borderRadius: '2px',
                  backgroundColor: isPlayed ? '#38bdf8' : 'rgba(255, 255, 255, 0.25)',
                  transition: 'height 0.2s ease, background-color 0.15s ease',
                }}
              />
            );
          })}

          {/* Transparent Range Input Overlay for Drag Seeking */}
          <input
            type="range"
            min={0}
            max={duration || 100}
            step="0.1"
            value={currentTime}
            onChange={handleSeek}
            style={{
              position: 'absolute',
              inset: 0,
              opacity: 0,
              cursor: 'pointer',
              width: '100%',
              height: '100%',
            }}
          />
        </div>

        {/* Timers */}
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
          <span>{formatAudioTime(currentTime)}</span>
          <span>{formatAudioTime(duration)}</span>
        </div>
      </div>

      {/* Speed Multiplier Toggle Button */}
      <button
        onClick={toggleSpeed}
        style={{
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          color: '#fff',
          borderRadius: '10px',
          padding: '2px 6px',
          fontSize: '0.72rem',
          fontWeight: 700,
          cursor: 'pointer',
          flexShrink: 0,
        }}
        title="Cycle Playback Speed (1x, 1.5x, 2x)"
      >
        {playbackRate}x
      </button>
    </div>
  );
};
