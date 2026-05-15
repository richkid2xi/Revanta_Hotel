import * as api from '../api';

// --- UTILS ---
const formatReview = (r) => {
  const rawDate = new Date(r.createdAt || Date.now());
  const day = rawDate.getDate().toString().padStart(2, '0');
  const month = rawDate.toLocaleString('default', { month: 'long' });
  const year = rawDate.getFullYear();
  const hours = rawDate.getHours().toString().padStart(2, '0');
  const minutes = rawDate.getMinutes().toString().padStart(2, '0');
  const dayName = rawDate.toLocaleString('default', { weekday: 'long' });
  
  // Ensure author object is populated correctly
  let author = null;
  if (!r.isAnonymous) {
    author = {
      name: r.guestName || 'Guest',
      email: r.guestEmail || '',
      phone: r.guestPhone || ''
    };
  }

  return {
    ...r,
    id: r.id,
    referenceNumber: r.referenceNumber || r.id,
    rating: r.overallRating || r.rating,
    rawDate: rawDate.getTime(),
    date: `${dayName}, ${day} ${month} ${year} at ${hours}:${minutes}`,
    shortDate: `${day} ${month.slice(0, 3)} ${year}, ${hours}:${minutes}`,
    text: r.writtenComment || r.text,
    author: author,
    questions: r.generalScores ? Object.entries(r.generalScores).map(([key, val]) => ({
      label: key.toUpperCase(),
      text: key,
      score: val
    })) : []
  };
};

// --- AUTH SESSION ---
export const getCurrentHotelId = () => {
  return localStorage.getItem('revanta_session_hotel_id');
};

export const getHotelSettings = () => {
  return {
    name: localStorage.getItem('revanta_active_hotel_name') || 'Revanta Hotel',
    logo: localStorage.getItem('revanta_active_logo_url') || null,
  };
};

// --- ASYNC API ACTIONS ---
export const fetchStats = async (branchId) => {
  return await api.getStats(branchId);
};

export const fetchReviews = async (params) => {
  try {
    const reviews = await api.getReviews(params);
    if (!Array.isArray(reviews)) return [];
    return reviews.map(formatReview);
  } catch (err) {
    console.error('Error fetching reviews:', err);
    return [];
  }
};

// --- CACHING ---
export const dashboardCache = {
  stats: null,
  reviews: null,
  timestamp: 0
};

export const getCachedDashboard = () => {
  if (Date.now() - dashboardCache.timestamp < 5 * 60 * 1000) { // 5 min cache
    return dashboardCache;
  }
  return null;
};

export const setDashboardCache = (stats, reviews) => {
  dashboardCache.stats = stats;
  dashboardCache.reviews = reviews;
  dashboardCache.timestamp = Date.now();
};

// --- SETTINGS & UPDATES ---
export const updateHotelSettings = async (updates) => {
  // Sync to local storage
  if (updates.name) localStorage.setItem('revanta_active_hotel_name', updates.name);
  if (updates.logo) localStorage.setItem('revanta_active_logo_url', updates.logo);
  
  // Sync to backend DB
  try {
    await api.updateHotel(updates);
  } catch (err) {
    console.error('Failed to sync hotel updates to backend:', err);
  }

  window.dispatchEvent(new Event('revanta_settings_updated'));
  return getHotelSettings();
};

export const updateReviewStatus = async (id, status) => {
  return await api.updateReview(id, { status });
};

export const saveReviewNote = async (id, note) => {
  return await api.updateReview(id, { internalNote: note });
};

// --- LEGACY / COMPATIBILITY ---
export const getReviews = () => [];
export const updateReview = (id, updates) => [];
export const addReview = (reviewData) => reviewData;
export const findBranchByToken = (token) => null;
