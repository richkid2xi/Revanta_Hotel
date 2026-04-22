import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { addReview } from '../../store/reviewsStore';
import styles from './ReviewPage.module.css';

function ReviewPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [visitPurpose, setVisitPurpose] = useState('');
  const [ratings, setRatings] = useState({ q1: 0, q2: 0, q3: 0, q4: 0, q5: 0 });
  const [comment, setComment] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [contact, setContact] = useState({ name: '', phone: '', email: '' });

  const TOTAL_STEPS = 9;

  // Questions definitions (Steps 2-6)
  const QUESTIONS = [
    { id: 'q1', label: 'Overall Satisfaction', text: 'Overall, how satisfied are you with your visit today?' },
    { id: 'q2', label: 'Staff Professionalism', text: 'How would you rate the attitude and professionalism of the staff you interacted with?' },
    { id: 'q3', label: 'Waiting Time', text: 'How long did you wait before you were attended to?' },
    { id: 'q4', label: 'Progress Made', text: 'Were you able to resolve or make progress on the reason you came today?' },
    { id: 'q5', label: 'Office Cleanliness', text: 'How would you rate the cleanliness and general environment of the office?' },
  ];

  const handleNext = () => setStep(s => s + 1);
  const handleBack = () => setStep(s => s - 1);

  const handleSubmit = async () => {
    const now = new Date();
    const day = now.getDate().toString().padStart(2, '0');
    const month = now.toLocaleString('default', { month: 'long' });
    const year = now.getFullYear();
    const hours = now.getHours().toString().padStart(2, '0');
    const mins = now.getMinutes().toString().padStart(2, '0');
    const dayName = now.toLocaleString('default', { weekday: 'long' });

    const reviewData = {
      id: refNumber,
      rawDate: now.getTime(),
      date: `${dayName}, ${day} ${month} ${year} at ${hours}:${mins}`,
      shortDate: `${day} ${month.slice(0, 3)} ${year}, ${hours}:${mins}`,
      rating: Math.round(Object.values(ratings).reduce((a, b) => a + b, 0) / Object.values(ratings).filter(v => v > 0).length),
      status: 'unread',
      isAnonymous,
      purpose: visitPurpose,
      text: comment.trim() || 'No additional comments.',
      author: isAnonymous ? null : { ...contact },
      questions: QUESTIONS.map((q) => ({
        label: q.label,
        text: q.text,
        score: ratings[q.id],
      })),
      notes: '',
      rawResolvedDate: null,
      resolvedDateStr: null,
    };

    addReview(reviewData);
    navigate('/thank-you', { 
      state: { 
        ref: refNumber, 
        name: isAnonymous ? null : contact.name 
      } 
    });
  };

  const handleRatingSelect = (qId, val) => {
    setRatings(prev => ({ ...prev, [qId]: val }));
  };

  const RATING_OPTIONS = [
    { value: 1, label: 'Very Dissatisfied', icon: 'sentiment_very_dissatisfied' },
    { value: 2, label: 'Dissatisfied',      icon: 'sentiment_dissatisfied' },
    { value: 3, label: 'Neutral',           icon: 'sentiment_neutral' },
    { value: 4, label: 'Satisfied',         icon: 'sentiment_satisfied' },
    { value: 5, label: 'Very Satisfied',    icon: 'sentiment_very_satisfied' },
  ];

  // Suggestions for chips
  const SUGGESTIONS = [
    "Collect birth certificate",
    "Business permit renewal",
    "Meet with official",
    "Ask about land documents",
    "File a complaint"
  ];

  // Generate a random ref for the footer
  const [refNumber] = useState(() => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const rand = (len) => Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    return `REF-2026-${rand(4)}-${rand(4)}`;
  });

  const progressPercent = Math.round((step / TOTAL_STEPS) * 100);

  return (
    <div className={styles.page}>
      {/* ─── Top Progress Bar (Steps 1+) ─── */}
      {step > 0 && (
        <div className={styles.topProgressWrap}>
          <div className={styles.topProgressText}>
            <span>
              {step === 1 && 'Visit Purpose'}
              {step >= 2 && step <= 6 && `Question ${step - 1} of 5`}
              {step === 7 && 'Written Feedback'}
              {step === 8 && 'Contact Info'}
              {step === 9 && 'Review & Submit'}
            </span>
            <span>{progressPercent}%</span>
          </div>
          <div className={styles.progressTrack}>
            <div 
              className={styles.progressFill} 
              style={{ width: `${progressPercent}%` }} 
            />
          </div>
        </div>
      )}

      {/* ─── Landing Page (Step 0) ─── */}
      {step === 0 && (
        <div className={styles.landingContainer}>
          <div className={styles.brandGroup}>
            <h1 className={styles.mainLogo}>Revanta</h1>
            <div className={styles.officeBadge}>
              <span className="material-icons-round">home_work</span>
              <span>REGIONAL MINISTER'S OFFICE</span>
            </div>
          </div>

          <div className={styles.contentGroup}>
            <h2 className={styles.mainTitle}>Share Your Experience</h2>
            <p className={styles.subtitle}>Your feedback helps us serve you better.</p>
            <p className={styles.description}>
              This is completely anonymous unless you choose to share your contact details.
            </p>
          </div>

          <button className={styles.startBtn} onClick={handleNext}>
            Start Feedback
          </button>

          <div className={styles.estimateTime}>
            <span className="material-icons-outlined">schedule</span>
            <span>Estimated time: Less than 2 minutes</span>
          </div>

          <div className={styles.landingDivider} />

          <div className={styles.footer}>
            <p className={styles.footerNote}>Reference number generated automatically for your record.</p>
            <p className={styles.refCode}>{refNumber}</p>
          </div>
        </div>
      )}

      {/* ─── Step 1: Visit Purpose ─── */}
      {step === 1 && (
        <div className={styles.stepContainer}>
          <button className={styles.backBtn} onClick={handleBack}>
            <span className="material-icons-round">arrow_back</span>
            <span>Back</span>
          </button>

          <div className={styles.stepContent}>
            <h2 className={styles.stepHeading}>Why did you visit the office today?</h2>
            <p className={styles.stepSubtitle}>Describe your visit in a few words — keep it brief.</p>
            <p className={styles.stepHint}>e.g. "Collect birth certificate" or "Ask about permit"</p>

            <div className={styles.inputWrapper}>
              <input 
                type="text"
                className={styles.purposeInput}
                placeholder="Short reason for your visit..."
                value={visitPurpose}
                onChange={(e) => setVisitPurpose(e.target.value.slice(0, 80))}
                autoFocus
              />
              <div className={styles.inputFooter}>
                <span>Keep it short — a few words is perfect.</span>
                <span>{visitPurpose.length}/80</span>
              </div>
            </div>

            <div className={styles.chipsContainer}>
              {SUGGESTIONS.map((text) => (
                <button 
                  key={text} 
                  className={styles.suggestionChip}
                  onClick={() => setVisitPurpose(text)}
                >
                  {text}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.actionFixed}>
            <button 
              className={styles.continueBtn} 
              disabled={!visitPurpose.trim()}
              onClick={handleNext}
            >
              Continue
            </button>
          </div>
        </div>
      )}

      {/* ─── Step 2-6: Rating Questions ─── */}
      {step >= 2 && step <= 6 && (
        <div className={styles.stepContainer}>
          <button className={styles.backBtn} onClick={handleBack}>
            <span className="material-icons-round">arrow_back</span>
            <span>Back</span>
          </button>

          <div className={styles.stepContent}>
            <div className={styles.qIndexBadge}>Q{step - 1}</div>
            <h2 className={styles.stepHeading}>
              {QUESTIONS[step - 2]?.text || "Question text awaiting..."}
            </h2>

            <div className={styles.optionsList}>
              {RATING_OPTIONS.map((opt) => {
                const isActive = ratings[`q${step - 1}`] === opt.value;
                return (
                  <button 
                    key={opt.value}
                    className={`${styles.ratingOptionCard} ${isActive ? styles.ratingOptionActive : ''}`}
                    data-rating={opt.value}
                    onClick={() => handleRatingSelect(`q${step - 1}`, opt.value)}
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
            <button 
              className={styles.continueBtn} 
              disabled={!ratings[`q${step - 1}`]}
              onClick={handleNext}
            >
              Continue
            </button>
          </div>
        </div>
      )}
      {/* ─── Step 7: Written Feedback ─── */}
      {step === 7 && (
        <div className={styles.stepContainer}>
          <button className={styles.backBtn} onClick={handleBack}>
            <span className="material-icons-round">arrow_back</span>
            <span>Back</span>
          </button>

          <div className={styles.stepContent}>
            <h2 className={styles.stepHeading}>Would you like to tell us more?</h2>
            <p className={styles.stepSubtitle}>This field is optional. You can skip if you prefer.</p>

            <div className={styles.textareaWrapper}>
              <textarea 
                className={styles.feedbackTextarea}
                placeholder="You can describe your experience, mention something that went well, or suggest how we can improve."
                value={comment}
                onChange={(e) => setComment(e.target.value.slice(0, 600))}
              />
              <div className={styles.inputFooter}>
                <span>Optional</span>
                <span>{comment.length}/600</span>
              </div>
            </div>

            <div className={styles.infoBox}>
              <span className="material-icons-outlined">info</span>
              <p>Your written feedback helps us identify specific areas for improvement and recognize staff who serve you well.</p>
            </div>
          </div>

          <div className={styles.actionSplit}>
            <button className={styles.skipBtn} onClick={handleNext}>
              Skip
            </button>
            <button 
              className={styles.continueBtn} 
              style={{ backgroundColor: '#2E7D32', color: '#fff', cursor: 'pointer' }}
              onClick={handleNext}
            >
              Continue
            </button>
          </div>
        </div>
      )}
      {/* ─── Step 8: Contact Info ─── */}
      {step === 8 && (
        <div className={styles.stepContainer}>
          <button className={styles.backBtn} onClick={handleBack}>
            <span className="material-icons-round">arrow_back</span>
            <span>Back</span>
          </button>

          <div className={styles.stepContent}>
            <h2 className={styles.stepHeading}>Would you like us to follow up with you?</h2>
            <p className={styles.stepSubtitle}>Your feedback is anonymous by default.</p>

            <div className={`${styles.toggleCard} ${!isAnonymous ? styles.toggleCardActive : ''}`} onClick={() => setIsAnonymous(!isAnonymous)}>
              <div className={`${styles.toggleSwitch} ${!isAnonymous ? styles.toggleSwitchActive : ''}`}>
                <div className={styles.toggleKnob} />
              </div>
              <span className={styles.toggleLabel}>
                {isAnonymous ? 'Anonymous — your identity will not be recorded' : 'I am willing to be contacted'}
              </span>
            </div>

            {!isAnonymous && (
              <div className={styles.contactForm}>
                <div className={styles.inputGroup}>
                  <label className={styles.inputLabel}>Full name</label>
                  <input 
                    type="text" 
                    className={styles.contactInput}
                    placeholder="Enter your full name"
                    value={contact.name}
                    onChange={(e) => setContact({...contact, name: e.target.value})}
                  />
                </div>
                <div className={styles.inputGroup}>
                  <label className={styles.inputLabel}>Phone number</label>
                  <input 
                    type="tel" 
                    className={styles.contactInput}
                    placeholder="e.g. 0244 000 000"
                    value={contact.phone}
                    onChange={(e) => setContact({...contact, phone: e.target.value})}
                  />
                </div>
                <div className={styles.inputGroup}>
                  <label className={styles.inputLabel}>Email</label>
                  <input 
                    type="email" 
                    className={styles.contactInput}
                    placeholder="your@email.com"
                    value={contact.email}
                    onChange={(e) => setContact({...contact, email: e.target.value})}
                  />
                </div>
              </div>
            )}

            <div className={styles.infoBox} style={{ backgroundColor: 'rgba(76, 175, 80, 0.03)' }}>
              <span className="material-icons-outlined" style={{ color: '#4CAF50' }}>lock</span>
              <p>Your contact details will only be used if we need to follow up on your feedback. They will not be shared with anyone else.</p>
            </div>
          </div>

          <div className={styles.actionFixed}>
            <button 
              className={styles.continueBtn} 
              disabled={!isAnonymous && (!contact.name || !contact.phone || !contact.email)}
              onClick={handleNext}
            >
              Continue
            </button>
          </div>
        </div>
      )}
      {/* ─── Step 9: Review & Submit ─── */}
      {step === 9 && (
        <div className={styles.stepContainer}>
          <button className={styles.backBtn} onClick={handleBack}>
            <span className="material-icons-round">arrow_back</span>
            <span>Back</span>
          </button>

          <div className={styles.stepContent}>
            <h2 className={styles.stepHeading}>Review your feedback</h2>
            <p className={styles.stepSubtitle}>Please confirm everything is correct before submitting.</p>

            <div className={styles.summaryCard}>
              <div className={styles.summarySection}>
                <div className={styles.summaryHeader}>
                  <label>VISIT PURPOSE</label>
                  <button className={styles.editBtn} onClick={() => setStep(1)}>
                    <span className="material-icons-round">edit</span>
                    Edit
                  </button>
                </div>
                <p className={styles.summaryValue}>{visitPurpose}</p>
              </div>

              <div className={styles.summarySection}>
                <div className={styles.summaryHeader}>
                  <label>YOUR RATINGS</label>
                  <button className={styles.editBtn} onClick={() => setStep(2)}>
                    <span className="material-icons-round">edit</span>
                    Edit
                  </button>
                </div>
                <div className={styles.summaryRatingsList}>
                  {QUESTIONS.map((q, idx) => {
                    const score = ratings[q.id];
                    const opt = RATING_OPTIONS.find(o => o.value === score);
                    return (
                      <div key={q.id} className={styles.summaryRatingRow}>
                        <span className={styles.qNum}>Q{idx + 1}</span>
                        <span className={styles.qLabel}>{q.text}</span>
                        <div className={styles.qScore} data-rating={score}>
                          <span className="material-icons-round">{opt?.icon}</span>
                          <span>{score}/5</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className={styles.summarySection}>
                <div className={styles.summaryHeader}>
                  <label>COMMENT</label>
                  <button className={styles.editBtn} onClick={() => setStep(7)}>
                    <span className="material-icons-round">edit</span>
                    Edit
                  </button>
                </div>
                <p className={styles.summaryValue} style={{ fontStyle: comment ? 'normal' : 'italic', color: comment ? '#fff' : 'var(--color-text-muted)' }}>
                  {comment || 'No written comment provided'}
                </p>
              </div>

              <div className={styles.summarySection}>
                <div className={styles.summaryHeader}>
                  <label>FOLLOW-UP</label>
                  <button className={styles.editBtn} onClick={() => setStep(8)}>
                    <span className="material-icons-round">edit</span>
                    Edit
                  </button>
                </div>
                {isAnonymous ? (
                  <div className={styles.summaryValue}>
                    <span className="material-icons-round" style={{ fontSize: 16, verticalAlign: 'middle', marginRight: 8, opacity: 0.5 }}>visibility_off</span>
                    Anonymous submission
                  </div>
                ) : (
                  <div className={styles.summaryContact}>
                    <div><span className="material-icons-round">person</span> {contact.name}</div>
                    <div><span className="material-icons-round">call</span> {contact.phone}</div>
                    <div><span className="material-icons-round">mail</span> {contact.email}</div>
                  </div>
                )}
              </div>

              <div className={styles.refBox}>
                <label>YOUR REFERENCE NUMBER</label>
                <div className={styles.refCodeLarge}>{refNumber}</div>
                <p>Screenshot this for your records</p>
              </div>

              <div className={styles.infoBox} style={{ marginTop: 24, backgroundColor: 'rgba(255,255,255,0.02)' }}>
                <span className="material-icons-outlined">info</span>
                <p>Once submitted, your feedback goes directly to the Regional Minister's office for review and action.</p>
              </div>
            </div>
          </div>

          <div className={styles.actionFixed}>
            <button 
              className={styles.submitBtn} 
              onClick={handleSubmit}
            >
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
