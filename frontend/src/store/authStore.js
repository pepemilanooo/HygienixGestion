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
          const { user, tokens } = response.data.data
          
          localStorage.setItem('token', tokens.accessToken)
          localStorage.setItem('refreshToken', tokens.refreshToken)
          
          set({ user, isAuthenticated: true, isLoading: false })
          return { success: true }
        } catch (error) {
          const message = error.response?.data?.message || 'Login fallito'
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
