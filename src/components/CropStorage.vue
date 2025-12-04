<template>
  <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
    <div class="flex items-center justify-between mb-6">
      <h2 class="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
        <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
          <path d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" />
        </svg>
        Crop Storage
      </h2>
      <button
        @click="showAddForm = true"
        class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
      >
        + Add Crop
      </button>
    </div>

    <!-- Storage List -->
    <div class="space-y-4">
      <div v-if="loading" class="text-center py-8 text-gray-500">
        Loading storage...
      </div>

      <div v-else-if="storage.length === 0" class="text-center py-8 text-gray-500">
        No crops in storage yet. Harvest fields or add crops manually to get started.
      </div>

      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div
          v-for="crop in storage"
          :key="crop.cropName"
          class="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition"
        >
          <div class="flex justify-between items-start mb-3">
            <div>
              <h3 class="text-lg font-semibold text-gray-900 dark:text-white">{{ crop.cropName }}</h3>
              <p class="text-sm text-gray-600 dark:text-gray-400">
                {{ crop.quantityStored }}L stored
              </p>
            </div>
            <button
              @click="editingCrop = crop; showSellForm = true"
              class="px-3 py-1 bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200 rounded text-sm hover:bg-blue-200 dark:hover:bg-blue-800 transition"
            >
              Sell
            </button>
          </div>

          <div v-if="crop.storageLocation" class="mb-2">
            <p class="text-xs text-gray-600 dark:text-gray-400">
              Location: {{ crop.storageLocation }}
            </p>
          </div>

          <div v-if="crop.notes" class="mb-3">
            <p class="text-sm text-gray-700 dark:text-gray-300 italic">
              {{ crop.notes }}
            </p>
          </div>

          <div class="flex gap-2 pt-3 border-t border-gray-200 dark:border-gray-700">
            <button
              @click="editingCrop = crop; showEditForm = true"
              class="flex-1 px-2 py-1 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition"
            >
              Edit
            </button>
            <button
              @click="deleteCrop(crop.cropName)"
              class="flex-1 px-2 py-1 text-sm bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200 rounded hover:bg-red-200 dark:hover:bg-red-800 transition"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Add Crop Modal -->
    <div v-if="showAddForm" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white dark:bg-gray-800 rounded-lg p-6 w-96 shadow-xl">
        <h3 class="text-xl font-bold mb-4 text-gray-900 dark:text-white">Add Crop to Storage</h3>

        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Crop Name
            </label>
            <input
              v-model="newCrop.cropName"
              type="text"
              placeholder="e.g., Wheat, Barley, Canola"
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Quantity (Liters)
            </label>
            <input
              v-model.number="newCrop.quantityStored"
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Storage Location (Optional)
            </label>
            <input
              v-model="newCrop.storageLocation"
              type="text"
              placeholder="e.g., Grain Store A"
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Notes (Optional)
            </label>
            <textarea
              v-model="newCrop.notes"
              placeholder="Any notes about this crop..."
              rows="3"
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div class="flex gap-2 mt-6">
          <button
            @click="showAddForm = false"
            class="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
          >
            Cancel
          </button>
          <button
            @click="addCrop"
            class="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
          >
            Add Crop
          </button>
        </div>
      </div>
    </div>

    <!-- Edit Crop Modal -->
    <div v-if="showEditForm && editingCrop" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white dark:bg-gray-800 rounded-lg p-6 w-96 shadow-xl">
        <h3 class="text-xl font-bold mb-4 text-gray-900 dark:text-white">Edit {{ editingCrop.cropName }}</h3>

        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Quantity (Liters)
            </label>
            <input
              v-model.number="editingCrop.quantityStored"
              type="number"
              step="0.01"
              min="0"
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Storage Location
            </label>
            <input
              v-model="editingCrop.storageLocation"
              type="text"
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Notes
            </label>
            <textarea
              v-model="editingCrop.notes"
              rows="3"
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div class="flex gap-2 mt-6">
          <button
            @click="showEditForm = false; editingCrop = null"
            class="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
          >
            Cancel
          </button>
          <button
            @click="updateCrop"
            class="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Update
          </button>
        </div>
      </div>
    </div>

    <!-- Sell Crop Modal -->
    <div v-if="showSellForm && editingCrop" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white dark:bg-gray-800 rounded-lg p-6 w-96 shadow-xl">
        <h3 class="text-xl font-bold mb-4 text-gray-900 dark:text-white">
          Sell {{ editingCrop.cropName }}
        </h3>

        <div class="bg-blue-50 dark:bg-blue-900 p-3 rounded mb-4">
          <p class="text-sm text-blue-900 dark:text-blue-200">
            Currently stored: <strong>{{ editingCrop.quantityStored }}L</strong>
          </p>
        </div>

        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Quantity to Sell (Liters)
            </label>
            <input
              v-model.number="sellForm.quantityToSell"
              type="number"
              step="0.01"
              min="0"
              :max="editingCrop.quantityStored"
              placeholder="0.00"
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Price per Liter (£)
            </label>
            <input
              v-model.number="sellForm.salePrice"
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div v-if="sellForm.quantityToSell && sellForm.salePrice" class="bg-green-50 dark:bg-green-900 p-3 rounded">
            <p class="text-sm text-green-900 dark:text-green-200">
              Total Sale: <strong>£{{ (sellForm.quantityToSell * sellForm.salePrice).toFixed(2) }}</strong>
            </p>
          </div>
        </div>

        <div class="flex gap-2 mt-6">
          <button
            @click="showSellForm = false; editingCrop = null; sellForm = { quantityToSell: 0, salePrice: 0 }"
            class="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
          >
            Cancel
          </button>
          <button
            @click="sellCrop"
            :disabled="!sellForm.quantityToSell || !sellForm.salePrice"
            class="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
          >
            Sell Crop
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useFarmStore } from '../stores/farm'
import { api } from '../utils/api'

interface CropStorageItem {
  id: number
  farmId: number
  cropName: string
  quantityStored: number
  storageLocation: string | null
  lastUpdated: string
  notes: string | null
}

const farmStore = useFarmStore()
const storage = ref<CropStorageItem[]>([])
const loading = ref(false)
const showAddForm = ref(false)
const showEditForm = ref(false)
const showSellForm = ref(false)
const editingCrop = ref<CropStorageItem | null>(null)

const newCrop = ref({
  cropName: '',
  quantityStored: 0,
  storageLocation: '',
  notes: ''
})

const sellForm = ref({
  quantityToSell: 0,
  salePrice: 0
})

const fetchStorage = async () => {
  if (!farmStore.currentFarmId) {
    console.warn('📦 CropStorage: No currentFarmId available')
    return
  }

  loading.value = true
  console.log(`📦 CropStorage: Fetching storage for farm ${farmStore.currentFarmId}`)
  try {
    const response = await api.get(`/farms/${farmStore.currentFarmId}/storage`)
    console.log(`📦 CropStorage: Received ${response.length} items:`, response)
    storage.value = response
  } catch (error) {
    console.error('Failed to fetch storage:', error)
  } finally {
    loading.value = false
  }
}

const addCrop = async () => {
  if (!farmStore.currentFarmId || !newCrop.value.cropName || newCrop.value.quantityStored <= 0) {
    return
  }

  try {
    const response = await api.post(`/farms/${farmStore.currentFarmId}/storage`, {
      cropName: newCrop.value.cropName,
      quantityStored: newCrop.value.quantityStored,
      storageLocation: newCrop.value.storageLocation || null,
      notes: newCrop.value.notes || null
    })
    storage.value.push(response)
    showAddForm.value = false
    newCrop.value = { cropName: '', quantityStored: 0, storageLocation: '', notes: '' }
  } catch (error) {
    console.error('Failed to add crop:', error)
  }
}

const updateCrop = async () => {
  if (!farmStore.currentFarmId || !editingCrop.value) return

  try {
    const response = await api.post(`/farms/${farmStore.currentFarmId}/storage`, {
      cropName: editingCrop.value.cropName,
      quantityStored: editingCrop.value.quantityStored,
      storageLocation: editingCrop.value.storageLocation,
      notes: editingCrop.value.notes
    })
    const index = storage.value.findIndex(c => c.cropName === editingCrop.value!.cropName)
    if (index !== -1) {
      storage.value[index] = response
    }
    showEditForm.value = false
    editingCrop.value = null
  } catch (error) {
    console.error('Failed to update crop:', error)
  }
}

const sellCrop = async () => {
  if (!farmStore.currentFarmId || !editingCrop.value) return

  try {
    const response = await api.patch(
      `/farms/${farmStore.currentFarmId}/storage/${editingCrop.value.cropName}`,
      {
        quantityToSell: sellForm.value.quantityToSell,
        salePrice: sellForm.value.salePrice
      }
    )
    
    // Update storage
    const index = storage.value.findIndex(c => c.cropName === editingCrop.value!.cropName)
    if (index !== -1) {
      storage.value[index] = response.storage
    }
    
    showSellForm.value = false
    editingCrop.value = null
    sellForm.value = { quantityToSell: 0, salePrice: 0 }
  } catch (error) {
    console.error('Failed to sell crop:', error)
  }
}

const deleteCrop = async (cropName: string) => {
  if (!farmStore.currentFarmId) return
  if (!confirm(`Delete storage for ${cropName}?`)) return

  try {
    await api.delete(`/farms/${farmStore.currentFarmId}/storage/${cropName}`)
    storage.value = storage.value.filter(c => c.cropName !== cropName)
  } catch (error) {
    console.error('Failed to delete storage:', error)
  }
}

onMounted(() => {
  fetchStorage()
})
</script>

<style scoped>
/* Component styles are handled by Tailwind classes */
</style>
