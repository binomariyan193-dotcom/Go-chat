import React, { useState } from 'react';
import { api } from '../../services/api';
import { Button } from '../common/Button';
import { validatePasswordStrength } from '../../utils/validators';

interface ForgotPasswordFormProps {
  onBackToLogin: () => void;
}

export const ForgotPasswordForm: React.FC<ForgotPasswordFormProps> = ({ onBackToLogin }) => {
  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [demoOtp, setDemoOtp] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const response = await api.post('/auth/forgot-password', { email: email.trim() });
      setDemoOtp(response.data.otp);
      setSuccess('Verification OTP sent! Check below or your inbox.');
      setStep(2);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to request password reset');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const passErr = validatePasswordStrength(newPassword);
    if (passErr) {
      setError(passErr);
      return;
    }

    setLoading(true);

    try {
      await api.post('/auth/reset-password', {
        email: email.trim(),
        otp: otp.trim(),
        newPassword,
      });

      setSuccess('Password reset successfully! Redirecting to login...');
      setTimeout(() => {
        onBackToLogin();
      }, 1500);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: 'auto', padding: '32px' }} className="glass-panel">
      <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '8px' }}>Reset Password</h2>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', fontSize: '0.9rem' }}>
        {step === 1 ? 'Enter your account email to receive a reset code' : 'Enter the 6-digit OTP and your new password'}
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

      {success && (
        <div
          style={{
            backgroundColor: 'rgba(16, 185, 129, 0.2)',
            color: '#10b981',
            padding: '10px 14px',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.85rem',
            marginBottom: '16px',
          }}
        >
          {success}
        </div>
      )}

      {/* Demo OTP Display Banner */}
      {demoOtp && step === 2 && (
        <div
          style={{
            backgroundColor: 'rgba(99, 102, 241, 0.2)',
            border: '1px solid var(--accent-color)',
            color: '#a5b4fc',
            padding: '12px',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.88rem',
            marginBottom: '16px',
            textAlign: 'center',
          }}
        >
          🔑 Verification OTP Code: <strong style={{ color: '#fff', fontSize: '1.1rem' }}>{demoOtp}</strong>
        </div>
      )}

      {step === 1 ? (
        <form onSubmit={handleRequestOtp} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>
              Account Email Address
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

          <Button type="submit" isLoading={loading} style={{ width: '100%', marginTop: '8px' }}>
            Send Reset Code
          </Button>
        </form>
      ) : (
        <form onSubmit={handleResetPassword} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>
              6-Digit OTP Code
            </label>
            <input
              type="text"
              required
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              placeholder="e.g. 482910"
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--glass-border)',
                backgroundColor: 'var(--bg-secondary)',
                color: '#fff',
                letterSpacing: '2px',
                textAlign: 'center',
                fontSize: '1.1rem',
                outline: 'none',
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>
              New Password
            </label>
            <input
              type="password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter new strong password"
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
            Confirm & Update Password
          </Button>
        </form>
      )}

      <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
        Remembered your password?{' '}
        <span
          onClick={onBackToLogin}
          style={{ color: 'var(--accent-color)', cursor: 'pointer', fontWeight: 600 }}
        >
          Back to Login
        </span>
      </p>
    </div>
  );
};
