import { useState, useEffect } from 'react';
import { fetchReviews, updateReviewStatus, saveReviewNote } from '../../store/reviewsStore';
import { ReviewSidebar, StarRating } from '../../components/ReviewSidebar';
import toast from 'react-hot-toast';
import styles from './ResolvedPage.module.css';

function ResolvedPage() {
  const [reviewsData, setReviewsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReview, setSelectedReview] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortDesc, setSortDesc] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const all = await fetchReviews({ status: 'resolved' });
        setReviewsData(all);
      } catch (err) {
        console.error('Failed to load resolved reviews:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleUpdateReview = async (id, updates) => {
    // Optimistic update
    setReviewsData(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r));
    if (selectedReview?.id === id) {
      setSelectedReview(prev => ({ ...prev, ...updates }));
    }
    // Sync to backend
    try {
      if (updates.status) {
        await updateReviewStatus(id, updates.status);
        toast.success(`Marked as ${updates.status}`);
      }
      if (updates.notes !== undefined) {
        await saveReviewNote(id, updates.notes);
        toast.success('Notes saved');
      }
    } catch (err) {
      console.error('Failed to sync update:', err);
      toast.error('Failed to save changes');
    }
  };

  const filtered = reviewsData
    .filter(r => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        r.text?.toLowerCase().includes(q) ||
        r.id?.toLowerCase().includes(q) ||
        r.author?.name?.toLowerCase().includes(q)
      );
    })
    .sort((a, b) => sortDesc ? b.rawDate - a.rawDate : a.rawDate - b.rawDate);

  return (
    <>
      <div className={styles.page}>
        {/* Header */}
        <div className={styles.headerRow}>
          <div className={styles.titleContainer}>
            <h1 className={styles.pageTitle}>Resolved Reviews</h1>
            <p className={styles.pageSubtitle}>{reviewsData.length} resolved reviews</p>
          </div>
          <div className={styles.headerActions}>
            <button className={styles.filterBtn} onClick={() => setSortDesc(v => !v)}>
              <span className="material-icons-outlined" style={{ fontSize: 16 }}>sort</span>
              Date {sortDesc ? '↓' : '↑'}
            </button>
          </div>
        </div>

        {/* Search */}
        <div className={styles.searchContainer}>
          <span className={`material-icons-outlined ${styles.searchIcon}`}>search</span>
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Search resolved reviews..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* List */}
        <div className={styles.reviewsList}>
          {loading ? (
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', padding: '40px 0', textAlign: 'center' }}>Loading resolved reviews...</p>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--color-text-muted)' }}>
              <span className="material-icons-outlined" style={{ fontSize: 40, display: 'block', marginBottom: 12 }}>task_alt</span>
              <p style={{ fontSize: '0.95rem' }}>No resolved reviews {searchQuery ? 'match your search' : 'yet'}.</p>
            </div>
          ) : (
            filtered.map((review) => (
              <div
                key={review.id}
                className={styles.card}
                onClick={() => setSelectedReview(review)}
                style={{ cursor: 'pointer' }}
              >
                <div className={styles.cardHeader}>
                  <span className={styles.refId}>{review.referenceNumber}</span>
                  <span className={styles.date}>{review.shortDate}</span>
                </div>

                <div className={styles.cardMeta}>
                  <StarRating rating={review.rating} />
                  <span className={`${styles.badge} ${styles.badgeResolved}`}>RESOLVED</span>
                  {review.isAnonymous && (
                    <span className={`${styles.badge} ${styles.badgeAnonymous}`}>ANONYMOUS</span>
                  )}
                </div>

                <p className={styles.comment}>{review.text}</p>

                {review.author && (
                  <div className={styles.authorContainer}>
                    <span className={`material-icons-outlined ${styles.authorIcon}`}>person_outline</span>
                    <span className={styles.authorName}>
                      {review.author.name}{review.author.email ? ` · ${review.author.email}` : ''}
                    </span>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      <ReviewSidebar
        review={selectedReview}
        onClose={() => setSelectedReview(null)}
        onUpdate={handleUpdateReview}
      />
    </>
  );
}

export default ResolvedPage;
