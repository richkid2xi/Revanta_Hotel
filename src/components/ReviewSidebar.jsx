import React, { useState } from 'react';
import styles from './ReviewSidebar.module.css';

export function StarRating({ rating, max = 5 }) {
  return (
    <div className={styles.stars}>
      {Array.from({ length: max }).map((_, i) => {
        const isFilled = i < rating;
        return (
          <span
            key={i}
            className={`material-icons-round ${styles.star} ${!isFilled ? styles.starEmpty : ''}`}
          >
            {isFilled ? 'star' : 'star_border'}
          </span>
        );
      })}
    </div>
  );
}

export function ReviewSidebar({ review, onClose, onUpdate }) {
  // Use internalNotes (DB field name via reviewsStore mapping) or fall back to notes
  const [notes, setNotes] = useState(review?.internalNotes || review?.notes || '');
  const [prevReviewId, setPrevReviewId] = useState(review?.id);
  const [savingNotes, setSavingNotes] = useState(false);
  const [savedNotes, setSavedNotes] = useState(false);

  // Sync notes when a different review is selected
  if (review?.id !== prevReviewId) {
    setPrevReviewId(review?.id);
    setNotes(review?.internalNotes || review?.notes || '');
    setSavedNotes(false);
  }

  if (!review) return null;

  const handleSaveNotes = async () => {
    setSavingNotes(true);
    try {
      if (onUpdate) await onUpdate(review.id, { notes });
      setSavedNotes(true);
      setTimeout(() => setSavedNotes(false), 2000);
    } finally {
      setSavingNotes(false);
    }
  };

  const handleMarkRead = () => {
    if (onUpdate) onUpdate(review.id, { status: 'read' });
    onClose();
  };

  const handleMarkResolved = () => {
    if (onUpdate) onUpdate(review.id, { status: 'resolved' });
    onClose();
  };

  const isResolved = review.status === 'resolved';
  const isRead = review.status === 'read';

  // Parse selectedServices from the DB field name
  const services = review.selectedServices || review.servicesSelected || [];

  return (
    <div className={styles.sidebarOverlay} onClick={onClose}>
      <div className={styles.sidebar} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.sidebarHeader}>
          <div className={styles.sidebarTitleRow}>
            <span className={styles.sidebarRefId}>{review.referenceNumber}</span>
            {review.status === 'unread' && (
              <span className={`${styles.badge} ${styles.badgeUnread}`}>UNREAD</span>
            )}
            {review.status === 'resolved' && (
              <span className={`${styles.badge} ${styles.badgeResolved}`}>RESOLVED</span>
            )}
            {review.isAnonymous && (
              <span className={`${styles.badge} ${styles.badgeAnonymous}`}>ANONYMOUS</span>
            )}
          </div>
          <div className={styles.date}>{review.date}</div>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close">
            <span className="material-icons-outlined">close</span>
          </button>
        </div>

        {/* Body */}
        <div className={styles.sidebarBody}>
          {/* Overall Score */}
          <div className={styles.scoreCard}>
            <div className={styles.scoreIconBox}>
              <span className="material-icons-round">star</span>
            </div>
            <div className={styles.scoreDetails}>
              <span className={styles.scoreLabel}>Overall Score</span>
              <div className={styles.scoreValueRow}>
                <StarRating rating={review.rating} />
                <span className={styles.scoreText}>{review.rating}/5</span>
              </div>
            </div>
          </div>

          {/* Experience Ratings */}
          {review.questions && review.questions.length > 0 && (
            <div>
              <div className={styles.sectionTitle}>Experience Ratings</div>
              {review.questions.map((q, idx) => (
                <div key={idx} className={styles.qItem}>
                  <div className={styles.qContent}>
                    <div className={styles.qHeader}>{q.label}</div>
                    <div className={styles.qProgressRow}>
                      <div className={styles.progressBar}>
                        <div className={styles.progressFill} style={{ width: `${(q.score / 5) * 100}%` }} />
                      </div>
                      <span className={styles.qScoreText}>{q.score}/5</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Services Used */}
          {services.length > 0 && (
            <div>
              <div className={styles.sectionTitle}>Services Used</div>
              <div className={styles.pillsContainer}>
                {services.map(service => (
                  <span key={service} className={styles.pill}>{service}</span>
                ))}
              </div>
            </div>
          )}

          {/* Additional Comments */}
          {review.text && (
            <div>
              <div className={styles.sectionTitle}>Additional Comments</div>
              <div className={styles.genericBox}>
                <p>{review.text}</p>
              </div>
            </div>
          )}

          {/* Contact Details */}
          <div>
            <div className={styles.sectionTitle}>Contact Details</div>
            {review.isAnonymous ? (
              <div className={styles.genericBox}>
                <span className={`material-icons-outlined ${styles.iconAnon}`}>visibility_off</span>
                <p style={{ color: 'var(--color-text-muted)' }}>Submitted anonymously — contact consent not given.</p>
              </div>
            ) : (
              <div className={styles.contactBox}>
                {review.author?.name && (
                  <div className={styles.contactRow}>
                    <span className={`material-icons-outlined ${styles.contactIcon}`}>person_outline</span>
                    <span className={styles.contactName}>{review.author.name}</span>
                  </div>
                )}
                {review.author?.email && (
                  <div className={styles.contactRow}>
                    <span className={`material-icons-outlined ${styles.contactIcon}`}>mail_outline</span>
                    <span className={styles.contactEmail}>{review.author.email}</span>
                  </div>
                )}
                {review.author?.phone && (
                  <div className={styles.contactRow}>
                    <span className={`material-icons-outlined ${styles.contactIcon}`}>call</span>
                    <span className={styles.contactPhone}>{review.author.phone}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Internal Notes */}
          <div>
            <div className={styles.sectionTitle}>Internal Notes (Hotel Only)</div>
            <div className={styles.notesContainer}>
              <textarea
                className={styles.notesInput}
                placeholder="Add internal notes, actions taken, or follow-up instructions..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                maxLength={500}
              />
              <div className={styles.notesFooter}>
                <span className={styles.notesCount}>{notes.length}/500</span>
                <button
                  className={styles.saveNotesBtn}
                  onClick={handleSaveNotes}
                  disabled={savingNotes}
                >
                  {savingNotes ? 'Saving...' : savedNotes ? 'Saved!' : 'Save Notes'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className={styles.sidebarFooter}>
          {!isResolved && (
            <>
              {review.status === 'unread' && (
                <button className={`${styles.sidebarFooterBtn} ${styles.btnMarkRead}`} onClick={handleMarkRead}>
                  <span className="material-icons-outlined" style={{ fontSize: 18 }}>drafts</span>
                  Mark as Read
                </button>
              )}
              <button className={`${styles.sidebarFooterBtn} ${styles.btnResolve}`} onClick={handleMarkResolved}>
                <span className="material-icons-outlined" style={{ fontSize: 18 }}>check_circle_outline</span>
                Mark as Resolved
              </button>
            </>
          )}
          <button
            className={`${styles.sidebarFooterBtn} ${styles.btnClose}`}
            onClick={onClose}
            style={isResolved ? { flex: 1, justifyContent: 'center' } : {}}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
