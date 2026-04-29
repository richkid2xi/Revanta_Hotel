import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import './SignIn.css';

const DEMO_CREDENTIALS = {
  email: 'demo@revanta.app',
  password: 'Demo@1234',
};

export default function SignIn() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  const handleSubmit = (e) => {
    e.preventDefault();
    navigate('/admin/overview');
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

          <button type="submit" className="btn-primary">
            Sign In
          </button>

          <button type="button" className="btn-outline" onClick={handleDemoFill}>
            <span className="material-icons-round" style={{ fontSize: 16, verticalAlign: 'middle', marginRight: 6 }}>
              auto_awesome
            </span>
            Use Demo Account
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
