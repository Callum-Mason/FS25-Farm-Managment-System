<template>
  <div class="space-y-6">
    <!-- Loading State -->
    <div v-if="loading" class="text-center py-12">
      <div class="text-xl text-text/60">Loading dashboard...</div>
    </div>

    <!-- Dashboard Content -->
    <div v-else>
      <!-- Welcome Header -->
      <div class="bg-gradient-to-r from-primary to-secondary text-white rounded-card p-6 lg:p-8 mb-6">
        <h2 class="text-2xl lg:text-3xl font-bold mb-2">Welcome to {{ farmName }}</h2>
        <p class="text-white/90">{{ currentGameDate }}</p>
      </div>

      <!-- Quick Stats -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      <div class="bg-white dark:bg-gray-800 rounded-card p-4 border-2 border-green-200 dark:border-green-900">
        <div class="text-sm text-text/60 mb-1">Balance</div>
        <div class="text-2xl font-bold" :class="balance >= 0 ? 'text-green-600' : 'text-red-600'">
          £{{ balance.toLocaleString('en-GB') }}
        </div>
      </div>
      <div class="bg-white dark:bg-gray-800 rounded-card p-4 border-2 border-primary/20 dark:border-gray-700">
        <div class="text-sm text-text/60 mb-1">Total Fields</div>
        <div class="text-2xl font-bold text-primary">{{ stats.totalFields }}</div>
      </div>
      <div class="bg-white dark:bg-gray-800 rounded-card p-4 border-2 border-primary/20 dark:border-gray-700">
        <div class="text-sm text-text/60 mb-1">Animals</div>
        <div class="text-2xl font-bold text-primary">{{ stats.totalAnimals }}</div>
      </div>
      <div class="bg-white dark:bg-gray-800 rounded-card p-4 border-2 border-primary/20 dark:border-gray-700">
        <div class="text-sm text-text/60 mb-1">Equipment</div>
        <div class="text-2xl font-bold text-primary">{{ stats.totalEquipment }}</div>
      </div>
      </div>

      <!-- Widgets Row -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6 mb-6">
      <!-- Financial Overview -->
      <div class="bg-white dark:bg-gray-800 rounded-card p-6 border-2 border-gray-200 dark:border-gray-700">
        <h3 class="text-xl font-bold text-primary mb-4">Financial Overview</h3>
        <div class="space-y-3">
          <div class="flex justify-between items-center">
            <span class="text-text/60">Total Income</span>
            <span class="text-lg font-bold text-green-600">+£{{ totalIncome.toLocaleString('en-GB') }}</span>
          </div>
          <div class="flex justify-between items-center">
            <span class="text-text/60">Total Expenses</span>
            <span class="text-lg font-bold text-red-600">-£{{ totalExpenses.toLocaleString('en-GB') }}</span>
          </div>
          <div class="border-t-2 border-gray-200 dark:border-gray-700 pt-3 flex justify-between items-center">
            <span class="font-medium">Net</span>
            <span class="text-xl font-bold" :class="balance >= 0 ? 'text-green-600' : 'text-red-600'">
              £{{ balance.toLocaleString('en-GB') }}
            </span>
          </div>
        </div>
      </div>

      <!-- Field Summary -->
      <div class="bg-white dark:bg-gray-800 rounded-card p-6 border-2 border-gray-200 dark:border-gray-700">
        <h3 class="text-xl font-bold text-primary mb-4">Field Summary</h3>
        <div class="space-y-4">
          <div class="flex justify-between items-center">
            <span class="text-text/60">Total Hectares</span>
            <span class="text-lg font-bold text-primary">{{ totalDisplay.toFixed(1) }} {{ unitIsAcres ? 'ac' : 'ha' }}</span>
          </div>
          
          <div v-if="cropBreakdown.length > 0">
            <div class="text-sm text-text/60 mb-3">Crop Distribution:</div>
            
            <!-- Pie Chart -->
            <div class="flex items-center justify-center mb-4">
              <svg width="160" height="160" viewBox="0 0 160 160" class="transform -rotate-90">
                <circle
                  v-for="(crop, index) in cropBreakdown"
                  :key="crop.crop"
                  cx="80"
                  cy="80"
                  r="60"
                  fill="none"
                  :stroke="getPieColor(index)"
                  stroke-width="40"
                  :stroke-dasharray="`${(crop.percentage / 100 * 377).toFixed(2)} 377`"
                  :stroke-dashoffset="getStrokeDashOffset(index)"
                  class="transition-all"
                />
              </svg>
            </div>
            
            <!-- Legend -->
            <div class="space-y-2">
              <div v-for="(crop, index) in cropBreakdown" :key="crop.crop" class="flex items-center justify-between text-sm">
                <div class="flex items-center gap-2">
                  <div class="w-3 h-3 rounded-full" :style="{ backgroundColor: getPieColor(index) }"></div>
                  <span>{{ crop.crop }}</span>
                </div>
                <span class="font-medium">{{ (unitIsAcres ? (crop.hectares * HA_TO_AC) : crop.hectares).toFixed(1) }} {{ unitIsAcres ? 'ac' : 'ha' }} ({{ crop.percentage.toFixed(1) }}%)</span>
              </div>
            </div>
          </div>
          <div v-else class="text-sm text-text/60 italic">No crops planted yet</div>
        </div>
      </div>
      </div>

      <!-- Recent Activity -->
      <div class="bg-white dark:bg-gray-800 rounded-card p-6 border-2 border-gray-200 dark:border-gray-700">
      <h3 class="text-xl font-bold text-primary mb-4">Recent Activity</h3>
      <div v-if="recentTransactions.length > 0" class="space-y-3">
        <div
          v-for="transaction in recentTransactions"
          :key="transaction.id"
          class="flex justify-between items-start py-2 border-b border-gray-200 dark:border-gray-700 last:border-0"
        >
          <div class="flex-1">
            <div class="font-medium text-text">{{ transaction.description }}</div>
            <div class="text-sm text-text/60">
              {{ transaction.category }} • {{ formatShortGameDate(transaction.gameYear, transaction.gameMonth, transaction.gameDay) }}
              <span v-if="transaction.createdByName"> • by {{ transaction.createdByName }}</span>
            </div>
          </div>
          <div class="text-right">
            <span
              class="font-bold"
              :class="transaction.type === 'income' ? 'text-green-600' : 'text-red-600'"
            >
              {{ transaction.type === 'income' ? '+' : '-' }}£{{ transaction.amount.toLocaleString('en-GB') }}
            </span>
          </div>
        </div>
      </div>
      <div v-else class="text-text/60 italic">No recent activity</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { h, ref, computed, onMounted } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { useFarmStore } from '../stores/farm'
import { formatGameDate, formatShortGameDate } from '../utils/gameDate'
import { api } from '../utils/api'

const route = useRoute()
const farmStore = useFarmStore()

interface Finance {
  id: number
  type: 'income' | 'expense'
  category: string
  description: string
  amount: number
  gameYear: number
  gameMonth: number
  gameDay: number
  createdByName?: string
}

interface Field {
  id: number
  name: string
  sizeHectares: number
  currentCrop: string | null
}

interface Animal {
  id: number
  type: string
  count: number
}

interface Equipment {
  id: number
  name: string
}

const finances = ref<Finance[]>([])
const fields = ref<Field[]>([])
const animals = ref<Animal[]>([])
const equipment = ref<Equipment[]>([])
const loading = ref(true)

const farmName = computed(() => farmStore.currentFarm?.name || 'Your Farm')

const currentGameDate = computed(() => {
  const farm = farmStore.currentFarm
  if (!farm) return ''
  return formatGameDate(farm.currentYear || 1, farm.currentMonth || 1, farm.currentDay || 1)
})

const balance = computed(() => {
  if (!Array.isArray(finances.value)) return 0
  return finances.value.reduce((acc, entry) => {
    return entry.type === 'income' ? acc + entry.amount : acc - entry.amount
  }, 0)
})

const totalIncome = computed(() => {
  if (!Array.isArray(finances.value)) return 0
  return finances.value
    .filter(f => f.type === 'income')
    .reduce((sum, f) => sum + f.amount, 0)
})

const totalExpenses = computed(() => {
  if (!Array.isArray(finances.value)) return 0
  return finances.value
    .filter(f => f.type === 'expense')
    .reduce((sum, f) => sum + f.amount, 0)
})

const stats = computed(() => ({
  totalFields: fields.value?.length || 0,
  totalAnimals: Array.isArray(animals.value) ? animals.value.reduce((sum, a) => sum + a.count, 0) : 0,
  totalEquipment: equipment.value?.length || 0
}))

const totalHectares = computed(() => {
  if (!Array.isArray(fields.value)) return 0
  return fields.value.reduce((sum, f) => sum + (f.sizeHectares || 0), 0)
})

// Unit handling
const HA_TO_AC = 2.47105381
const unitIsAcres = computed(() => farmStore.currentFarm?.areaUnit === 'acres')
const totalDisplay = computed(() => unitIsAcres.value ? totalHectares.value * HA_TO_AC : totalHectares.value)

const cropBreakdown = computed(() => {
  if (!Array.isArray(fields.value)) return []
  const crops: Record<string, number> = {}
  fields.value.forEach(field => {
    if (field.currentCrop) {
      crops[field.currentCrop] = (crops[field.currentCrop] || 0) + (field.sizeHectares || 0)
    }
  })
  return Object.entries(crops)
    .map(([crop, hectares]) => ({ 
      crop, 
      hectares,
      percentage: totalHectares.value > 0 ? (hectares / totalHectares.value * 100) : 0
    }))
    .sort((a, b) => b.hectares - a.hectares)
})

const recentTransactions = computed(() => {
  if (!Array.isArray(finances.value)) return []
  return [...finances.value]
    .sort((a, b) => {
      if (a.gameYear !== b.gameYear) return b.gameYear - a.gameYear
      if (a.gameMonth !== b.gameMonth) return b.gameMonth - a.gameMonth
      return b.gameDay - a.gameDay
    })
    .slice(0, 5)
})

// Pie chart helper functions
const pieColors = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316']

function getPieColor(index: number): string {
  return pieColors[index % pieColors.length]
}

function getStrokeDashOffset(index: number): number {
  if (!Array.isArray(cropBreakdown.value) || index === 0) return 0
  
  let offset = 0
  for (let i = 0; i < index; i++) {
    offset -= (cropBreakdown.value[i].percentage / 100 * 377)
  }
  return offset
}

onMounted(async () => {
  try {
    // Ensure we have an up-to-date farms list and currentFarmId before proceeding
    await farmStore.fetchFarms()
  // console.log('=== Dashboard Mounted ===')
  // console.log('Loading state:', loading.value)
  // console.log('currentFarmId:', farmStore.currentFarmId)
  // console.log('farms count:', farmStore.farms.length)
    
    // Ensure the selected farm actually exists in the fetched farms list
    if (!farmStore.currentFarmId || !farmStore.currentFarm) {
      // console.error('No valid farm selected! currentFarmId:', farmStore.currentFarmId, 'currentFarm:', farmStore.currentFarm)
      loading.value = false
      // console.log('Set loading to false (no valid farm)')
      return
    }
    
    // console.log('Fetching dashboard data for farm:', farmStore.currentFarmId)
    
    await Promise.all([
      fetchFinances(),
      fetchFields(),
      fetchAnimals(),
      fetchEquipment()
    ])
    
  // console.log('=== Dashboard Data Loaded ===')
  // console.log('Finances:', finances.value.length)
  // console.log('Fields:', fields.value.length)
  // console.log('Animals:', animals.value.length)
  // console.log('Equipment:', equipment.value.length)
    
  } catch (error) {
    // console.error('=== Dashboard Error ===', error)
  } finally {
    loading.value = false
    // console.log('Loading is now:', loading.value)
  }
})

async function fetchFinances() {
  if (!farmStore.currentFarmId) return
  
  try {
  // console.log('Fetching finances for farm:', farmStore.currentFarmId)
    const result = await api.get(`/farms/${farmStore.currentFarmId}/finances`)
  // console.log('Finances API result:', result)
    // API returns { finances: [...], balance: number }
    finances.value = result.finances || []
    // console.log('Finances loaded:', finances.value.length)
  } catch (error) {
    // console.error('Failed to fetch finances:', error)
    finances.value = []
  }
}

async function fetchFields() {
  if (!farmStore.currentFarmId) return
  
  try {
  // console.log('Fetching fields for farm:', farmStore.currentFarmId)
  fields.value = await api.get(`/farms/${farmStore.currentFarmId}/fields`)
  // console.log('Fields loaded:', fields.value.length)
  // console.log('Fields data:', fields.value)
  } catch (error) {
    // console.error('Failed to fetch fields:', error)
    fields.value = []
  }
}

async function fetchAnimals() {
  if (!farmStore.currentFarmId) return
  
  try {
    // console.log('Fetching animals for farm:', farmStore.currentFarmId)
    animals.value = await api.get(`/farms/${farmStore.currentFarmId}/animals`)
    // console.log('Animals loaded:', animals.value.length)
  } catch (error) {
    // console.error('Failed to fetch animals:', error)
    animals.value = []
  }
}

async function fetchEquipment() {
  if (!farmStore.currentFarmId) return
  
  try {
    // console.log('Fetching equipment for farm:', farmStore.currentFarmId)
    equipment.value = await api.get(`/farms/${farmStore.currentFarmId}/equipment`)
    // console.log('Equipment loaded:', equipment.value.length)
  } catch (error) {
    // console.error('Failed to fetch equipment:', error)
    equipment.value = []
  }
}

// Icon components
const FieldIcon = () => h('svg', {
  xmlns: 'http://www.w3.org/2000/svg',
  viewBox: '0 0 20 20',
  fill: 'currentColor'
}, [
  h('path', {
    'fill-rule': 'evenodd',
    d: 'M5 2a1 1 0 011 1v1h1a1 1 0 010 2H6v1a1 1 0 01-2 0V6H3a1 1 0 010-2h1V3a1 1 0 011-1zm0 10a1 1 0 011 1v1h1a1 1 0 110 2H6v1a1 1 0 11-2 0v-1H3a1 1 0 110-2h1v-1a1 1 0 011-1zM12 2a1 1 0 01.967.744L14.146 7.2 17.5 9.134a1 1 0 010 1.732l-3.354 1.935-1.18 4.455a1 1 0 01-1.933 0L9.854 12.8 6.5 10.866a1 1 0 010-1.732l3.354-1.935 1.18-4.455A1 1 0 0112 2z',
    'clip-rule': 'evenodd'
  })
])

const CropIcon = () => h('svg', {
  xmlns: 'http://www.w3.org/2000/svg',
  viewBox: '0 0 20 20',
  fill: 'currentColor'
}, [
  h('path', {
    'fill-rule': 'evenodd',
    d: 'M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v3.586L7.707 9.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 10.586V7z',
    'clip-rule': 'evenodd'
  })
])

const MoneyIcon = () => h('svg', {
  xmlns: 'http://www.w3.org/2000/svg',
  viewBox: '0 0 20 20',
  fill: 'currentColor'
}, [
  h('path', {
    d: 'M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z'
  }),
  h('path', {
    'fill-rule': 'evenodd',
    d: 'M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z',
    'clip-rule': 'evenodd'
  })
])

const AnimalIcon = () => h('svg', {
  xmlns: 'http://www.w3.org/2000/svg',
  viewBox: '0 0 20 20',
  fill: 'currentColor'
}, [
  h('path', {
    'fill-rule': 'evenodd',
    d: 'M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z',
    'clip-rule': 'evenodd'
  })
])

const EquipmentIcon = () => h('svg', {
  xmlns: 'http://www.w3.org/2000/svg',
  viewBox: '0 0 20 20',
  fill: 'currentColor'
}, [
  h('path', {
    'fill-rule': 'evenodd',
    d: 'M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z',
    'clip-rule': 'evenodd'
  })
])

const GuideIcon = () => h('svg', {
  xmlns: 'http://www.w3.org/2000/svg',
  viewBox: '0 0 20 20',
  fill: 'currentColor'
}, [
  h('path', {
    d: 'M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z'
  })
])

const SettingsIcon = () => h('svg', {
  xmlns: 'http://www.w3.org/2000/svg',
  viewBox: '0 0 20 20',
  fill: 'currentColor'
}, [
  h('path', {
    'fill-rule': 'evenodd',
    d: 'M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z',
    'clip-rule': 'evenodd'
  })
])

const sections = [
  {
    path: '/app/fields',
    title: 'Field Tracker',
    description: 'Manage your fields, crops, and growth stages',
    icon: FieldIcon
  },
  {
    path: '/app/crops',
    title: 'Crop Rotation',
    description: 'Plan your crop rotation strategy',
    icon: CropIcon
  },
  {
    path: '/app/money',
    title: 'Money Tracker',
    description: 'Track your farm finances and balance',
    icon: MoneyIcon
  },
  {
    path: '/app/animals',
    title: 'Animals',
    description: 'Manage your livestock and productivity',
    icon: AnimalIcon
  },
  {
    path: '/app/equipment',
    title: 'Equipment',
    description: 'Track your machinery and maintenance',
    icon: EquipmentIcon
  },
  {
    path: '/app/guide',
    title: 'UK Guide',
    description: 'British farming best practices',
    icon: GuideIcon
  },
  {
    path: '/app/settings',
    title: 'Farm Settings',
    description: 'Manage farm details and team members',
    icon: SettingsIcon
  }
]

function isActive(path: string) {
  return route.path === path
}
</script>
