import axios from 'axios';
import { tokenstore } from '../../auth/tokenstore';

export const http = axios.create({
    baseURL : import.meta.env.VITE_API_URL,
    headers: {
        "Content-Type" : "application/json"
    }
});

// Request interceptor - Add auth token to requests
http.interceptors.request.use((config)=>{
  const token = tokenstore.getToken();
  if(token){
    config.headers.Authorization = `Bearer ${token}`;
  }
  if (config.data instanceof FormData) {
    delete config.headers['Content-Type'];
  }
  
  return config;
});

// Response interceptor - Handle authentication errors
http.interceptors.response.use(
  (response) => {
    // Pass through successful responses
    return response;
  },
  (error) => {
    // Handle 401 Unauthorized responses (token expired or invalid)
    if (error.response && error.response.status === 401) {
      // Check if response has the expected structure
      const responseData = error.response.data;
      
      // Clear user session
      tokenstore.clear();
      
      // Redirect to login page
      window.location.href = '/login';
      
      // Return rejected promise with error details
      return Promise.reject({
        message: responseData?.message || 'Unauthorized - Please login again',
        success: false,
        data: responseData?.data || null
      });
    }
    
    // For other errors, pass them through
    return Promise.reject(error);
  }
);