import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getHotelByToken } from '../../api';
import styles from './ReviewPage.module.css';

function ReviewRedirect() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchData() {
      if (token) {
        try {
          const result = await getHotelByToken(token);
          if (result) {
            // Set the active session context
            localStorage.setItem('revanta_active_hotel_name', result.hotelName);
            localStorage.setItem('revanta_active_hotel_id', result.hotelId);
            localStorage.setItem('revanta_active_branch_name', result.branchName);
            localStorage.setItem('revanta_active_branch_id', result.branchId);
            localStorage.setItem('revanta_active_logo_url', result.logoUrl || '');
            localStorage.setItem('revanta_active_services', JSON.stringify(result.enabledServices));
            
            // Redirect to the real form
            navigate('/review', { replace: true });
          }
        } catch (err) {
          console.error('Error fetching hotel data:', err);
          setError(err.response?.data?.error || "Invalid Review Link");
        }
      }
    }
    fetchData();
  }, [token, navigate]);

  if (error) {
    return (
      <div className={styles.page}>
        <div className={styles.stepContainer} style={{ textAlign: 'center', paddingTop: '100px', maxWidth: '400px' }}>
          <span className="material-icons-round" style={{ fontSize: 48, color: '#EF4444', marginBottom: 16 }}>error_outline</span>
          <h1 className={styles.stepHeading} style={{ color: '#EF4444', fontSize: '1.25rem' }}>Invalid Review Link</h1>
          <p className={styles.stepSubtitle} style={{ fontSize: '0.9rem', color: '#8B949E' }}>The QR code or link you used is invalid or has expired. Please contact the hotel staff for assistance.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.stepContainer} style={{ alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div className={styles.loader} />
        <h2 className={styles.stepHeading} style={{ marginTop: 24, fontSize: '1.1rem', color: '#8B949E' }}>Connecting to Revanta...</h2>
        <style>{`
          .${styles.loader} {
            width: 48px;
            height: 48px;
            border: 3px solid rgba(16, 185, 129, 0.1);
            border-top-color: #10B981;
            border-radius: 50%;
            animation: spin 0.8s linear infinite;
          }
          @keyframes spin { 100% { transform: rotate(360deg); } }
        `}</style>
      </div>
    </div>
  );
}

export default ReviewRedirect;
