import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { verifyPayment } from '../../api';

/**
 * Handles return from Paystack payment gateway.
 * Paystack appends ?reference=xxx to the callback_url.
 */
function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('verifying'); // 'verifying' | 'success' | 'failed'

  useEffect(() => {
    const reference = searchParams.get('reference') || searchParams.get('trxref');
    if (!reference) {
      setStatus('failed');
      return;
    }

    verifyPayment(reference)
      .then(res => {
        if (res.status === 'success') {
          setStatus('success');
          // Redirect to dashboard after 3 seconds
          setTimeout(() => navigate('/admin/overview', { replace: true }), 3000);
        } else {
          setStatus('failed');
        }
      })
      .catch(() => setStatus('failed'));
  }, [searchParams, navigate]);

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'column',
      gap: 16,
      padding: 24,
      background: 'var(--color-bg)',
      fontFamily: 'var(--font-body)',
    }}>
      {status === 'verifying' && (
        <>
          <div style={{
            width: 40, height: 40,
            border: '3px solid rgba(13,148,136,0.2)',
            borderTopColor: '#0D9488',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite'
          }} />
          <p style={{ color: 'var(--color-text-muted)', fontSize: '1rem' }}>Verifying your payment...</p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </>
      )}

      {status === 'success' && (
        <>
          <span className="material-icons-round" style={{ fontSize: 56, color: '#0D9488' }}>check_circle</span>
          <h2 style={{ color: 'var(--color-text-primary)', margin: 0 }}>Payment Successful!</h2>
          <p style={{ color: 'var(--color-text-muted)', textAlign: 'center' }}>
            Your subscription is now active. Redirecting to your dashboard...
          </p>
        </>
      )}

      {status === 'failed' && (
        <>
          <span className="material-icons-round" style={{ fontSize: 56, color: '#EF4444' }}>error_outline</span>
          <h2 style={{ color: 'var(--color-text-primary)', margin: 0 }}>Payment Verification Failed</h2>
          <p style={{ color: 'var(--color-text-muted)', textAlign: 'center' }}>
            We couldn't verify your payment. Please contact support if you were charged.
          </p>
          <button
            onClick={() => navigate('/signin')}
            style={{
              marginTop: 8, padding: '10px 24px',
              background: '#0D9488', color: '#fff',
              border: 'none', borderRadius: 8,
              fontWeight: 600, cursor: 'pointer', fontSize: '0.9rem'
            }}
          >
            Go to Sign In
          </button>
        </>
      )}
    </div>
  );
}

export default PaymentSuccess;
