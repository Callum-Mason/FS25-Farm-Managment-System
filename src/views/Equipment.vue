<template>
  <div class="py-8">
    <div class="flex justify-between items-center mb-6">
      <h2 class="text-3xl font-bold text-primary">Equipment</h2>
      <button
        v-if="!isViewer"
        @click="showAddModal = true"
        class="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
      >
        Add Equipment
      </button>
    </div>

    <div v-if="loading" class="text-center py-8">Loading equipment...</div>

    <div v-else-if="equipment.length === 0" class="text-center py-8 text-text/60">
      No equipment yet. Click "Add Equipment" to get started.
    </div>

    <div v-else class="grid gap-4">
      <div
        v-for="item in equipment"
        :key="item.id"
        class="bg-white dark:bg-gray-800 rounded-card p-6 border-2 border-primary/20 dark:border-gray-700"
        :class="{ 'opacity-60': item.sold }"
      >
        <div class="flex justify-between items-start">
          <div class="flex-1">
            <div class="flex items-center gap-3 flex-wrap">
              <h3 class="text-xl font-bold text-primary">{{ item.brand }} {{ item.model }}</h3>
              <span class="px-2 py-1 text-sm rounded bg-secondary/10 text-secondary">{{ item.category }}</span>
              <span v-if="item.sold" class="px-2 py-1 text-sm rounded bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 font-medium">
                ❌ SOLD
              </span>
              <span v-else-if="item.ownerName" class="px-2 py-1 text-sm rounded bg-primary/10 text-primary" title="Assigned to">
                👤 {{ item.ownerName }}
              </span>
            </div>
            
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
              <div>
                <p class="text-sm text-text/60">Status</p>
                <p class="font-medium">{{ item.owned ? 'Owned' : 'Leased' }}</p>
              </div>
              <div v-if="item.leased">
                <p class="text-sm text-text/60">Daily Cost</p>
                <p class="font-medium">£{{ item.dailyCost }}</p>
              </div>
              <div v-if="!item.sold">
                <p class="text-sm text-text/60">Condition</p>
                <p class="font-medium">{{ item.condition }}%</p>
              </div>
              <div v-if="item.purchasePrice > 0">
                <p class="text-sm text-text/60">Purchase Price</p>
                <p class="font-medium">£{{ item.purchasePrice.toLocaleString() }}</p>
              </div>
              <div v-if="item.sold && item.salePrice > 0">
                <p class="text-sm text-text/60">Sale Price</p>
                <p class="font-medium text-green-600">£{{ item.salePrice.toLocaleString() }}</p>
              </div>
              <div v-if="item.sold && item.saleDate">
                <p class="text-sm text-text/60">Sale Date</p>
                <p class="font-medium">{{ formatDate(item.saleDate) }}</p>
              </div>
            </div>
            <p v-if="item.notes" class="mt-4 text-sm text-text/80">{{ item.notes }}</p>
          </div>
          <div v-if="!isViewer && !item.sold" class="flex gap-2 ml-4">
            <button
              @click="duplicateItem(item)"
              class="px-3 py-2 bg-secondary text-white rounded hover:bg-secondary/90 flex items-center gap-1"
              title="Duplicate this equipment"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path d="M7 9a2 2 0 012-2h6a2 2 0 012 2v6a2 2 0 01-2 2H9a2 2 0 01-2-2V9z" />
                <path d="M5 3a2 2 0 00-2 2v6a2 2 0 002 2V5h8a2 2 0 00-2-2H5z" />
              </svg>
              Copy
            </button>
            <button
              v-if="item.owned"
              @click="startSale(item)"
              class="px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 flex items-center gap-1"
              title="Mark as sold"
            >
              💰 Sell
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Add Equipment Modal -->
    <div v-if="showAddModal" class="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div class="bg-white dark:bg-surface rounded-card p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto border-2 border-primary/20 dark:border-primary/30">
        <h3 class="text-2xl font-bold text-primary mb-6">Add Equipment</h3>
        <form @submit.prevent="handleAdd" class="space-y-4">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium mb-2 text-text">Brand *</label>
              <input
                v-model="newEquipment.brand"
                @input="updateBrandSuggestions"
                type="text"
                required
                list="brands-list"
                placeholder="e.g. John Deere, Claas"
                class="w-full px-4 py-2 border border-primary/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <datalist id="brands-list">
                <option v-for="brand in availableBrands" :key="brand" :value="brand"></option>
              </datalist>
            </div>
            <div>
              <label class="block text-sm font-medium mb-2 text-text">Model *</label>
              <input
                v-model="newEquipment.model"
                type="text"
                required
                placeholder="e.g. 6R Series, Axion 800"
                class="w-full px-4 py-2 border border-primary/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>
          
          <div>
            <label class="block text-sm font-medium mb-2 text-text">Category *</label>
            <select
              v-model="newEquipment.category"
              required
              class="w-full px-4 py-2 border border-primary/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">Select category...</option>
              <option value="Tractor">Tractor</option>
              <option value="Harvester">Harvester</option>
              <option value="Plough">Plough</option>
              <option value="Cultivator">Cultivator</option>
              <option value="Seeder">Seeder</option>
              <option value="Sprayer">Sprayer</option>
              <option value="Baler">Baler</option>
              <option value="Trailer">Trailer</option>
              <option value="Loader">Loader</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div v-if="newEquipment.category === 'Tractor'" class="bg-primary/5 border-2 border-primary/20 p-4 rounded-lg">
            <label class="block text-sm font-medium mb-2 text-text">👤 Assign Tractor To (Optional)</label>
            <select
              v-model="newEquipment.userId"
              class="w-full px-4 py-2 border border-primary/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option :value="null">Farm Equipment (Shared)</option>
              <option v-for="member in farmMembers" :key="member.userId" :value="member.userId">
                {{ member.name }} ({{ member.role }})
              </option>
            </select>
            <p class="text-xs text-text/60 mt-1">Assign this tractor to a specific team member for their personal use</p>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="flex items-center space-x-2">
                <input
                  v-model="newEquipment.owned"
                  type="checkbox"
                  class="w-4 h-4"
                />
                <span class="text-sm font-medium">Owned</span>
              </label>
            </div>
            <div>
              <label class="flex items-center space-x-2">
                <input
                  v-model="newEquipment.leased"
                  type="checkbox"
                  class="w-4 h-4"
                />
                <span class="text-sm font-medium">Leased</span>
              </label>
            </div>
          </div>

          <div v-if="newEquipment.leased">
            <label class="block text-sm font-medium mb-2 text-text">Daily Lease Cost (£)</label>
            <input
              v-model.number="newEquipment.dailyCost"
              type="number"
              step="0.01"
              min="0"
              class="w-full px-4 py-2 border border-primary/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label class="block text-sm font-medium mb-2 text-text">Condition: {{ newEquipment.condition }}%</label>
            <input
              v-model.number="newEquipment.condition"
              type="range"
              min="0"
              max="100"
              class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
            <div class="flex justify-between text-xs text-text/60 mt-1">
              <span>Needs Repair</span>
              <span>Fair</span>
              <span>Excellent</span>
            </div>
          </div>

          <div v-if="newEquipment.owned" class="bg-secondary/5 border-2 border-secondary/20 p-4 rounded-lg space-y-4">
            <h4 class="font-medium text-secondary">💰 Purchase Details</h4>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium mb-2">Purchase Price (£)</label>
                <input
                  v-model.number="newEquipment.purchasePrice"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  class="w-full px-4 py-2 border border-secondary/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary"
                />
                <p class="text-xs text-text/60 mt-1">Will be added to expenses automatically</p>
              </div>
              <div>
                <label class="block text-sm font-medium mb-2">Purchase Date</label>
                <input
                  v-model="newEquipment.purchaseDate"
                  type="date"
                  class="w-full px-4 py-2 border border-secondary/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary"
                />
              </div>
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium mb-2">Notes</label>
            <textarea
              v-model="newEquipment.notes"
              rows="3"
              placeholder="Maintenance schedule, special features, etc."
              class="w-full px-4 py-2 border border-primary/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            ></textarea>
          </div>

          <div class="flex gap-4 pt-4">
            <button
              type="submit"
              class="flex-1 bg-primary text-white py-3 rounded-lg font-medium hover:bg-primary/90"
            >
              Add Equipment
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

    <!-- Sell Equipment Modal -->
    <div v-if="showSaleModal" class="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div class="bg-white dark:bg-gray-800 rounded-card p-8 max-w-md w-full border-2 border-gray-200 dark:border-gray-700">
        <h3 class="text-2xl font-bold text-primary mb-6">Sell Equipment</h3>
        <div v-if="equipmentToSell" class="mb-6 p-4 bg-secondary/5 rounded-lg">
          <p class="font-medium">{{ equipmentToSell.brand }} {{ equipmentToSell.model }}</p>
          <p class="text-sm text-text/60 mt-1">{{ equipmentToSell.category }}</p>
          <p v-if="equipmentToSell.purchasePrice > 0" class="text-sm text-text/60 mt-1">
            Purchased for: £{{ equipmentToSell.purchasePrice.toLocaleString() }}
          </p>
        </div>
        <form @submit.prevent="handleSale" class="space-y-4">
          <div>
            <label class="block text-sm font-medium mb-2">Sale Price (£) *</label>
            <input
              v-model.number="saleData.salePrice"
              type="number"
              step="0.01"
              min="0.01"
              required
              placeholder="0.00"
              class="w-full px-4 py-2 border border-primary/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <p class="text-xs text-text/60 mt-1">Will be added to finances as income</p>
          </div>
          <div>
            <label class="block text-sm font-medium mb-2">Sale Date</label>
            <input
              v-model="saleData.saleDate"
              type="date"
              class="w-full px-4 py-2 border border-primary/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div class="flex gap-4 pt-4">
            <button
              type="submit"
              class="flex-1 bg-green-600 text-white py-3 rounded-lg font-medium hover:bg-green-700"
            >
              Confirm Sale
            </button>
            <button
              type="button"
              @click="closeSaleModal"
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
import { ref, onMounted, computed } from 'vue'
import { useFarmStore } from '../stores/farm'
import { api } from '../utils/api'

interface Equipment {
  id: number
  farmId: number
  model: string
  category: string
  brand: string
  owned: boolean
  leased: boolean
  dailyCost: number
  condition: number
  userId: number | null
  ownerName?: string
  purchasePrice: number
  purchaseDate: string | null
  sold: boolean
  salePrice: number
  saleDate: string | null
  notes: string | null
  updatedAt: string
}

interface FarmMember {
  userId: number
  name: string
  role: string
}

const farmStore = useFarmStore()
const equipment = ref<Equipment[]>([])
const farmMembers = ref<FarmMember[]>([])
const availableBrands = ref<string[]>([])
const loading = ref(true)
const showAddModal = ref(false)
const showSaleModal = ref(false)
const equipmentToSell = ref<Equipment | null>(null)

const isViewer = computed(() => farmStore.currentUserRole === 'viewer')

const newEquipment = ref({
  model: '',
  category: '',
  brand: '',
  owned: true,
  leased: false,
  dailyCost: 0,
  condition: 100,
  userId: null as number | null,
  purchasePrice: 0,
  purchaseDate: '',
  notes: ''
})

const saleData = ref({
  salePrice: 0,
  saleDate: new Date().toISOString().split('T')[0]
})

onMounted(async () => {
  await loadEquipment()
  await loadBrands()
  await loadFarmMembers()
})

async function loadEquipment() {
  if (!farmStore.currentFarmId) return
  
  loading.value = true
  try {
    equipment.value = await api.get(`/farms/${farmStore.currentFarmId}/equipment`)
  } catch (error: any) {
    console.error('Failed to load equipment:', error)
    alert(error.message || 'Failed to load equipment')
  } finally {
    loading.value = false
  }
}

async function loadBrands() {
  if (!farmStore.currentFarmId) return
  
  try {
    availableBrands.value = await api.get(`/farms/${farmStore.currentFarmId}/equipment/brands`)
  } catch (error) {
    console.error('Failed to load brands:', error)
  }
}

async function loadFarmMembers() {
  if (!farmStore.currentFarmId) return
  
  try {
    const members = await farmStore.getMembers(farmStore.currentFarmId)
    farmMembers.value = members.map(m => ({
      userId: m.userId,
      name: m.name,
      role: m.role
    }))
  } catch (error) {
    console.error('Failed to load members:', error)
    // Non-owners can't see members, that's OK
  }
}

function updateBrandSuggestions() {
  // The datalist will automatically filter based on input
}

function duplicateItem(item: Equipment) {
  newEquipment.value = {
    model: item.model,
    category: item.category,
    brand: item.brand,
    owned: item.owned,
    leased: item.leased,
    dailyCost: item.dailyCost,
    condition: item.condition,
    userId: item.userId,
    purchasePrice: 0,
    purchaseDate: '',
    notes: item.notes || ''
  }
  showAddModal.value = true
}

function startSale(item: Equipment) {
  equipmentToSell.value = item
  saleData.value = {
    salePrice: 0,
    saleDate: new Date().toISOString().split('T')[0]
  }
  showSaleModal.value = true
}

function closeModal() {
  showAddModal.value = false
  newEquipment.value = {
    model: '',
    category: '',
    brand: '',
    owned: true,
    leased: false,
    dailyCost: 0,
    condition: 100,
    userId: null,
    purchasePrice: 0,
    purchaseDate: '',
    notes: ''
  }
}

function closeSaleModal() {
  showSaleModal.value = false
  equipmentToSell.value = null
  saleData.value = {
    salePrice: 0,
    saleDate: new Date().toISOString().split('T')[0]
  }
}

async function handleAdd() {
  if (!farmStore.currentFarmId) return
  
  try {
    await api.post(`/farms/${farmStore.currentFarmId}/equipment`, newEquipment.value)
    await loadEquipment()
    await loadBrands() // Refresh brands list
    closeModal()
  } catch (error: any) {
    console.error('Failed to add equipment:', error)
    alert(error.message || 'Failed to add equipment')
  }
}

async function handleSale() {
  if (!equipmentToSell.value) return
  
  try {
    await api.post(`/equipment/${equipmentToSell.value.id}/sell`, saleData.value)
    await loadEquipment()
    closeSaleModal()
  } catch (error: any) {
    console.error('Failed to sell equipment:', error)
    alert(error.message || 'Failed to sell equipment')
  }
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  })
}
</script>
