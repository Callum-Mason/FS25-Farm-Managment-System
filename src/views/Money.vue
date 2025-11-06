<template>
  <div class="py-4 lg:py-8">
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
      <div>
        <h2 class="text-2xl lg:text-3xl font-bold text-primary">Money Tracker</h2>
        <p class="text-xl lg:text-2xl font-bold mt-2" :class="balance >= 0 ? 'text-green-600' : 'text-red-600'">
          Balance: £{{ balance.toLocaleString('en-GB', { minimumFractionDigits: 2 }) }}
        </p>
      </div>
      <button
        v-if="!isViewer"
        @click="showAddModal = true"
        class="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 whitespace-nowrap w-full sm:w-auto"
      >
        Add Entry
      </button>
    </div>

    <div v-if="loading" class="text-center py-8">Loading finances...</div>

    <div v-else>
      <!-- Desktop Table View -->
      <div class="hidden lg:block bg-white dark:bg-gray-800 rounded-card overflow-hidden border-2 border-gray-200 dark:border-gray-700">
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead class="bg-primary/10">
              <tr>
                <th class="px-4 py-3 text-left">Date</th>
                <th class="px-4 py-3 text-left">Type</th>
                <th class="px-4 py-3 text-left">Category</th>
                <th class="px-4 py-3 text-left">Description</th>
                <th class="px-4 py-3 text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="entry in finances" :key="entry.id" class="border-b border-primary/10">
                <td class="px-4 py-3 whitespace-nowrap">{{ formatShortGameDate(entry.gameYear, entry.gameMonth, entry.gameDay) }}</td>
                <td class="px-4 py-3">
                  <span
                    class="px-2 py-1 rounded text-sm whitespace-nowrap"
                    :class="entry.type === 'income' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'"
                  >
                    {{ entry.type }}
                  </span>
                </td>
                <td class="px-4 py-3">{{ entry.category }}</td>
                <td class="px-4 py-3">{{ entry.description }}</td>
                <td class="px-4 py-3 text-right font-medium whitespace-nowrap" :class="entry.type === 'income' ? 'text-green-600' : 'text-red-600'">
                  {{ entry.type === 'income' ? '+' : '-' }}£{{ entry.amount.toLocaleString('en-GB', { minimumFractionDigits: 2 }) }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Mobile Card View -->
      <div class="lg:hidden space-y-3">
        <div
          v-for="entry in finances"
          :key="entry.id"
          class="bg-white dark:bg-gray-800 rounded-lg p-4 border-2 border-gray-200 dark:border-gray-700"
        >
          <div class="flex justify-between items-start mb-2">
            <span class="text-xs text-text/60">{{ formatShortGameDate(entry.gameYear, entry.gameMonth, entry.gameDay) }}</span>
            <span
              class="px-2 py-1 rounded text-xs"
              :class="entry.type === 'income' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'"
            >
              {{ entry.type }}
            </span>
          </div>
          <div class="mb-2">
            <div class="text-sm font-medium text-text/70">{{ entry.category }}</div>
            <div class="text-sm text-text">{{ entry.description }}</div>
          </div>
          <div class="text-lg font-bold text-right" :class="entry.type === 'income' ? 'text-green-600' : 'text-red-600'">
            {{ entry.type === 'income' ? '+' : '-' }}£{{ entry.amount.toLocaleString('en-GB', { minimumFractionDigits: 2 }) }}
          </div>
        </div>
      </div>
    </div>

    <!-- Add Entry Modal -->
    <div v-if="showAddModal" class="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div class="bg-white dark:bg-gray-800 rounded-card p-8 max-w-2xl w-full border-2 border-gray-200 dark:border-gray-700">
        <h3 class="text-2xl font-bold text-primary mb-6">Add Finance Entry</h3>
        <p class="text-sm text-text/60 mb-4">Entry will be added on: <strong>{{ currentGameDate }}</strong></p>
        <form @submit.prevent="handleAdd" class="space-y-4">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium mb-2">Type</label>
              <select
                v-model="newEntry.type"
                required
                class="w-full px-4 py-2 border border-primary/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="income">Income</option>
                <option value="expense">Expense</option>
              </select>
            </div>
          </div>
          
          <div>
            <label class="block text-sm font-medium mb-2">Category</label>
            <input
              v-model="newEntry.category"
              type="text"
              required
              class="w-full px-4 py-2 border border-primary/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label class="block text-sm font-medium mb-2">Description</label>
            <input
              v-model="newEntry.description"
              type="text"
              required
              class="w-full px-4 py-2 border border-primary/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label class="block text-sm font-medium mb-2">Amount (£)</label>
            <input
              v-model.number="newEntry.amount"
              type="number"
              step="0.01"
              required
              class="w-full px-4 py-2 border border-primary/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div class="flex gap-4 pt-4">
            <button
              type="submit"
              class="flex-1 bg-primary text-white py-3 rounded-lg font-medium hover:bg-primary/90"
            >
              Add Entry
            </button>
            <button
              type="button"
              @click="showAddModal = false"
              class="flex-1 border-2 border-primary/20 py-3 rounded-lg font-medium hover:bg-surface"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useFarmStore } from '../stores/farm'
import { formatShortGameDate } from '../utils/gameDate'
import { api } from '../utils/api'

interface Finance {
  id: number
  farmId: number
  gameYear: number
  gameMonth: number
  gameDay: number
  type: string
  category: string
  description: string
  amount: number
  createdByUserId: number
}

const farmStore = useFarmStore()
const finances = ref<Finance[]>([])
const balance = ref(0)
const loading = ref(true)
const showAddModal = ref(false)
const isViewer = ref(false)

const currentGameDate = computed(() => {
  const farm = farmStore.currentFarm
  if (!farm) return ''
  return formatShortGameDate(
    farm.currentYear || 1, 
    farm.currentMonth || 1, 
    farm.currentDay || 1
  )
})

const newEntry = ref({
  type: 'income',
  category: '',
  description: '',
  amount: 0
})

onMounted(async () => {
  await loadFinances()
})

async function loadFinances() {
  try {
    loading.value = true
    const data = await api.get(`/farms/${farmStore.currentFarmId}/finances`)
    finances.value = data.finances
    balance.value = data.balance
  } catch (error) {
    console.error('Failed to load finances:', error)
  } finally {
    loading.value = false
  }
}

async function handleAdd() {
  try {
    await api.post(`/farms/${farmStore.currentFarmId}/finances`, newEntry.value)
    showAddModal.value = false
    newEntry.value = {
      type: 'income',
      category: '',
      description: '',
      amount: 0
    }
    await loadFinances()
  } catch (error) {
    console.error('Failed to add finance entry:', error)
  }
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('en-GB')
}
</script>
