import axios from 'axios';
import API_URL from './config';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to include the auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('revanta_auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// --- AUTH ---
export const login = async (credentials) => {
  const response = await api.post('/api/login', credentials);
  return response.data;
};

// --- REGISTRATION ---
export const registerHotel = async (data) => {
  const response = await api.post('/api/register-hotel', data);
  return response.data;
};

export const verifyPayment = async (reference) => {
  const response = await api.get(`/api/verify-payment?reference=${reference}`);
  return response.data;
};

// --- PUBLIC REVIEW ---
export const submitReview = async (data) => {
  const response = await api.post('/api/submit-review', data);
  return response.data;
};

export const getHotelByToken = async (token) => {
  const response = await api.get(`/api/get-hotel-by-token?token=${token}`);
  return response.data;
};

// --- DASHBOARD ---
export const getStats = async (branchId) => {
  const url = branchId ? `/api/stats?branchId=${branchId}` : '/api/stats';
  const response = await api.get(url);
  return response.data;
};

export const getReviews = async (params) => {
  const response = await api.get('/api/reviews', { params });
  return response.data;
};

export const updateReview = async (id, data) => {
  const response = await api.patch(`/api/reviews/${id}`, data);
  return response.data;
};

// --- SUBSCRIPTION ---
export const getSubscription = async () => {
  const response = await api.get('/api/subscription');
  return response.data;
};

export const renewSubscription = async (plan) => {
  const response = await api.post('/api/subscription/renew', { plan });
  return response.data;
};

export const changePassword = async (currentPassword, newPassword) => {
  const response = await api.post('/api/change-password', { currentPassword, newPassword });
  return response.data;
};

export const updateHotel = async (updates) => {
  const response = await api.patch('/api/hotel', updates);
  return response.data;
};

export default api;
