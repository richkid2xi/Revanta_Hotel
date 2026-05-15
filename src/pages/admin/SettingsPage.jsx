import React, { useState, useEffect, useRef } from 'react';
import QRCodeLib from 'qrcode';
import { useTheme } from '../../context/ThemeContext';
import { getHotelSettings, updateHotelSettings } from '../../store/reviewsStore';
import * as api from '../../api';
import { changePassword } from '../../api';
import toast from 'react-hot-toast';
import styles from './SettingsPage.module.css';

function SettingsPage() {
  const { theme, toggleTheme } = useTheme();
  const [officeName, setOfficeName] = useState(() => getHotelSettings().name);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState({ text: '', error: false });
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);
  const [subscription, setSubscription] = useState(null);
  const [loadingSub, setLoadingSub] = useState(true);
  
  const canvasRef = useRef(null);
  const feedbackUrl = `${window.location.origin}/review`;

  useEffect(() => {
    if (!canvasRef.current) return;
    QRCodeLib.toCanvas(canvasRef.current, feedbackUrl, {
      width: 200,
      margin: 1,
      color: { dark: '#1B3B36', light: '#ffffff' },
    });
  }, [feedbackUrl]);

  useEffect(() => {
    async function loadSubscription() {
      try {
        const res = await api.getSubscription();
        setSubscription(res);
      } catch (err) {
        console.error('Failed to load subscription:', err);
      } finally {
        setLoadingSub(false);
      }
    }
    loadSubscription();
  }, []);

  const handleCopy = () => {
    navigator.clipboard.writeText(feedbackUrl);
    setCopied(true);
    toast.success('Link copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRefreshQr = () => {
    if (!canvasRef.current) return;
    QRCodeLib.toCanvas(canvasRef.current, feedbackUrl, {
      width: 200,
      margin: 1,
      color: { dark: '#1B3B36', light: '#ffffff' },
    });
  };

  const handlePrintQr = () => {
    if (!canvasRef.current) return;
    const printWindow = window.open('', '', 'width=800,height=600');
    if (!printWindow) return; 
    
    printWindow.document.write(`
      <html>
        <head>
          <title>Feedback QR Code</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; text-align: center; padding: 40px; color: #1f2937; }
            h1 { font-size: 28px; margin-bottom: 8px; color: #111827; }
            p { font-size: 16px; color: #4b5563; margin-bottom: 40px; }
            .qr-container { display: flex; justify-content: center; margin-bottom: 40px; }
            img { border: 1px solid #e5e7eb; border-radius: 12px; padding: 16px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
            .footer { font-weight: 600; color: #0D9488; }
          </style>
        </head>
        <body>
          <h1>We Value Your Feedback!</h1>
          <p>Please scan the QR code below using your smartphone camera to share your experience with us.</p>
          <div class="qr-container">
            <img src="${canvasRef.current.toDataURL()}" alt="QR Code" width="250" height="250" />
          </div>
          <p class="footer">Thank you for choosing ${officeName || 'us'}!</p>
          <script>
            window.onload = () => { window.print(); window.close(); }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleUpdatePassword = async () => {
    if (!currentPassword || !newPassword) {
      setPasswordMsg({ text: 'Please fill in all password fields.', error: true });
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setPasswordMsg({ text: 'New passwords do not match.', error: true });
      return;
    }
    if (newPassword.length < 8) {
      setPasswordMsg({ text: 'Password must be at least 8 characters.', error: true });
      return;
    }
    setPasswordLoading(true);
    setPasswordMsg({ text: '', error: false });
    try {
      await changePassword(currentPassword, newPassword);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
      setPasswordMsg({ text: 'Password updated successfully.', error: false });
      setTimeout(() => setPasswordMsg({ text: '', error: false }), 3000);
    } catch (err) {
      setPasswordMsg({ text: err.response?.data?.error || 'Failed to update password.', error: true });
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleSaveOffice = async () => {
    try {
      await updateHotelSettings({ name: officeName });
      setSaved(true);
      toast.success('Office settings saved!');
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      toast.error('Failed to save settings');
    }
  };

  const handleRenew = async () => {
    try {
      const res = await api.renewSubscription(subscription?.plan || 'starter');
      if (res.authorization_url) {
        window.location.href = res.authorization_url;
      }
    } catch (err) {
      alert('Failed to initialize renewal. Please try again.');
    }
  };

  return (
    <div className={styles.page}>
      {/* Page Header */}
      <div className={styles.headerRow}>
        <div className={styles.titleContainer}>
          <h1 className={styles.pageTitle}>Settings</h1>
          <p className={styles.pageSubtitle}>Manage your account, feedback link, and appearance.</p>
        </div>
      </div>

      {/* Subscription Card */}
      <div className={styles.card}>
        <h2 className={styles.cardTitle}>Subscription & Billing</h2>
        {loadingSub ? (
          <p className={styles.loadingText}>Loading subscription details...</p>
        ) : (
          <div className={styles.subContent}>
            <div className={styles.subStatusRow}>
              <div className={styles.subMainInfo}>
                <span className={styles.subPlanLabel}>CURRENT PLAN</span>
                <span className={styles.subPlanValue}>{subscription?.plan?.toUpperCase()}</span>
              </div>
              <div className={styles.subBadgeBox}>
                <span className={`${styles.subBadge} ${subscription?.subscriptionStatus === 'active' ? styles.subBadgeActive : styles.subBadgeExpired}`}>
                  {subscription?.subscriptionStatus?.toUpperCase() || 'UNKNOWN'}
                </span>
              </div>
            </div>
            
            <div className={styles.subDetailRow}>
              <div className={styles.subDetailItem}>
                <span className={styles.subDetailLabel}>Active Since</span>
                <span className={styles.subDetailValue}>
                  {subscription?.createdAt ? new Date(subscription.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'N/A'}
                </span>
              </div>
              <div className={styles.subDetailItem}>
                <span className={styles.subDetailLabel}>Next Renewal Date</span>
                <span className={styles.subDetailValue}>
                  {subscription?.subscriptionEnd ? new Date(subscription.subscriptionEnd).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'N/A'}
                </span>
              </div>
            </div>

            <div className={`${styles.subDetailItem} ${styles.subDetailInfo}`}>
              <span className={styles.subDetailLabel}>Status Details</span>
              <span className={styles.subDetailValue}>
                Your subscription includes a 72-hour grace period for renewals. Access will be restricted if not renewed by the deadline.
              </span>
            </div>

            <div className={styles.cardFooter}>
              <button className={styles.btnPrimary} onClick={handleRenew}>
                <span className="material-icons-outlined" style={{ fontSize: 16 }}>refresh</span>
                Renew Subscription
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Office Details */}
      <div className={styles.card}>
        <h2 className={styles.cardTitle}>Office Details</h2>
        <div className={styles.formGroup}>
          <label className={styles.label}>BUSINESS / OFFICE NAME</label>
          <input
            type="text"
            className={styles.input}
            value={officeName}
            onChange={(e) => setOfficeName(e.target.value)}
          />
        </div>
        <div className={styles.cardFooter}>
          <button className={styles.btnPrimary} onClick={handleSaveOffice}>
            <span className="material-icons-outlined" style={{ fontSize: 16 }}>
              {saved ? 'check' : 'save'}
            </span>
            {saved ? 'Saved!' : 'Save Changes'}
          </button>
        </div>
      </div>

      {/* Feedback Link & QR Code */}
      <div className={styles.card}>
        <h2 className={styles.cardTitle}>Feedback Link & QR Code</h2>
        <div className={styles.formGroup}>
          <label className={styles.label}>FEEDBACK URL</label>
          <div className={styles.urlGroup}>
            <input
              type="text"
              className={styles.input}
              value={feedbackUrl}
              readOnly
            />
            <button className={styles.btnSecondary} onClick={handleCopy}>
              <span className="material-icons-outlined" style={{ fontSize: 16 }}>
                {copied ? 'check' : 'content_copy'}
              </span>
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
        </div>

        <div className={styles.qrSection}>
          <div className={styles.qrBox}>
            <canvas ref={canvasRef} />
          </div>
          <div className={styles.qrContent}>
            <p className={styles.qrFooterText}>Print and display at your service point so guests can scan and leave feedback.</p>
            <div className={styles.qrActions}>
              <button className={styles.btnSecondary} onClick={handleRefreshQr}>
                <span className="material-icons-outlined" style={{ fontSize: 16 }}>refresh</span>
                Refresh
              </button>
              <button className={styles.btnSecondary} onClick={handlePrintQr}>
                <span className="material-icons-outlined" style={{ fontSize: 16 }}>print</span>
                Print A5 Card
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Security */}
      <div className={styles.card}>
        <h2 className={styles.cardTitle}>Security</h2>
        {passwordMsg.text && (
          <p style={{ color: passwordMsg.error ? '#EF4444' : '#10B981', fontSize: '0.9rem', marginBottom: '8px' }}>
            {passwordMsg.text}
          </p>
        )}
        <div className={styles.formGroup}>
          <label className={styles.label}>CURRENT PASSWORD</label>
          <input
            type="password"
            className={styles.input}
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
          />
        </div>
        <div className={styles.formGroup}>
          <label className={styles.label}>NEW PASSWORD</label>
          <input
            type="password"
            className={styles.input}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
        </div>
        <div className={styles.formGroup}>
          <label className={styles.label}>CONFIRM NEW PASSWORD</label>
          <input
            type="password"
            className={styles.input}
            value={confirmNewPassword}
            onChange={(e) => setConfirmNewPassword(e.target.value)}
          />
        </div>
        <div className={styles.cardFooter}>
          <button className={styles.btnPrimary} onClick={handleUpdatePassword} disabled={passwordLoading}>
            {passwordLoading ? 'Updating...' : 'Update Password'}
          </button>
        </div>
      </div>

      {/* Appearance */}
      <div className={styles.card}>
        <h2 className={styles.cardTitle}>Appearance</h2>
        <div className={styles.toggleRow}>
          <div className={styles.toggleInfo}>
            <span className={styles.toggleTitle}>Dark Mode</span>
            <span className={styles.toggleDesc}>Toggle between light and dark interface.</span>
          </div>
          <button
            className={styles.toggleBtn}
            onClick={toggleTheme}
            aria-label="Toggle dark mode"
            style={{
              backgroundColor: theme === 'dark' ? 'var(--color-primary-light)' : 'var(--color-border)'
            }}
          >
            <div
              className={styles.toggleCircle}
              style={{ left: theme === 'dark' ? '22px' : '2px' }}
            />
          </button>
        </div>
      </div>
    </div>
  );
}

export default SettingsPage;
