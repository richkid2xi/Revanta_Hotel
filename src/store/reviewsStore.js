export const generateMockReviews = () => {
  const reviews = [];
  
  // Weights for statuses
  const statuses = [
    ...Array(15).fill('unread'),
    ...Array(30).fill('read'),
    ...Array(105).fill('resolved')
  ];

  const comments = [
    "The room was spotless and the breakfast buffet was amazing.",
    "Great stay! The staff at the front desk were very welcoming.",
    "The pool area was a bit crowded, but the spa services made up for it.",
    "Exceptional service. Will definitely be returning for my next business trip.",
    "The WiFi in my room was a bit spotty, but the business center was helpful.",
    "Loved the ocean view from my suite. Simply breathtaking!",
    "The gym facilities are top-notch. Very impressed with the equipment.",
    "Room service was quick and the staff was very polite.",
    "A bit noisy near the elevators, but the bed was extremely comfortable.",
    "Perfect location for the conference. Highly recommend this hotel.",
    "Fast check-in and friendly bellboy.",
    "The restaurant menu could use more vegan options.",
    "I appreciated the late check-out option.",
    "Housekeeping was very respectful of our privacy.",
    "The valet service was quick and efficient."
  ];

  const authors = [
    null,
    { name: "Kwame Asante", email: "kwame.asante@gmail.com", phone: "+233 24 456 7890" },
    { name: "Osei Kwabena", email: "okwabena@gmail.com", phone: "+233 55 123 4567" },
    null,
    { name: "Abena Mensah", email: "abena.m@yahoo.com", phone: "+233 20 987 6543" },
    { name: "Kofi Boateng", email: "kofi.b@hotmail.com", phone: "+233 24 111 2222" },
    null,
    { name: "Akua Danso", email: "akua.d@gmail.com", phone: "+233 50 333 4444" },
    { name: "Ama Serwaa", email: "ama.s@yahoo.com", phone: "+233 24 999 8888" },
    null
  ];

  const baseDate = new Date('2026-04-25T12:00:00Z');

  for (let i = 0; i < 150; i++) {
    // distribute over the last 30 days
    const rawDate = new Date(baseDate.getTime() - i * 3600000 * 4.5 - Math.random() * 86400000);

    const day = rawDate.getDate().toString().padStart(2, '0');
    const month = rawDate.toLocaleString('default', { month: 'long' });
    const year = rawDate.getFullYear();
    const hours = rawDate.getHours().toString().padStart(2, '0');
    const minutes = rawDate.getMinutes().toString().padStart(2, '0');
    const dayName = rawDate.toLocaleString('default', { weekday: 'long' });
    const dateStr = `${dayName}, ${day} ${month} ${year} at ${hours}:${minutes}`;
    const shortDateStr = `${day} ${month.slice(0, 3)} ${year}, ${hours}:${minutes}`;

    const isAnon = i % 3 === 0;
    const rating = Math.floor(Math.random() * 5) + 1;

    // resolved Date
    let resolvedDateStr = null;
    let rawResolvedDate = null;
    const status = i < statuses.length ? statuses[i] : 'resolved';
    
    if (status === 'resolved') {
      const rDate = new Date(rawDate.getTime() + Math.random() * 86400000 * 2); // 0-2 days later
      rawResolvedDate = rDate.getTime();
      const rDay = rDate.getDate().toString().padStart(2, '0');
      const rMonth = rDate.toLocaleString('default', { month: 'short' });
      resolvedDateStr = `${rDay} ${rMonth} ${rDate.getFullYear()}`;
    }

    reviews.push({
      hotelId: 'H001',
      branchId: i % 2 === 0 ? 'b1' : 'b2',
      id: `STY-2026-${(150 - i).toString().padStart(3, '0')}`,
      rawDate: rawDate.getTime(),
      date: dateStr,
      shortDate: shortDateStr,
      rating: rating,
      status: status,
      isAnonymous: isAnon,
      text: comments[i % comments.length],
      author: isAnon ? null : authors[i % authors.length],
      questions: [
        { label: 'Q1 · OVERALL SATISFACTION', text: 'Overall, how satisfied are you with your experience?', score: rating },
        { label: 'Q2 · CHECK-IN & CHECK-OUT', text: 'How would you rate the smoothness of your check-in and check-out process?', score: rating },
        { label: 'Q3 · STAFF ATTITUDE & PROFESSIONALISM', text: 'How would you rate the attitude and professionalism of our staff?', score: Math.min(5, rating + 1) },
        { label: 'Q4 · CLEANLINESS', text: 'How would you rate the cleanliness of our facilities?', score: Math.max(1, rating - 1) },
        { label: 'Q5 · VALUE FOR MONEY', text: 'How would you rate the value for money?', score: rating },
        { label: 'Q6 · OVERALL EXPERIENCE', text: 'How smooth was your overall experience with us?', score: Math.min(5, rating + 1) }
      ],
      servicesSelected: i % 2 === 0 ? ['Room Stay', 'Events or Banquet'] : ['Room Stay', 'Pool or Gym'],
      purpose: i % 2 === 0 ? "Business Trip" : "Family Vacation",
      notes: "",
      rawResolvedDate,
      resolvedDateStr
    });
  }
  return reviews;
};

// Mock Auth Session
export const getCurrentHotelId = () => {
  return localStorage.getItem('revanta_session_hotel_id') || 'H001';
};

export const getActiveBranchId = () => {
  return localStorage.getItem('revanta_active_branch') || 'b1';
};

export const getAllReviewsRaw = () => {
  const stored = localStorage.getItem('revanta_reviews');
  if (stored) {
    const parsed = JSON.parse(stored);
    if (parsed.length >= 150) {
      return parsed;
    }
  }
  const initial = generateMockReviews();
  localStorage.setItem('revanta_reviews', JSON.stringify(initial));
  return initial;
};

export const getReviews = () => {
  const hotelId = getCurrentHotelId();
  const branchId = getActiveBranchId();
  const all = getAllReviewsRaw();
  return all.filter(r => r.hotelId === hotelId && r.branchId === branchId);
};

export const updateReview = (id, updates) => {
  const all = getAllReviewsRaw();
  const hotelId = getCurrentHotelId();
  const branchId = getActiveBranchId();
  const index = all.findIndex(r => r.id === id && r.hotelId === hotelId && r.branchId === branchId);
  if (index !== -1) {
    all[index] = { ...all[index], ...updates };
    localStorage.setItem('revanta_reviews', JSON.stringify(all));
  }
  return all.filter(r => r.hotelId === hotelId && r.branchId === branchId);
};

export const addReview = (reviewData) => {
  const all = getAllReviewsRaw();
  const hotelId = reviewData.hotelId || getCurrentHotelId();
  const branchId = reviewData.branchId || getActiveBranchId();
  const nextNum = all.length + 1;
  const review = {
    ...reviewData,
    hotelId,
    branchId,
    id: reviewData.id || `STY-2026-${nextNum.toString().padStart(3, '0')}`,
  };
  all.unshift(review); // newest first
  localStorage.setItem('revanta_reviews', JSON.stringify(all));
  return review;
};
export const getHotelSettings = () => {
  const hotelId = getCurrentHotelId();
  const defaultSettings = {
    hotelId,
    name: "The Grand Revanta",
    logo: null,
    primaryLocation: "Accra, Greater Accra",
    services: {
      roomStay: true,
      events: true,
      conference: true,
      poolOrGym: true,
      spa: true,
      other: true
    },
    branches: [
      { id: 'b1', name: 'Main Branch', location: 'Accra, Ghana', token: 'GR-ACC-01' },
      { id: 'b2', name: 'Airport Branch', location: 'Airport Residential, Accra', token: 'GR-AIR-02' }
    ]
  };

  const stored = localStorage.getItem(`revanta_settings_${hotelId}`);
  if (stored) {
    const parsed = JSON.parse(stored);
    // Merge services to ensure newly added options (like 'other' and 'events') show up
    return {
      ...parsed,
      services: {
        ...defaultSettings.services,
        ...(parsed.services || {})
      }
    };
  }
  
  localStorage.setItem(`revanta_settings_${hotelId}`, JSON.stringify(defaultSettings));
  return defaultSettings;
};

export const updateHotelSettings = (updates) => {
  const hotelId = getCurrentHotelId();
  const current = getHotelSettings();
  const updated = { ...current, ...updates };
  localStorage.setItem(`revanta_settings_${hotelId}`, JSON.stringify(updated));
  window.dispatchEvent(new Event('revanta_settings_updated'));
  return updated;
};

export const findBranchByToken = (token) => {
  // Try to find the branch across all local storage settings keys
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key.startsWith('revanta_settings_')) {
      const settings = JSON.parse(localStorage.getItem(key));
      const branch = settings.branches?.find(b => b.token === token);
      if (branch) {
        return { hotelId: settings.hotelId, branch, hotelName: settings.name };
      }
    }
  }
  // If not found in storage, check default
  const defaultSettings = getHotelSettings();
  const branch = defaultSettings.branches?.find(b => b.token === token);
  if (branch) {
    return { hotelId: defaultSettings.hotelId, branch, hotelName: defaultSettings.name };
  }
  return null;
};
