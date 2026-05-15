import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { registerHotel } from '../api';
import './SignUp.css';

const steps = [
  { id: 1, label: 'Business Info' },
  { id: 2, label: 'Plan' },
  { id: 3, label: 'Account' },
  { id: 4, label: 'Payment' },
];

const ghanaRegions = {
  "Ahafo": ["Goaso", "Hwidiem", "Kenyasi", "Kukuom"],
  "Ashanti": ["Kumasi", "Obuasi", "Mampong", "Ejisu", "Konongo"],
  "Bono": ["Sunyani", "Berekum", "Dormaa Ahenkro", "Wenchi"],
  "Bono East": ["Techiman", "Kintampo", "Nkoranza", "Atebubu"],
  "Central": ["Cape Coast", "Winneba", "Kasoa", "Elmina", "Saltpond"],
  "Eastern": ["Koforidua", "Nsawam", "Nkawkaw", "Suhum", "Akropong"],
  "Greater Accra": ["Accra", "Tema", "Madina", "Ashaiman", "Teshie", "Osu", "Dodowa"],
  "North East": ["Nalerigu", "Walewale", "Bunkpurugu", "Chereponi"],
  "Northern": ["Tamale", "Yendi", "Savelugu", "Bimbilla"],
  "Oti": ["Dambai", "Jasikan", "Kadjebi", "Kete Krachi"],
  "Savannah": ["Damongo", "Salaga", "Bole", "Sawla"],
  "Upper East": ["Bolgatanga", "Navrongo", "Bawku", "Paga"],
  "Upper West": ["Wa", "Lawra", "Tumu", "Jirapa"],
  "Volta": ["Ho", "Keta", "Hohoe", "Aflao", "Kpandu"],
  "Western": ["Sekondi-Takoradi", "Tarkwa", "Axim", "Elubo"],
  "Western North": ["Sefwi Wiawso", "Bibiani", "Enchi", "Juabeso"]
};

export default function SignUp() {
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Form State
  const [businessName, setBusinessName] = useState('');
  const [businessType, setBusinessType] = useState('hotel');
  const [selectedRegion, setSelectedRegion] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedPlan, setSelectedPlan] = useState('premium');
  
  const [fullName, setFullName] = useState('');
  const [jobTitle, setJobTitle] = useState('owner');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [showPassword, setShowPassword] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('momo');

  const handleNext = (e) => {
    e.preventDefault();
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    } else {
      handleFinalSubmit();
    }
  };

  const handleFinalSubmit = async () => {
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const registrationData = {
        hotelName: businessName,
        type: businessType,
        region: selectedRegion,
        city: selectedCity,
        website: '', // Optional for now
        logoUrl: '', // Optional for now
        ownerName: fullName,
        ownerEmail: email,
        ownerPhone: phone,
        jobTitle: jobTitle,
        plan: selectedPlan,
        password: password,
        branchCount: 1, // Default for signup
        branches: [{ name: 'Main Branch', location: selectedCity }],
      };

      const result = await registerHotel(registrationData);
      
      if (result.authorization_url) {
        // Redirect to Paystack
        window.location.href = result.authorization_url;
      } else {
        // Fallback or legacy flow
        setCurrentStep(5);
      }
    } catch (err) {
      setError(err.response?.data?.error || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Success screen
  if (currentStep === 5) {
    const trialEndDate = new Date();
    trialEndDate.setDate(trialEndDate.getDate() + 14);
    const formattedDate = trialEndDate.toISOString().split('T')[0];

    return (
      <div className="success-container" style={{ position: 'relative' }}>
        <button type="button" className="auth-theme-toggle" onClick={toggleTheme}>
          <span className="material-icons-round">{theme === 'dark' ? 'light_mode' : 'dark_mode'}</span>
        </button>
        <div className="success-icon-wrapper">
          <span className="material-icons-round">domain</span>
        </div>
        <h1 className="success-title">Welcome to Revanta!</h1>
        <p className="success-subtitle">Your account is set up and ready to collect feedback.</p>

        <div className="success-summary-card">
          <div className="success-row">
            <span className="success-label">Business</span>
            <span className="success-value">{businessName || 'Your Business'}</span>
          </div>
          <div className="success-row">
            <span className="success-label">Plan</span>
            <span className="success-value text-teal" style={{ textTransform: 'capitalize' }}>{selectedPlan}</span>
          </div>
          <div className="success-row">
            <span className="success-label">Trial ends</span>
            <span className="success-value text-orange">{formattedDate}</span>
          </div>
        </div>

        <Link to="/admin/overview" className="btn-primary go-dashboard-btn" style={{ display: 'block', textAlign: 'center', textDecoration: 'none' }}>
          Go to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', position: 'relative' }}>
      <button type="button" className="auth-theme-toggle" onClick={toggleTheme}>
        <span className="material-icons-round">{theme === 'dark' ? 'light_mode' : 'dark_mode'}</span>
      </button>
      <div className="signup-container">
        <div className="stepper-container">
          <div className="stepper-steps">
            {steps.map((step) => (
              <div key={step.id} className={`step ${currentStep >= step.id ? 'active' : ''}`}>
                <div className="step-circle">{step.id}</div>
                <div className="step-label">{step.label}</div>
              </div>
            ))}
          </div>
          <div className="stepper-progress-bar">
            <div
              className="stepper-progress-fill"
              style={{ width: `${(currentStep / steps.length) * 100}%` }}
            ></div>
          </div>
        </div>

        <div className="auth-card signup-card">

          {/* ── Step 1: Business Info ── */}
          {currentStep === 1 && (
            <>
              <div className="auth-header-left">
                <h2>Business Information</h2>
              </div>
              <form onSubmit={handleNext} className="auth-form">
                <div className="form-group">
                  <label htmlFor="businessName">BUSINESS / OFFICE NAME</label>
                  <input
                    type="text"
                    id="businessName"
                    placeholder="e.g. Grand Accra Hotel"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="businessType">BUSINESS TYPE</label>
                  <div className="select-wrapper">
                    <select 
                      id="businessType" 
                      value={businessType} 
                      onChange={(e) => setBusinessType(e.target.value)}
                    >
                      <option value="hotel">Hotel / Lodge</option>
                      <option value="restaurant">Restaurant / Café</option>
                      <option value="government">Government Office</option>
                      <option value="retail">Retail / Shop</option>
                      <option value="other">Other</option>
                    </select>
                    <span className="material-icons-round select-icon">expand_more</span>
                  </div>
                </div>

                <div className="form-row-3">
                  <div className="form-group">
                    <label htmlFor="country">COUNTRY</label>
                    <input
                      type="text"
                      id="country"
                      value="Ghana"
                      readOnly
                      className="readonly-input"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="region">REGION</label>
                    <div className="select-wrapper">
                      <select
                        id="region"
                        value={selectedRegion}
                        onChange={(e) => {
                          setSelectedRegion(e.target.value);
                          setSelectedCity('');
                        }}
                      >
                        <option value="" disabled hidden>Select Region</option>
                        {Object.keys(ghanaRegions).map((region) => (
                          <option key={region} value={region}>{region}</option>
                        ))}
                      </select>
                      <span className="material-icons-round select-icon">expand_more</span>
                    </div>
                  </div>
                  <div className="form-group">
                    <label htmlFor="city">CITY</label>
                    <div className="select-wrapper">
                      <select
                        id="city"
                        value={selectedCity}
                        onChange={(e) => setSelectedCity(e.target.value)}
                        disabled={!selectedRegion}
                      >
                        <option value="" disabled hidden>
                          {selectedRegion ? 'Select City' : 'Select Region first'}
                        </option>
                        {selectedRegion && ghanaRegions[selectedRegion].map((city) => (
                          <option key={city} value={city}>{city}</option>
                        ))}
                      </select>
                      <span className="material-icons-round select-icon">expand_more</span>
                    </div>
                  </div>
                </div>

                <div className="form-group">
                  <label>LOGO (OPTIONAL)</label>
                  <div className="file-upload-box">
                    <input type="file" id="logo" accept="image/png, image/jpeg" hidden />
                    <label htmlFor="logo" className="upload-label">
                      <span className="material-icons-round">image</span>
                      <span>Click to upload PNG or JPG</span>
                    </label>
                  </div>
                </div>

                <div className="form-actions-row">
                  <Link to="/signin" className="text-link back-link">
                    &larr; Sign In
                  </Link>
                  <button type="submit" className="btn-primary next-btn">
                    Continue &rarr;
                  </button>
                </div>
              </form>
            </>
          )}

          {/* ── Step 2: Plan ── */}
          {currentStep === 2 && (
            <>
              <div className="auth-header-left">
                <h2>Choose Your Plan</h2>
              </div>

              <form onSubmit={handleNext} className="auth-form">
                <div className="plans-container">
                  <div
                    className={`plan-card ${selectedPlan === 'starter' ? 'active' : ''}`}
                    onClick={() => setSelectedPlan('starter')}
                  >
                    <h3 className="plan-name">Starter</h3>
                    <div className="plan-price">
                      <span className="price-amount">GH¢200</span>
                      <span className="price-period">/month</span>
                    </div>
                    <ul className="plan-features">
                      <li><span className="material-icons-round check-icon">check</span> Up to 500 reviews/month</li>
                      <li><span className="material-icons-round check-icon">check</span> Basic analytics</li>
                      <li><span className="material-icons-round check-icon">check</span> QR code generation</li>
                      <li><span className="material-icons-round check-icon">check</span> Email reports</li>
                      <li><span className="material-icons-round check-icon">check</span> CSV export</li>
                    </ul>
                  </div>

                  <div
                    className={`plan-card ${selectedPlan === 'premium' ? 'active' : ''}`}
                    onClick={() => setSelectedPlan('premium')}
                  >
                    <div className="popular-badge">Most Popular</div>
                    <h3 className="plan-name">Premium</h3>
                    <div className="plan-price">
                      <span className="price-amount">GH¢450</span>
                      <span className="price-period">/month</span>
                    </div>
                    <ul className="plan-features">
                      <li><span className="material-icons-round check-icon">check</span> Unlimited reviews</li>
                      <li><span className="material-icons-round check-icon">check</span> Advanced analytics</li>
                      <li><span className="material-icons-round check-icon">check</span> QR code generation</li>
                      <li><span className="material-icons-round check-icon">check</span> Real-time alerts</li>
                      <li><span className="material-icons-round check-icon">check</span> Staff mentions</li>
                      <li><span className="material-icons-round check-icon">check</span> Priority support</li>
                      <li><span className="material-icons-round check-icon">check</span> Custom branding</li>
                      <li><span className="material-icons-round check-icon">check</span> API access</li>
                    </ul>
                  </div>
                </div>

                <div className="form-actions-row">
                  <button type="button" onClick={handlePrev} className="text-link back-link" style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontSize: '14px', fontFamily: 'inherit' }}>
                    &larr; Back
                  </button>
                  <button type="submit" className="btn-primary next-btn">
                    Continue &rarr;
                  </button>
                </div>
              </form>
            </>
          )}

          {/* ── Step 3: Account ── */}
          {currentStep === 3 && (
            <>
              <div className="auth-header-left">
                <h2>Your Account</h2>
              </div>

              <form onSubmit={handleNext} className="auth-form">
                <div className="form-group">
                  <label htmlFor="fullName">FULL NAME</label>
                  <input 
                    type="text" 
                    id="fullName" 
                    placeholder="Kwame Asante" 
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                  />
                </div>

                <div className="form-row-2">
                  <div className="form-group">
                    <label htmlFor="jobTitle">JOB TITLE</label>
                    <div className="select-wrapper">
                      <select 
                        id="jobTitle" 
                        value={jobTitle}
                        onChange={(e) => setJobTitle(e.target.value)}
                      >
                        <option value="owner">Owner / Proprietor</option>
                        <option value="gm">General Manager</option>
                        <option value="front_desk">Front Desk Manager</option>
                        <option value="admin">Administrator</option>
                        <option value="it">IT Administrator</option>
                      </select>
                      <span className="material-icons-round select-icon">expand_more</span>
                    </div>
                  </div>
                  <div className="form-group">
                    <label htmlFor="phone">PHONE</label>
                    <input 
                      type="text" 
                      id="phone" 
                      placeholder="+233 XX XXX XXXX" 
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="accountEmail">EMAIL</label>
                  <input 
                    type="email" 
                    id="accountEmail" 
                    placeholder="you@business.com" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="form-row-2">
                  <div className="form-group">
                    <label htmlFor="accountPassword">PASSWORD</label>
                    <div className="input-with-icon">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        id="accountPassword"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                      <button
                        type="button"
                        className="icon-btn"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        <span className="material-icons-round">
                          {showPassword ? 'visibility_off' : 'visibility'}
                        </span>
                      </button>
                    </div>
                  </div>
                  <div className="form-group">
                    <label htmlFor="confirmPassword">CONFIRM PASSWORD</label>
                    <input 
                      type="password" 
                      id="confirmPassword" 
                      placeholder="••••••••" 
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="form-actions" style={{ marginTop: '12px', marginBottom: '8px', justifyContent: 'flex-start' }}>
                  <label className="checkbox-container">
                    <input type="checkbox" />
                    <span className="checkmark"></span>
                    <span style={{ fontSize: '14px', color: 'var(--text-muted)', userSelect: 'none' }}>
                      I agree to the <Link to="/terms" className="text-link">Terms of Service</Link> and <Link to="/privacy" className="text-link">Privacy Policy</Link>
                    </span>
                  </label>
                </div>

                <div className="form-actions-row">
                  <button type="button" onClick={handlePrev} className="text-link back-link" style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontSize: '14px', fontFamily: 'inherit' }}>
                    &larr; Back
                  </button>
                  <button type="submit" className="btn-primary next-btn">
                    Continue &rarr;
                  </button>
                </div>
              </form>
            </>
          )}

          {/* ── Step 4: Payment ── */}
          {currentStep === 4 && (
            <>
              <div className="auth-header-left">
                <h2>Payment</h2>
              </div>

              <form onSubmit={handleNext} className="auth-form">
                <div className="payment-summary-box">
                  <div className="summary-row">
                    <span className="summary-label">Plan</span>
                    <span className="summary-value" style={{ fontWeight: 600 }}>{selectedPlan === 'premium' ? 'Premium' : 'Starter'}</span>
                  </div>
                  <div className="summary-divider"></div>
                  <div className="summary-row total-row">
                    <span className="summary-label">Total / month</span>
                    <span className="summary-total-price">GH¢{selectedPlan === 'starter' ? '200' : '450'}</span>
                  </div>
                </div>

                <div className="form-group">
                  <label>PAYMENT METHOD</label>
                  <div className="payment-methods">
                    <div
                      className={`payment-method-btn ${paymentMethod === 'momo' ? 'active' : ''}`}
                      onClick={() => setPaymentMethod('momo')}
                    >
                      MoMo
                    </div>
                    <div
                      className={`payment-method-btn ${paymentMethod === 'telecel' ? 'active' : ''}`}
                      onClick={() => setPaymentMethod('telecel')}
                    >
                      Telecel Cash
                    </div>
                  </div>
                </div>

                {error && <div className="auth-error-msg" style={{ color: '#EF4444', fontSize: '14px', marginBottom: '12px', textAlign: 'center' }}>{error}</div>}

                <button 
                  type="submit" 
                  className="btn-primary pay-btn" 
                  disabled={loading}
                  style={{ width: '100%', marginTop: '8px', padding: '14px', fontSize: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                >
                  {loading ? (
                    <>
                      <div className="spinner-small" /> Processing...
                    </>
                  ) : (
                    `Pay & Activate — GH¢${selectedPlan === 'starter' ? '200' : '450'}/mo`
                  )}
                </button>

                <div className="form-actions-row" style={{ marginTop: '24px' }}>
                  <button type="button" onClick={handlePrev} className="text-link back-link" style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontSize: '14px', fontFamily: 'inherit' }}>
                    &larr; Back
                  </button>
                </div>
              </form>
            </>
          )}

        </div>
      </div>
    </div>
  );
}
