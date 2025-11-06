<template>
  <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 to-secondary/10 p-4">
    <div class="bg-white dark:bg-gray-800 border-2 border-primary/20 dark:border-gray-700 rounded-card p-8 max-w-md w-full shadow-lg">
      <div class="text-center mb-8">
        <h1 class="text-3xl font-bold text-primary mb-2">Welcome to Farm Manager!</h1>
        <p class="text-text/60">Create your first farm to get started</p>
      </div>

      <form @submit.prevent="handleCreate" class="space-y-6">
        <div>
          <label class="block text-sm font-medium text-text mb-2">Farm Name *</label>
          <input
            v-model="formData.name"
            type="text"
            required
            placeholder="e.g., Green Valley Farm"
            class="w-full px-4 py-2 border-2 border-primary/20 rounded-lg focus:outline-none focus:border-primary"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-text mb-2">Map Name *</label>
          <select
            v-model="formData.mapName"
            required
            class="w-full px-4 py-2 border-2 border-primary/20 rounded-lg focus:outline-none focus:border-primary"
          >
            <option value="">Select a map...</option>
            <option value="Hutan Pantai">Hutan Pantai</option>
            <option value="Riverbend Springs">Riverbend Springs</option>
            <option value="Zielonka">Zielonka</option>
            <option value="Elmcreek">Elmcreek</option>
            <option value="Erlengrat">Erlengrat</option>
            <option value="Haut-Beyleron">Haut-Beyleron</option>
            <option value="Custom">Custom Map</option>
          </select>
        </div>

        <div v-if="formData.mapName === 'Custom'">
          <label class="block text-sm font-medium text-text mb-2">Custom Map Name</label>
          <input
            v-model="customMapName"
            type="text"
            placeholder="Enter custom map name"
            class="w-full px-4 py-2 border-2 border-primary/20 rounded-lg focus:outline-none focus:border-primary"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-text mb-2">Starting Funds (£)</label>
          <input
            v-model.number="formData.startingFunds"
            type="number"
            step="1000"
            min="0"
            placeholder="e.g., 100000"
            class="w-full px-4 py-2 border-2 border-primary/20 rounded-lg focus:outline-none focus:border-primary"
          />
          <p class="text-xs text-text/60 mt-1">Will be added as opening balance in your finances</p>
        </div>

        <div v-if="error" class="bg-red-50 border-2 border-red-200 rounded-lg p-4">
          <p class="text-red-800 text-sm">{{ error }}</p>
        </div>

        <button
          type="submit"
          :disabled="isSubmitting"
          class="w-full py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition disabled:opacity-50 font-medium"
        >
          {{ isSubmitting ? 'Creating...' : 'Create Farm' }}
        </button>
      </form>

      <div class="mt-6 pt-6 border-t-2 border-primary/10">
        <p class="text-sm text-text/60 text-center mb-4">Or join an existing farm</p>
        
        <form @submit.prevent="handleJoin" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-text mb-2">Join Code</label>
            <input
              v-model="joinCode"
              type="text"
              placeholder="Enter 10-character code"
              maxlength="10"
              class="w-full px-4 py-2 border-2 border-primary/20 rounded-lg focus:outline-none focus:border-primary"
            />
          </div>

          <button
            type="submit"
            :disabled="isJoining || joinCode.length !== 10"
            class="w-full py-2 bg-secondary text-white rounded-lg hover:bg-secondary/90 transition disabled:opacity-50 font-medium"
          >
            {{ isJoining ? 'Joining...' : 'Join Farm' }}
          </button>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useFarmStore } from '../stores/farm'

const router = useRouter()
const farmStore = useFarmStore()

const formData = ref({
  name: '',
  mapName: '',
  startingFunds: 100000
})

const customMapName = ref('')
const joinCode = ref('')
const error = ref('')
const isSubmitting = ref(false)
const isJoining = ref(false)

async function handleCreate() {
  if (!formData.value.name || !formData.value.mapName) {
    error.value = 'Please fill in all required fields'
    return
  }

  isSubmitting.value = true
  error.value = ''

  try {
    const mapName = formData.value.mapName === 'Custom' 
      ? customMapName.value || 'Custom Map'
      : formData.value.mapName

    await farmStore.createFarm(formData.value.name, mapName, formData.value.startingFunds)
    router.push('/app')
  } catch (err: any) {
    error.value = err.message || 'Failed to create farm'
  } finally {
    isSubmitting.value = false
  }
}

async function handleJoin() {
  if (joinCode.value.length !== 10) {
    alert('Please enter a valid 10-character join code')
    return
  }

  isJoining.value = true

  try {
    await farmStore.joinFarm(joinCode.value)
    router.push('/app')
  } catch (err: any) {
    alert(err.message || 'Failed to join farm')
  } finally {
    isJoining.value = false
  }
}
</script>
