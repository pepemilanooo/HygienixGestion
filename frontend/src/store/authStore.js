import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { authAPI } from '../services/api'

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (email, password) => {
        set({ isLoading: true, error: null })
        try {
          const response = await authAPI.login(email, password)
          const data = response.data?.data
          if (!data || !data.user || !data.tokens) {
            const msg = response.data?.message || 'Risposta del server non valida. Riprova.'
            set({ error: msg, isLoading: false })
            return { success: false, error: msg }
          }
          const { user, tokens } = data
          localStorage.setItem('token', tokens.accessToken)
          localStorage.setItem('refreshToken', tokens.refreshToken)
          set({ user, isAuthenticated: true, isLoading: false })
          return { success: true }
        } catch (error) {
          let message = error.response?.data?.message || 'Login fallito'
          if (!error.response && error.message) {
            if (error.code === 'ERR_NETWORK') {
              message = 'Server non raggiungibile. Verifica che il backend sia online e che l\'URL API sia corretto (variabile VITE_API_URL).'
            } else {
              message = `Errore di rete: ${error.message}`
            }
          }
          set({ error: message, isLoading: false })
          return { success: false, error: message }
        }
      },

      logout: () => {
        localStorage.removeItem('token')
        localStorage.removeItem('refreshToken')
        set({ user: null, isAuthenticated: false, error: null })
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
    }
  )
)
