import React from 'react';

interface LoopInLogoProps {
  size?: number;
  className?: string;
  showText?: boolean;
}

export const LoopInLogo: React.FC<LoopInLogoProps> = ({ size = 36, className = '', showText = true }) => {
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px' }} className={className}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ filter: 'drop-shadow(0px 4px 12px rgba(99, 102, 241, 0.45))' }}
      >
        <defs>
          <linearGradient id="loopinGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#6366f1" />
            <stop offset="100%" stopColor="#a855f7" />
          </linearGradient>
          <linearGradient id="loopinGrad2" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#38bdf8" />
            <stop offset="100%" stopColor="#6366f1" />
          </linearGradient>
        </defs>

        {/* Left Loop Bubble */}
        <path
          d="M 17 12 C 10 12 5 17 5 24 C 5 31 10 36 17 36 C 22 36 26 32 30 24 C 34 16 38 12 43 12 C 46 12 48 14 48 17 C 48 20 46 22 43 22"
          stroke="url(#loopinGrad1)"
          strokeWidth="4.5"
          strokeLinecap="round"
        />

        {/* Right Loop Bubble */}
        <path
          d="M 31 36 C 38 36 43 31 43 24 C 43 17 38 12 31 12 C 26 12 22 16 18 24 C 14 32 10 36 5 36 C 2 36 0 34 0 31 C 0 28 2 26 5 26"
          stroke="url(#loopinGrad2)"
          strokeWidth="4.5"
          strokeLinecap="round"
        />

        {/* Central Pulse Dot */}
        <circle cx="24" cy="24" r="3" fill="#ffffff" />
      </svg>

      {showText && (
        <span
          style={{
            fontSize: size * 0.62,
            fontWeight: 800,
            letterSpacing: '-0.5px',
            background: 'linear-gradient(135deg, #ffffff 0%, #a5b4fc 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            fontFamily: 'var(--font-family)',
          }}
        >
          Loop<span style={{ color: '#a855f7', WebkitTextFillColor: '#a855f7' }}>IN</span>
        </span>
      )}
    </div>
  );
};
