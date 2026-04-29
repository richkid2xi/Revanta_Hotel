import React, { useState, useEffect, useRef } from 'react';
import QRCodeLib from 'qrcode';
import { useTheme } from '../../context/ThemeContext';
import { getHotelSettings, updateHotelSettings } from '../../store/reviewsStore';
import styles from './SettingsPage.module.css';

function SettingsPage() {
  const { theme, toggleTheme } = useTheme();
  const [officeName, setOfficeName] = useState(() => getHotelSettings().name);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);
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

  const handlePrintQr = () => {
    if (!canvasRef.current) return;
    const printWindow = window.open('', '', 'width=800,height=600');
    if (!printWindow) return; // Pop-up blocked
    
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

  const handleSaveOffice = () => {
    updateHotelSettings({ name: officeName });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
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
          <p className={styles.qrFooterText}>Print and display at your service point so guests can scan and leave feedback.</p>
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
            <a 
              href="https://elitron-portfolio.vercel.app/" 
              target="_blank" 
              rel="noopener noreferrer" 
              className={styles.infoValueText}
              style={{ color: 'var(--color-primary-light)', textDecoration: 'none', fontWeight: 600 }}
            >
              EliTech CreaTives
            </a>
          </div>
          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>Type</span>
            <span className={styles.infoValueText}>Guest Feedback System</span>
          </div>
          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>Country</span>
            <span className={styles.infoValueText}>Ghana</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SettingsPage;
