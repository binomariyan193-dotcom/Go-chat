import React, { useState } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../common/Button';
import { validatePasswordStrength } from '../../utils/validators';
import { LoopInLogo } from '../common/LoopInLogo';

interface RegisterFormProps {
  onToggleForm: () => void;
}

export const RegisterForm: React.FC<RegisterFormProps> = ({ onToggleForm }) => {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Client-side password validation
    const passErr = validatePasswordStrength(password);
    if (passErr) {
      setError(passErr);
      return;
    }

    setLoading(true);

    try {
      const response = await api.post('/auth/register', { email, username, password });
      login(response.data.token, response.data.user);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '400px', width: '100%', margin: 'auto', padding: '32px' }} className="glass-panel">
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <LoopInLogo size={42} />
      </div>
      <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '6px' }}>Create Account</h2>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', fontSize: '0.9rem' }}>
        Start chatting with your friends today
      </p>

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

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div>
          <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>
            Username
          </label>
          <input
            type="text"
            required
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Unique username"
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
          <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>
            Email
          </label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@example.com"
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
          <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>
            Password
          </label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Min 6 chars (A-Z, a-z, 0-9, !@#)"
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
          <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', display: 'block', marginTop: '4px' }}>
            Must include min 6 chars: uppercase, lowercase, number & special char.
          </span>
        </div>

        <Button type="submit" isLoading={loading} style={{ width: '100%', marginTop: '8px' }}>
          Sign Up
        </Button>
      </form>

      <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
        Already have an account?{' '}
        <span
          onClick={onToggleForm}
          style={{ color: 'var(--accent-color)', cursor: 'pointer', fontWeight: 600 }}
        >
          Sign In
        </span>
      </p>
    </div>
  );
};
