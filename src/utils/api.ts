import { useAuthStore } from '../stores/auth'

const BASE_URL = '/api'

interface ApiResponse {
  [key: string]: any
}

class ApiClient {
  private getHeaders(): HeadersInit {
    const authStore = useAuthStore()
    const headers: HeadersInit = {
      'Content-Type': 'application/json'
    }
    
    if (authStore.token) {
      headers['Authorization'] = `Bearer ${authStore.token}`
    }
    
    return headers
  }

  async get(endpoint: string): Promise<any> {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      headers: this.getHeaders()
    })
    
    // Handle authentication failure (401) globally — don't treat permission (403) as a sign-out
    if (response.status === 401) {
      try {
        const authStore = useAuthStore()
        authStore.logout()
      } catch (e) {
        // ignore
      }
      // Redirect to login so user can sign in again
      window.location.href = '/login'
      throw new Error('Authentication required')
    }

    if (!response.ok) {
      throw new Error(`API error: ${response.statusText}`)
    }

    return response.json()
  }

  async post(endpoint: string, data: any): Promise<any> {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data)
    })
    
    // Handle authentication failure (401) globally — allow callers to handle 403 permission errors
    if (response.status === 401) {
      try {
        const authStore = useAuthStore()
        authStore.logout()
      } catch (e) {
        // ignore
      }
      window.location.href = '/login'
      throw new Error('Authentication required')
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: response.statusText }))
      throw new Error(error.error || 'API error')
    }

    return response.json()
  }

  async patch(endpoint: string, data: any): Promise<any> {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout
    
    try {
      const response = await fetch(`${BASE_URL}${endpoint}`, {
        method: 'PATCH',
        headers: this.getHeaders(),
        body: JSON.stringify(data),
        signal: controller.signal
      })
      
      clearTimeout(timeoutId)
      
      if (response.status === 401) {
        try {
          const authStore = useAuthStore()
          authStore.logout()
        } catch (e) {
          // ignore
        }
        window.location.href = '/login'
        throw new Error('Authentication required')
      }

      if (!response.ok) {
        const errorText = await response.text()
        // console.error('API error response:', errorText)
        throw new Error(`API error: ${response.statusText}`)
      }
      
      return response.json()
    } catch (error: any) {
      clearTimeout(timeoutId)
      if (error.name === 'AbortError') {
        throw new Error('Request timeout - server took too long to respond')
      }
      throw error
    }
  }

  async delete(endpoint: string): Promise<any> {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method: 'DELETE',
      headers: this.getHeaders()
    })
    
    if (response.status === 401) {
      try {
        const authStore = useAuthStore()
        authStore.logout()
      } catch (e) {
        // ignore
      }
      window.location.href = '/login'
      throw new Error('Authentication required')
    }

    if (!response.ok) {
      throw new Error(`API error: ${response.statusText}`)
    }

    return response.json()
  }
}

export const api = new ApiClient()
