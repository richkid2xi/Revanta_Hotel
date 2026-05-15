import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { login } from '../api';
import './SignIn.css';

const DEMO_CREDENTIALS = {
  email: 'richardelikem31@gmail.com',
  password: '12345678',
};

export default function SignIn() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const result = await login({ email, password });
      
      // Clear old session data
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('revanta_')) localStorage.removeItem(key);
      });

      localStorage.setItem('revanta_auth_token', result.token);
      localStorage.setItem('revanta_session_hotel_id', result.hotel.id);
      localStorage.setItem('revanta_active_hotel_name', result.hotel.name);
      
      // Store the first branch's token for QR code generation
      if (result.hotel.branches && result.hotel.branches.length > 0) {
        localStorage.setItem('revanta_active_branch_token', result.hotel.branches[0].reviewToken);
      }
      
      navigate('/admin/overview');
    } catch (err) {
      setError('Invalid email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoFill = () => {
    setEmail(DEMO_CREDENTIALS.email);
    setPassword(DEMO_CREDENTIALS.password);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', position: 'relative' }}>
      <button type="button" className="auth-theme-toggle" onClick={toggleTheme}>
        <span className="material-icons-round">{theme === 'dark' ? 'light_mode' : 'dark_mode'}</span>
      </button>

      <div className="auth-card">
        <h2>Sign in to your account</h2>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="email">EMAIL</label>
            <input
              type="email"
              id="email"
              placeholder="you@business.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">PASSWORD</label>
            <div className="input-with-icon">
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className="icon-btn"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                <span className="material-icons-round">
                  {showPassword ? 'visibility_off' : 'visibility'}
                </span>
              </button>
            </div>
          </div>

          {error && <p style={{ color: '#EF4444', fontSize: '0.85rem', marginTop: '-10px', marginBottom: '10px' }}>{error}</p>}

          <div className="form-actions">
            <label className="checkbox-container">
              <input type="checkbox" />
              <span className="checkmark" />
              Remember me
            </label>
            <Link to="/forgot-password" className="text-link">
              Forgot password?
            </Link>
          </div>

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>

          <button type="button" className="btn-outline" onClick={handleDemoFill}>
            <span className="material-icons-round" style={{ fontSize: 16, verticalAlign: 'middle', marginRight: 6 }}>
              auto_awesome
            </span>
            Use Test Account
          </button>
        </form>

        <div className="auth-footer">
          No account?{' '}
          <Link to="/signup" className="text-link">
            Sign up free
          </Link>
        </div>
      </div>
    </div>
  );
}
