<template>
  <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 to-secondary/10 p-4">
    <div class="bg-white dark:bg-surface border-2 border-primary/20 dark:border-primary/30 rounded-card p-8 max-w-lg w-full shadow-lg max-h-[90vh] overflow-y-auto">
      <div class="text-center mb-8">
        <h1 class="text-3xl font-bold text-primary mb-2">Welcome to Farm Manager!</h1>
        <p class="text-text/60">Create your farm and customize your farming experience</p>
      </div>

      <form @submit.prevent="handleCreate" class="space-y-6">
        <!-- Basic Information -->
        <div class="space-y-4">
          <h3 class="text-lg font-semibold text-text border-b border-primary/20 pb-2">Basic Information</h3>
          
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
        </div>

        <!-- Game Settings -->
        <div class="space-y-4">
          <h3 class="text-lg font-semibold text-text border-b border-primary/20 pb-2">Game Settings</h3>
          
          <div>
            <label class="block text-sm font-medium text-text mb-2">Starting Funds</label>
          <input
            v-model.number="formData.startingFunds"
            type="number"
            step="1"
            min="0"
            :placeholder="`e.g., ${formData.currency === 'USD' ? '$' : formData.currency === 'EUR' ? '€' : '£'}100,000`"
            class="w-full px-4 py-2 border-2 border-primary/20 rounded-lg focus:outline-none focus:border-primary"
          />
          <p class="text-xs text-text/60 mt-1">Will be added as opening balance in your finances</p>
        </div>

        <div>
          <label class="block text-sm font-medium text-text mb-2">Currency</label>
          <select
            v-model="formData.currency"
            class="w-full px-4 py-2 border-2 border-primary/20 rounded-lg focus:outline-none focus:border-primary"
          >
            <option value="GBP">British Pound (£)</option>
            <option value="USD">US Dollar ($)</option>
            <option value="EUR">Euro (€)</option>
            <option value="CAD">Canadian Dollar (C$)</option>
            <option value="AUD">Australian Dollar (A$)</option>
            <option value="DKK">Danish Krone (kr)</option>
            <option value="NOK">Norwegian Krone (kr)</option>
            <option value="SEK">Swedish Krona (kr)</option>
            <option value="CHF">Swiss Franc (CHF)</option>
          </select>
        </div>

        <div>
          <label class="block text-sm font-medium text-text mb-2">Field Size Units</label>
          <select
            v-model="formData.areaUnit"
            class="w-full px-4 py-2 border-2 border-primary/20 rounded-lg focus:outline-none focus:border-primary"
          >
            <option value="hectares">Hectares (ha)</option>
            <option value="acres">Acres (ac)</option>
          </select>
          <p class="text-xs text-text/60 mt-1">Choose how field sizes are displayed and entered</p>
        </div>

        <div>
          <label class="block text-sm font-medium text-text mb-2">Days Per Month</label>
          <input
            v-model.number="formData.daysPerMonth"
            type="number"
            min="1"
            max="31"
            class="w-full px-4 py-2 border-2 border-primary/20 rounded-lg focus:outline-none focus:border-primary"
          />
          <p class="text-xs text-text/60 mt-1">Set how many days are in each month (1-31 days, affects game date progression)</p>
        </div>
        </div>

        <!-- Starting Date -->
        <div class="space-y-4">
          <h3 class="text-lg font-semibold text-text border-b border-primary/20 pb-2">Starting Date</h3>
          <div class="grid grid-cols-3 gap-4">
            <div>
              <label class="block text-sm font-medium text-text mb-2">Year</label>
              <input
                v-model.number="formData.currentYear"
                type="number"
                min="1"
                max="9999"
                class="w-full px-4 py-2 border-2 border-primary/20 rounded-lg focus:outline-none focus:border-primary"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-text mb-2">Month</label>
              <select
                v-model.number="formData.currentMonth"
                class="w-full px-4 py-2 border-2 border-primary/20 rounded-lg focus:outline-none focus:border-primary"
              >
                <option :value="1">January</option>
                <option :value="2">February</option>
                <option :value="3">March</option>
                <option :value="4">April</option>
                <option :value="5">May</option>
                <option :value="6">June</option>
                <option :value="7">July</option>
                <option :value="8">August</option>
                <option :value="9">September</option>
                <option :value="10">October</option>
                <option :value="11">November</option>
                <option :value="12">December</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-text mb-2">Day</label>
              <input
                v-model.number="formData.currentDay"
                type="number"
                :min="1"
                :max="formData.daysPerMonth"
                class="w-full px-4 py-2 border-2 border-primary/20 rounded-lg focus:outline-none focus:border-primary"
              />
            </div>
          </div>
          <p class="text-xs text-text/60">Choose the starting date for your farm's game calendar</p>
        </div>

        <div v-if="error" class="bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800/50 rounded-lg p-4">
          <p class="text-red-800 dark:text-red-300 text-sm">{{ error }}</p>
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
import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useFarmStore } from '../stores/farm'

const router = useRouter()
const farmStore = useFarmStore()

const formData = ref({
  name: '',
  mapName: '',
  startingFunds: 100000,
  currentYear: 1,
  currentMonth: 9,
  currentDay: 1,
  currency: 'GBP',
  areaUnit: 'hectares',
  daysPerMonth: 30
})

const customMapName = ref('')
const joinCode = ref('')
const error = ref('')
const isSubmitting = ref(false)
const isJoining = ref(false)

// Watch for changes in daysPerMonth and adjust currentDay if needed
watch(() => formData.value.daysPerMonth, (newDaysPerMonth) => {
  if (formData.value.currentDay > newDaysPerMonth) {
    formData.value.currentDay = newDaysPerMonth
  }
})

async function handleCreate() {
  if (!formData.value.name || !formData.value.mapName) {
    error.value = 'Please fill in all required fields'
    return
  }

  // Additional validation
  if (formData.value.currentYear < 1 || formData.value.currentYear > 9999) {
    error.value = 'Year must be between 1 and 9999'
    return
  }
  if (formData.value.startingFunds < 0) {
    error.value = 'Starting funds cannot be negative'
    return
  }
  if (formData.value.daysPerMonth < 1 || formData.value.daysPerMonth > 31) {
    error.value = 'Days per month must be between 1 and 31'
    return
  }
  if (formData.value.currentDay > formData.value.daysPerMonth) {
    error.value = `Day cannot be greater than ${formData.value.daysPerMonth} for the selected month length`
    return
  }

  isSubmitting.value = true
  error.value = ''

  try {
    const mapName = formData.value.mapName === 'Custom' 
      ? customMapName.value || 'Custom Map'
      : formData.value.mapName

    await farmStore.createFarm(
      formData.value.name, 
      mapName, 
      formData.value.startingFunds,
      formData.value.currentYear,
      formData.value.currentMonth,
      formData.value.currentDay,
      formData.value.currency,
      formData.value.areaUnit,
      formData.value.daysPerMonth
    )
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
