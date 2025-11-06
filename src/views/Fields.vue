<template>
  <div class="py-8">
    <div class="flex justify-between items-center mb-6">
      <h2 class="text-3xl font-bold text-primary">Field Tracker</h2>
      <button
        v-if="!isViewer"
        @click="showAddModal = true"
        class="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
      >
        Add Field
      </button>
    </div>

    <div v-if="loading" class="text-center py-8">Loading fields...</div>

    <div v-else-if="fields.length === 0" class="text-center py-8 text-text/60">
      No fields yet. Click "Add Field" to get started.
    </div>

    <div v-else class="grid gap-4">
      <FieldCard
        v-for="field in fields"
        :key="field.id"
        :field="field"
        :readonly="isViewer"
        @update="handleUpdate"
      />
    </div>

    <!-- Add Field Modal -->
    <div v-if="showAddModal" class="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div class="bg-white dark:bg-gray-800 rounded-card p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <h3 class="text-2xl font-bold text-primary mb-6">Add New Field</h3>
        <form @submit.prevent="handleAdd" class="space-y-4">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium mb-2">Field Number</label>
              <input
                v-model.number="newField.fieldNumber"
                type="number"
                required
                class="w-full px-4 py-2 border border-primary/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label class="block text-sm font-medium mb-2">Name</label>
              <input
                v-model="newField.name"
                type="text"
                required
                class="w-full px-4 py-2 border border-primary/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>
          
                  <div>
                    <label class="block text-sm font-medium mb-2">Size ({{ farmStore.currentFarm?.areaUnit === 'acres' ? 'acres' : 'hectares' }})</label>
                    <input
                      v-model.number="newFieldDisplaySize"
                      type="number"
                      step="0.1"
                      required
                      class="w-full px-4 py-2 border border-primary/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>

          <div class="flex gap-4 pt-4">
            <button
              type="submit"
              class="flex-1 bg-primary text-white py-3 rounded-lg font-medium hover:bg-primary/90"
            >
              Add Field
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
import FieldCard from '../components/FieldCard.vue'

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
}

const farmStore = useFarmStore()
const fields = ref<Field[]>([])
const loading = ref(true)
const showAddModal = ref(false)
const isViewer = ref(false)

const newField = ref({
  fieldNumber: 1,
  name: '',
  sizeHectares: 10
})

// Conversion helpers
const HA_TO_AC = 2.47105381
function hectaresToAcres(ha: number) { return ha * HA_TO_AC }
function acresToHectares(ac: number) { return ac / HA_TO_AC }

import { computed, watch } from 'vue'

// Display value for size input — shows value in selected unit but stores in hectares
const newFieldDisplaySize = computed({
  get() {
    const unit = farmStore.currentFarm?.areaUnit || 'hectares'
    return unit === 'acres' ? Number((hectaresToAcres(newField.value.sizeHectares || 0)).toFixed(2)) : newField.value.sizeHectares
  },
  set(val: number) {
    const unit = farmStore.currentFarm?.areaUnit || 'hectares'
    newField.value.sizeHectares = unit === 'acres' ? acresToHectares(val || 0) : (val || 0)
  }
})

onMounted(async () => {
  await loadFields()
})

async function loadFields() {
  try {
    loading.value = true
    fields.value = await api.get(`/farms/${farmStore.currentFarmId}/fields`)
  } catch (error) {
    console.error('Failed to load fields:', error)
  } finally {
    loading.value = false
  }
}

async function handleAdd() {
  try {
    await api.post(`/farms/${farmStore.currentFarmId}/fields`, newField.value)
    showAddModal.value = false
    newField.value = { fieldNumber: 1, name: '', sizeHectares: 10 }
    await loadFields()
  } catch (error) {
    console.error('Failed to add field:', error)
  }
}

async function handleUpdate() {
  await loadFields()
}
</script>
