import api from './api';

// Description: Get all adverts
// Endpoint: GET /api/adverts
// Request: { query?: string, tags?: string[], location?: string, radius?: number, lat?: number, lng?: number }
// Response: { adverts: Array<Advert> }
export const getAdverts = async (params?: {
  query?: string;
  tags?: string[];
  location?: string;
  radius?: number;
  lat?: number;
  lng?: number;
}) => {
  try {
    const response = await api.get('/api/adverts', { params });
    return response.data;
  } catch (error) {
    console.error(error);
    throw new Error(error?.response?.data?.message || error.message);
  }
};

// Description: Get a single advert by ID
// Endpoint: GET /api/adverts/:id
// Request: { key?: string }
// Response: { advert: Advert }
export const getAdvertById = async (id: string, key?: string) => {
  try {
    console.log(`API: Calling getAdvertById with ID: ${id} and key: ${key || 'none'}`);
    const response = await api.get(`/api/adverts/${id}`, { params: key ? { key } : undefined });
    console.log("API: getAdvertById response:", JSON.stringify(response.data));
    return response.data;
  } catch (error: any) {
    console.error(`API: Error in getAdvertById for ID ${id}:`, error);
    if (error.response?.data?.requiresKey) {
      throw new Error(error.response.data.message || 'This advert requires an access key');
    }
    throw new Error(error?.response?.data?.message || error.message);
  }
};

// Description: Create a new advert
// Endpoint: POST /api/adverts
// Request: { title: string, description: string, image?: string, location?: string, customFields?: Array<{name: string, value: string}>, tags?: string[], visibility?: 'public' | 'private' }
// Response: { advert: Advert, message: string }
export const createAdvert = async (data: {
  title: string;
  description: string;
  image?: string;
  location?: string;
  customFields?: { name: string; value: string }[];
  tags?: string[];
  visibility?: 'public' | 'private';
}) => {
  try {
    const response = await api.post('/api/adverts', data);
    return response.data;
  } catch (error: any) {
    console.error(error);
    // Check if the error is due to reaching the advert limit
    if (error.response?.data?.limitReached) {
      throw new Error(error.response.data.message);
    }
    throw new Error(error?.response?.data?.message || error.message);
  }
};

// Description: Update an existing advert
// Endpoint: PUT /api/adverts/:id
// Request: { title?: string, description?: string, image?: string, location?: string, customFields?: Array<{name: string, value: string}>, tags?: string[], visibility?: 'public' | 'private' }
// Response: { advert: Advert, message: string }
export const updateAdvert = async (
  id: string,
  data: {
    title?: string;
    description?: string;
    image?: string;
    location?: string;
    customFields?: { name: string; value: string }[];
    tags?: string[];
    visibility?: 'public' | 'private';
  }
) => {
  try {
    const response = await api.put(`/api/adverts/${id}`, data);
    return response.data;
  } catch (error: any) {
    console.error(error);
    throw new Error(error?.response?.data?.message || error.message);
  }
};

// Description: Delete an advert
// Endpoint: DELETE /api/adverts/:id
// Request: {}
// Response: { message: string }
export const deleteAdvert = async (id: string) => {
  try {
    const response = await api.delete(`/api/adverts/${id}`);
    return response.data;
  } catch (error: any) {
    console.error(error);
    throw new Error(error?.response?.data?.message || error.message);
  }
};

// Description: Get user's adverts
// Endpoint: GET /api/adverts/user/me
// Request: {}
// Response: { adverts: Array<Advert> }
export const getUserAdverts = async () => {
  try {
    console.log("API: Calling getUserAdverts");
    const response = await api.get('/api/adverts/user/me');
    console.log("API: getUserAdverts response:", JSON.stringify(response.data));
    
    // Check if the response data is properly structured
    if (response.data && response.data.adverts) {
      // Log the first advert's structure if available
      if (response.data.adverts.length > 0) {
        console.log("API: First advert structure:", JSON.stringify(response.data.adverts[0]));
        console.log("API: First advert ID:", response.data.adverts[0]._id || "ID missing!");
      }
    } else {
      console.error("API: Unexpected response structure:", response.data);
    }
    
    return response.data;
  } catch (error: any) {
    console.error("API: Error in getUserAdverts:", error);
    throw new Error(error?.response?.data?.message || error.message);
  }
};

// Description: Upvote an advert
// Endpoint: POST /api/adverts/:id/upvote
// Request: {}
// Response: { upvotes: number, upvoted: boolean }
export const upvoteAdvert = async (id: string) => {
  try {
    console.log(`[CLIENT] Upvoting advert with ID: ${id}`);
    const url = `/api/adverts/${id}/upvote`;
    console.log(`[CLIENT] Sending POST request to: ${url}`);
    
    const response = await api.post(url);
    console.log(`[CLIENT] Upvote response:`, response.data);
    return response.data;
  } catch (error: any) {
    console.error(`[CLIENT] Error upvoting advert ${id}:`, error);
    
    // Check if the error response contains the cannotUpvoteOwn flag
    if (error.response?.data?.cannotUpvoteOwn) {
      // Create a custom error object and set the flag directly on it
      const customError = new Error(error.response.data.message);
      // This is important - make the property accessible directly on the error
      Object.defineProperty(customError, 'cannotUpvoteOwn', {
        value: true,
        enumerable: true
      });
      throw customError;
    }
    
    throw new Error(error?.response?.data?.message || error.message);
  }
};

// Description: Track a view for an advert
// Endpoint: POST /api/adverts/:id/view
// Request: {}
// Response: { views: number }
export const trackAdvertView = async (id: string) => {
  try {
    const response = await api.post(`/api/adverts/${id}/view`);
    return response.data;
  } catch (error: any) {
    console.error(error);
    throw new Error(error?.response?.data?.message || error.message);
  }
};

// Description: Get a shareable link for an advert
// Endpoint: GET /api/adverts/:id/share
// Request: {}
// Response: { url: string }
export const getShareableLink = async (id: string) => {
  try {
    const response = await api.get(`/api/adverts/${id}/share`);
    return response.data;
  } catch (error: any) {
    console.error(error);
    throw new Error(error?.response?.data?.message || error.message);
  }
};

// Description: Get advert statistics
// Endpoint: GET /api/adverts/:id/stats
// Request: {}
// Response: { upvotes: number, views: number, upvoted: boolean }
export const getAdvertStats = async (id: string) => {
  try {
    console.log(`[CLIENT] Getting stats for advert ${id}`);
    // Fix: add /api prefix to the endpoint
    const response = await api.get(`/api/adverts/${id}/stats`);
    console.log(`[CLIENT] Stats response:`, response.data);
    return response.data;
  } catch (error: any) {
    console.error(`[CLIENT] Error getting advert stats for ${id}:`, error);
    throw new Error(error?.response?.data?.message || error.message);
  }
};

// Description: Get a private shareable link for an advert
// Endpoint: GET /api/adverts/:id/share-private
// Request: {}
// Response: { url: string, key: string, message: string }
export const getPrivateShareableLink = async (id: string) => {
  try {
    const response = await api.get(`/api/adverts/${id}/share-private`);
    return response.data;
  } catch (error: any) {
    console.error(error);
    throw new Error(error?.response?.data?.message || error.message);
  }
};