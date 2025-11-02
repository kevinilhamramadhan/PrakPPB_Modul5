import axios from 'axios';

// Base URL configuration
// fallback to current origin when VITE_API_BASE_URL is not provided to avoid requests to 'undefined/...'
const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? (typeof window !== 'undefined' ? window.location.origin : '');

// Create axios instance
const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
apiClient.interceptors.response.use(
  (response) => {
    // return full response so services can decide how to normalize shape
    return response;
  },
  (error) => {
    const payload = error.response?.data ?? { message: error.message };
    const err = new Error(payload.message || 'An error occurred');
    // attach useful fields
    err.status = error.response?.status;
    err.payload = payload;
    return Promise.reject(err);
  }
);

export { apiClient, BASE_URL };
