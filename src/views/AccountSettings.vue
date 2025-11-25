<template>
  <div class="py-8">
    <div class="mb-8">
      <h2 class="text-3xl font-bold text-primary">Account Settings</h2>
      <p class="text-text/60 mt-2">Manage your personal account settings</p>
    </div>

    <!-- Account Information -->
    <div class="bg-white dark:bg-surface border-2 border-primary/20 dark:border-primary/30 rounded-card p-6 mb-6">
      <h3 class="text-xl font-bold text-primary mb-4">Account Information</h3>
      
      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-text mb-2">Name</label>
          <input
            type="text"
            :value="authStore.user?.name"
            disabled
            class="w-full px-4 py-2 border-2 border-primary/20 rounded-lg bg-gray-100 dark:bg-surface/50 text-text/60"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-text mb-2">Email</label>
          <input
            type="email"
            :value="authStore.user?.email"
            disabled
            class="w-full px-4 py-2 border-2 border-primary/20 rounded-lg bg-gray-100 dark:bg-surface/50 text-text/60"
          />
        </div>
      </div>
    </div>

    <!-- Danger Zone -->
    <div class="bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800/50 rounded-card p-6">
      <h3 class="text-xl font-bold text-red-700 dark:text-red-400 mb-4">Danger Zone</h3>
      
      <div class="space-y-4">
        <div>
          <p class="font-medium text-red-800 dark:text-red-300 mb-2">Delete Your Account</p>
          <div class="bg-white dark:bg-surface border-2 border-red-300 dark:border-red-800/50 rounded-lg p-4 mb-4">
            <p class="text-sm text-red-700 dark:text-red-400 mb-2 font-medium">⚠️ Warning: This action cannot be undone!</p>
            <p class="text-sm text-red-600 dark:text-red-400 mb-2">
              Deleting your account will:
            </p>
            <ul class="list-disc list-inside text-sm text-red-600 dark:text-red-400 space-y-1 ml-2">
              <li>Permanently delete all farms where you are the owner</li>
              <li>Delete all associated data (fields, animals, equipment, finances, etc.)</li>
              <li>Remove you from any farms where you are a member</li>
              <li>Delete your account and all personal information</li>
            </ul>
          </div>
          
          <button
            @click="showDeleteConfirm = true"
            class="px-6 py-2 bg-red-600 dark:bg-red-700 text-white rounded-lg hover:bg-red-700 dark:hover:bg-red-800 transition font-medium"
          >
            Delete My Account
          </button>
        </div>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <div
      v-if="showDeleteConfirm"
      class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      @click.self="showDeleteConfirm = false"
    >
      <div class="bg-white dark:bg-surface rounded-card p-6 max-w-md w-full">
        <h3 class="text-2xl font-bold text-red-700 dark:text-red-400 mb-4">Confirm Account Deletion</h3>
        
        <p class="text-text mb-4">
          Are you absolutely sure you want to delete your account? This will permanently delete:
        </p>
        
        <ul class="list-disc list-inside text-sm text-text/80 space-y-1 mb-4 ml-2">
          <li>Your user account</li>
          <li>All farms you own</li>
          <li>All data associated with your farms</li>
        </ul>
        
        <p class="text-sm text-red-600 dark:text-red-400 font-medium mb-6">
          This action is irreversible and cannot be undone!
        </p>

        <div class="space-y-3">
          <button
            @click="handleDeleteAccount"
            :disabled="isDeleting"
            class="w-full px-6 py-3 bg-red-600 dark:bg-red-700 text-white rounded-lg hover:bg-red-700 dark:hover:bg-red-800 transition font-medium disabled:opacity-50"
          >
            {{ isDeleting ? 'Deleting...' : 'Yes, Delete My Account' }}
          </button>
          
          <button
            @click="showDeleteConfirm = false"
            :disabled="isDeleting"
            class="w-full px-6 py-3 bg-gray-200 dark:bg-surface text-text rounded-lg hover:bg-gray-300 dark:hover:bg-surface/80 transition font-medium disabled:opacity-50"
          >
            Cancel
          </button>
        </div>

        <p v-if="deleteError" class="mt-4 text-red-600 dark:text-red-400 text-sm">
          {{ deleteError }}
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const showDeleteConfirm = ref(false)
const isDeleting = ref(false)
const deleteError = ref('')

async function handleDeleteAccount() {
  isDeleting.value = true
  deleteError.value = ''
  
  try {
    await authStore.deleteAccount()
    // User is automatically logged out and redirected by the store
    router.push('/login')
  } catch (error) {
    console.error('Delete account error:', error)
    deleteError.value = error instanceof Error ? error.message : 'Failed to delete account. Please try again.'
    isDeleting.value = false
  }
}
</script>
