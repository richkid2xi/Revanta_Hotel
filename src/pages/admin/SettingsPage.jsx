import React, { useState, useEffect, useRef } from 'react';
import QRCodeLib from 'qrcode';
import { useTheme } from '../../context/ThemeContext';
import styles from './SettingsPage.module.css';

function SettingsPage() {
  const { theme, toggleTheme } = useTheme();
  const [officeName, setOfficeName] = useState("Volta Regional Minister's Office");
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [copied, setCopied] = useState(false);
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

  const handleCopy = () => {
    navigator.clipboard.writeText(feedbackUrl);
    setCopied(true);
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

  return (
    <div className={styles.page}>
      {/* Page Header */}
      <div className={styles.headerRow}>
        <div className={styles.titleContainer}>
          <h1 className={styles.pageTitle}>Settings</h1>
          <p className={styles.pageSubtitle}>Office configuration and system preferences.</p>
        </div>
      </div>

      {/* Office Details */}
      <div className={styles.card}>
        <h2 className={styles.cardTitle}>Office Details</h2>
        <div className={styles.formGroup}>
          <label className={styles.label}>OFFICE NAME</label>
          <input
            type="text"
            className={styles.input}
            value={officeName}
            onChange={(e) => setOfficeName(e.target.value)}
          />
        </div>
        <div className={styles.cardFooter}>
          <button className={styles.btnPrimary}>
            <span className="material-icons-outlined" style={{ fontSize: 16 }}>save</span>
            Save Changes
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
          <div className={styles.qrActions}>
            <button className={styles.btnSecondary} onClick={handleRefreshQr}>
              <span className="material-icons-outlined" style={{ fontSize: 16 }}>refresh</span>
              Refresh
            </button>
            <button className={styles.btnSecondary}>
              <span className="material-icons-outlined" style={{ fontSize: 16 }}>print</span>
              Print A5 Card
            </button>
          </div>
          <p className={styles.qrFooterText}>A5 card uses Ghana government styling — suitable for display at service points.</p>
        </div>
      </div>

      {/* Change Password */}
      <div className={styles.card}>
        <h2 className={styles.cardTitle}>Change Password</h2>
        <div className={styles.formGroup}>
          <label className={styles.label}>CURRENT PASSWORD</label>
          <input
            type="password"
            className={styles.input}
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            placeholder="••••••••"
          />
        </div>
        <div className={styles.formGroup}>
          <label className={styles.label}>NEW PASSWORD</label>
          <input
            type="password"
            className={styles.input}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="••••••••"
          />
        </div>
        <div className={styles.cardFooter}>
          <button className={styles.btnPrimary}>
            <span className="material-icons-outlined" style={{ fontSize: 16 }}>lock</span>
            Update Password
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

      {/* System Information */}
      <div className={styles.card}>
        <h2 className={styles.cardTitle}>System Information</h2>
        <div className={styles.infoList}>
          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>Platform</span>
            <span className={styles.infoValue}>Revanta v1.0.0</span>
          </div>
          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>Developer</span>
            <span className={styles.infoValueText}>EliTech Creatives</span>
          </div>
          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>Office</span>
            <span className={styles.infoValueText}>Volta Regional Minister&apos;s Office</span>
          </div>
          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>Region</span>
            <span className={styles.infoValueText}>Volta Region, Ghana</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SettingsPage;
