<template>
  <div class="py-8">
    <div class="flex justify-between items-center mb-8">
      <h2 class="text-3xl font-bold text-primary">Farm Settings</h2>
      <RouterLink
        to="/create-farm"
        class="px-4 py-2 bg-secondary text-white rounded-lg hover:bg-secondary/90 transition flex items-center gap-2"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clip-rule="evenodd" />
        </svg>
        Create New Farm
      </RouterLink>
    </div>

    <div v-if="!isOwner" class="bg-yellow-50 border-2 border-yellow-200 rounded-card p-6 mb-6">
      <p class="text-yellow-800">
        <strong>Note:</strong> Only farm owners can edit settings. You are currently a {{ userRole }}.
      </p>
    </div>

    <!-- Farm Details -->
    <div class="bg-white dark:bg-gray-800 border-2 border-primary/20 dark:border-gray-700 rounded-card p-6 mb-6">
      <h3 class="text-xl font-bold text-primary mb-4">Farm Details</h3>
      
      <form @submit.prevent="handleUpdateFarm" class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-text mb-2">Farm Name</label>
          <input
            v-model="farmForm.name"
            type="text"
            :disabled="!isOwner || isUpdating"
            required
            class="w-full px-4 py-2 border-2 border-primary/20 rounded-lg focus:outline-none focus:border-primary disabled:bg-gray-100"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-text mb-2">Map Name</label>
          <input
            v-model="farmForm.mapName"
            type="text"
            :disabled="!isOwner || isUpdating"
            required
            class="w-full px-4 py-2 border-2 border-primary/20 rounded-lg focus:outline-none focus:border-primary disabled:bg-gray-100"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-text mb-2">Currency</label>
          <select
            v-model="farmForm.currency"
            :disabled="!isOwner || isUpdating"
            class="w-full px-4 py-2 border-2 border-primary/20 rounded-lg focus:outline-none focus:border-primary disabled:bg-gray-100"
          >
            <option value="GBP">£ (GBP)</option>
            <option value="EUR">€ (EUR)</option>
            <option value="USD">$ (USD)</option>
          </select>
        </div>

        <div>
          <label class="block text-sm font-medium text-text mb-2">Days Per Month</label>
          <input
            v-model.number="farmForm.daysPerMonth"
            type="number"
            min="1"
            max="31"
            :disabled="!isOwner || isUpdating"
            required
            class="w-full px-4 py-2 border-2 border-primary/20 rounded-lg focus:outline-none focus:border-primary disabled:bg-gray-100"
          />
          <p class="text-sm text-text/60 mt-1">Set how many days are in each month (affects game date progression)</p>
        </div>

        <div>
          <label class="block text-sm font-medium text-text mb-2">Field Size Units</label>
          <select
            v-model="farmForm.areaUnit"
            :disabled="!isOwner || isUpdating"
            class="w-full px-4 py-2 border-2 border-primary/20 rounded-lg focus:outline-none focus:border-primary disabled:bg-gray-100"
          >
            <option value="hectares">Hectares (ha)</option>
            <option value="acres">Acres (ac)</option>
          </select>
          <p class="text-sm text-text/60 mt-1">Choose how field sizes are displayed and entered.</p>
        </div>

        <button
          v-if="isOwner"
          type="submit"
          :disabled="isUpdating"
          class="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition disabled:opacity-50"
        >
          {{ isUpdating ? 'Saving...' : 'Save Changes' }}
        </button>
      </form>
    </div>

    <!-- Game Date Jump -->
    <div class="bg-white dark:bg-gray-800 border-2 border-primary/20 dark:border-gray-700 rounded-card p-6 mb-6">
      <div class="flex justify-between items-center mb-4">
        <h3 class="text-xl font-bold text-primary">Jump to Date</h3>
        <button
          v-if="isOwner"
          @click="showCalendarPicker = !showCalendarPicker"
          type="button"
          class="px-4 py-2 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition flex items-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clip-rule="evenodd" />
          </svg>
          {{ showCalendarPicker ? 'Hide Calendar' : 'Show Calendar' }}
        </button>
      </div>
      
      <p class="text-sm text-text/60 mb-4">
        Current Date: <span class="font-semibold text-primary">{{ currentGameDate }}</span>
      </p>

      <!-- Calendar Picker View -->
      <div v-if="showCalendarPicker" class="mb-6 bg-gradient-to-br from-green-50 to-blue-50 dark:from-gray-700 dark:to-gray-600 rounded-lg p-6">
        <!-- Year and Month Selector -->
        <div class="flex justify-between items-center mb-6">
          <button
            @click="navigateMonth(-1)"
            type="button"
            class="p-2 hover:bg-white/50 dark:hover:bg-gray-800/50 rounded-lg transition"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <div class="flex gap-4">
            <select
              v-model.number="dateJumpForm.month"
              class="px-4 py-2 bg-white dark:bg-gray-800 border-2 border-primary/20 rounded-lg focus:outline-none focus:border-primary font-semibold"
            >
              <option v-for="(month, index) in monthNames" :key="index" :value="index + 1">
                {{ month }}
              </option>
            </select>

            <input
              v-model.number="dateJumpForm.year"
              type="number"
              min="1"
              class="w-24 px-4 py-2 bg-white dark:bg-gray-800 border-2 border-primary/20 rounded-lg focus:outline-none focus:border-primary font-semibold text-center"
            />
          </div>

          <button
            @click="navigateMonth(1)"
            type="button"
            class="p-2 hover:bg-white/50 dark:hover:bg-gray-800/50 rounded-lg transition"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        <!-- Calendar Grid -->
        <div class="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-lg">
          <div class="grid grid-cols-7 gap-2">
            <!-- Day Headers -->
            <div v-for="day in ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']" :key="day" class="text-center text-sm font-semibold text-gray-600 dark:text-gray-400 py-2">
              {{ day }}
            </div>

            <!-- Calendar Days -->
            <button
              v-for="dayNum in calendarDays"
              :key="dayNum"
              @click="selectDay(dayNum)"
              type="button"
              :disabled="dayNum === 0"
              :class="[
                'aspect-square rounded-lg transition-all',
                dayNum === 0 ? 'invisible' : '',
                dayNum === dateJumpForm.day && !isJumping ? 'bg-primary text-white font-bold shadow-lg scale-110' : 'bg-surface/50 dark:bg-surface hover:bg-primary/20 dark:hover:bg-primary/30 text-text',
                dayNum === farmStore.currentFarm?.currentDay && dateJumpForm.month === farmStore.currentFarm?.currentMonth && dateJumpForm.year === farmStore.currentFarm?.currentYear ? 'ring-2 ring-secondary' : ''
              ]"
            >
              {{ dayNum || '' }}
            </button>
          </div>

          <!-- Quick Actions -->
          <div class="flex gap-2 mt-4">
            <button
              @click="setToday"
              type="button"
              class="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition text-sm font-medium"
            >
              Current Date
            </button>
            <button
              @click="handleJumpToDate"
              type="button"
              :disabled="isJumping"
              class="flex-1 px-4 py-2 bg-secondary text-white rounded-lg hover:bg-secondary/90 transition text-sm font-medium disabled:opacity-50"
            >
              {{ isJumping ? 'Jumping...' : 'Jump to Selected' }}
            </button>
          </div>
        </div>
      </div>

      <!-- Simple Form View (Original) -->
      <form v-else @submit.prevent="handleJumpToDate" class="space-y-4">

        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label class="block text-sm font-medium text-text mb-2">Year</label>
            <input
              v-model.number="dateJumpForm.year"
              type="number"
              min="1"
              :disabled="!isOwner || isJumping"
              required
              class="w-full px-4 py-2 border-2 border-primary/20 rounded-lg focus:outline-none focus:border-primary disabled:bg-gray-100"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-text mb-2">Month</label>
            <select
              v-model.number="dateJumpForm.month"
              :disabled="!isOwner || isJumping"
              class="w-full px-4 py-2 border-2 border-primary/20 rounded-lg focus:outline-none focus:border-primary disabled:bg-gray-100"
            >
              <option v-for="(month, index) in monthNames" :key="index" :value="index + 1">
                {{ month }}
              </option>
            </select>
          </div>

          <div>
            <label class="block text-sm font-medium text-text mb-2">Day</label>
            <input
              v-model.number="dateJumpForm.day"
              type="number"
              min="1"
              :max="farmForm.daysPerMonth"
              :disabled="!isOwner || isJumping"
              required
              class="w-full px-4 py-2 border-2 border-primary/20 rounded-lg focus:outline-none focus:border-primary disabled:bg-gray-100"
            />
          </div>
        </div>

        <button
          v-if="isOwner"
          type="submit"
          :disabled="isJumping"
          class="px-6 py-2 bg-secondary text-white rounded-lg hover:bg-secondary/90 transition disabled:opacity-50"
        >
          {{ isJumping ? 'Jumping...' : 'Jump to Date' }}
        </button>
      </form>
    </div>

    <!-- Members (Owner/Editor only) -->
    <div v-if="userRole !== 'viewer'" class="bg-white dark:bg-gray-800 border-2 border-primary/20 dark:border-gray-700 rounded-card p-6 mb-6">
      <h3 class="text-xl font-bold text-primary mb-4">Farm Members</h3>
      
      <div v-if="isLoadingMembers" class="text-center py-4">
        <p class="text-text/60">Loading members...</p>
      </div>

      <div v-else-if="members.length === 0" class="text-center py-4">
        <p class="text-text/60">No members found.</p>
      </div>

      <div v-else class="space-y-3">
        <div
          v-for="member in members"
          :key="member.id"
          class="flex items-center justify-between p-4 bg-surface rounded-lg"
        >
          <div class="flex-1">
            <p class="font-medium text-text">{{ member.name }}</p>
            <p class="text-sm text-text/70">{{ member.email }}</p>
            <p class="text-xs text-text/60 mt-1">Joined {{ formatDate(member.joinedAt) }}</p>
          </div>

          <div class="flex items-center gap-3">
            <select
              v-if="isOwner && member.userId !== authStore.user?.id"
              v-model="memberRoles[member.id]"
              @change="handleRoleChange(member.id)"
              class="px-3 py-1 border-2 border-primary/20 rounded-lg text-sm focus:outline-none focus:border-primary"
            >
              <option value="owner">Owner</option>
              <option value="editor">Editor</option>
              <option value="viewer">Viewer</option>
            </select>
            <span v-else class="px-3 py-1 bg-primary/10 text-primary rounded-lg text-sm font-medium">
              {{ member.role }}
            </span>

            <button
              v-if="isOwner && member.userId !== authStore.user?.id"
              @click="handleRemoveMember(member.id)"
              class="px-3 py-1 bg-red-600 dark:bg-red-700 text-white rounded-lg hover:bg-red-700 dark:hover:bg-red-800 transition text-sm"
            >
              Remove
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Join Codes (Owner only) -->
    <div v-if="isOwner" class="bg-white dark:bg-gray-800 border-2 border-primary/20 dark:border-gray-700 rounded-card p-6">
      <h3 class="text-xl font-bold text-primary mb-2">Invite Members</h3>
      <p class="text-sm text-text/60 mb-4">Share join codes with team members so they can join your farm</p>
      
      <div class="mb-4">
        <button
          @click="handleCreateJoinCode"
          :disabled="isCreatingCode"
          class="px-6 py-2 bg-secondary text-white rounded-lg hover:bg-secondary/90 transition disabled:opacity-50 font-medium"
        >
          {{ isCreatingCode ? 'Creating...' : '+ Generate New Join Code' }}
        </button>
      </div>

      <div v-if="isLoadingCodes" class="text-center py-4">
        <p class="text-text/60">Loading codes...</p>
      </div>

      <div v-else-if="joinCodes.length === 0" class="text-center py-8 bg-surface rounded-lg">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 mx-auto text-text/40 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
        <p class="text-text/70 font-medium mb-1">No Active Join Codes</p>
        <p class="text-text/60 text-sm">Generate a code above to invite members to your farm</p>
      </div>

      <div v-else class="space-y-3">
        <div
          v-for="code in joinCodes"
          :key="code.id"
          class="p-5 bg-gradient-to-r from-primary/5 to-secondary/5 border-2 border-primary/20 rounded-lg"
        >
          <div class="flex items-center justify-between mb-3">
            <div>
              <p class="text-xs text-text/60 mb-1">Join Code</p>
              <code class="text-2xl font-mono font-bold text-primary tracking-wider">{{ code.code }}</code>
            </div>
            <button
              @click="copyCode(code.code)"
              class="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition font-medium flex items-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
                <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
              </svg>
              Copy Code
            </button>
          </div>
          <div class="flex items-center gap-2 text-sm text-text/60">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clip-rule="evenodd" />
            </svg>
            <span>Expires: {{ formatDate(code.expiresAt) }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Danger Zone (Owner only) -->
    <div v-if="isOwner" class="bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800/50 rounded-card p-6">
      <h3 class="text-xl font-bold text-red-700 dark:text-red-400 mb-4">Danger Zone</h3>
      
      <div class="space-y-4">
        <div class="flex items-start justify-between">
          <div>
            <p class="font-medium text-red-800 dark:text-red-300">Delete This Farm</p>
            <p class="text-sm text-red-600 dark:text-red-400 mt-1">
              Once you delete a farm, there is no going back. All data including fields, animals, equipment, and finances will be permanently deleted.
            </p>
          </div>
          <button
            @click="confirmDeleteFarm"
            class="px-6 py-2 bg-red-600 dark:bg-red-700 text-white rounded-lg hover:bg-red-700 dark:hover:bg-red-800 transition font-medium whitespace-nowrap ml-4"
          >
            Delete Farm
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { RouterLink } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useFarmStore, type FarmMember } from '../stores/farm'
import { formatGameDate } from '../utils/gameDate'

const authStore = useAuthStore()
const farmStore = useFarmStore()

const monthNames = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]

const farmForm = ref({
  name: '',
  mapName: '',
  currency: 'GBP',
  daysPerMonth: 28,
  areaUnit: 'hectares'
})

const dateJumpForm = ref({
  year: 1,
  month: 1,
  day: 1
})

const showCalendarPicker = ref(false)

const members = ref<FarmMember[]>([])
const memberRoles = ref<Record<number, string>>({})
const joinCodes = ref<any[]>([])

const userRole = computed(() => farmStore.currentUserRole)
const isOwner = computed(() => userRole.value === 'owner')

const isUpdating = ref(false)
const isJumping = ref(false)
const isLoadingMembers = ref(false)
const isLoadingCodes = ref(false)
const isCreatingCode = ref(false)

// Generate calendar days for the current month
const calendarDays = computed(() => {
  const daysInMonth = farmStore.currentFarm?.daysPerMonth || 28
  const days: number[] = []
  
  // Calculate what day of the week the month starts on
  // For simplicity, we'll start every month on Sunday (index 0)
  // You could enhance this based on the year/month if needed
  const startDayOfWeek = 0 // Sunday
  
  // Add empty slots for days before the month starts
  for (let i = 0; i < startDayOfWeek; i++) {
    days.push(0)
  }
  
  // Add all days of the month
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i)
  }
  
  // Fill remaining slots to complete the grid (7 days per week)
  while (days.length % 7 !== 0) {
    days.push(0)
  }
  
  return days
})

const currentGameDate = computed(() => {
  const farm = farmStore.currentFarm
  if (!farm) return 'No farm selected'
  return formatGameDate(farm.currentYear, farm.currentMonth, farm.currentDay)
})

// Calendar picker functions
const navigateMonth = (direction: number) => {
  dateJumpForm.value.month += direction
  
  if (dateJumpForm.value.month > 12) {
    dateJumpForm.value.month = 1
    dateJumpForm.value.year++
  } else if (dateJumpForm.value.month < 1) {
    dateJumpForm.value.month = 12
    dateJumpForm.value.year--
  }
  
  // Adjust day if it exceeds the month's max days
  const maxDays = farmStore.currentFarm?.daysPerMonth || 28
  if (dateJumpForm.value.day > maxDays) {
    dateJumpForm.value.day = maxDays
  }
}

const selectDay = (day: number) => {
  if (day > 0) {
    dateJumpForm.value.day = day
  }
}

const setToday = () => {
  if (farmStore.currentFarm) {
    dateJumpForm.value.year = farmStore.currentFarm.currentYear
    dateJumpForm.value.month = farmStore.currentFarm.currentMonth
    dateJumpForm.value.day = farmStore.currentFarm.currentDay
  }
}

onMounted(async () => {
  // Refresh farms to ensure we have latest role data
  await farmStore.fetchFarms()
  await loadFarmData()
  if (userRole.value !== 'viewer') {
    await loadMembers()
  }
  if (isOwner.value) {
    await loadJoinCodes()
  }
})

watch(() => farmStore.currentFarmId, async () => {
  await farmStore.fetchFarms()
  await loadFarmData()
  if (userRole.value !== 'viewer') {
    await loadMembers()
  }
  if (isOwner.value) {
    await loadJoinCodes()
  }
})

async function loadFarmData() {
  const farm = farmStore.currentFarm
  console.log('Current farm:', farm)
  console.log('User role:', userRole.value)
  if (farm) {
    farmForm.value = {
      name: farm.name,
      mapName: farm.mapName,
      currency: farm.currency,
      daysPerMonth: farm.daysPerMonth || 28,
      areaUnit: (farm as any).areaUnit || 'hectares'
    }
    
    // Initialize date jump form with current date
    dateJumpForm.value = {
      year: farm.currentYear || 1,
      month: farm.currentMonth || 1,
      day: farm.currentDay || 1
    }
  }
}

async function loadMembers() {
  if (!farmStore.currentFarmId) return
  
  isLoadingMembers.value = true
  try {
    members.value = await farmStore.getMembers(farmStore.currentFarmId)
    // Initialize role tracking
    members.value.forEach(member => {
      memberRoles.value[member.id] = member.role
    })
  } catch (error: any) {
    console.error('Failed to load members:', error)
    alert(error.message || 'Failed to load members')
  } finally {
    isLoadingMembers.value = false
  }
}

async function loadJoinCodes() {
  if (!farmStore.currentFarmId) return
  
  isLoadingCodes.value = true
  try {
    joinCodes.value = await farmStore.getJoinCodes(farmStore.currentFarmId)
  } catch (error: any) {
    console.error('Failed to load join codes:', error)
    alert(error.message || 'Failed to load join codes')
  } finally {
    isLoadingCodes.value = false
  }
}

async function handleUpdateFarm() {
  if (!farmStore.currentFarmId || !isOwner.value) return
  
  isUpdating.value = true
  try {
    await farmStore.updateFarm(farmStore.currentFarmId, farmForm.value)
    alert('Farm details updated successfully!')
  } catch (error: any) {
    console.error('Failed to update farm:', error)
    alert(error.message || 'Failed to update farm')
  } finally {
    isUpdating.value = false
  }
}

async function handleJumpToDate() {
  if (!farmStore.currentFarmId || !isOwner.value) return
  
  isJumping.value = true
  try {
    await farmStore.jumpToDate(
      dateJumpForm.value.year,
      dateJumpForm.value.month,
      dateJumpForm.value.day
    )
    alert('Successfully jumped to new date!')
  } catch (error: any) {
    console.error('Failed to jump to date:', error)
    alert(error.message || 'Failed to jump to date')
  } finally {
    isJumping.value = false
  }
}

async function handleRoleChange(memberId: number) {
  if (!farmStore.currentFarmId || !isOwner.value) return
  
  try {
    const newRole = memberRoles.value[memberId]
    await farmStore.updateMemberRole(farmStore.currentFarmId, memberId, newRole)
    
    // Update local data
    const member = members.value.find(m => m.id === memberId)
    if (member) {
      member.role = newRole
    }
    
    alert('Member role updated successfully!')
  } catch (error: any) {
    console.error('Failed to update member role:', error)
    alert(error.message || 'Failed to update member role')
    await loadMembers() // Reload to reset
  }
}

async function handleRemoveMember(memberId: number) {
  if (!farmStore.currentFarmId || !isOwner.value) return
  
  if (!confirm('Are you sure you want to remove this member?')) return
  
  try {
    await farmStore.removeMember(farmStore.currentFarmId, memberId)
    members.value = members.value.filter(m => m.id !== memberId)
    alert('Member removed successfully!')
  } catch (error: any) {
    console.error('Failed to remove member:', error)
    alert(error.message || 'Failed to remove member')
  }
}

async function handleCreateJoinCode() {
  if (!farmStore.currentFarmId || !isOwner.value) return
  
  isCreatingCode.value = true
  try {
    await farmStore.createJoinCode(farmStore.currentFarmId)
    await loadJoinCodes()
    alert('Join code created successfully!')
  } catch (error: any) {
    console.error('Failed to create join code:', error)
    alert(error.message || 'Failed to create join code')
  } finally {
    isCreatingCode.value = false
  }
}

function copyCode(code: string) {
  navigator.clipboard.writeText(code)
  alert('Code copied to clipboard!')
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  })
}

async function confirmDeleteFarm() {
  if (!farmStore.currentFarmId || !isOwner.value) return
  
  const farmName = farmStore.currentFarm?.name || 'this farm'
  
  // First confirmation
  if (!confirm(`Are you sure you want to delete "${farmName}"? This action cannot be undone.`)) {
    return
  }
  
  // Second confirmation - type farm name
  const typedName = prompt(`To confirm deletion, please type the farm name: ${farmName}`)
  
  if (typedName !== farmName) {
    alert('Farm name did not match. Deletion cancelled.')
    return
  }
  
  try {
    const currentId = farmStore.currentFarmId
    await farmStore.deleteFarm(currentId)
    alert('Farm deleted successfully')
    
    // Check if there are other farms available
    await farmStore.fetchFarms()
    
    if (farmStore.farms.length > 0) {
      // Switch to the first available farm
      farmStore.setCurrentFarm(farmStore.farms[0].id)
      window.location.href = '/app'
    } else {
      // No farms left, redirect to create farm page
      window.location.href = '/create-farm'
    }
  } catch (error: any) {
    console.error('Failed to delete farm:', error)
    alert(error.message || 'Failed to delete farm')
  }
}
</script>
