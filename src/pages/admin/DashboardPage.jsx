import { useMemo, useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getReviews, updateReview as storeUpdateReview, getHotelSettings } from '../../store/reviewsStore';
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
  const [allReviews, setAllReviews] = useState(() => getReviews());
  const [hotelName, setHotelName] = useState(() => getHotelSettings().name);
  const navigate = useNavigate();

  useEffect(() => {
    const handleSettingsUpdate = () => setHotelName(getHotelSettings().name);
    window.addEventListener('revanta_settings_updated', handleSettingsUpdate);
    return () => window.removeEventListener('revanta_settings_updated', handleSettingsUpdate);
  }, []);

  const stats = useMemo(() => {
    const total = allReviews.length;
    const unread = allReviews.filter(r => r.status === 'unread').length;
    const read = allReviews.filter(r => r.status === 'read').length;
    const resolved = allReviews.filter(r => r.status === 'resolved').length;
    return [
      { id: 'total',    label: 'Total Reviews',  value: total,    icon: 'hotel_class',        color: 'neutral' },
      { id: 'unread',   label: 'Unread',         value: unread,   icon: 'mark_email_unread',  color: 'amber',   sub: 'Needs response' },
      { id: 'read',     label: 'Read',           value: read,     icon: 'drafts',             color: 'neutral', sub: 'Reviewed' },
      { id: 'resolved', label: 'Resolved',       value: resolved, icon: 'check_circle',       color: 'green',   sub: 'Closed cases' },
    ];
  }, [allReviews]);

  const avgScore = useMemo(() => {
    const active = allReviews.filter(r => r.status !== 'resolved');
    if (!active.length) return 0;
    return (active.reduce((sum, r) => sum + r.rating, 0) / active.length).toFixed(1);
  }, [allReviews]);

  const recentSubmissions = useMemo(() =>
    [...allReviews]
      .filter(r => r.status !== 'resolved')
      .sort((a, b) => b.rawDate - a.rawDate)
      .slice(0, 5),
    [allReviews]
  );

  const handleUpdateReview = (id, updates) => {
    const updated = storeUpdateReview(id, updates);
    setAllReviews(updated);
  };

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
        <div className={styles.dateBadge}>
          <span className="material-icons-outlined" style={{ fontSize: 16 }}>calendar_today</span>
          {today}
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
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>No submissions yet.</p>
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
  const { id, status, rating, shortDate, date, text, author } = submission;
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
          <span className={styles.subRef}>{id}</span>
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
