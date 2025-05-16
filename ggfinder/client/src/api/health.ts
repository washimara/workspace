import api from './api';

// Description: Get system health status
// Endpoint: GET /api/health
// Request: {}
// Response: { status: string, timestamp: string, database: { supabase: string } }
export const getHealthStatus = async () => {
  try {
    const response = await api.get('/api/health');
    return response.data;
  } catch (error: any) {
    throw new Error(error?.response?.data?.message || error.message);
  }
};

// Description: Get detailed health information
// Endpoint: GET /api/health/detailed
// Request: {}
// Response: { status: string, timestamp: string, environment: string, database: { supabase: Object }, api: Object }
export const getDetailedHealthStatus = async () => {
  try {
    const response = await api.get('/api/health/detailed');
    return response.data;
  } catch (error: any) {
    throw new Error(error?.response?.data?.message || error.message);
  }
};

// Description: Check database connectivity
// Endpoint: GET /api/health/database
// Request: {}
// Response: { status: string, message: string, database: string, timestamp: string }
export const getDatabaseHealth = async () => {
  try {
    const response = await api.get('/api/health/database');
    return response.data;
  } catch (error: any) {
    throw new Error(error?.response?.data?.message || error.message);
  }
};