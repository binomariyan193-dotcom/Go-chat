import React, { useState } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../common/Button';
import { LoopInLogo } from '../common/LoopInLogo';

interface LoginFormProps {
  onToggleForm: () => void;
  onForgotPassword?: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onToggleForm, onForgotPassword }) => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await api.post('/auth/login', { email, password });
      login(response.data.token, response.data.user);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '400px', width: '100%', margin: 'auto', padding: '32px' }} className="glass-panel">
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <LoopInLogo size={42} />
      </div>
      <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '6px' }}>Welcome Back</h2>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', fontSize: '0.9rem' }}>
        Log in to join your conversations
      </p>

      {error && (
        <div
          style={{
            backgroundColor: 'rgba(239, 68, 68, 0.2)',
            color: '#f87171',
            padding: '10px',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.85rem',
            marginBottom: '16px',
          }}
        >
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div>
          <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>
            Email
          </label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 14px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--glass-border)',
              backgroundColor: 'var(--bg-secondary)',
              color: '#fff',
              outline: 'none',
            }}
          />
        </div>

        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Password
            </label>
            {onForgotPassword && (
              <span
                onClick={onForgotPassword}
                style={{ fontSize: '0.78rem', color: 'var(--accent-color)', cursor: 'pointer', fontWeight: 500 }}
              >
                Forgot password?
              </span>
            )}
          </div>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 14px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--glass-border)',
              backgroundColor: 'var(--bg-secondary)',
              color: '#fff',
              outline: 'none',
            }}
          />
        </div>

        <Button type="submit" isLoading={loading} style={{ width: '100%', marginTop: '8px' }}>
          Sign In
        </Button>
      </form>

      <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
        Don't have an account?{' '}
        <span
          onClick={onToggleForm}
          style={{ color: 'var(--accent-color)', cursor: 'pointer', fontWeight: 600 }}
        >
          Sign Up
        </span>
      </p>
    </div>
  );
};
