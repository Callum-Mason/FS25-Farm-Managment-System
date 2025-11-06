<template>
  <div class="py-8">
    <div class="flex justify-between items-center mb-6">
      <h2 class="text-3xl font-bold text-primary">Animals</h2>
      <button
        v-if="!isViewer"
        @click="showAddModal = true"
        class="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
      >
        Add Animals
      </button>
    </div>

    <div v-if="loading" class="text-center py-8">Loading animals...</div>

    <div v-else-if="animals.length === 0" class="text-center py-8 text-text/60">
      No animals yet. Click "Add Animals" to get started.
    </div>

    <div v-else class="grid gap-4">
      <div
        v-for="animal in animals"
        :key="animal.id"
        class="bg-white dark:bg-gray-800 rounded-card p-6 border-2 border-primary/20 dark:border-gray-700"
      >
        <div class="flex justify-between items-start">
          <div class="flex-1">
            <h3 class="text-xl font-bold text-primary">{{ animal.type }}</h3>
            <div class="grid grid-cols-2 gap-4 mt-4">
              <div>
                <p class="text-sm text-text/60">Count</p>
                <p class="font-medium">{{ animal.count }}</p>
              </div>
              <div>
                <p class="text-sm text-text/60">Feed per Day</p>
                <p class="font-medium">{{ animal.feedPerDay }} units</p>
              </div>
              <div>
                <p class="text-sm text-text/60">Productivity</p>
                <p class="font-medium">{{ animal.productivity }}%</p>
              </div>
              <div>
                <p class="text-sm text-text/60">Last Updated</p>
                <p class="font-medium">{{ formatDate(animal.updatedAt) }}</p>
              </div>
            </div>
            <p v-if="animal.notes" class="mt-4 text-sm text-text/80">{{ animal.notes }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Add Animal Modal -->
    <div v-if="showAddModal" class="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div class="bg-white dark:bg-gray-800 rounded-card p-8 max-w-2xl w-full">
        <h3 class="text-2xl font-bold text-primary mb-6">Add Animals</h3>
        <form @submit.prevent="handleAdd" class="space-y-4">
          <div>
            <label class="block text-sm font-medium mb-2">Type</label>
            <input
              v-model="newAnimal.type"
              type="text"
              required
              placeholder="e.g. Dairy Cows, Sheep, Chickens"
              class="w-full px-4 py-2 border border-primary/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          
          <div class="grid grid-cols-3 gap-4">
            <div>
              <label class="block text-sm font-medium mb-2">Count</label>
              <input
                v-model.number="newAnimal.count"
                type="number"
                required
                class="w-full px-4 py-2 border border-primary/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label class="block text-sm font-medium mb-2">Feed per Day</label>
              <input
                v-model.number="newAnimal.feedPerDay"
                type="number"
                step="0.1"
                required
                class="w-full px-4 py-2 border border-primary/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label class="block text-sm font-medium mb-2">Productivity %</label>
              <input
                v-model.number="newAnimal.productivity"
                type="number"
                required
                class="w-full px-4 py-2 border border-primary/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium mb-2">Notes</label>
            <textarea
              v-model="newAnimal.notes"
              rows="3"
              class="w-full px-4 py-2 border border-primary/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            ></textarea>
          </div>

          <div class="flex gap-4 pt-4">
            <button
              type="submit"
              class="flex-1 bg-primary text-white py-3 rounded-lg font-medium hover:bg-primary/90"
            >
              Add Animals
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
import { ref, onMounted } from 'vue'
import { useFarmStore } from '../stores/farm'
import { api } from '../utils/api'

interface Animal {
  id: number
  farmId: number
  type: string
  count: number
  feedPerDay: number
  productivity: number
  notes: string | null
  updatedAt: string
}

const farmStore = useFarmStore()
const animals = ref<Animal[]>([])
const loading = ref(true)
const showAddModal = ref(false)
const isViewer = ref(false)

const newAnimal = ref({
  type: '',
  count: 0,
  feedPerDay: 0,
  productivity: 100,
  notes: ''
})

onMounted(async () => {
  await loadAnimals()
})

async function loadAnimals() {
  try {
    loading.value = true
    animals.value = await api.get(`/farms/${farmStore.currentFarmId}/animals`)
  } catch (error) {
    console.error('Failed to load animals:', error)
  } finally {
    loading.value = false
  }
}

async function handleAdd() {
  try {
    await api.post(`/farms/${farmStore.currentFarmId}/animals`, newAnimal.value)
    showAddModal.value = false
    newAnimal.value = { type: '', count: 0, feedPerDay: 0, productivity: 100, notes: '' }
    await loadAnimals()
  } catch (error) {
    console.error('Failed to add animals:', error)
  }
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('en-GB')
}
</script>
