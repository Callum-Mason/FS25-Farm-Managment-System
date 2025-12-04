<template>
  <div class="py-8">
    <div class="flex justify-between items-center mb-6">
      <div>
        <h2 class="text-3xl font-bold text-primary">Animals</h2>
        <p v-if="animals.length > 0" class="text-sm text-text/60 mt-1">
          Total Feed Cost: 
          <span class="font-bold text-primary">£{{ totalDailyFeedCost.toFixed(2) }}/day</span>
          • 
          <span class="font-bold">£{{ totalMonthlyFeedCost.toFixed(2) }}/month</span>
        </p>
      </div>
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
            <div class="grid grid-cols-3 gap-4 mt-4">
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
            </div>

            <!-- Feed Cost Breakdown -->
            <div class="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
              <p class="text-xs text-text/70 font-medium mb-2">Feed Cost Analysis</p>
              <div class="grid grid-cols-3 gap-3 text-xs">
                <div>
                  <p class="text-text/60">Daily</p>
                  <p class="font-semibold text-yellow-700 dark:text-yellow-300">{{ (animal.feedPerDay * animal.count).toFixed(2) }} units</p>
                </div>
                <div>
                  <p class="text-text/60">Monthly (30 days)</p>
                  <p class="font-semibold text-yellow-700 dark:text-yellow-300">{{ (animal.feedPerDay * animal.count * 30).toFixed(0) }} units</p>
                </div>
                <div>
                  <p class="text-text/60">Last Updated</p>
                  <p class="font-semibold">{{ formatDate(animal.updatedAt) }}</p>
                </div>
              </div>
            </div>

            <p v-if="animal.notes" class="mt-4 text-sm text-text/80">{{ animal.notes }}</p>
          </div>
          
          <div v-if="!isViewer" class="flex gap-2 ml-4">
            <button
              @click="editAnimal(animal)"
              class="px-3 py-2 text-sm border border-primary rounded-lg hover:bg-primary/10"
            >
              Edit
            </button>
            <button
              @click="deleteAnimal(animal.id)"
              class="px-3 py-2 text-sm border border-red-400 text-red-600 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Add/Edit Animal Modal -->
    <div v-if="showAddModal || editingAnimal" class="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div class="bg-white dark:bg-gray-800 rounded-card p-8 max-w-2xl w-full">
        <h3 class="text-2xl font-bold text-primary mb-6">{{ editingAnimal ? 'Edit Animals' : 'Add Animals' }}</h3>
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
              {{ editingAnimal ? 'Update Animals' : 'Add Animals' }}
            </button>
            <button
              type="button"
              @click="closeModal"
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
const editingAnimal = ref<Animal | null>(null)
const isViewer = ref(false)

const newAnimal = ref({
  type: '',
  count: 0,
  feedPerDay: 0,
  productivity: 100,
  notes: ''
})

// Calculate total feed costs
const totalDailyFeedCost = computed(() => {
  return animals.value.reduce((sum, animal) => sum + (animal.feedPerDay * animal.count), 0)
})

const totalMonthlyFeedCost = computed(() => {
  return totalDailyFeedCost.value * 30
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

function editAnimal(animal: Animal) {
  editingAnimal.value = animal
  newAnimal.value = { ...animal }
  showAddModal.value = true
}

function closeModal() {
  showAddModal.value = false
  editingAnimal.value = null
  newAnimal.value = { type: '', count: 0, feedPerDay: 0, productivity: 100, notes: '' }
}

async function handleAdd() {
  try {
    if (editingAnimal.value) {
      await api.patch(`/farms/${farmStore.currentFarmId}/animals/${editingAnimal.value.id}`, newAnimal.value)
    } else {
      await api.post(`/farms/${farmStore.currentFarmId}/animals`, newAnimal.value)
    }
    closeModal()
    await loadAnimals()
  } catch (error) {
    console.error('Failed to save animals:', error)
  }
}

async function deleteAnimal(animalId: number) {
  if (!confirm('Are you sure you want to delete this animal group?')) {
    return
  }

  try {
    await api.delete(`/farms/${farmStore.currentFarmId}/animals/${animalId}`)
    await loadAnimals()
  } catch (error) {
    console.error('Failed to delete animal:', error)
    alert('Failed to delete animal')
  }
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('en-GB')
}
</script>
