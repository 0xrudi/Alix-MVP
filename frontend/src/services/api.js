import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL,
});

export const fetchUserData = async (userId) => {
  try {
    const response = await api.get(`/users/${userId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching user data:', error);
    throw error;
  }
};

export const updateUserProfile = async (userData) => {
  try {
    const response = await api.post('/users', userData);
    return response.data;
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
};

export const fetchUserArtifacts = async (userId, page = 1, limit = 20) => {
  try {
    const response = await api.get(`/artifacts/${userId}`, { params: { page, limit } });
    return response.data;
  } catch (error) {
    console.error('Error fetching artifacts:', error);
    throw error;
  }
};

export default api;