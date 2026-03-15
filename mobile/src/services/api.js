import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Change this to your Railway backend URL
const API_URL = 'https://your-backend-url.railway.app/api';

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
apiClient.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const refreshToken = await AsyncStorage.getItem('refreshToken');
      if (refreshToken) {
        try {
          const response = await axios.post(`${API_URL}/auth/refresh`, {
            refreshToken,
          });

          const { accessToken, refreshToken: newRefreshToken } = response.data.data;
          await AsyncStorage.setItem('accessToken', accessToken);
          await AsyncStorage.setItem('refreshToken', newRefreshToken);

          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return apiClient(originalRequest);
        } catch (refreshError) {
          await AsyncStorage.removeItem('accessToken');
          await AsyncStorage.removeItem('refreshToken');
          await AsyncStorage.removeItem('user');
        }
      }
    }

    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (email, password) => apiClient.post('/auth/login', { email, password }),
  me: () => apiClient.get('/auth/me'),
  logout: () => apiClient.post('/auth/logout'),
};

// Interventions API
export const interventionsAPI = {
  getAll: (params) => apiClient.get('/interventions', { params }),
  getById: (id) => apiClient.get(`/interventions/${id}`),
  checkIn: (id, lat, lng) => apiClient.post(`/interventions/${id}/check-in`, { lat, lng }),
  checkOut: (id) => apiClient.post(`/interventions/${id}/check-out`),
  complete: (id, data) => apiClient.post(`/interventions/${id}/complete`, data),
  addPhoto: (id, photoData) => apiClient.post(`/interventions/${id}/photos`, photoData),
  addProductUsage: (id, data) => apiClient.post(`/interventions/${id}/products`, data),
  saveSignature: (id, signatureUrl) => apiClient.post(`/interventions/${id}/signature`, { signatureUrl }),
};

// Technicians API
export const techniciansAPI = {
  getAll: (params) => apiClient.get('/technicians', { params }),
  getToday: () => apiClient.get('/technicians/me/today'),
  getSchedule: (id) => apiClient.get(`/technicians/${id}/schedule`),
};

// Products API
export const productsAPI = {
  getAll: (params) => apiClient.get('/products', { params }),
  getById: (id) => apiClient.get(`/products/${id}`),
};

// Clients API
export const clientsAPI = {
  getAll: (params) => apiClient.get('/clients', { params }),
  getById: (id) => apiClient.get(`/clients/${id}`),
};

export default apiClient;
