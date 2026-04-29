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
  const [notes, setNotes] = useState(review?.notes || '');
  const [prevReviewId, setPrevReviewId] = useState(review?.id);

  if (review?.id !== prevReviewId) {
    setPrevReviewId(review?.id);
    setNotes(review?.notes || '');
  }

  if (!review) return null;

  const handleSaveNotes = () => {
    if (onUpdate) onUpdate(review.id, { notes });
  };

  const handleMarkRead = () => {
    if (onUpdate) onUpdate(review.id, { status: 'read' });
    onClose();
  };

  const handleMarkResolved = () => {
    const rDate = new Date();
    const rawResolvedDate = rDate.getTime();
    const rDay = rDate.getDate().toString().padStart(2, '0');
    const rMonth = rDate.toLocaleString('default', { month: 'short' });
    const resolvedDateStr = `${rDay} ${rMonth} ${rDate.getFullYear()}`;

    if (onUpdate) {
      onUpdate(review.id, { 
        status: 'resolved',
        rawResolvedDate,
        resolvedDateStr
      });
    }
    onClose();
  };

  const isResolved = review.status === 'resolved';

  return (
    <div className={styles.sidebarOverlay} onClick={onClose}>
      <div className={styles.sidebar} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.sidebarHeader}>
          <div className={styles.sidebarTitleRow}>
            <span className={styles.sidebarRefId}>{review.id}</span>
            {review.status === 'unread' && (
              <span className={`${styles.badge} ${styles.badgeUnread}`}>UNREAD</span>
            )}
            {review.isAnonymous && (
              <span className={`${styles.badge} ${styles.badgeAnonymous}`}>ANONYMOUS</span>
            )}
          </div>
          <div className={styles.date}>{review.date}</div>
          <span className={`material-icons-outlined ${styles.closeBtn}`} onClick={onClose}>close</span>
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

          {/* Review Responses */}
          <div>
            <div className={styles.sectionTitle}>Main Experience Ratings</div>
            {review.questions?.map((q, idx) => (
              <div key={idx} className={styles.qItem}>
                <div className={styles.qContent}>
                  <div className={styles.qHeader}>{q.label}</div>
                  <div className={styles.qText}>{q.text}</div>
                  <div className={styles.qProgressRow}>
                    <div className={styles.stars} style={{ gap: 0 }}>
                      {Array.from({ length: 5 }).map((_, i) => (
                        <span key={i} className={`material-icons-round ${styles.star} ${i >= q.score ? styles.starEmpty : ''}`} style={{ fontSize: 16 }}>
                          {i < q.score ? 'star' : 'star_border'}
                        </span>
                      ))}
                    </div>
                    <div className={styles.progressBar}>
                      <div className={styles.progressFill} style={{ width: `${(q.score / 5) * 100}%` }} />
                    </div>
                    <span className={styles.qScoreText}>{q.score}/5</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Services Used */}
          <div>
            <div className={styles.sectionTitle}>Services Used</div>
            <div className={styles.pillsContainer}>
              {review.servicesSelected?.map(service => (
                <span 
                  key={service} 
                  className={styles.pill} 
                  data-service={service}
                >
                  {service}
                </span>
              ))}
              {!review.servicesSelected && <p className={styles.emptyText}>{review.purpose}</p>}
            </div>
          </div>



          {/* Additional Comments */}
          <div>
            <div className={styles.sectionTitle}>Additional Comments</div>
            <div className={styles.genericBox}>
              <p>{review.text}</p>
            </div>
          </div>

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
                <div className={styles.contactRow}>
                  <span className={`material-icons-outlined ${styles.contactIcon}`}>person_outline</span>
                  <span className={styles.contactName}>{review.author?.name}</span>
                </div>
                <div className={styles.contactRow}>
                  <span className={`material-icons-outlined ${styles.contactIcon}`}>mail_outline</span>
                  <span className={styles.contactEmail}>{review.author?.email}</span>
                </div>
                <div className={styles.contactRow}>
                  <span className={`material-icons-outlined ${styles.contactIcon}`}>call</span>
                  <span className={styles.contactPhone}>{review.author?.phone}</span>
                </div>
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
                <button className={styles.saveNotesBtn} onClick={handleSaveNotes}>Save notes</button>
              </div>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className={styles.sidebarFooter}>
          {!isResolved && (
            <>
              <button className={`${styles.sidebarFooterBtn} ${styles.btnMarkRead}`} onClick={handleMarkRead}>
                <span className="material-icons-outlined" style={{ fontSize: 18 }}>mail_outline</span>
                Mark as Read
              </button>
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
