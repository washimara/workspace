import axios from 'axios';

// Create an axios instance with base URL and default headers
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to attach authentication token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error('API request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API response error:', error);
    
    // Format error message for client
    const errorMessage = error.response?.data?.error || error.message || 'An unexpected error occurred';
    
    // Handle token expiration or invalid token
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // Redirect to login page if not already there
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    
    return Promise.reject(new Error(errorMessage));
  }
);

// Auth services
export const authService = {
  login: async (credentials) => {
    try {
      const response = await api.post('/auth/login', credentials);
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      return response.data;
    } catch (error) {
      console.error('Login error:', error);
      throw new Error(error.message || 'Failed to login');
    }
  },
  
  register: async (userData) => {
    try {
      const response = await api.post('/auth/register', userData);
      return response.data;
    } catch (error) {
      console.error('Registration error:', error);
      throw new Error(error.message || 'Failed to register');
    }
  },
  
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },
  
  getCurrentUser: () => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },
};

// Posts/Adverts services
export const postsService = {
  getPosts: async () => {
    try {
      const response = await api.get('/api/posts');
      return response.data;
    } catch (error) {
      console.error('Get posts error:', error);
      throw new Error(error.message || 'Failed to fetch posts');
    }
  },
  
  getPostById: async (id) => {
    try {
      const response = await api.get(`/api/posts/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Get post ${id} error:`, error);
      throw new Error(error.message || 'Failed to fetch post details');
    }
  },
  
  createPost: async (postData) => {
    try {
      const response = await api.post('/api/posts', postData);
      return response.data;
    } catch (error) {
      console.error('Create post error:', error);
      throw new Error(error.message || 'Failed to create post');
    }
  },
  
  updatePost: async (id, postData) => {
    try {
      const response = await api.put(`/api/posts/${id}`, postData);
      return response.data;
    } catch (error) {
      console.error(`Update post ${id} error:`, error);
      throw new Error(error.message || 'Failed to update post');
    }
  },
  
  deletePost: async (id) => {
    try {
      const response = await api.delete(`/api/posts/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Delete post ${id} error:`, error);
      throw new Error(error.message || 'Failed to delete post');
    }
  },
  
  getUserPosts: async () => {
    try {
      const response = await api.get('/api/posts/user');
      return response.data;
    } catch (error) {
      console.error('Get user posts error:', error);
      throw new Error(error.message || 'Failed to fetch your posts');
    }
  },
};

export default api;