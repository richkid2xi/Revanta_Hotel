import React, { useState, useMemo, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { fetchReviews, updateReviewStatus, saveReviewNote } from '../../store/reviewsStore';
import toast from 'react-hot-toast';
import styles from './ReviewsPage.module.css';

import { ReviewSidebar, StarRating } from '../../components/ReviewSidebar';

function ReviewsPage() {
  const [reviewsData, setReviewsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('All');
  const [sortBy, setSortBy] = useState('date');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedReview, setSelectedReview] = useState(null);
  const location = useLocation();

  const loadReviews = async () => {
    try {
      const data = await fetchReviews();
      setReviewsData(data);
      
      if (location.state?.openReviewId) {
        const rev = data.find(r => r.id === location.state.openReviewId);
        if (rev) setSelectedReview(rev);
      }
    } catch (err) {
      console.error('Failed to load reviews:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReviews();

    // Auto-refresh every 60 seconds
    const interval = setInterval(() => {
      loadReviews();
    }, 60000);

    return () => clearInterval(interval);
  }, [location.state]);

  const handleUpdateReview = async (id, updates) => {
    // 1. Update UI immediately (Optimistic UI)
    setReviewsData(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r));
    if (selectedReview && selectedReview.id === id) {
      setSelectedReview({ ...selectedReview, ...updates });
    }

    // 2. Call API
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
      console.error('Failed to sync review update:', err);
      toast.error('Failed to save changes');
    }
  };

  const counts = useMemo(() => ({
    all: reviewsData.length,
    unread: reviewsData.filter(r => r.status === 'unread').length,
    read: reviewsData.filter(r => r.status === 'read').length,
    resolved: reviewsData.filter(r => r.status === 'resolved').length,
  }), [reviewsData]);

  const filteredAndSortedReviews = useMemo(() => {
    let result = reviewsData;

    // 1. Filter by Tab
    if (activeTab !== 'All') {
      result = result.filter(r => r.status.toLowerCase() === activeTab.toLowerCase());
    }

    // 2. Filter by Search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(r => 
        r.text.toLowerCase().includes(query) ||
        r.id.toLowerCase().includes(query) ||
        (r.author && r.author.name.toLowerCase().includes(query))
      );
    }

    // 3. Sort
    result = [...result].sort((a, b) => {
      if (sortBy === 'date') {
        return b.rawDate - a.rawDate; // Newest first
      } else if (sortBy === 'rating') {
        return b.rating - a.rating; // Highest rating first
      }
      return 0;
    });

    return result;
  }, [reviewsData, activeTab, sortBy, searchQuery]);

  return (
    <>
      <div className={styles.page}>
        {/* Header */}
        <div className={styles.headerRow}>
          <div className={styles.titleContainer}>
            <h1 className={styles.pageTitle}>All Reviews</h1>
            <p className={styles.pageSubtitle}>{counts.all} reviews total</p>
          </div>
          <div className={styles.headerActions}>
            <button 
              className={`${styles.filterBtn} ${sortBy === 'date' ? styles.filterBtnActive : ''}`}
              onClick={() => setSortBy('date')}
            >
              Date
              {sortBy === 'date' && <span className={`material-icons-outlined ${styles.filterBtnIcon}`}>arrow_downward</span>}
            </button>
            <button 
              className={`${styles.filterBtn} ${sortBy === 'rating' ? styles.filterBtnActive : ''}`}
              onClick={() => setSortBy('rating')}
            >
              Rating
              {sortBy === 'rating' && <span className={`material-icons-outlined ${styles.filterBtnIcon}`}>arrow_downward</span>}
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className={styles.tabsContainer}>
          {['All', 'Unread', 'Read', 'Resolved'].map(tab => (
            <button 
              key={tab}
              className={`${styles.tabBtn} ${activeTab === tab ? styles.tabBtnActive : ''}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab} <span className={styles.tabCount}>{counts[tab.toLowerCase()]}</span>
            </button>
          ))}
        </div>

        {/* Search */}
        <div className={styles.searchContainer}>
          <span className={`material-icons-outlined ${styles.searchIcon}`}>search</span>
          <input 
            type="text" 
            className={styles.searchInput} 
            placeholder="Search by comment, reference or name..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* List */}
        <div className={styles.reviewsList}>
          {loading ? (
             <div style={{ padding: '40px', textAlign: 'center', color: 'var(--color-text-muted)' }}>Loading reviews...</div>
          ) : filteredAndSortedReviews.length === 0 ? (
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', marginTop: 10 }}>No reviews match your filters.</p>
          ) : (
            filteredAndSortedReviews.map((review) => (
              <div 
                key={review.id} 
                className={`${styles.card} ${review.status === 'unread' ? styles.cardUnread : ''}`} 
                onClick={() => setSelectedReview(review)}
                style={{ cursor: 'pointer' }}
              >
                <div className={styles.cardHeader}>
                  <span className={styles.refId}>{review.referenceNumber}</span>
                  <span className={styles.date}>{review.shortDate}</span>
                </div>
                
                <div className={styles.cardMeta}>
                  <StarRating rating={review.rating} />
                  {review.status === 'unread' && (
                    <span className={`${styles.badge} ${styles.badgeUnread}`}>UNREAD</span>
                  )}
                  {review.isAnonymous && (
                    <span className={`${styles.badge} ${styles.badgeAnonymous}`}>ANONYMOUS</span>
                  )}
                </div>

                <p className={styles.comment}>{review.text}</p>

                {review.author && (
                  <div className={styles.authorContainer}>
                    <span className={`material-icons-outlined ${styles.authorIcon}`}>person_outline</span>
                    <span className={styles.authorName}>
                      {review.author.name}
                      {review.author.email ? ` · ${review.author.email}` : ''}
                      {!review.author.email && review.author.phone ? ` · ${review.author.phone}` : ''}
                    </span>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      <ReviewSidebar review={selectedReview} onClose={() => setSelectedReview(null)} onUpdate={handleUpdateReview} />
    </>
  );
}

export default ReviewsPage;
