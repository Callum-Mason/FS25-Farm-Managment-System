import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { api } from '../utils/api'

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
  }

  async function login(email: string, password: string) {
    const response = await api.post('/auth/login', { email, password })
    token.value = response.token
    user.value = { id: response.userId, name: response.name, email: response.email }
    localStorage.setItem('token', response.token)
    localStorage.setItem('user', JSON.stringify(user.value))
  }

  function logout() {
    token.value = null
    user.value = null
    localStorage.removeItem('token')
    localStorage.removeItem('user')
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
