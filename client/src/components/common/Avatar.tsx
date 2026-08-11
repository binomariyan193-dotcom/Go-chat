import React from 'react';

interface AvatarProps {
  src?: string;
  name: string;
  status?: 'online' | 'offline' | 'away';
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
}

export const Avatar: React.FC<AvatarProps> = ({ src, name, status, size = 'md', onClick }) => {
  const statusColors = {
    online: '#10b981',
    away: '#f59e0b',
    offline: '#6b7280',
  };

  const fallbackInitial = name ? name.charAt(0).toUpperCase() : '?';

  return (
    <div
      onClick={onClick}
      style={{
        position: 'relative',
        display: 'inline-block',
        cursor: onClick ? 'pointer' : 'default',
      }}
    >
      {src ? (
        <img
          src={src}
          alt={name}
          style={{
            width: size === 'sm' ? 32 : size === 'lg' ? 48 : 40,
            height: size === 'sm' ? 32 : size === 'lg' ? 48 : 40,
            borderRadius: '50%',
            objectFit: 'cover',
            border: '1px solid var(--border-color)',
          }}
        />
      ) : (
        <div
          style={{
            width: size === 'sm' ? 32 : size === 'lg' ? 48 : 40,
            height: size === 'sm' ? 32 : size === 'lg' ? 48 : 40,
            borderRadius: '50%',
            backgroundColor: 'var(--accent-color)',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 600,
          }}
        >
          {fallbackInitial}
        </div>
      )}
      {status && (
        <span
          style={{
            position: 'absolute',
            bottom: 0,
            right: 0,
            width: 10,
            height: 10,
            borderRadius: '50%',
            backgroundColor: statusColors[status],
            border: '2px solid var(--bg-primary)',
          }}
        />
      )}
    </div>
  );
};
