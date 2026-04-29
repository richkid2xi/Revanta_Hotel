import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { addReview, getHotelSettings } from '../../store/reviewsStore';
import styles from './ReviewPage.module.css';

// ─── Constants ────────────────────────────────────────────────────────────────

const ALL_SERVICES = [
  { id: 'roomStay',    label: 'Room Stay',                  icon: 'hotel' },
  { id: 'conference',  label: 'Conference or Meeting Room', icon: 'meeting_room' },
  { id: 'poolOrGym',   label: 'Pool or Gym',                icon: 'pool' },
  { id: 'spa',         label: 'Spa or Wellness',            icon: 'spa' },
  { id: 'events',      label: 'Events or Banquet',          icon: 'celebration' },
  { id: 'other',       label: 'Other',                      icon: 'more_horiz' },
];

const MAIN_QUESTIONS = [
  { id: 'q1', label: 'OVERALL SATISFACTION',          text: 'Overall, how satisfied are you with your experience?' },
  { id: 'q2', label: 'STAFF ATTITUDE & PROFESSIONALISM', text: 'How would you rate the attitude and professionalism of our staff?' },
  { id: 'q3', label: 'CLEANLINESS',                   text: 'How would you rate the cleanliness of our facilities?' },
  { id: 'q4', label: 'VALUE FOR MONEY',                text: 'How would you rate the value for money?' },
  { id: 'q5', label: 'OVERALL EXPERIENCE',            text: 'How smooth was your overall experience with us?' },
];

const RATING_OPTIONS = [
  { value: 1, label: 'Very Dissatisfied', icon: 'sentiment_very_dissatisfied' },
  { value: 2, label: 'Dissatisfied',      icon: 'sentiment_dissatisfied' },
  { value: 3, label: 'Neutral',           icon: 'sentiment_neutral' },
  { value: 4, label: 'Satisfied',         icon: 'sentiment_satisfied' },
  { value: 5, label: 'Very Satisfied',    icon: 'sentiment_very_satisfied' },
];

function generateRefNumber() {
  const digits = '0123456789';
  const rand = (len) =>
    Array.from({ length: len }, () => digits[Math.floor(Math.random() * digits.length)]).join('');
  return `STY-2026-${rand(5)}`;
}

// ─── Component ────────────────────────────────────────────────────────────────

function ReviewPage() {
  const navigate = useNavigate();
  const settings = useMemo(() => getHotelSettings(), []);

  // Active services (filtered by hotel settings)
  const SERVICES = useMemo(() => {
    return ALL_SERVICES.filter((s) => settings.services[s.id]);
  }, [settings]);

  // Form state
  const [step, setStep] = useState(0);
  const [selectedServices, setSelectedServices] = useState([]);
  const [mainRatings, setMainRatings] = useState({});
  const [comment, setComment] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [contact, setContact] = useState({ name: '', phone: '', email: '' });
  const [showValidationError, setShowValidationError] = useState(false);

  const [refNumber] = useState(generateRefNumber);

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
  const handleSubmit = () => {
    const now = new Date();
    const pad = (n) => String(n).padStart(2, '0');

    const reviewData = {
      id:              refNumber,
      rawDate:         now.getTime(),
      date:            `${now.toLocaleString('default', { weekday: 'long' })}, ${pad(now.getDate())} ${now.toLocaleString('default', { month: 'long' })} ${now.getFullYear()} at ${pad(now.getHours())}:${pad(now.getMinutes())}`,
      shortDate:       `${pad(now.getDate())} ${now.toLocaleString('default', { month: 'short' })} ${now.getFullYear()}, ${pad(now.getHours())}:${pad(now.getMinutes())}`,
      rating:          mainRatings['q1'] || 0,
      status:          'unread',
      isAnonymous,
      servicesSelected: selectedServices,
      text:            comment.trim() || 'No additional comments.',
      author:          isAnonymous ? null : { ...contact },
      questions:       MAIN_QUESTIONS.map((q) => ({ label: q.label, text: q.text, score: mainRatings[q.id] })),
      notes:           '',
      rawResolvedDate: null,
      resolvedDateStr: null,
    };

    addReview(reviewData);
    navigate('/thank-you', { state: { ref: refNumber, name: isAnonymous ? null : contact.name } });
  };

  // ─── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className={styles.page}>

      {/* ── Top Progress Bar ── */}
      {step > 0 && step <= TOTAL_STEPS && (
        <div className={styles.topProgressWrap}>
          <div className={styles.topProgressText}>
            <span>
              {currentStepData.type === 'serviceSelection' && 'Experience'}
              {currentStepData.type === 'mainQ'            && `General Survey ${currentStepData.index}/5`}
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
            <h1 className={styles.mainLogo}>Revanta</h1>
            <div className={styles.officeBadge}>
              <span className="material-icons-round">hotel</span>
              <span>{settings.name}</span>
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
                    <span key={s} className={styles.pill}>{s}</span>
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
            <button className={styles.submitBtn} onClick={handleSubmit}>
              <span className="material-icons-round">send</span>
              Submit Feedback
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default ReviewPage;
