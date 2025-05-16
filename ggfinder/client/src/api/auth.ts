import api from './api';

// Description: Login user
// Endpoint: POST /api/auth/login
// Request: { email: string, password: string }
// Response: { accessToken: string, refreshToken: string, user: { id: string, email: string, name: string } }
export const login = async (data: { email: string; password: string }) => {
  try {
    const response = await api.post('/api/auth/login', data);
    
    // Store tokens in localStorage
    localStorage.setItem('accessToken', response.data.accessToken);
    localStorage.setItem('refreshToken', response.data.refreshToken);
    
    return response.data;
  } catch (error) {
    console.error('Login error:', error);
    throw new Error(error?.response?.data?.message || error.message);
  }
};

// Description: Register user
// Endpoint: POST /api/auth/register
// Request: { name: string, email: string, password: string }
// Response: { accessToken: string, user: { id: string, email: string, name: string } }
export const register = async (data: { name: string; email: string; password: string }) => {
  try {
    const response = await api.post('/api/auth/register', data);
    
    // Store only accessToken for newly registered users
    localStorage.setItem('accessToken', response.data.accessToken);
    
    return response.data;
  } catch (error) {
    console.error('Registration error:', error);
    throw new Error(error?.response?.data?.message || error.message);
  }
};

// Description: Logout user
// Endpoint: POST /api/auth/logout
// Request: { refreshToken: string }
// Response: { message: string }
export const logout = async () => {
  try {
    const refreshToken = localStorage.getItem('refreshToken');
    
    if (refreshToken) {
      await api.post('/api/auth/logout', { refreshToken });
    }
    
    // Clear tokens from localStorage
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    
    return { message: 'Logged out successfully' };
  } catch (error) {
    console.error('Logout error:', error);
    
    // Still clear tokens even if API call fails
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    
    throw new Error(error?.response?.data?.message || error.message);
  }
};

// Description: Get current user
// Endpoint: GET /api/auth/me
// Request: {}
// Response: { user: { id: string, email: string, name: string } }
export const getCurrentUser = async () => {
  try {
    const response = await api.get('/api/auth/me');
    return response.data;
  } catch (error) {
    console.error('Failed to load user:', error);
    throw new Error(error?.response?.data?.message || error.message);
  }
};