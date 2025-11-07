import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { api } from '../utils/api'
import { useFarmStore } from './farm'

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(localStorage.getItem('token'))
  const user = ref<{ id: number; name: string; email: string } | null>(
    JSON.parse(localStorage.getItem('user') || 'null')
  )

  const isAuthenticated = computed(() => !!token.value)

  async function register(name: string, email: string, password: string) {
    const response = await api.post('/auth/register', { name, email, password })
    token.value = response.token
    user.value = { id: response.userId, name: response.name, email: response.email }
    localStorage.setItem('token', response.token)
    localStorage.setItem('user', JSON.stringify(user.value))
    // Fetch farms immediately after registering so currentFarmId is set correctly
    try {
      const farmStore = useFarmStore()
      await farmStore.fetchFarms()
    } catch (e) {
      // ignore fetch errors here; UI will handle missing farms
    }
  }

  async function login(email: string, password: string) {
    const response = await api.post('/auth/login', { email, password })
    token.value = response.token
    user.value = { id: response.userId, name: response.name, email: response.email }
    localStorage.setItem('token', response.token)
    localStorage.setItem('user', JSON.stringify(user.value))
    // Fetch farms after login so we get the correct farm list and currentFarmId
    try {
      const farmStore = useFarmStore()
      await farmStore.fetchFarms()
    } catch (e) {
      // ignore; route guard already handles fetch failures
    }
  }

  function logout() {
    token.value = null
    user.value = null
    // Clear all local storage on logout to avoid stale values (e.g., currentFarmId)
    try {
      const farmStore = useFarmStore()
      farmStore.currentFarmId = null
    } catch (e) {
      // ignore
    }
    // Set a short-lived session flag to prevent other stores/components from auto-writing
    // `currentFarmId` or `theme` immediately after we clear storage and trigger re-renders.
    try {
      sessionStorage.setItem('suppressAutoSet', '1')
    } catch (e) {}

    // Debug: log localStorage keys before clearing (helpful during dev)
    try {
      // eslint-disable-next-line no-console
      // console.log('logout: localStorage before clear:', Object.keys(localStorage))
    } catch (e) {}

    localStorage.clear()

    try {
      // eslint-disable-next-line no-console
      // console.log('logout: localStorage after clear:', Object.keys(localStorage))
    } catch (e) {}

    // Keep the flag for a short time (1s) while the app re-renders; then remove it so normal writes resume.
    try {
      setTimeout(() => {
        try { sessionStorage.removeItem('suppressAutoSet') } catch (e) {}
        try {
          // eslint-disable-next-line no-console
          // console.log('logout: removed suppressAutoSet flag')
        } catch (e) {}
      }, 1000)
    } catch (e) {}
  }

  async function deleteAccount() {
    await api.delete('/auth/account')
    // Clear auth state after successful deletion
    logout()
  }

  return {
    token,
    user,
    isAuthenticated,
    register,
    login,
    logout,
    deleteAccount
  }
})
