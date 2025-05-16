import api from './api';

// Description: Get all posts with optional search parameters
// Endpoint: GET /api/adverts
// Request: { query?: string, tags?: string[], location?: string }
// Response: { posts: Array<Post> }
export const getPosts = async (params?: { query?: string; tags?: string[]; location?: string }) => {
  try {
    const response = await api.get('/api/adverts', { params });
    return { posts: response.data.adverts };
  } catch (error) {
    console.error('Error fetching posts:', error);
    throw new Error(error?.response?.data?.message || error.message);
  }
};

// Description: Get a single post by ID
// Endpoint: GET /api/adverts/:id
// Request: {}
// Response: { post: Post }
export const getPostById = async (id: string) => {
  try {
    const response = await api.get(`/api/adverts/${id}`);
    return { post: response.data.advert };
  } catch (error) {
    console.error('Error fetching post by ID:', error);
    throw new Error(error?.response?.data?.message || error.message);
  }
};

// Description: Create a new post
// Endpoint: POST /api/adverts
// Request: { title: string, description: string, image?: string, location?: string, customFields?: Array<{name: string, value: string}>, tags?: string[] }
// Response: { post: Post, message: string }
export const createPost = async (data: {
  title: string;
  description: string;
  image?: string;
  location?: string;
  customFields?: { name: string; value: string }[];
  tags?: string[];
}) => {
  try {
    // Convert customFields to custom_fields for the API
    const apiData = {
      ...data,
      custom_fields: data.customFields
    };
    delete apiData.customFields;

    const response = await api.post('/api/adverts', apiData);
    return {
      post: response.data.advert,
      message: response.data.message
    };
  } catch (error) {
    console.error('Error creating post:', error);
    throw new Error(error?.response?.data?.message || error.message);
  }
};

// Description: Update an existing post
// Endpoint: PUT /api/adverts/:id
// Request: { title?: string, description?: string, image?: string, location?: string, customFields?: Array<{name: string, value: string}>, tags?: string[] }
// Response: { post: Post, message: string }
export const updatePost = async (
  id: string,
  data: {
    title?: string;
    description?: string;
    image?: string;
    location?: string;
    customFields?: { name: string; value: string }[];
    tags?: string[];
  }
) => {
  try {
    // Convert customFields to custom_fields for the API
    const apiData = {
      ...data,
      custom_fields: data.customFields
    };
    delete apiData.customFields;

    const response = await api.put(`/api/adverts/${id}`, apiData);
    return {
      post: response.data.advert,
      message: response.data.message
    };
  } catch (error) {
    console.error('Error updating post:', error);
    throw new Error(error?.response?.data?.message || error.message);
  }
};

// Description: Delete a post
// Endpoint: DELETE /api/adverts/:id
// Request: {}
// Response: { message: string }
export const deletePost = async (id: string) => {
  try {
    const response = await api.delete(`/api/adverts/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting post:', error);
    throw new Error(error?.response?.data?.message || error.message);
  }
};

// Description: Get user posts
// Endpoint: GET /api/adverts/user/me
// Request: {}
// Response: { posts: Array<{ id: string, title: string, description: string, image?: string, location?: string, tags?: string[], createdAt: string, custom_fields?: Array<{ name: string, value: string }> }> }
export const getUserPosts = async () => {
  try {
    console.log('Fetching user posts from API');
    const response = await api.get('/api/adverts/user/me');
    console.log('User posts raw response:', response.data);

    // Check if we have adverts in the response
    if (!response.data || !response.data.adverts) {
      console.error('Unexpected response structure:', response.data);
      throw new Error('Failed to retrieve user posts');
    }

    // Map the response properly
    const posts = response.data.adverts.map((advert) => ({
      ...advert,
      id: advert._id || advert.id, // Ensure ID is available in both formats
      _id: advert._id || advert.id, // For compatibility with existing components
      customFields: advert.customFields || advert.custom_fields || []
    }));

    console.log('Mapped posts:', posts);
    return { posts };
  } catch (error) {
    console.error('Error fetching user posts:', error);
    throw new Error(error?.response?.data?.message || error.message);
  }
};