<template>
  <div class="min-h-screen flex items-center justify-center p-4">
    <div class="w-full max-w-md bg-white dark:bg-gray-800 rounded-card shadow-lg p-8 border-2 border-gray-200 dark:border-gray-700">
      <h1 class="text-3xl font-bold text-primary mb-2">Create Account</h1>
      <p class="text-text/60 mb-8">Join FS25 Farm Manager</p>
      
      <form @submit.prevent="handleRegister" class="space-y-4">
        <div>
          <label class="block text-sm font-medium mb-2 text-text">Name</label>
          <input
            v-model="name"
            type="text"
            required
            class="w-full px-4 py-2 border border-primary/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        
        <div>
          <label class="block text-sm font-medium mb-2 text-text">Email</label>
          <input
            v-model="email"
            type="email"
            required
            class="w-full px-4 py-2 border border-primary/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        
        <div>
          <label class="block text-sm font-medium mb-2 text-text">Password</label>
          <input
            v-model="password"
            type="password"
            required
            minlength="8"
            class="w-full px-4 py-2 border border-primary/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        
        <button
          type="submit"
          :disabled="loading"
          class="w-full bg-primary text-white py-3 rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50"
        >
          {{ loading ? 'Creating account...' : 'Register' }}
        </button>
        
        <p v-if="error" class="text-red-600 dark:text-red-400 text-sm">{{ error }}</p>
      </form>
      
      <p class="mt-6 text-center text-sm">
        Already have an account?
        <RouterLink to="/login" class="text-primary font-medium">Log in</RouterLink>
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter, RouterLink } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const name = ref('')
const email = ref('')
const password = ref('')
const loading = ref(false)
const error = ref('')

async function handleRegister() {
  loading.value = true
  error.value = ''
  
  try {
    await authStore.register(name.value, email.value, password.value)
    router.push('/app')
  } catch (e: any) {
    error.value = e.message || 'Failed to register'
  } finally {
    loading.value = false
  }
}
</script>
