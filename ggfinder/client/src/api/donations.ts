import api from './api';

// Description: Make a donation
// Endpoint: POST /api/donations
// Request: { amount: number, currency: string, paymentMethod: string, donationType: string }
// Response: { success: boolean, donation: { _id: string, amount: number, currency: string, status: string, createdAt: string } }
export const makeDonation = async (data: {
  amount: number;
  currency?: string;
  paymentMethod: string;
  donationType?: 'one-time' | 'subscription';
}) => {
  try {
    const response = await api.post('/api/donations', data);
    return response.data;
  } catch (error: any) {
    throw new Error(error?.response?.data?.message || error.message);
  }
};

// Description: Get user's donation history
// Endpoint: GET /api/donations/history
// Request: {}
// Response: { success: boolean, donations: Array<{ _id: string, amount: number, currency: string, status: string, donationType: string, createdAt: string }> }
export const getDonationHistory = async () => {
  try {
    const response = await api.get('/api/donations/history');
    return response.data;
  } catch (error: any) {
    throw new Error(error?.response?.data?.message || error.message);
  }
};

// Description: Get user's subscription status
// Endpoint: GET /api/donations/subscription
// Request: {}
// Response: { success: boolean, subscription: { status: string, startDate: string, endDate: string } }
export const getSubscriptionStatus = async () => {
  try {
    const response = await api.get('/api/donations/subscription');
    return response.data;
  } catch (error: any) {
    throw new Error(error?.response?.data?.message || error.message);
  }
};