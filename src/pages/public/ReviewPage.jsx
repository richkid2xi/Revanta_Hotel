import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { submitReview } from '../../api';
import styles from './ReviewPage.module.css';

// ─── Constants ────────────────────────────────────────────────────────────────

const ALL_SERVICES_MAP = {
  'room': { label: 'Room Stay', icon: 'hotel' },
  'restaurant': { label: 'Restaurant', icon: 'restaurant' },
  'conference': { label: 'Conference or Meeting Room', icon: 'meeting_room' },
  'pool_gym': { label: 'Pool or Gym', icon: 'pool' },
  'spa': { label: 'Spa or Wellness', icon: 'spa' },
  'events': { label: 'Events or Banquet', icon: 'celebration' },
  'other': { label: 'Other', icon: 'more_horiz' },
};

const MAIN_QUESTIONS = [
  { id: 'q1', label: 'OVERALL SATISFACTION',          text: 'Overall, how satisfied are you with your experience?' },
  { id: 'q2', label: 'CHECK-IN & CHECK-OUT',          text: 'How would you rate the smoothness of your check-in and check-out process?' },
  { id: 'q3', label: 'STAFF ATTITUDE & PROFESSIONALISM', text: 'How would you rate the attitude and professionalism of our staff?' },
  { id: 'q4', label: 'CLEANLINESS',                   text: 'How would you rate the cleanliness of our facilities?' },
  { id: 'q5', label: 'VALUE FOR MONEY',                text: 'How would you rate the value for money?' },
  { id: 'q6', label: 'OVERALL EXPERIENCE',            text: 'How smooth was your overall experience with us?' },
];

const RATING_OPTIONS = [
  { value: 1, label: 'Very Dissatisfied', icon: 'sentiment_very_dissatisfied' },
  { value: 2, label: 'Dissatisfied',      icon: 'sentiment_dissatisfied' },
  { value: 3, label: 'Neutral',           icon: 'sentiment_neutral' },
  { value: 4, label: 'Satisfied',         icon: 'sentiment_satisfied' },
  { value: 5, label: 'Very Satisfied',    icon: 'sentiment_very_satisfied' },
];

function generateRefNumber() {
  const chars = '0123456789ABCDEF';
  const rand = (len) =>
    Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  return `REV-${rand(8)}`;
}

// ─── Component ────────────────────────────────────────────────────────────────

function ReviewPage() {
  const navigate = useNavigate();
  
  // Get data from localStorage (set by ReviewRedirect)
  const hotelName = localStorage.getItem('revanta_active_hotel_name') || 'Revanta Hotel';
  const hotelId = localStorage.getItem('revanta_active_hotel_id');
  const branchName = localStorage.getItem('revanta_active_branch_name') || 'Main Branch';
  const branchId = localStorage.getItem('revanta_active_branch_id');
  const logoUrl = localStorage.getItem('revanta_active_logo_url');
  const enabledServicesKeys = JSON.parse(localStorage.getItem('revanta_active_services') || '[]');

  // Active services (filtered by hotel settings)
  const SERVICES = useMemo(() => {
    // If we have specific services enabled for this hotel, use them.
    // Otherwise, fall back to a sensible default list.
    const keys = enabledServicesKeys.length > 0 
      ? enabledServicesKeys 
      : ['room', 'restaurant', 'pool_gym', 'other'];
      
    return keys.map(key => ({
      id: key,
      ...ALL_SERVICES_MAP[key]
    })).filter(s => s && s.label); 
  }, [enabledServicesKeys]);

  // Form state
  const [step, setStep] = useState(0);
  const [selectedServices, setSelectedServices] = useState([]);
  const [mainRatings, setMainRatings] = useState({});
  const [comment, setComment] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [contact, setContact] = useState({ name: '', phone: '', email: '' });
  const [otherServiceText, setOtherServiceText] = useState('');
  const [showValidationError, setShowValidationError] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cooldownRemaining, setCooldownRemaining] = useState(null);

  const [refNumber] = useState(generateRefNumber);

  // --- Spam Prevention Check ---
  useEffect(() => {
    const lastSubmission = localStorage.getItem(`revanta_last_sub_${hotelId}`);
    if (lastSubmission) {
      const timeSince = Date.now() - parseInt(lastSubmission);
      const cooldown = 24 * 60 * 60 * 1000; // 24 hours
      if (timeSince < cooldown) {
        setCooldownRemaining(Math.ceil((cooldown - timeSince) / (60 * 60 * 1000)));
      }
    }
  }, [hotelId]);

  // ─── Dynamic step list ─────────────────────────────────────────────────────
  const dynamicSteps = useMemo(() => {
    const steps = [];
    steps.push({ type: 'welcome' });
    steps.push({ type: 'serviceSelection' });
    MAIN_QUESTIONS.forEach((q, idx) => steps.push({ type: 'mainQ', data: q, index: idx + 1 }));

    steps.push({ type: 'comment' });
    steps.push({ type: 'contact' });
    steps.push({ type: 'summary' });
    return steps;
  }, [selectedServices]);

  const currentStepData = dynamicSteps[step];
  const TOTAL_STEPS = dynamicSteps.length - 1;
  const progressPercent = Math.round((step / TOTAL_STEPS) * 100);

  // ─── Navigation ────────────────────────────────────────────────────────────
  const handleNext = () => setStep((s) => Math.min(s + 1, TOTAL_STEPS));
  const handleBack = () => setStep((s) => Math.max(s - 1, 1));

  const handleContinue = () => {
    if (selectedServices.length === 0) {
      setShowValidationError(true);
    } else {
      setShowValidationError(false);
      handleNext();
    }
  };

  // ─── Rating handlers ────────────────────────────────────────────────────────
  const toggleService = (label) =>
    setSelectedServices((prev) =>
      prev.includes(label) ? prev.filter((l) => l !== label) : [...prev, label]
    );

  const handleMainRating = (id, val) =>
    setMainRatings((prev) => ({ ...prev, [id]: val }));

  // ─── Submit ─────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const reviewData = {
        reference: refNumber,
        hotelId: hotelId,
        branchId: branchId,
        overallRating: mainRatings['q1'] || 0,
        selectedServices: selectedServices.map(s => s === 'Other' && otherServiceText.trim() ? `Other: ${otherServiceText.trim()}` : s),
        generalScores: mainRatings,
        serviceScores: {}, // Expandable in the future
        writtenComment: comment.trim(),
        isAnonymous: isAnonymous,
        guestName: isAnonymous ? null : contact.name,
        guestPhone: isAnonymous ? null : contact.phone,
        guestEmail: isAnonymous ? null : contact.email,
      };

      const result = await submitReview(reviewData);
      
      if (result.success) {
        // Set cooldown to prevent spamming
        localStorage.setItem(`revanta_last_sub_${hotelId}`, Date.now().toString());
        navigate('/thank-you', { state: { ref: result.reference, name: isAnonymous ? null : contact.name } });
      }
    } catch (err) {
      console.error('Error submitting review:', err);
      alert('Failed to submit review. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (cooldownRemaining !== null) {
    return (
      <div className={styles.page}>
        <div className={styles.landingContainer} style={{ marginTop: '10vh' }}>
          <span className="material-icons-round" style={{ fontSize: '64px', color: '#10B981', marginBottom: '24px' }}>check_circle</span>
          <h2 className={styles.mainTitle}>Feedback Received</h2>
          <p className={styles.subtitle}>Thank you! You've already submitted a review for {hotelName} recently.</p>
          <p className={styles.description} style={{ marginTop: '16px' }}>
            To ensure quality feedback, we limit submissions to once every 24 hours. 
            You can submit another review in about {cooldownRemaining} hours.
          </p>
          <button className={styles.startBtn} style={{ marginTop: '32px' }} onClick={() => navigate('/signin')}>
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>

      {/* ── Top Progress Bar ── */}
      {step > 0 && step <= TOTAL_STEPS && (
        <div className={styles.topProgressWrap}>
          <div className={styles.topProgressText}>
            <span>
              {currentStepData.type === 'serviceSelection' && 'Experience'}
              {currentStepData.type === 'mainQ'            && `General Survey ${currentStepData.index}/${MAIN_QUESTIONS.length}`}
              {currentStepData.type === 'comment'          && 'Final Feedback'}
              {currentStepData.type === 'contact'          && 'Contact Info'}
              {currentStepData.type === 'summary'          && 'Review'}
            </span>
            <span>{progressPercent}%</span>
          </div>
          <div className={styles.progressTrack}>
            <div className={styles.progressFill} style={{ width: `${progressPercent}%` }} />
          </div>
        </div>
      )}

      {/* ── Step 0: Welcome ── */}
      {currentStepData.type === 'welcome' && (
        <div className={styles.landingContainer}>
          <div className={styles.brandGroup}>
            {logoUrl ? (
              <img src={logoUrl} alt={hotelName} className={styles.hotelLogo} style={{ maxHeight: '80px', marginBottom: '20px' }} />
            ) : (
              <h1 className={styles.mainLogo}>Revanta</h1>
            )}
            <div className={styles.officeBadge}>
              <span className="material-icons-round">hotel</span>
              <span>{hotelName} &bull; {branchName}</span>
            </div>
          </div>

          <div className={styles.contentGroup}>
            <h2 className={styles.mainTitle}>Share Your Experience</h2>
            <p className={styles.subtitle}>Your feedback helps us serve you better.</p>
            <p className={styles.description}>
              Help us improve our hospitality by sharing your thoughts about your recent stay.
            </p>
          </div>

          <button className={styles.startBtn} onClick={handleNext}>
            Start Review
          </button>

          <div className={styles.estimateTime}>
            <span className="material-icons-outlined">schedule</span>
            <div className={styles.timeBadge}>Takes about 2 minutes</div>
          </div>

          <div className={styles.divider} />

          <div className={styles.footer}>
            <p className={styles.footerNote}>Reference: {refNumber}</p>
          </div>
        </div>
      )}

      {/* ── Step 1: Service Selection ── */}
      {currentStepData.type === 'serviceSelection' && (
        <div className={styles.stepContainer}>
          {step > 1 && (
            <button className={styles.backBtn} onClick={handleBack}>
              <span className="material-icons-round">arrow_back</span>
              <span>Back</span>
            </button>
          )}

          <div className={styles.stepContent}>
            <h2 className={styles.serviceHeading}>Which services did you make use of?</h2>
            <p className={styles.serviceSubtext}>Select all that apply.</p>

            <div className={styles.serviceGrid}>
              {SERVICES.map((s) => {
                const isActive = selectedServices.includes(s.label);
                return (
                  <div
                    key={s.id}
                    className={`${styles.serviceCard} ${isActive ? styles.serviceCardActive : ''}`}
                    onClick={() => {
                      toggleService(s.label);
                      if (showValidationError) setShowValidationError(false);
                    }}
                  >
                    {isActive && (
                      <span className={`material-icons-round ${styles.checkIconSmall}`}>
                        check_circle
                      </span>
                    )}
                    <span className="material-icons-round">{s.icon}</span>
                    <span className={styles.serviceLabel}>{s.label}</span>
                  </div>
                );
              })}
            </div>

            {selectedServices.includes('Other') && (
              <div className={styles.otherInputWrapper}>
                <input
                  type="text"
                  className={styles.otherInput}
                  placeholder="Please specify other services..."
                  value={otherServiceText}
                  onChange={(e) => setOtherServiceText(e.target.value)}
                />
              </div>
            )}

            {showValidationError && (
              <p className={styles.validationText}>Please select at least one option to continue.</p>
            )}
          </div>

          <div className={styles.actionFixed}>
            <button
              className={`${styles.continueBtn} ${selectedServices.length > 0 ? styles.continueBtnActive : ''}`}
              onClick={handleContinue}
            >
              Continue
            </button>
          </div>
        </div>
      )}

      {/* ── Main Rating Questions ── */}
      {currentStepData.type === 'mainQ' && (
        <div className={styles.stepContainer}>
          {step > 1 && (
            <button className={styles.backBtn} onClick={handleBack}>
              <span className="material-icons-round">arrow_back</span>
              <span>Back</span>
            </button>
          )}

          <div className={styles.stepContent}>
            <div className={styles.qIndexBadge}>
              {currentStepData.data.label}
            </div>
            <h2 className={styles.stepHeading}>{currentStepData.data.text}</h2>

            <div className={styles.optionsList}>
              {RATING_OPTIONS.map((opt) => {
                const currentRating = mainRatings[currentStepData.data.id];
                const isActive = currentRating === opt.value;

                return (
                  <button
                    key={opt.value}
                    className={`${styles.ratingOptionCard} ${isActive ? styles.ratingOptionActive : ''}`}
                    data-rating={opt.value}
                    onClick={() => handleMainRating(currentStepData.data.id, opt.value)}
                  >
                    <span className="material-icons-round">{opt.icon}</span>
                    <span className={styles.ratingNumber}>{opt.value}</span>
                    <span className={styles.ratingLabel}>{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className={styles.actionFixed}>
            {(() => {
              const hasSelected = mainRatings[currentStepData.data.id];
              return (
                <button
                  className={`${styles.continueBtn} ${hasSelected ? styles.continueBtnActive : ''}`}
                  onClick={() => { if (hasSelected) handleNext(); }}
                >
                  Continue
                </button>
              );
            })()}
          </div>
        </div>
      )}

      {/* ── Comment Step ── */}
      {currentStepData.type === 'comment' && (
        <div className={styles.stepContainer}>
          {step > 1 && (
            <button className={styles.backBtn} onClick={handleBack}>
              <span className="material-icons-round">arrow_back</span>
              <span>Back</span>
            </button>
          )}

          <div className={styles.stepContent}>
            <h2 className={styles.stepHeading}>Would you like to tell us more?</h2>
            <p className={styles.stepSubtitle}>This field is optional. You can skip if you prefer.</p>

            <div className={styles.textareaWrapper}>
              <textarea
                className={styles.feedbackTextarea}
                placeholder="Share any specific details or suggestions..."
                value={comment}
                onChange={(e) => setComment(e.target.value.slice(0, 600))}
              />
              <div className={styles.inputFooter}>
                <span>{comment.length}/600</span>
              </div>
            </div>
          </div>

          <div className={styles.actionSplit}>
            <button className={styles.skipBtn} onClick={handleNext}>Skip</button>
            <button
              className={`${styles.continueBtn} ${comment.trim() ? styles.continueBtnActive : ''}`}
              onClick={handleNext}
            >
              Continue
            </button>
          </div>
        </div>
      )}

      {/* ── Contact Info Step ── */}
      {currentStepData.type === 'contact' && (
        <div className={styles.stepContainer}>
          {step > 1 && (
            <button className={styles.backBtn} onClick={handleBack}>
              <span className="material-icons-round">arrow_back</span>
              <span>Back</span>
            </button>
          )}

          <div className={styles.stepContent}>
            <h2 className={styles.stepHeading}>Would you like us to follow up?</h2>

            <div
              className={`${styles.toggleCard} ${!isAnonymous ? styles.toggleCardActive : ''}`}
              onClick={() => setIsAnonymous((v) => !v)}
            >
              <div className={`${styles.toggleSwitch} ${!isAnonymous ? styles.toggleSwitchActive : ''}`}>
                <div className={styles.toggleKnob} />
              </div>
              <span className={styles.toggleLabel}>
                {isAnonymous ? 'Stay Anonymous' : 'I am willing to be contacted'}
              </span>
            </div>

            {!isAnonymous && (
              <div className={styles.contactForm}>
                {[
                  { key: 'name',  label: 'Name',  type: 'text' },
                  { key: 'phone', label: 'Phone', type: 'tel' },
                  { key: 'email', label: 'Email', type: 'email' },
                ].map(({ key, label, type }) => (
                  <div key={key} className={styles.inputGroup}>
                    <label className={styles.inputLabel}>{label}</label>
                    <input
                      type={type}
                      className={styles.contactInput}
                      value={contact[key]}
                      onChange={(e) => setContact((prev) => ({ ...prev, [key]: e.target.value }))}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className={styles.actionFixed}>
            <button
              className={`${styles.continueBtn} ${isAnonymous || (contact.name && contact.phone) ? styles.continueBtnActive : ''}`}
              onClick={() => {
                if (isAnonymous || (contact.name && contact.phone)) handleNext();
              }}
            >
              Review Submission
            </button>
          </div>
        </div>
      )}

      {/* ── Summary & Submit ── */}
      {currentStepData.type === 'summary' && (
        <div className={styles.stepContainer}>
          {step > 1 && (
            <button className={styles.backBtn} onClick={handleBack}>
              <span className="material-icons-round">arrow_back</span>
              <span>Back</span>
            </button>
          )}

          <div className={styles.stepContent}>
            <h2 className={styles.stepHeading}>Review your feedback</h2>

            <div className={styles.summaryCard}>
              {/* Services Used */}
              <div className={styles.summarySection}>
                <label>SERVICES USED</label>
                <div className={styles.pillsRow}>
                  {selectedServices.map((s) => (
                    <span key={s} className={styles.pill}>
                      {s === 'Other' && otherServiceText.trim() ? `Other: ${otherServiceText.trim()}` : s}
                    </span>
                  ))}
                </div>
              </div>

              {/* General Ratings */}
              <div className={styles.summarySection}>
                <label>GENERAL RATINGS</label>
                <div className={styles.summaryRatingsList}>
                  {MAIN_QUESTIONS.map((q, idx) => (
                    <div key={q.id} className={styles.summaryRatingRow}>
                      <span className={styles.qNum}>Q{idx + 1}</span>
                      <span className={styles.qLabel}>{q.text}</span>
                      <div className={styles.qScore} data-rating={mainRatings[q.id]}>
                        <span>{mainRatings[q.id]}/5</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Comment */}
              {comment && (
                <div className={styles.summarySection}>
                  <label>COMMENT</label>
                  <p className={styles.summaryValue}>{comment}</p>
                </div>
              )}

              {/* Reference Number */}
              <div className={styles.refBox}>
                <label>YOUR REFERENCE NUMBER</label>
                <div className={styles.refCodeLarge}>{refNumber}</div>
              </div>
            </div>
          </div>

          <div className={styles.actionFixed}>
            <button className={styles.submitBtn} onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? (
                <div className={styles.loaderSmall} />
              ) : (
                <>
                  <span className="material-icons-round">send</span>
                  Submit Feedback
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default ReviewPage;
