import api from './api';

// Description: Create a new subscription
// Endpoint: POST /api/subscriptions
// Request: { amount: number, currency: string, paymentMethod: string, autoRenew: boolean }
// Response: { success: boolean, subscription: object, user: object }
export const createSubscription = async (data: { 
  amount: number; 
  currency?: string; 
  paymentMethod: string; 
  autoRenew?: boolean;
}) => {
  try {
    const response = await api.post('/api/subscriptions', data);
    return response.data;
  } catch (error: any) {
    throw new Error(error?.response?.data?.message || error.message);
  }
};

// Description: Get user's active subscription
// Endpoint: GET /api/subscriptions/active
// Request: {}
// Response: { success: boolean, subscription: object|null }
export const getActiveSubscription = async () => {
  try {
    const response = await api.get('/api/subscriptions/active');
    return response.data;
  } catch (error: any) {
    throw new Error(error?.response?.data?.message || error.message);
  }
};

// Description: Get user's subscription history
// Endpoint: GET /api/subscriptions/history
// Request: {}
// Response: { success: boolean, subscriptions: array }
export const getSubscriptionHistory = async () => {
  try {
    const response = await api.get('/api/subscriptions/history');
    console.log("API response for subscription history:", response.data);
    return response.data;
  } catch (error: any) {
    console.error("Error in getSubscriptionHistory API call:", error);
    throw new Error(error?.response?.data?.message || error.message);
  }
};

// Description: Cancel a subscription
// Endpoint: POST /api/subscriptions/:subscriptionId/cancel
// Request: {}
// Response: { success: boolean, subscription: object }
export const cancelSubscription = async (subscriptionId: string) => {
  try {
    const response = await api.post(`/api/subscriptions/${subscriptionId}/cancel`);
    return response.data;
  } catch (error: any) {
    throw new Error(error?.response?.data?.message || error.message);
  }
};

// Description: Renew a subscription
// Endpoint: POST /api/subscriptions/:subscriptionId/renew
// Request: {}
// Response: { success: boolean, subscription: object, user: object }
export const renewSubscription = async (subscriptionId: string) => {
  try {
    const response = await api.post(`/api/subscriptions/${subscriptionId}/renew`);
    return response.data;
  } catch (error: any) {
    throw new Error(error?.response?.data?.message || error.message);
  }
};

// Description: Check premium access
// Endpoint: GET /api/subscriptions/check-premium
// Request: {}
// Response: { success: boolean, hasPremiumAccess: boolean }
export const checkPremiumAccess = async () => {
  try {
    const response = await api.get('/api/subscriptions/check-premium');
    return response.data;
  } catch (error: any) {
    throw new Error(error?.response?.data?.message || error.message);
  }
};