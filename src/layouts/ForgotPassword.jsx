import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import axios from 'axios';
import API_URL from '../api/config';
import './SignIn.css';
import './ForgotPassword.css';

export default function ForgotPassword() {
  const [step, setStep] = useState(1); // 1 = email, 2 = otp, 3 = new password
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { theme, toggleTheme } = useTheme();

  const handleRequestOTP = async (e) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    setError('');
    try {
      await axios.post(`${API_URL}/api/forgot-password`, { email });
      setStep(2);
    } catch (err) {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    if (!otp) return;
    setLoading(true);
    setError('');
    try {
      await axios.post(`${API_URL}/api/verify-otp`, { email, otp });
      setStep(3);
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await axios.post(`${API_URL}/api/reset-password`, { email, password: newPassword });
      setSuccess('Password updated! You can now sign in.');
    } catch (err) {
      setError(err.response?.data?.error || 'Reset failed. Session may have expired.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="forgot-password-wrapper" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', position: 'relative' }}>
      <button type="button" className="auth-theme-toggle" onClick={toggleTheme}>
        <span className="material-icons-round">{theme === 'dark' ? 'light_mode' : 'dark_mode'}</span>
      </button>
      <div className="auth-card forgot-password-card">

        {step === 1 && (
          <>
            <h2>Reset your password</h2>
            <p className="subtitle">Enter your email and we'll send you an OTP.</p>
            {error && <p style={{ color: '#EF4444', fontSize: '0.85rem', marginBottom: 8 }}>{error}</p>}
            <form onSubmit={handleRequestOTP} className="auth-form">
              <div className="form-group">
                <label htmlFor="email">EMAIL</label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@hotel.com"
                  required
                />
              </div>
              <button type="submit" className="btn-primary reset-btn" disabled={loading}>
                {loading ? 'Sending...' : 'Send OTP'}
              </button>
              <div className="form-actions-centered">
                <Link to="/signin" className="text-link back-link">&larr; Back to Sign In</Link>
              </div>
            </form>
          </>
        )}

        {step === 2 && (
          <>
            <h2>Enter OTP</h2>
            <p className="subtitle">We sent a 6-digit code to <span className="email-highlight">{email}</span>.</p>
            {error && <p style={{ color: '#EF4444', fontSize: '0.85rem', marginBottom: 8 }}>{error}</p>}
            <form onSubmit={handleVerifyOTP} className="auth-form">
              <div className="form-group">
                <label htmlFor="otp">6-DIGIT OTP</label>
                <input
                  type="text"
                  id="otp"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="123456"
                  maxLength={6}
                  required
                />
              </div>
              <button type="submit" className="btn-primary reset-btn" disabled={loading}>
                {loading ? 'Verifying...' : 'Verify OTP'}
              </button>
              <div className="form-actions-centered">
                <button type="button" onClick={() => setStep(1)} className="text-link back-link">&larr; Change Email</button>
              </div>
            </form>
          </>
        )}

        {step === 3 && (
          <>
            <h2>Set a new password</h2>
            <p className="subtitle">Choose a strong password for your account.</p>
            {error && <p style={{ color: '#EF4444', fontSize: '0.85rem', marginBottom: 8 }}>{error}</p>}
            {success ? (
              <div style={{ textAlign: 'center', padding: '16px 0' }}>
                <span className="material-icons-round" style={{ fontSize: 40, color: '#0D9488', display: 'block', marginBottom: 8 }}>check_circle</span>
                <p style={{ color: 'var(--color-text-primary)', fontWeight: 600, marginBottom: 16 }}>{success}</p>
                <Link to="/signin" className="btn-primary" style={{ textDecoration: 'none', display: 'inline-block', padding: '10px 24px' }}>Go to Sign In</Link>
              </div>
            ) : (
              <form onSubmit={handleResetPassword} className="auth-form">
                <div className="form-group">
                  <label htmlFor="newPassword">NEW PASSWORD</label>
                  <input
                    type="password"
                    id="newPassword"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    minLength={8}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="confirmPassword">CONFIRM PASSWORD</label>
                  <input
                    type="password"
                    id="confirmPassword"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                  />
                </div>
                <button type="submit" className="btn-primary reset-btn" disabled={loading}>
                  {loading ? 'Updating...' : 'Update Password'}
                </button>
              </form>
            )}
          </>
        )}

      </div>
    </div>
  );
}
