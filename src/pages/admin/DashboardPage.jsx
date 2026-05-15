import { useMemo, useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { fetchStats, fetchReviews, getHotelSettings, getCachedDashboard, setDashboardCache } from '../../store/reviewsStore';
import toast from 'react-hot-toast';
import styles from './DashboardPage.module.css';

/* ── Star Rating ───────────────────────────────────────── */
function StarRating({ rating, max = 5, size = 18 }) {
  return (
    <span className={styles.stars} aria-label={`${rating} out of ${max} stars`}>
      {Array.from({ length: max }).map((_, i) => {
        const filled = i < Math.floor(rating);
        const half = !filled && i < rating;
        return (
          <span
            key={i}
            className={`material-icons-round ${styles.star}`}
            style={{ fontSize: size }}
          >
            {filled ? 'star' : half ? 'star_half' : 'star_border'}
          </span>
        );
      })}
    </span>
  );
}

/* ── Helpers ───────────────────────────────────────────── */
function formatDate() {
  return new Date().toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function getSatisfactionClass(score, styles) {
  if (score >= 4.0) return styles.satGreen;
  if (score >= 3.0) return styles.satAmber;
  return styles.satRed;
}

/* ── Dashboard Page ────────────────────────────────────── */
function DashboardPage() {
  const today = useMemo(() => formatDate(), []);
  const [allReviews, setAllReviews] = useState([]);
  const [dashboardStats, setDashboardStats] = useState({ totalReviews: 0, unreadReviews: 0, readReviews: 0, resolvedReviews: 0, avgRating: 0 });
  const [hotelName, setHotelName] = useState(() => getHotelSettings().name);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const [refreshing, setRefreshing] = useState(false);

  const loadData = async (force = false) => {
    setRefreshing(true);
    try {
      if (!force) {
        const cached = getCachedDashboard();
        if (cached && cached.stats && cached.reviews) {
          setDashboardStats(cached.stats);
          setAllReviews(cached.reviews);
          setLoading(false);
          setRefreshing(false);
          return;
        }
      }

      const [statsData, reviewsData] = await Promise.all([
        fetchStats(),
        fetchReviews()
      ]);
      const newStats = {
        ...statsData,
        readReviews: statsData.readReviews ?? 0
      };
      const newReviews = reviewsData.slice(0, 5);
      
      setDashboardStats(newStats);
      setAllReviews(newReviews);
      setDashboardCache(newStats, newReviews);
      
      if (force) toast.success('Dashboard refreshed');
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
      toast.error('Failed to refresh data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();

    const handleSettingsUpdate = () => setHotelName(getHotelSettings().name);
    window.addEventListener('revanta_settings_updated', handleSettingsUpdate);
    return () => window.removeEventListener('revanta_settings_updated', handleSettingsUpdate);
  }, []);

  const stats = useMemo(() => {
    return [
      { id: 'total',    label: 'Total Reviews',  value: dashboardStats.totalReviews,    icon: 'hotel_class',        color: 'neutral' },
      { id: 'unread',   label: 'Unread',         value: dashboardStats.unreadReviews,   icon: 'mark_email_unread',  color: 'amber',   sub: 'Needs response' },
      { id: 'read',     label: 'Read',           value: dashboardStats.readReviews,     icon: 'drafts',             color: 'neutral', sub: 'Acknowledged' },
      { id: 'resolved', label: 'Resolved',       value: dashboardStats.resolvedReviews, icon: 'check_circle',       color: 'green',   sub: 'Closed cases' },
    ];
  }, [dashboardStats]);

  const avgScore = dashboardStats.avgRating;

  const recentSubmissions = allReviews;

  const handleUpdateReview = async (id, updates) => {
    // Optimistic update
    setAllReviews(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r));
    // Sync to backend
    try {
      const { updateReviewStatus } = await import('../../store/reviewsStore');
      if (updates.status) {
        await updateReviewStatus(id, updates.status);
        if (updates.status === 'read') toast.success('Marked as read');
        if (updates.status === 'resolved') toast.success('Marked as resolved');
        // Reload stats so counts reflect immediately
        loadData(true);
      }
    } catch (err) {
      console.error('Failed to sync review update:', err);
      toast.error('Failed to update status');
    }
  };

  if (loading) {
    return (
      <div className={styles.page} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div className={styles.loaderSmall} style={{ width: 40, height: 40 }}></div>
      </div>
    );
  }

  return (
    <div className={styles.page}>

      {/* ── Page header ─────────────────────────────────── */}
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Overview</h1>
          <p className={styles.pageSubtitle}>
            <span style={{ textTransform: 'uppercase' }}>{hotelName}</span>&nbsp;·&nbsp;Guest Review Dashboard
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <button 
            onClick={() => loadData(true)} 
            disabled={refreshing}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '6px 12px', borderRadius: '8px',
              border: '1px solid var(--color-border)',
              background: 'transparent', color: 'var(--color-text-main)',
              cursor: refreshing ? 'not-allowed' : 'pointer',
              opacity: refreshing ? 0.7 : 1,
              fontFamily: 'var(--font-body)', fontSize: '0.85rem'
            }}
          >
            <span 
              className="material-icons-outlined" 
              style={{ 
                fontSize: 16, 
                animation: refreshing ? 'spin 1s linear infinite' : 'none' 
              }}
            >
              refresh
            </span>
            Refresh
          </button>
          <div className={styles.dateBadge}>
            <span className="material-icons-outlined" style={{ fontSize: 16 }}>calendar_today</span>
            {today}
          </div>
        </div>
      </div>

      {/* ── Stat cards ──────────────────────────────────── */}
      <div className={styles.statsGrid}>
        {stats.map((stat) => (
          <div key={stat.id} className={`${styles.statCard} ${styles[`statCard_${stat.color}`]}`}>
            <div className={styles.statTop}>
              <span className={styles.statLabel}>{stat.label}</span>
              <span className={`material-icons-outlined ${styles.statIcon} ${styles[`statIcon_${stat.color}`]}`}>
                {stat.icon}
              </span>
            </div>
            <div className={styles.statValue}>{stat.value}</div>
            {stat.sub && <div className={styles.statSub}>{stat.sub}</div>}
          </div>
        ))}
      </div>

      {/* ── Avg satisfaction ────────────────────────────── */}
      {avgScore > 0 && (
        <div className={`${styles.satisfactionCard} ${getSatisfactionClass(Number(avgScore), styles)}`}>
          <div className={styles.satisfactionLeft}>
            <span className={styles.satisfactionLabel}>
              Avg. Satisfaction — {new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}
            </span>
            <div className={styles.satisfactionScore}>
              <span className={styles.scoreNumber}>{avgScore}</span>
              <div className={styles.scoreDetails}>
                <StarRating rating={Number(avgScore)} size={22} />
                <span className={styles.scoreMeta}>
                  out of 5.0&nbsp;·&nbsp;{allReviews.filter(r => r.status !== 'resolved').length} reviews
                </span>
              </div>
            </div>
          </div>
          <div className={styles.satisfactionIcon}>
            <span className={`material-icons-round ${styles.satisfactionIconColor}`}>star</span>
          </div>
        </div>
      )}

      {/* ── Recent submissions ───────────────────────────── */}
      <div className={styles.recentSection}>
        <div className={styles.recentHeader}>
          <h2 className={styles.sectionTitle}>Recent Guest Reviews</h2>
          <Link to="/admin/reviews" className={styles.viewAll}>
            View all <span className="material-icons-round" style={{ fontSize: 16 }}>arrow_forward</span>
          </Link>
        </div>

        <div className={styles.submissionList}>
          {recentSubmissions.length === 0 ? (
            <div className={styles.emptyState}>
              <span className="material-icons-outlined">inbox</span>
              <p>No guest reviews yet</p>
              <span>Share your feedback QR code to start receiving responses.</span>
            </div>
          ) : (
            recentSubmissions.map((sub) => (
              <SubmissionCard
                key={sub.id}
                submission={sub}
                onUpdate={handleUpdateReview}
                onOpen={() => navigate('/admin/reviews', { state: { openReviewId: sub.id } })}
              />
            ))
          )}
        </div>
      </div>

      {/* ── QR Code shortcut ── */}
      <div className={styles.qrShortcutCard}>
        <div className={styles.qrShortcutLeft}>
          <div className={styles.qrShortcutIcon}>
            <span className="material-icons-round">qr_code_2</span>
          </div>
          <div>
            <h3 className={styles.qrShortcutTitle}>Feedback QR Code</h3>
            <p className={styles.qrShortcutDesc}>Your feedback QR code is ready. Print it and display it at your service points.</p>
          </div>
        </div>
        <Link to="/admin/settings" className={styles.qrShortcutBtn}>
          Manage
        </Link>
      </div>
    </div>
  );
}

/* ── Submission Card ───────────────────────────────────── */
function SubmissionCard({ submission, onUpdate, onOpen }) {
  const { id, referenceNumber, status, rating, shortDate, date, text, author } = submission;
  const isUnread = status === 'unread';

  const handleMarkRead = (e) => {
    e.stopPropagation();
    onUpdate(id, { status: 'read' });
  };

  const handleResolve = (e) => {
    e.stopPropagation();
    const rDate = new Date();
    const rawResolvedDate = rDate.getTime();
    const rDay = rDate.getDate().toString().padStart(2, '0');
    const rMonth = rDate.toLocaleString('default', { month: 'short' });
    const resolvedDateStr = `${rDay} ${rMonth} ${rDate.getFullYear()}`;
    onUpdate(id, { status: 'resolved', rawResolvedDate, resolvedDateStr });
  };

  return (
    <div
      className={`${styles.subCard} ${isUnread ? styles.subCardUnread : ''}`}
      onClick={onOpen}
      style={{ cursor: 'pointer' }}
      title="Go to Reviews"
    >
      {/* Row 1: ref + badge + date */}
      <div className={styles.subCardTop}>
        <div className={styles.subCardMeta}>
          <span className={styles.subRef}>{referenceNumber}</span>
          <span className={`${styles.subBadge} ${isUnread ? styles.subBadgeUnread : styles.subBadgeRead}`}>
            {isUnread ? 'UNREAD' : 'READ'}
          </span>
        </div>
        <div className={styles.subActions}>
          <span className={styles.subDate}>{shortDate || date}</span>
          {isUnread && (
            <button className={styles.actionBtn} onClick={handleMarkRead}>Mark Read</button>
          )}
          <button className={`${styles.actionBtn} ${styles.actionBtnGreen}`} onClick={handleResolve}>Resolve</button>
        </div>
      </div>

      {/* Row 2: stars */}
      <div className={styles.subCardBody}>
        <StarRating rating={rating} size={16} />
        <span className={styles.subRatingText}>{rating}/5</span>
      </div>
      <p className={styles.subText}>{text}</p>
      {author && <p className={styles.subAuthor}>{typeof author === 'object' ? author.name : author}</p>}
    </div>
  );
}

export default DashboardPage;
