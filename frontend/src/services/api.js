import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true
      
      const refreshToken = localStorage.getItem('refreshToken')
      if (refreshToken) {
        try {
          const response = await axios.post(`${API_URL}/auth/refresh`, { refreshToken })
          const { accessToken } = response.data.data
          
          localStorage.setItem('token', accessToken)
          originalRequest.headers.Authorization = `Bearer ${accessToken}`
          
          return apiClient(originalRequest)
        } catch (refreshError) {
          localStorage.removeItem('token')
          localStorage.removeItem('refreshToken')
          window.location.href = '/login'
        }
      }
    }
    
    return Promise.reject(error)
  }
)

// Auth API
export const authAPI = {
  login: (email, password) => apiClient.post('/auth/login', { email, password }),
  me: () => apiClient.get('/auth/me'),
  logout: () => apiClient.post('/auth/logout'),
  changePassword: (passwordAttuale, nuovaPassword) =>
    apiClient.put('/auth/me/password', { passwordAttuale, nuovaPassword }),
}

// Clients API
export const clientsAPI = {
  getAll: (params) => apiClient.get('/clients', { params }),
  getById: (id) => apiClient.get(`/clients/${id}`),
  create: (data) => apiClient.post('/clients', data),
  update: (id, data) => apiClient.put(`/clients/${id}`, data),
  delete: (id) => apiClient.delete(`/clients/${id}`),
  getDocumenti: (id) => apiClient.get(`/clients/${id}/documenti`),
  addDocumento: (id, data) => apiClient.post(`/clients/${id}/documenti`, data),
  deleteDocumento: (clientId, docId) => apiClient.delete(`/clients/${clientId}/documenti/${docId}`),
}

// Locations API (sedi cliente)
export const locationsAPI = {
  getAll: (params) => apiClient.get('/locations', { params }),
  getByClientId: (clientId) => apiClient.get('/locations', { params: { clientId } }),
  getById: (id) => apiClient.get(`/locations/${id}`),
  create: (data) => apiClient.post('/locations', data),
  update: (id, data) => apiClient.put(`/locations/${id}`, data),
  delete: (id) => apiClient.delete(`/locations/${id}`),
}

// Tipi intervento
export const tipiInterventoAPI = {
  getAll: () => apiClient.get('/tipi-intervento'),
}

// Tecnici
export const tecniciAPI = {
  getAll: (params) => apiClient.get('/tecnici', { params }),
  getById: (id) => apiClient.get(`/tecnici/${id}`),
  create: (data) => apiClient.post('/tecnici', data),
  update: (id, data) => apiClient.patch(`/tecnici/${id}`, data),
}

// Interventions API
export const interventionsAPI = {
  getAll: (params) => apiClient.get('/interventions', { params }),
  getById: (id) => apiClient.get(`/interventions/${id}`),
  create: (data) => apiClient.post('/interventions', data),
  checkIn: (id, lat, lng) => apiClient.post(`/interventions/${id}/check-in`, { lat, lng }),
  complete: (id, data) => apiClient.post(`/interventions/${id}/complete`, data),
  rigeneraReport: (id) => apiClient.post(`/interventions/${id}/rigenera-report`),
  addProdotto: (id, data) => apiClient.post(`/interventions/${id}/prodotti`, data),
  removeProdotto: (id, rigaId) => apiClient.delete(`/interventions/${id}/prodotti/${rigaId}`),
  saveSopralluogo: (id, data) => apiClient.post(`/interventions/${id}/sopralluogo`, data),
  getSopralluogo: (id) => apiClient.get(`/interventions/${id}/sopralluogo`),
}

// Dashboard API
export const dashboardAPI = {
  getStats: () => apiClient.get('/dashboard/stats'),
}

// Upload (PDF/documenti e firma)
export const uploadAPI = {
  documento: (file) => {
    const formData = new FormData()
    formData.append('file', file)
    return apiClient.post('/upload/documento', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  },
  firma: (file) => {
    const formData = new FormData()
    formData.append('file', file)
    return apiClient.post('/upload/firma', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  },
}

// Preventivi
export const preventiviAPI = {
  getAll: (params) => apiClient.get('/preventivi', { params }),
  getById: (id) => apiClient.get(`/preventivi/${id}`),
  create: (data) => apiClient.post('/preventivi', data),
  update: (id, data) => apiClient.put(`/preventivi/${id}`, data),
  delete: (id) => apiClient.delete(`/preventivi/${id}`),
}

// Fatture
export const fattureAPI = {
  getAll: (params) => apiClient.get('/fatture', { params }),
  getById: (id) => apiClient.get(`/fatture/${id}`),
  create: (data) => apiClient.post('/fatture', data),
  update: (id, data) => apiClient.put(`/fatture/${id}`, data),
}

// Impostazioni (solo admin può salvare)
export const settingsAPI = {
  getAll: () => apiClient.get('/settings'),
  update: (data) => apiClient.put('/settings', data),
}

// Prodotti (inventario)
export const prodottiAPI = {
  getAll: (params) => apiClient.get('/prodotti', { params }),
  getById: (id) => apiClient.get(`/prodotti/${id}`),
  create: (data) => apiClient.post('/prodotti', data),
  update: (id, data) => apiClient.put(`/prodotti/${id}`, data),
  delete: (id) => apiClient.delete(`/prodotti/${id}`),
}

export default apiClient
