// utils/api.js

const API_BASE = 'http://127.0.0.1:8000/api';

// Helper function for authenticated requests
export const authFetch = async (endpoint, options = {}) => {
  const token = localStorage.getItem('access_token');
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  const config = {
    ...options,
    headers,
  };
  
  const response = await fetch(`${API_BASE}${endpoint}`, config);
  
  // Handle 401 Unauthorized (token expired)
  if (response.status === 401) {
    // Try to refresh token
    const refreshed = await refreshToken();
    if (refreshed) {
      // Retry with new token
      headers['Authorization'] = `Bearer ${localStorage.getItem('access_token')}`;
      return fetch(`${API_BASE}${endpoint}`, config);
    } else {
      // Redirect to login
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      window.location.href = '/login';
      return;
    }
  }
  
  return response;
};

// Refresh token function
export const refreshToken = async () => {
  const refreshToken = localStorage.getItem('refresh_token');
  if (!refreshToken) return false;
  
  try {
    const response = await fetch(`${API_BASE}/token/refresh/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh: refreshToken })
    });
    
    if (response.ok) {
      const data = await response.json();
      localStorage.setItem('access_token', data.access);
      return true;
    }
  } catch (error) {
    console.error('Token refresh failed:', error);
  }
  
  return false;
};

// API functions
export const api = {
  // Auth
  login: (username, password) => 
    fetch(`${API_BASE}/token/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    }),
  
  register: (userData) => 
    fetch(`${API_BASE}/register/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    }),
  
  // User
  getProfile: () => authFetch('/profile/'),
  
  setApiKey: (provider, apiKey) => 
    authFetch('/set-api-key/', {
      method: 'POST',
      body: JSON.stringify({ provider, api_key: apiKey })
    }),
  
  // AI Chat
  sendMessage: (messageData) => 
    authFetch('/ai-chat/', {
      method: 'POST',
      body: JSON.stringify(messageData)
    }),
  
  getConversations: () => authFetch('/conversations/'),
  
  clearMemory: () => 
    authFetch('/clear-memory/', {
      method: 'POST'
    }),
  
  // Billing
  getPlans: () => fetch(`${API_BASE}/plans/`),  // Public endpoint
  
  createCheckout: (planData) => 
    authFetch('/create-checkout/', {
      method: 'POST',
      body: JSON.stringify(planData)
    }),
  
  cancelSubscription: () => 
    authFetch('/cancel-subscription/', {
      method: 'POST'
    }),
};