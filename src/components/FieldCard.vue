<template>
  <div class="border-2 border-primary/20 dark:border-gray-700 rounded-card p-6 bg-white dark:bg-gray-800">
    <div class="flex justify-between items-start mb-4">
      <div>
  <h3 class="text-xl font-bold text-primary">Field {{ field.fieldNumber }}: {{ field.name }}</h3>
  <p class="text-text/60">{{ displaySize }} {{ unitLabelFull }}</p>
      </div>
      <div class="flex gap-2">
        <button
          v-if="!readonly && !editing"
          @click="showHistory = !showHistory"
          class="px-3 py-1 text-sm border border-primary rounded-lg hover:bg-primary/10"
          :class="{ 'bg-primary/10': showHistory }"
        >
          {{ showHistory ? 'Hide' : 'History' }}
        </button>
        <button
          v-if="!readonly"
          @click="editing = !editing; if (editing) loadRecommendations()"
          class="px-3 py-1 text-sm border border-primary rounded-lg hover:bg-primary/10"
        >
          {{ editing ? 'Cancel' : 'Edit' }}
        </button>
      </div>
    </div>

    <!-- Recommendations Section -->
    <div v-if="editing && showRecommendations && recommendations.length > 0" class="mb-4 p-4 bg-secondary/10 dark:bg-secondary/20 rounded-lg">
      <h4 class="font-bold text-primary mb-2">
        🌱 Recommended Next Crops
        <span v-if="previousCropForRecommendations" class="text-sm font-normal text-text/70">
          (after {{ previousCropForRecommendations }})
        </span>
      </h4>
      <div class="space-y-2">
        <div
          v-for="rec in recommendations.slice(0, 5)"
          :key="rec.crop"
          class="flex items-start gap-2"
        >
          <span
            class="px-2 py-0.5 rounded text-xs font-medium"
            :class="{
              'bg-green-500 text-white': rec.priority === 'high',
              'bg-yellow-500 text-white': rec.priority === 'medium',
              'bg-gray-400 text-white': rec.priority === 'low'
            }"
          >
            {{ rec.priority }}
          </span>
          <div class="flex-1">
            <button
              @click="selectCropFromRecommendation(rec.crop)"
              class="font-medium hover:text-primary underline"
            >
              {{ rec.crop }}
            </button>
            <p class="text-xs text-text/60">{{ rec.reason }}</p>
          </div>
        </div>
      </div>
    </div>

    <div v-if="editing" class="space-y-4">
      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium mb-2">Current Crop</label>
          <select
            v-model="editData.currentCrop"
            class="w-full px-3 py-2 border border-primary/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option :value="null">None</option>
            <optgroup label="Cereals">
              <option value="Wheat">Wheat</option>
              <option value="Barley">Barley</option>
              <option value="Oat">Oat</option>
              <option value="Sorghum">Sorghum</option>
            </optgroup>
            <optgroup label="Oilseeds">
              <option value="Canola">Canola</option>
              <option value="Sunflower">Sunflower</option>
              <option value="Soybean">Soybean</option>
            </optgroup>
            <optgroup label="Root Crops">
              <option value="Sugar Beet">Sugar Beet</option>
              <option value="Potato">Potato</option>
              <option value="Onions">Onions</option>
            </optgroup>
            <optgroup label="Legumes">
              <option value="Pea">Pea</option>
              <option value="Chickpea">Chickpea</option>
            </optgroup>
            <optgroup label="Industrial">
              <option value="Cotton">Cotton</option>
              <option value="Sugar Cane">Sugar Cane</option>
              <option value="Olives">Olives</option>
              <option value="Grapes">Grapes</option>
            </optgroup>
            <optgroup label="Forage/Silage">
              <option value="Corn">Corn</option>
              <option value="Grass">Grass</option>
            </optgroup>
            <optgroup label="Specialty">
              <option value="Poplar">Poplar</option>
              <option value="Spinach">Spinach</option>
              <option value="Green Beans">Green Beans</option>
              <option value="Carrots">Carrots</option>
              <option value="Parsnips">Parsnips</option>
              <option value="Red Beet">Red Beet</option>
            </optgroup>
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium mb-2">Growth Stage</label>
          <select
            v-model="editData.growthStage"
            class="w-full px-3 py-2 border border-primary/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option :value="null">Not Set</option>
            <option value="Plowed">Plowed</option>
            <option value="Cultivated">Cultivated</option>
            <option value="Seeded">Seeded</option>
            <option value="Fertilized">Fertilized</option>
            <option value="Growing">Growing</option>
            <option value="Ready to Harvest">Ready to Harvest</option>
            <option value="Harvested">Harvested</option>
          </select>
        </div>
      </div>

      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium mb-2">Fertiliser State</label>
          <select
            v-model="editData.fertiliserState"
            class="w-full px-3 py-2 border border-primary/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option :value="null">None</option>
            <option value="Stage 1 Applied">Stage 1 Applied</option>
            <option value="Stage 2 Applied">Stage 2 Applied</option>
            <option value="Stage 3 Applied">Stage 3 Applied</option>
            <option value="Fully Fertilized">Fully Fertilized</option>
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium mb-2">Weeds State</label>
          <select
            v-model="editData.weedsState"
            class="w-full px-3 py-2 border border-primary/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option :value="null">None</option>
            <option value="Light">Light</option>
            <option value="Medium">Medium</option>
            <option value="Heavy">Heavy</option>
            <option value="Sprayed">Sprayed</option>
          </select>
        </div>
      </div>

      <div>
        <label class="block text-sm font-medium mb-2">Notes</label>
        <textarea
          v-model="editData.notes"
          rows="2"
          class="w-full px-3 py-2 border border-primary/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
        ></textarea>
      </div>

      <button
        @click="handleSave"
        class="w-full bg-primary text-white py-2 rounded-lg hover:bg-primary/90"
      >
        Save Changes
      </button>
    </div>

    <div v-else>
      <!-- Field Info Display -->
      <div class="grid grid-cols-2 gap-4 mb-4">
        <div>
          <p class="text-sm text-text/60">Current Crop</p>
          <p class="font-medium">{{ field.currentCrop || 'None' }}</p>
        </div>
        <div>
          <p class="text-sm text-text/60">Growth Stage</p>
          <p class="font-medium">{{ field.growthStage || 'N/A' }}</p>
        </div>
        <div>
          <p class="text-sm text-text/60">Fertiliser</p>
          <p class="font-medium">{{ field.fertiliserState || 'N/A' }}</p>
        </div>
        <div>
          <p class="text-sm text-text/60">Weeds</p>
          <p class="font-medium">{{ field.weedsState || 'N/A' }}</p>
        </div>
        <div v-if="field.notes" class="col-span-2">
          <p class="text-sm text-text/60">Notes</p>
          <p class="font-medium">{{ field.notes }}</p>
        </div>
      </div>

      <!-- Production Costs Section -->
      <div class="mt-4 p-4 bg-gradient-to-br from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 rounded-lg border-2 border-green-200 dark:border-green-800">
        <div class="flex justify-between items-center mb-3">
          <h4 class="font-bold text-gray-900 dark:text-white flex items-center gap-2">
            💰 Production Costs
          </h4>
          <button
            v-if="!readonly && !editingCosts"
            @click="editingCosts = true; loadCostsData()"
            class="px-3 py-1 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            Track Costs
          </button>
          <button
            v-if="!readonly && editingCosts"
            @click="editingCosts = false"
            class="px-3 py-1 text-sm border border-gray-400 dark:border-gray-500 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            Cancel
          </button>
        </div>

        <!-- Cost Tracking Form -->
        <div v-if="editingCosts" class="space-y-3">
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Seeding Rate (L/ha)
              </label>
              <input
                v-model.number="costsData.seedingRate"
                type="number"
                step="1"
                min="0"
                class="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Expected Yield (L)
              </label>
              <input
                v-model.number="costsData.expectedYield"
                type="number"
                step="100"
                min="0"
                class="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Seed Cost ({{ currencySymbol }})
              </label>
              <input
                v-model.number="costsData.seedCost"
                type="number"
                step="0.01"
                min="0"
                class="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Fertilizer Cost ({{ currencySymbol }})
              </label>
              <input
                v-model.number="costsData.fertilizerCost"
                type="number"
                step="0.01"
                min="0"
                class="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Lime Cost ({{ currencySymbol }})
              </label>
              <input
                v-model.number="costsData.limeCost"
                type="number"
                step="0.01"
                min="0"
                class="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Weeding Cost ({{ currencySymbol }})
              </label>
              <input
                v-model.number="costsData.weedingCost"
                type="number"
                step="0.01"
                min="0"
                class="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Fuel Cost ({{ currencySymbol }})
              </label>
              <input
                v-model.number="costsData.fuelCost"
                type="number"
                step="0.01"
                min="0"
                class="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Equipment/Labor ({{ currencySymbol }})
              </label>
              <input
                v-model.number="costsData.equipmentCost"
                type="number"
                step="0.01"
                min="0"
                class="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Other Costs ({{ currencySymbol }})
              </label>
              <input
                v-model.number="costsData.otherCosts"
                type="number"
                step="0.01"
                min="0"
                class="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          </div>

          <button
            @click="saveCosts"
            :disabled="savingCosts"
            class="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 font-medium mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {{ savingCosts ? 'Saving...' : 'Save Production Costs' }}
          </button>
        </div>

        <!-- Cost Summary Display -->
        <div v-else class="space-y-2">
          <div v-if="hasCostData" class="grid grid-cols-2 gap-3 text-sm">
            <div v-if="field.seedingRate" class="col-span-2">
              <span class="text-gray-600 dark:text-gray-400">Seeding Rate:</span>
              <span class="font-semibold ml-2">{{ field.seedingRate }} L/ha</span>
            </div>
            <div v-if="field.expectedYield" class="col-span-2">
              <span class="text-gray-600 dark:text-gray-400">Expected Yield:</span>
              <span class="font-semibold ml-2">{{ field.expectedYield?.toLocaleString() }} L</span>
            </div>
            <div v-if="field.actualYield" class="col-span-2">
              <span class="text-gray-600 dark:text-gray-400">Actual Yield:</span>
              <span class="font-semibold ml-2">{{ field.actualYield?.toLocaleString() }} L</span>
              <span v-if="field.expectedYield" 
                class="text-xs ml-2"
                :class="field.actualYield >= field.expectedYield ? 'text-green-600' : 'text-amber-600'">
                ({{ field.actualYield >= field.expectedYield ? '+' : '' }}{{ ((field.actualYield - field.expectedYield) / field.expectedYield * 100).toFixed(1) }}%)
              </span>
            </div>
            <div v-if="field.seedCost">
              <span class="text-gray-600 dark:text-gray-400">Seeds:</span>
              <span class="font-semibold ml-2">{{ formatCurrency(field.seedCost) }}</span>
            </div>
            <div v-if="field.fertilizerCost">
              <span class="text-gray-600 dark:text-gray-400">Fertilizer:</span>
              <span class="font-semibold ml-2">{{ formatCurrency(field.fertilizerCost) }}</span>
            </div>
            <div v-if="field.limeCost">
              <span class="text-gray-600 dark:text-gray-400">Lime:</span>
              <span class="font-semibold ml-2">{{ formatCurrency(field.limeCost) }}</span>
            </div>
            <div v-if="field.weedingCost">
              <span class="text-gray-600 dark:text-gray-400">Weeding:</span>
              <span class="font-semibold ml-2">{{ formatCurrency(field.weedingCost) }}</span>
            </div>
            <div v-if="field.fuelCost">
              <span class="text-gray-600 dark:text-gray-400">Fuel:</span>
              <span class="font-semibold ml-2">{{ formatCurrency(field.fuelCost) }}</span>
            </div>
            <div v-if="field.equipmentCost">
              <span class="text-gray-600 dark:text-gray-400">Equipment:</span>
              <span class="font-semibold ml-2">{{ formatCurrency(field.equipmentCost) }}</span>
            </div>
            <div v-if="field.otherCosts">
              <span class="text-gray-600 dark:text-gray-400">Other:</span>
              <span class="font-semibold ml-2">{{ formatCurrency(field.otherCosts) }}</span>
            </div>
            <div class="col-span-2 pt-2 border-t-2 border-green-300 dark:border-green-700">
              <span class="text-gray-900 dark:text-white font-bold">Total Costs:</span>
              <span class="font-bold text-lg ml-2 text-green-700 dark:text-green-400">{{ formatCurrency(totalCosts) }}</span>
            </div>
            <div v-if="field.sizeHectares && totalCosts" class="col-span-2 text-xs text-gray-600 dark:text-gray-400">
              Cost per {{ unitLabelShort }}: {{ formatCurrency(costPerUnit) }}/{{ unitLabelShort }}
            </div>
          </div>
          <p v-else class="text-sm text-gray-600 dark:text-gray-400">
            No production costs tracked yet. Click "Track Costs" to start tracking expenses for this field.
          </p>
        </div>
      </div>
      
      <!-- Quick Action: Next Stage Button -->
      <div v-if="!readonly && getNextStage()" class="mt-4">
        <button
          @click="quickNextStage"
          class="w-full bg-secondary text-white py-2 rounded-lg hover:bg-secondary/90 font-medium flex items-center justify-center gap-2"
        >
          <span>→</span>
          <span>{{ getNextStageButtonText() }}</span>
        </button>
      </div>
    </div>

    <!-- Field History Section -->
    <div v-if="showHistory && !editing" class="mt-4 p-4 bg-surface dark:bg-gray-700 rounded-lg border border-primary/10 dark:border-gray-600">
      <h4 class="font-bold text-primary mb-3">📜 Field History</h4>
      <div v-if="loadingHistory" class="text-center py-2 text-sm text-text/60">Loading history...</div>
      <div v-else-if="history.length === 0" class="text-sm text-text/60">No history recorded yet.</div>
      <div v-else class="space-y-2 max-h-60 overflow-y-auto pr-2">
        <div
          v-for="entry in history"
          :key="entry.id"
          class="flex justify-between items-start gap-2 text-sm border-l-2 border-primary/40 pl-3 py-1"
        >
          <div class="flex-1 min-w-0">
            <span class="font-medium">{{ entry.crop }}</span>
            <span class="text-text/60"> - {{ entry.action }}</span>
            <p v-if="entry.notes" class="text-xs mt-1" :class="entry.action === 'Harvested' && entry.notes.includes('Harvested:') ? 'text-green-600 dark:text-green-400 font-semibold' : 'text-text/50'">
              {{ entry.notes }}
            </p>
          </div>
          <span class="text-xs text-text/40 whitespace-nowrap flex-shrink-0">
            {{ formatShortGameDate(entry.gameYear, entry.gameMonth, entry.gameDay) }}
          </span>
        </div>
      </div>
    </div>

    <p class="text-xs text-text/40 mt-4">Last updated: {{ formatDate(field.updatedAt) }}</p>
  </div>

  <!-- Harvest Dialog -->
  <div v-if="showHarvestDialog" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50" @click.self="cancelHarvest">
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
      <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-4">🌾 Record Harvest</h3>
      
      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Actual Yield (litres)
          </label>
          <input
            v-model.number="harvestYield"
            type="number"
            step="100"
            min="0"
            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            placeholder="How much did you harvest?"
            autofocus
          />
          <p v-if="field.expectedYield" class="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Expected: {{ field.expectedYield }} L
            <span v-if="harvestYield && field.expectedYield" 
              :class="harvestYield >= field.expectedYield ? 'text-green-600' : 'text-amber-600'">
              ({{ harvestYield >= field.expectedYield ? '+' : '' }}{{ ((harvestYield - field.expectedYield) / field.expectedYield * 100).toFixed(1) }}%)
            </span>
          </p>
        </div>

        <div class="flex gap-3">
          <button
            @click="cancelHarvest"
            class="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
          >
            Cancel
          </button>
          <button
            @click="confirmHarvest"
            class="flex-1 px-4 py-2 bg-secondary text-white rounded-lg hover:bg-secondary/90"
          >
            Confirm Harvest
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, watch, onMounted, computed } from 'vue'
import { api } from '../utils/api'
import { formatShortGameDate } from '../utils/gameDate'
import { useFarmStore } from '../stores/farm'

const farmStore = useFarmStore()

interface Field {
  id: number
  farmId: number
  fieldNumber: number
  name: string
  sizeHectares: number
  currentCrop: string | null
  growthStage: string | null
  fertiliserState: string | null
  weedsState: string | null
  notes: string | null
  updatedAt: string
  seedingRate?: number | null
  seedCost?: number
  fertilizerCost?: number
  limeCost?: number
  weedingCost?: number
  fuelCost?: number
  equipmentCost?: number
  otherCosts?: number
  expectedYield?: number | null
  actualYield?: number | null
}

interface HistoryEntry {
  id: number
  fieldId: number
  crop: string
  action: string
  growthStage: string | null
  gameYear: number
  gameMonth: number
  gameDay: number
  notes: string | null
}

interface CropRecommendation {
  crop: string
  priority: 'high' | 'medium' | 'low'
  reason: string
}

const props = defineProps<{
  field: Field
  readonly?: boolean
}>()

const emit = defineEmits<{
  update: []
}>()

const editing = ref(false)
const showHistory = ref(false)
const showRecommendations = ref(false)
const loadingHistory = ref(false)
const history = ref<HistoryEntry[]>([])
const recommendations = ref<CropRecommendation[]>([])
const previousCropForRecommendations = ref<string | null>(null)
const selectingFromRecommendation = ref(false)
const editingCosts = ref(false)
const savingCosts = ref(false)
const showHarvestDialog = ref(false)
const harvestYield = ref<number>(0)

const editData = reactive({
  currentCrop: props.field.currentCrop,
  growthStage: props.field.growthStage,
  fertiliserState: props.field.fertiliserState,
  weedsState: props.field.weedsState,
  notes: props.field.notes
})

const costsData = reactive({
  seedingRate: 0,
  seedCost: 0,
  fertilizerCost: 0,
  limeCost: 0,
  weedingCost: 0,
  fuelCost: 0,
  equipmentCost: 0,
  otherCosts: 0,
  expectedYield: 0
})

// Update editData when field prop changes
watch(() => props.field, (newField) => {
  editData.currentCrop = newField.currentCrop
  editData.growthStage = newField.growthStage
  editData.fertiliserState = newField.fertiliserState
  editData.weedsState = newField.weedsState
  editData.notes = newField.notes
}, { deep: true })

// Load history when showing it
watch(showHistory, async (show) => {
  if (show && history.value.length === 0) {
    await loadHistory()
  }
})

async function loadHistory() {
  try {
    loadingHistory.value = true
    history.value = await api.get(`/fields/${props.field.id}/history`)
  } catch (error) {
    console.error('Failed to load field history:', error)
  } finally {
    loadingHistory.value = false
  }
}

async function loadRecommendations() {
  try {
    // Only show recommendations when field is harvested or prepared for planting
    const showForStages = ['Harvested', 'Plowed', 'Cultivated']
    if (showForStages.includes(editData.growthStage || '')) {
      const data = await api.get(`/fields/${props.field.id}/recommendations`)
      recommendations.value = data.recommendations || []
      previousCropForRecommendations.value = data.previousCrop || null
      showRecommendations.value = true
    } else {
      showRecommendations.value = false
      previousCropForRecommendations.value = null
    }
  } catch (error) {
    console.error('Failed to load recommendations:', error)
    showRecommendations.value = false
    previousCropForRecommendations.value = null
  }
}

// Watch growth stage changes to show/hide recommendations and auto-clear on harvest
watch(() => editData.growthStage, (newStage) => {
  if (editing.value) {
    // Auto-clear crop and states when field is reset or prepared for new planting
    // BUT NOT when we're selecting from recommendations
    if (!selectingFromRecommendation.value && (newStage === null || newStage === 'Plowed' || newStage === 'Cultivated')) {
      editData.currentCrop = null
      editData.fertiliserState = null
      editData.weedsState = null
    }
    
    // Reset the flag after processing
    selectingFromRecommendation.value = false
    
    loadRecommendations()
  }
})

async function handleSave() {
  try {
    // Ensure we're not in "selecting from recommendation" mode
    selectingFromRecommendation.value = false
    
    await api.patch(`/fields/${props.field.id}`, editData)
    editing.value = false
    showRecommendations.value = false
    // Reload history if a significant action was taken
    if (['Harvested', 'Plowed', 'Cultivated', 'Seeded'].includes(editData.growthStage || '')) {
      history.value = [] // Clear to force reload
      if (showHistory.value) {
        await loadHistory()
      }
    }
    emit('update')
  } catch (error) {
    console.error('Failed to update field:', error)
  }
}

function selectCropFromRecommendation(crop: string) {
  selectingFromRecommendation.value = true
  editData.currentCrop = crop
  editData.growthStage = 'Seeded'
}

// Define the growth stage progression
const growthStageProgression: Record<string, string> = {
  'Plowed': 'Cultivated',
  'Cultivated': 'Seeded',
  'Seeded': 'Fertilized',
  'Fertilized': 'Growing',
  'Growing': 'Ready to Harvest',
  'Ready to Harvest': 'Harvested'
}

function getNextStage(): string | null {
  if (!props.field.growthStage) return null
  return growthStageProgression[props.field.growthStage] || null
}

function getNextStageButtonText(): string {
  const nextStage = getNextStage()
  if (!nextStage) return ''
  
  const stageActions: Record<string, string> = {
    'Cultivated': 'Cultivate Field',
    'Seeded': 'Seed Crop',
    'Fertilized': 'Apply Fertilizer',
    'Growing': 'Mark as Growing',
    'Ready to Harvest': 'Ready to Harvest',
    'Harvested': 'Harvest Crop'
  }
  
  return stageActions[nextStage] || `Move to ${nextStage}`
}

async function quickNextStage() {
  const nextStage = getNextStage()
  if (!nextStage) return
  
  // If moving to Harvested, show dialog to record yield
  if (nextStage === 'Harvested') {
    harvestYield.value = props.field.expectedYield || 0
    showHarvestDialog.value = true
    return
  }
  
  try {
    await api.patch(`/fields/${props.field.id}`, {
      growthStage: nextStage,
      currentCrop: props.field.currentCrop,
      fertiliserState: props.field.fertiliserState,
      weedsState: props.field.weedsState,
      notes: props.field.notes
    })
    
    // Reload history if a significant action was taken
    if (['Harvested', 'Plowed', 'Cultivated', 'Seeded'].includes(nextStage)) {
      history.value = [] // Clear to force reload
      if (showHistory.value) {
        await loadHistory()
      }
    }
    
    emit('update')
  } catch (error) {
    console.error('Failed to update field:', error)
  }
}

async function confirmHarvest() {
  try {
    await api.patch(`/fields/${props.field.id}`, {
      growthStage: 'Harvested',
      currentCrop: props.field.currentCrop,
      fertiliserState: props.field.fertiliserState,
      weedsState: props.field.weedsState,
      notes: props.field.notes,
      actualYield: harvestYield.value || null
    })
    
    showHarvestDialog.value = false
    
    // Reload history
    history.value = []
    if (showHistory.value) {
      await loadHistory()
    }
    
    emit('update')
  } catch (error) {
    console.error('Failed to harvest field:', error)
  }
}

function cancelHarvest() {
  showHarvestDialog.value = false
  harvestYield.value = 0
}

function formatDate(dateString: string) {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

// Currency and cost tracking
const currencySymbols: Record<string, string> = {
  'GBP': '£', 'EUR': '€', 'USD': '$', 'CAD': 'C$', 'AUD': 'A$',
  'JPY': '¥', 'CHF': 'CHF', 'SEK': 'kr', 'NOK': 'kr', 'DKK': 'kr',
  'PLN': 'zł', 'CZK': 'Kč', 'HUF': 'Ft'
}

const currencySymbol = computed(() => {
  const currency = farmStore.currentFarm?.currency || 'GBP'
  return currencySymbols[currency] || currency
})

const hasCostData = computed(() => {
  return !!(
    props.field.seedCost ||
    props.field.fertilizerCost ||
    props.field.limeCost ||
    props.field.weedingCost ||
    props.field.fuelCost ||
    props.field.equipmentCost ||
    props.field.otherCosts ||
    props.field.seedingRate ||
    props.field.expectedYield
  )
})

const totalCosts = computed(() => {
  return (
    (props.field.seedCost || 0) +
    (props.field.fertilizerCost || 0) +
    (props.field.limeCost || 0) +
    (props.field.weedingCost || 0) +
    (props.field.fuelCost || 0) +
    (props.field.equipmentCost || 0) +
    (props.field.otherCosts || 0)
  )
})

// Area unit conversion and display helpers
const HA_TO_AC = 2.47105381
function hectaresToAcres(ha: number) { return ha * HA_TO_AC }
function acresToHectares(ac: number) { return ac / HA_TO_AC }

const unitIsAcres = computed(() => farmStore.currentFarm?.areaUnit === 'acres')
const displaySize = computed(() => {
  const ha = props.field.sizeHectares || 0
  return unitIsAcres.value ? Number(hectaresToAcres(ha).toFixed(2)) : Number(ha.toFixed(2))
})
const unitLabelFull = computed(() => unitIsAcres.value ? 'acres' : 'hectares')
const unitLabelShort = computed(() => unitIsAcres.value ? 'ac' : 'ha')
const costPerUnit = computed(() => {
  const ha = props.field.sizeHectares || 0
  if (!ha || !totalCosts.value) return 0
  if (unitIsAcres.value) {
    const acres = hectaresToAcres(ha)
    return acres ? totalCosts.value / acres : 0
  }
  return totalCosts.value / ha
})

function formatCurrency(amount: number | undefined): string {
  if (amount === undefined || amount === null) return currencySymbol.value + '0.00'
  return currencySymbol.value + amount.toFixed(2)
}

function loadCostsData() {
  costsData.seedingRate = props.field.seedingRate || 0
  costsData.seedCost = props.field.seedCost || 0
  costsData.fertilizerCost = props.field.fertilizerCost || 0
  costsData.limeCost = props.field.limeCost || 0
  costsData.weedingCost = props.field.weedingCost || 0
  costsData.fuelCost = props.field.fuelCost || 0
  costsData.equipmentCost = props.field.equipmentCost || 0
  costsData.otherCosts = props.field.otherCosts || 0
  costsData.expectedYield = props.field.expectedYield || 0
}

async function saveCosts() {
  if (savingCosts.value) return // Prevent double-click
  
  try {
    savingCosts.value = true
    console.log('Starting save operation...')
    console.log('Field ID:', props.field.id)
    console.log('Data to save:', {
      seedingRate: costsData.seedingRate || null,
      seedCost: costsData.seedCost,
      fertilizerCost: costsData.fertilizerCost,
      limeCost: costsData.limeCost,
      weedingCost: costsData.weedingCost,
      fuelCost: costsData.fuelCost,
      equipmentCost: costsData.equipmentCost,
      otherCosts: costsData.otherCosts,
      expectedYield: costsData.expectedYield || null
    })
    
    const result = await api.patch(`/fields/${props.field.id}/production`, {
      seedingRate: costsData.seedingRate || null,
      seedCost: costsData.seedCost,
      fertilizerCost: costsData.fertilizerCost,
      limeCost: costsData.limeCost,
      weedingCost: costsData.weedingCost,
      fuelCost: costsData.fuelCost,
      equipmentCost: costsData.equipmentCost,
      otherCosts: costsData.otherCosts,
      expectedYield: costsData.expectedYield || null
    })
    
    console.log('✅ Save successful! Response:', result)
    editingCosts.value = false
    emit('update')
  } catch (error: any) {
    console.error('❌ Save failed:', error)
    console.error('Error details:', {
      message: error.message,
      stack: error.stack
    })
    alert(`Failed to save production costs:\n${error.message}\n\nPlease check the console for details.`)
  } finally {
    savingCosts.value = false
  }
}

</script>
