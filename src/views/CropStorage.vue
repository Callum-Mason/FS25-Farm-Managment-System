<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg p-6">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-3xl font-bold mb-2">Crop Storage</h1>
          <p class="text-green-100">Manage your stored crops and inventory</p>
        </div>
        <svg class="w-12 h-12 opacity-80" fill="currentColor" viewBox="0 0 20 20">
          <path d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" />
        </svg>
      </div>
    </div>

    <!-- Tab Navigation -->
    <div class="bg-white dark:bg-gray-800 rounded-lg border-b border-gray-200 dark:border-gray-700">
      <div class="flex gap-0">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          @click="activeTab = tab.id"
          :class="[
            'px-6 py-4 font-medium border-b-2 transition whitespace-nowrap',
            activeTab === tab.id
              ? 'border-green-600 text-green-600 dark:text-green-400'
              : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
          ]"
        >
          {{ tab.label }}
        </button>
      </div>
    </div>

    <!-- Tab Content -->
    <div>
      <!-- Overview Tab -->
      <div v-show="activeTab === 'overview'" class="space-y-6">
        <!-- Quick Stats -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div class="bg-white dark:bg-gray-800 rounded-lg p-6 border-2 border-green-200 dark:border-green-900">
            <div class="text-sm text-gray-600 dark:text-gray-400 mb-2">Total Crops Stored</div>
            <div class="text-3xl font-bold text-green-600">{{ storage.length }}</div>
          </div>
          <div class="bg-white dark:bg-gray-800 rounded-lg p-6 border-2 border-blue-200 dark:border-blue-900">
            <div class="text-sm text-gray-600 dark:text-gray-400 mb-2">Total Volume</div>
            <div class="text-3xl font-bold text-blue-600">{{ formatVolume(totalVolume) }}L</div>
          </div>
          <div class="bg-white dark:bg-gray-800 rounded-lg p-6 border-2 border-purple-200 dark:border-purple-900">
            <div class="text-sm text-gray-600 dark:text-gray-400 mb-2">Estimated Value</div>
            <div class="text-3xl font-bold text-purple-600">£{{ estimatedValue.toLocaleString('en-GB') }}</div>
          </div>
        </div>

        <!-- Top Stored Crops -->
        <div class="bg-white dark:bg-gray-800 rounded-lg p-6 border-2 border-gray-200 dark:border-gray-700">
          <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-4">Top Stored Crops</h3>
          <div v-if="storage.length === 0" class="text-gray-500 text-center py-8">
            No crops in storage yet
          </div>
          <div v-else class="space-y-3">
            <div v-for="crop in topStoredCrops" :key="crop.cropName" class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div class="flex-1">
                <div class="font-medium text-gray-900 dark:text-white">{{ crop.cropName }}</div>
                <div class="text-sm text-gray-600 dark:text-gray-400">{{ formatVolume(crop.quantityStored) }}L stored</div>
              </div>
              <div class="text-right">
                <div class="text-sm font-medium text-gray-900 dark:text-white">
                  {{ ((crop.quantityStored / totalVolume) * 100).toFixed(1) }}%
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Inventory Tab -->
      <div v-show="activeTab === 'inventory'" class="space-y-6">
        <!-- Action Bar -->
        <div class="flex gap-3">
          <button
            @click="showAddForm = true"
            class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium"
          >
            + Add Crop
          </button>
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search crops..."
            class="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-green-500"
          />
        </div>

        <!-- Storage Grid -->
        <div v-if="loading" class="text-center py-12 text-gray-500">
          Loading storage...
        </div>

        <div v-else-if="filteredStorage.length === 0" class="text-center py-12 text-gray-500">
          {{ storage.length === 0 ? 'No crops in storage yet. Harvest fields or add crops manually to get started.' : 'No crops match your search.' }}
        </div>

        <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div
            v-for="crop in filteredStorage"
            :key="crop.id"
            class="bg-white dark:bg-gray-800 rounded-lg border-2 border-gray-200 dark:border-gray-700 p-4 hover:shadow-lg transition"
          >
            <div class="flex justify-between items-start mb-3">
              <div>
                <h3 class="text-lg font-semibold text-gray-900 dark:text-white">{{ crop.cropName }}</h3>
                <p class="text-sm text-gray-600 dark:text-gray-400">{{ formatVolume(crop.quantityStored) }}L</p>
              </div>
              <span class="px-2 py-1 bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200 rounded text-xs font-medium">
                In Stock
              </span>
            </div>

            <div v-if="crop.storageLocation" class="mb-2 pb-2 border-b border-gray-200 dark:border-gray-700">
              <p class="text-xs text-gray-600 dark:text-gray-400">
                📍 {{ crop.storageLocation }}
              </p>
            </div>

            <div v-if="crop.notes" class="mb-3 pb-3 border-b border-gray-200 dark:border-gray-700">
              <p class="text-sm text-gray-700 dark:text-gray-300 italic">
                {{ crop.notes }}
              </p>
            </div>

            <div class="text-xs text-gray-500 dark:text-gray-400 mb-3">
              Last updated: {{ formatDate(crop.lastUpdated) }}
            </div>

            <div class="flex gap-2">
              <button
                @click="editingCrop = crop; showEditForm = true"
                class="flex-1 px-2 py-2 text-sm bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200 rounded hover:bg-blue-200 dark:hover:bg-blue-800 transition"
              >
                Edit
              </button>
              <button
                @click="editingCrop = crop; showSellForm = true"
                class="flex-1 px-2 py-2 text-sm bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-200 rounded hover:bg-green-200 dark:hover:bg-green-800 transition"
              >
                Sell
              </button>
              <button
                @click="deleteCrop(crop.id)"
                class="flex-1 px-2 py-2 text-sm bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 rounded hover:bg-red-200 dark:hover:bg-red-800 transition"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Sales History Tab -->
      <div v-show="activeTab === 'sales'" class="space-y-6">
        <div v-if="salesHistory.length === 0" class="bg-white dark:bg-gray-800 rounded-lg p-12 text-center text-gray-500">
          No sales recorded yet. Start selling crops to see your sales history here.
        </div>

        <div v-else>
          <!-- Sales Summary -->
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div class="bg-white dark:bg-gray-800 rounded-lg p-6 border-2 border-green-200 dark:border-green-900">
              <div class="text-sm text-gray-600 dark:text-gray-400 mb-2">Total Sales</div>
              <div class="text-3xl font-bold text-green-600">£{{ totalSalesRevenue.toLocaleString('en-GB') }}</div>
            </div>
            <div class="bg-white dark:bg-gray-800 rounded-lg p-6 border-2 border-blue-200 dark:border-blue-900">
              <div class="text-sm text-gray-600 dark:text-gray-400 mb-2">Crops Sold</div>
              <div class="text-3xl font-bold text-blue-600">{{ totalQuantitySold }}L</div>
            </div>
            <div class="bg-white dark:bg-gray-800 rounded-lg p-6 border-2 border-purple-200 dark:border-purple-900">
              <div class="text-sm text-gray-600 dark:text-gray-400 mb-2">Average Price</div>
              <div class="text-3xl font-bold text-purple-600">£{{ avgSalePrice.toFixed(2) }}/L</div>
            </div>
          </div>

          <!-- Sales List -->
          <div class="bg-white dark:bg-gray-800 rounded-lg overflow-hidden border-2 border-gray-200 dark:border-gray-700">
            <table class="w-full">
              <thead>
                <tr class="border-b-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
                  <th class="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Crop</th>
                  <th class="px-6 py-3 text-right text-sm font-semibold text-gray-900 dark:text-white">Quantity</th>
                  <th class="px-6 py-3 text-right text-sm font-semibold text-gray-900 dark:text-white">Price/L</th>
                  <th class="px-6 py-3 text-right text-sm font-semibold text-gray-900 dark:text-white">Total</th>
                  <th class="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Date</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="sale in salesHistory" :key="sale.id" class="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td class="px-6 py-4 text-gray-900 dark:text-white font-medium">{{ sale.cropName }}</td>
                  <td class="px-6 py-4 text-right text-gray-700 dark:text-gray-300">{{ formatVolume(sale.quantityToSell) }}L</td>
                  <td class="px-6 py-4 text-right text-gray-700 dark:text-gray-300">£{{ sale.salePrice.toFixed(2) }}</td>
                  <td class="px-6 py-4 text-right font-semibold text-green-600">£{{ (sale.quantityToSell * sale.salePrice).toLocaleString('en-GB', { maximumFractionDigits: 2 }) }}</td>
                  <td class="px-6 py-4 text-gray-600 dark:text-gray-400 text-sm">{{ formatDate(sale.saleDate) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Analytics Tab -->
      <div v-show="activeTab === 'analytics'" class="space-y-6">
        <!-- Storage Distribution -->
        <div class="bg-white dark:bg-gray-800 rounded-lg p-6 border-2 border-gray-200 dark:border-gray-700">
          <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-4">Storage Distribution</h3>
          
          <div v-if="storage.length === 0" class="text-center py-8 text-gray-500">
            No data available
          </div>

          <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-8">
            <!-- Pie Chart -->
            <div class="flex items-center justify-center">
              <svg width="200" height="200" viewBox="0 0 200 200" class="transform -rotate-90">
                <circle
                  v-for="(crop, index) in storage"
                  :key="crop.cropName"
                  cx="100"
                  cy="100"
                  r="80"
                  fill="none"
                  :stroke="chartColors[index % chartColors.length]"
                  stroke-width="60"
                  :stroke-dasharray="`${(crop.quantityStored / totalVolume * 502.65).toFixed(2)} 502.65`"
                  :stroke-dashoffset="getChartOffset(index)"
                  class="transition-all"
                />
              </svg>
            </div>

            <!-- Legend -->
            <div class="space-y-3">
              <div v-for="(crop, index) in storage" :key="crop.cropName" class="flex items-center justify-between">
                <div class="flex items-center gap-3">
                  <div 
                    class="w-4 h-4 rounded-full"
                    :style="{ backgroundColor: chartColors[index % chartColors.length] }"
                  ></div>
                  <span class="text-gray-900 dark:text-white font-medium">{{ crop.cropName }}</span>
                </div>
                <span class="text-sm text-gray-600 dark:text-gray-400">
                  {{ ((crop.quantityStored / totalVolume) * 100).toFixed(1) }}%
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Crop Statistics -->
        <div class="bg-white dark:bg-gray-800 rounded-lg p-6 border-2 border-gray-200 dark:border-gray-700">
          <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-4">Crop Statistics</h3>
          
          <div v-if="storage.length === 0" class="text-center py-8 text-gray-500">
            No data available
          </div>

          <div v-else class="space-y-4">
            <div v-for="crop in storage" :key="crop.cropName" class="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div class="flex justify-between items-center mb-2">
                <span class="font-medium text-gray-900 dark:text-white">{{ crop.cropName }}</span>
                <span class="text-sm text-gray-600 dark:text-gray-400">
                  {{ ((crop.quantityStored / totalVolume) * 100).toFixed(1) }}% of total
                </span>
              </div>
              <div class="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                <div
                  class="bg-green-600 h-2 rounded-full transition-all"
                  :style="{ width: ((crop.quantityStored / totalVolume) * 100) + '%' }"
                ></div>
              </div>
              <div class="flex justify-between text-xs text-gray-600 dark:text-gray-400 mt-2">
                <span>{{ formatVolume(crop.quantityStored) }}L stored</span>
                <span>Last updated: {{ formatDate(crop.lastUpdated) }}</span>
              </div>
            </div>
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
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-green-500"
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
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-green-500"
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
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-green-500"
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
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-green-500"
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
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-green-500"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Storage Location
            </label>
            <input
              v-model="editingCrop.storageLocation"
              type="text"
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-green-500"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Notes
            </label>
            <textarea
              v-model="editingCrop.notes"
              rows="3"
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-green-500"
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
            Currently stored: <strong>{{ formatVolume(editingCrop.quantityStored) }}L</strong>
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
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-green-500"
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
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-green-500"
            />
          </div>

          <div v-if="sellForm.quantityToSell && sellForm.salePrice" class="bg-green-50 dark:bg-green-900 p-3 rounded">
            <p class="text-sm text-green-900 dark:text-green-200">
              Total Sale: <strong>£{{ (sellForm.quantityToSell * sellForm.salePrice).toLocaleString('en-GB', { maximumFractionDigits: 2 }) }}</strong>
            </p>
          </div>
        </div>

        <div class="flex gap-2 mt-6">
          <button
            @click="showSellForm = false; editingCrop = null; resetSellForm()"
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
import { ref, computed, onMounted } from 'vue'
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

interface SaleRecord {
  id: number
  cropName: string
  quantityToSell: number
  salePrice: number
  saleDate: string
}

const farmStore = useFarmStore()
const storage = ref<CropStorageItem[]>([])
const salesHistory = ref<SaleRecord[]>([])
const loading = ref(false)

const activeTab = ref('overview')
const searchQuery = ref('')
const showAddForm = ref(false)
const showEditForm = ref(false)
const showSellForm = ref(false)
const editingCrop = ref<CropStorageItem | null>(null)

const tabs = [
  { id: 'overview', label: '📊 Overview' },
  { id: 'inventory', label: '📦 Inventory' },
  { id: 'sales', label: '💰 Sales History' },
  { id: 'analytics', label: '📈 Analytics' }
]

const chartColors = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316']

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

const filteredStorage = computed(() => {
  if (!searchQuery.value) return storage.value
  return storage.value.filter(crop =>
    crop.cropName.toLowerCase().includes(searchQuery.value.toLowerCase())
  )
})

const totalVolume = computed(() => {
  return storage.value.reduce((sum, crop) => sum + crop.quantityStored, 0)
})

const topStoredCrops = computed(() => {
  return [...storage.value].sort((a, b) => b.quantityStored - a.quantityStored).slice(0, 5)
})

const totalSalesRevenue = computed(() => {
  return salesHistory.value.reduce((sum, sale) => sum + (sale.quantityToSell * sale.salePrice), 0)
})

const totalQuantitySold = computed(() => {
  return salesHistory.value.reduce((sum, sale) => sum + sale.quantityToSell, 0)
})

const avgSalePrice = computed(() => {
  if (salesHistory.value.length === 0) return 0
  return totalSalesRevenue.value / totalQuantitySold.value
})

const estimatedValue = computed(() => {
  // Simple estimation: average sale price × total stored quantity
  if (salesHistory.value.length === 0) return 0
  return avgSalePrice.value * totalVolume.value
})

function formatVolume(liters: number): string {
  if (liters >= 1000000) {
    return (liters / 1000000).toFixed(2) + 'M'
  } else if (liters >= 1000) {
    return (liters / 1000).toFixed(2) + 'k'
  }
  return Math.round(liters).toString()
}

function formatDate(dateStr: string): string {
  try {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-GB', { year: 'numeric', month: 'short', day: 'numeric' })
  } catch {
    return dateStr
  }
}

function getChartOffset(index: number): number {
  if (index === 0) return 0
  let offset = 0
  for (let i = 0; i < index; i++) {
    offset -= (storage.value[i].quantityStored / totalVolume.value * 502.65)
  }
  return offset
}

function resetSellForm() {
  sellForm.value = { quantityToSell: 0, salePrice: 0 }
}

const fetchStorage = async () => {
  if (!farmStore.currentFarmId) return

  loading.value = true
  try {
    const response = await api.get(`/farms/${farmStore.currentFarmId}/storage`)
    storage.value = response || []
  } catch (error) {
    console.error('Failed to fetch storage:', error)
  } finally {
    loading.value = false
  }
}

const fetchSalesHistory = async () => {
  if (!farmStore.currentFarmId) return

  try {
    // Try to fetch sales history if endpoint exists
    const response = await api.get(`/farms/${farmStore.currentFarmId}/storage/sales`)
    salesHistory.value = response || []
  } catch (error) {
    // Endpoint may not exist yet, that's ok
    console.log('Sales history endpoint not available yet')
    salesHistory.value = []
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
    const index = storage.value.findIndex(c => c.id === editingCrop.value!.id)
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

    // Update storage with new quantity
    const index = storage.value.findIndex(c => c.id === editingCrop.value!.id)
    if (index !== -1) {
      storage.value[index] = response.storage
    }

    // Add to sales history
    if (response.sale) {
      salesHistory.value.push(response.sale)
    }

    showSellForm.value = false
    editingCrop.value = null
    resetSellForm()
  } catch (error) {
    console.error('Failed to sell crop:', error)
  }
}

const deleteCrop = async (id: number) => {
  if (!farmStore.currentFarmId) return
  
  const cropName = storage.value.find(c => c.id === id)?.cropName
  if (!cropName || !confirm(`Delete storage for ${cropName}?`)) return

  try {
    await api.delete(`/farms/${farmStore.currentFarmId}/storage/${cropName}`)
    storage.value = storage.value.filter(c => c.id !== id)
  } catch (error) {
    console.error('Failed to delete storage:', error)
  }
}

onMounted(async () => {
  await fetchStorage()
  await fetchSalesHistory()
})
</script>

<style scoped>
/* Component styles handled by Tailwind */
</style>
