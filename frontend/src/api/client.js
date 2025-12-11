import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';

console.log('🔗 API Client initialized with base URL:', API_BASE_URL);

const client = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

// Request interceptor
client.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    if (config.data instanceof FormData) {
   
      if (config.headers && config.headers['Content-Type']) {
        delete config.headers['Content-Type'];
      }
    } else {
      config.headers = {
        ...(config.headers || {}),
        'Content-Type': 'application/json',
      };
    }

    console.log('📤 Request:', config.method?.toUpperCase(), config.url);
    return config;
  },
  (error) => {
    console.error('❌ Request error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor
client.interceptors.response.use(
  (response) => {
    console.log('✅ Response:', response.status, response.config.url);
    return response;
  },
  async (error) => {
    console.error('❌ Response error:', error.response?.status, error.message);
    
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const refresh = localStorage.getItem('refresh_token');
        if (!refresh) {
          throw new Error('No refresh token');
        }
        
        console.log('🔄 Attempting token refresh...');
        const response = await axios.post(`${API_BASE_URL}/token/refresh/`, { refresh });
        localStorage.setItem('access_token', response.data.access);
        
        client.defaults.headers.Authorization = `Bearer ${response.data.access}`;
        originalRequest.headers.Authorization = `Bearer ${response.data.access}`;
        
        console.log('✅ Token refreshed successfully');
        return client(originalRequest);
      } catch (err) {
        console.error('❌ Token refresh failed:', err);
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/signin';
        return Promise.reject(err);
      }
    }
    
    return Promise.reject(error);
  }
);

export default client;
