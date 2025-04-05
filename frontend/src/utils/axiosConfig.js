import axios from 'axios';

// Create an axios instance with custom configuration
const api = axios.create({
  baseURL: 'http://localhost:5000',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add a request interceptor
api.interceptors.request.use(
  config => {
    // Get token from local storage
    const token = localStorage.getItem('token');
    
    // If token exists, add it to the headers
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    console.log('API Request:', {
      url: config.url,
      method: config.method,
      data: config.data
    });
    
    return config;
  },
  error => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Add a response interceptor
api.interceptors.response.use(
  response => {
    // Handle successful responses
    console.log('API Response:', {
      status: response.status,
      data: response.data
    });
    
    return response;
  },
  error => {
    // Handle error responses
    console.error('Response error:', error);
    
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error('Error data:', error.response.data);
      console.error('Error status:', error.response.status);
      console.error('Error headers:', error.response.headers);
    } else if (error.request) {
      // The request was made but no response was received
      console.error('No response received:', error.request);
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('Error message:', error.message);
    }
    
    return Promise.reject(error);
  }
);

export default api; 