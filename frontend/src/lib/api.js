import axios from 'axios';

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - add auth token
apiClient.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('accessToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - handle errors
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Handle 401 errors
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      // Try to refresh token
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        try {
          const response = await axios.post(
            `${process.env.NEXT_PUBLIC_API_URL}/auth/refresh`,
            { refreshToken }
          );

          const { accessToken, refreshToken: newRefreshToken } = response.data.data;
          localStorage.setItem('accessToken', accessToken);
          localStorage.setItem('refreshToken', newRefreshToken);

          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return apiClient(originalRequest);
        } catch (refreshError) {
          // Refresh failed, logout user
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('user');
          window.location.href = '/login';
        }
      } else {
        // No refresh token, logout user
        localStorage.removeItem('accessToken');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;

// Auth API
export const authAPI = {
  login: (email, password) => apiClient.post('/auth/login', { email, password }),
  me: () => apiClient.get('/auth/me'),
  logout: () => apiClient.post('/auth/logout'),
};

// Clients API
export const clientsAPI = {
  getAll: (params) => apiClient.get('/clients', { params }),
  getById: (id) => apiClient.get(`/clients/${id}`),
  create: (data) => apiClient.post('/clients', data),
  update: (id, data) => apiClient.put(`/clients/${id}`, data),
  delete: (id) => apiClient.delete(`/clients/${id}`),
  getStats: () => apiClient.get('/clients/stats'),
};

// Interventions API
export const interventionsAPI = {
  getAll: (params) => apiClient.get('/interventions', { params }),
  getById: (id) => apiClient.get(`/interventions/${id}`),
  create: (data) => apiClient.post('/interventions', data),
  update: (id, data) => apiClient.put(`/interventions/${id}`, data),
  delete: (id) => apiClient.delete(`/interventions/${id}`),
  checkIn: (id, lat, lng) => apiClient.post(`/interventions/${id}/check-in`, { lat, lng }),
  checkOut: (id) => apiClient.post(`/interventions/${id}/check-out`),
  complete: (id, data) => apiClient.post(`/interventions/${id}/complete`, data),
};

// Technicians API
export const techniciansAPI = {
  getAll: (params) => apiClient.get('/technicians', { params }),
  getById: (id) => apiClient.get(`/technicians/${id}`),
  getInterventions: (id, params) => apiClient.get(`/technicians/${id}/interventions`, { params }),
  getSchedule: (id, params) => apiClient.get(`/technicians/${id}/schedule`, { params }),
  getToday: () => apiClient.get('/technicians/me/today'),
};

// Products API
export const productsAPI = {
  getAll: (params) => apiClient.get('/products', { params }),
  getById: (id) => apiClient.get(`/products/${id}`),
  create: (data) => apiClient.post('/products', data),
  update: (id, data) => apiClient.put(`/products/${id}`, data),
  delete: (id) => apiClient.delete(`/products/${id}`),
  getLowStock: () => apiClient.get('/products/low-stock'),
};

// Analytics API
export const analyticsAPI = {
  getDashboard: () => apiClient.get('/analytics/dashboard'),
  getInterventions: (params) => apiClient.get('/analytics/interventions', { params }),
  getPestTypes: () => apiClient.get('/analytics/pest-types'),
  getProductsUsage: (params) => apiClient.get('/analytics/products-usage', { params }),
  getTechniciansPerformance: (params) => apiClient.get('/analytics/technicians-performance', { params }),
  getMapData: (params) => apiClient.get('/analytics/map-data', { params }),
};
