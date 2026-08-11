import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  isLoading = false,
  disabled,
  style,
  ...props
}) => {
  const getStyles = (): React.CSSProperties => {
    const base: React.CSSProperties = {
      padding: '10px 18px',
      borderRadius: 'var(--radius-md)',
      fontWeight: 600,
      fontSize: '0.9rem',
      cursor: disabled || isLoading ? 'not-allowed' : 'pointer',
      transition: 'all 0.2s ease',
      border: 'none',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px',
      opacity: disabled || isLoading ? 0.6 : 1,
    };

    if (variant === 'primary') {
      return { ...base, backgroundColor: 'var(--accent-color)', color: '#fff', ...style };
    }
    if (variant === 'secondary') {
      return { ...base, backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-primary)', ...style };
    }
    return { ...base, backgroundColor: 'transparent', color: 'var(--text-secondary)', ...style };
  };

  return (
    <button disabled={disabled || isLoading} style={getStyles()} {...props}>
      {isLoading ? 'Loading...' : children}
    </button>
  );
};
