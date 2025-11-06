<template>
  <div class="p-6 max-w-6xl mx-auto space-y-6">
    <div>
      <h1 class="text-3xl font-bold text-gray-900 dark:text-white">Farm Calculators</h1>
      <p class="text-gray-600 dark:text-gray-400 mt-2">Planning tools for Farming Simulator 25</p>
    </div>

    <!-- Calculator Navigation -->
    <div class="flex flex-wrap gap-2">
      <button
        v-for="calc in calculators"
        :key="calc.id"
        @click="activeCalculator = calc.id"
        :class="[
          'px-4 py-2 rounded-lg font-medium transition-colors',
          activeCalculator === calc.id
            ? 'bg-green-600 text-white'
            : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
        ]"
      >
        {{ calc.name }}
      </button>
    </div>

    <!-- Field Profitability Calculator -->
    <div v-if="activeCalculator === 'profitability'" class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-4">Crop Profitability Calculator</h2>
      <p class="text-gray-600 dark:text-gray-400 mb-6">Calculate expected profit from planting a crop in FS25</p>

      <!-- Field Selector -->
      <div class="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
        <label class="block text-sm font-medium text-gray-900 dark:text-white mb-2">
          Auto-fill from Field (Optional)
        </label>
        <select
          v-model="selectedFieldId"
          @change="autofillFromField"
          class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        >
          <option :value="null">-- Select a field to auto-fill --</option>
          <option v-for="field in fields" :key="field.id" :value="field.id">
            Field {{ field.fieldNumber }} - {{ field.name }} ({{ field.sizeHectares }}ha)
            <template v-if="field.currentCrop"> - {{ field.currentCrop }}</template>
          </option>
        </select>
        <p class="text-xs text-gray-600 dark:text-gray-400 mt-2">
          Select a field to auto-fill data from your current production cycle
        </p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Field Size (hectares)
            </label>
            <input
              v-model.number="profitCalc.fieldSize"
              type="number"
              step="0.1"
              min="0"
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Seed Cost per Hectare ({{ currencySymbol }})
            </label>
            <input
              v-model.number="profitCalc.seedCost"
              type="number"
              step="0.01"
              min="0"
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Expected Yield (litres per hectare)
            </label>
            <input
              v-model.number="profitCalc.yieldPerHa"
              type="number"
              step="100"
              min="0"
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Selling Price per 1000L ({{ currencySymbol }})
            </label>
            <input
              v-model.number="profitCalc.sellingPrice"
              type="number"
              step="10"
              min="0"
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Operating Costs per Hectare ({{ currencySymbol }})
            </label>
            <input
              v-model.number="profitCalc.operatingCost"
              type="number"
              step="10"
              min="0"
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
            <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">Fertilizer, lime, weeding, fuel, etc.</p>
          </div>
        </div>

        <div class="space-y-4">
          <div class="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border-2 border-green-200 dark:border-green-800">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Results</h3>
            <div class="space-y-3">
              <div class="flex justify-between items-center">
                <span class="text-gray-600 dark:text-gray-400">Total Revenue:</span>
                <span class="font-bold text-gray-900 dark:text-white">{{ formatCurrency(profitResults.revenue) }}</span>
              </div>
              <div class="flex justify-between items-center">
                <span class="text-gray-600 dark:text-gray-400">Total Costs:</span>
                <span class="font-bold text-gray-900 dark:text-white">{{ formatCurrency(profitResults.costs) }}</span>
              </div>
              <div class="border-t-2 border-green-300 dark:border-green-700 pt-3">
                <div class="flex justify-between items-center">
                  <span class="text-lg font-semibold text-gray-900 dark:text-white">Net Profit:</span>
                  <span :class="[
                    'text-xl font-bold',
                    profitResults.profit >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                  ]">
                    {{ formatCurrency(profitResults.profit) }}
                  </span>
                </div>
                <div class="flex justify-between items-center mt-2">
                  <span class="text-sm text-gray-600 dark:text-gray-400">Profit per Hectare:</span>
                  <span :class="[
                    'font-bold',
                    profitResults.profitPerHa >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                  ]">
                    {{ formatCurrency(profitResults.profitPerHa) }}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div class="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
            <h4 class="font-semibold text-gray-900 dark:text-white mb-2">💡 FS25 Tips</h4>
            <ul class="text-sm text-gray-600 dark:text-gray-400 space-y-1">
              <li>• Use fertilizer stages for maximum yield</li>
              <li>• Crop rotation increases yield by 15%</li>
              <li>• Watch market prices - they fluctuate!</li>
              <li>• Consider equipment costs vs hired workers</li>
            </ul>
          </div>
        </div>
      </div>
    </div>

    <!-- Loan Payment Calculator -->
    <div v-if="activeCalculator === 'loan'" class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-4">Equipment Loan Calculator</h2>
      <p class="text-gray-600 dark:text-gray-400 mb-6">Calculate loan payments for equipment purchases in FS25</p>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Loan Amount ({{ currencySymbol }})
            </label>
            <input
              v-model.number="loanCalc.amount"
              type="number"
              step="100"
              min="0"
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Annual Interest Rate (%)
            </label>
            <input
              v-model.number="loanCalc.interestRate"
              type="number"
              step="0.1"
              min="0"
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Loan Term (months)
            </label>
            <input
              v-model.number="loanCalc.termMonths"
              type="number"
              step="1"
              min="1"
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
        </div>

        <div class="space-y-4">
          <div class="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border-2 border-blue-200 dark:border-blue-800">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Results</h3>
            <div class="space-y-3">
              <div class="flex justify-between items-center">
                <span class="text-gray-600 dark:text-gray-400">Monthly Payment:</span>
                <span class="font-bold text-gray-900 dark:text-white">{{ formatCurrency(loanResults.monthlyPayment) }}</span>
              </div>
              <div class="flex justify-between items-center">
                <span class="text-gray-600 dark:text-gray-400">Total Interest:</span>
                <span class="font-bold text-red-600 dark:text-red-400">{{ formatCurrency(loanResults.totalInterest) }}</span>
              </div>
              <div class="border-t-2 border-blue-300 dark:border-blue-700 pt-3">
                <div class="flex justify-between items-center">
                  <span class="text-lg font-semibold text-gray-900 dark:text-white">Total Payback:</span>
                  <span class="text-xl font-bold text-gray-900 dark:text-white">
                    {{ formatCurrency(loanResults.totalPayback) }}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div class="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4 border border-yellow-200 dark:border-yellow-800">
            <h4 class="font-semibold text-gray-900 dark:text-white mb-2">⚠️ FS25 Loans</h4>
            <ul class="text-sm text-gray-600 dark:text-gray-400 space-y-1">
              <li>• Loan limit based on land & equipment value</li>
              <li>• Default interest rate is ~3-4% annually</li>
              <li>• Consider leasing equipment instead</li>
              <li>• Pay off loans to unlock more credit</li>
            </ul>
          </div>
        </div>
      </div>
    </div>

    <!-- Seeding Rate Calculator -->
    <div v-if="activeCalculator === 'seeding'" class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-4">Seed Cost Calculator</h2>
      <p class="text-gray-600 dark:text-gray-400 mb-6">Calculate seed requirements and costs for your field in FS25</p>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Field Size (hectares)
            </label>
            <input
              v-model.number="seedCalc.fieldSize"
              type="number"
              step="0.1"
              min="0"
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Seeding Rate (litres per hectare)
            </label>
            <input
              v-model.number="seedCalc.ratePerHa"
              type="number"
              step="10"
              min="0"
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Seed Price per Litre ({{ currencySymbol }})
            </label>
            <input
              v-model.number="seedCalc.pricePerKg"
              type="number"
              step="0.01"
              min="0"
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          <div class="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
            <h4 class="font-semibold text-gray-900 dark:text-white mb-2">FS25 Seeding Rates</h4>
            <ul class="text-sm text-gray-600 dark:text-gray-400 space-y-1">
              <li>• Wheat: 120-150 L/ha</li>
              <li>• Barley: 110-140 L/ha</li>
              <li>• Oats: 130-160 L/ha</li>
              <li>• Canola: 50-70 L/ha</li>
              <li>• Corn: 30-50 L/ha</li>
              <li>• Soybeans: 70-90 L/ha</li>
              <li>• Sunflowers: 40-60 L/ha</li>
              <li>• Onions: 51 L/ha</li>
            </ul>
          </div>
        </div>

        <div class="space-y-4">
          <div class="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 border-2 border-purple-200 dark:border-purple-800">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Results</h3>
            <div class="space-y-3">
              <div class="flex justify-between items-center">
                <span class="text-gray-600 dark:text-gray-400">Total Seed Needed:</span>
                <span class="font-bold text-gray-900 dark:text-white">{{ seedResults.totalSeed.toFixed(0) }} L</span>
              </div>
              <div class="border-t-2 border-purple-300 dark:border-purple-700 pt-3">
                <div class="flex justify-between items-center">
                  <span class="text-lg font-semibold text-gray-900 dark:text-white">Total Cost:</span>
                  <span class="text-xl font-bold text-gray-900 dark:text-white">
                    {{ formatCurrency(seedResults.totalCost) }}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div class="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border border-green-200 dark:border-green-800">
            <h4 class="font-semibold text-gray-900 dark:text-white mb-2">🌱 FS25 Tips</h4>
            <ul class="text-sm text-gray-600 dark:text-gray-400 space-y-1">
              <li>• Seeds are measured in litres in FS25</li>
              <li>• Seed prices vary by crop type</li>
              <li>• Use seeder with correct working width</li>
              <li>• Store excess seed for next season</li>
            </ul>
          </div>
        </div>
      </div>
    </div>

    <!-- Break-Even Calculator -->
    <div v-if="activeCalculator === 'breakeven'" class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-4">Break-Even Price Calculator</h2>
      <p class="text-gray-600 dark:text-gray-400 mb-6">Find the minimum selling price needed to break even in FS25</p>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Total Production Costs ({{ currencySymbol }})
            </label>
            <input
              v-model.number="breakevenCalc.totalCosts"
              type="number"
              step="10"
              min="0"
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
            <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">Seeds, fertilizer, lime, fuel, equipment lease, etc.</p>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Expected Yield (litres)
            </label>
            <input
              v-model.number="breakevenCalc.expectedYield"
              type="number"
              step="100"
              min="0"
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Current Market Price ({{ currencySymbol }}/1000L)
            </label>
            <input
              v-model.number="breakevenCalc.marketPrice"
              type="number"
              step="10"
              min="0"
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
            <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">Check prices at sell points</p>
          </div>
        </div>

        <div class="space-y-4">
          <div class="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4 border-2 border-orange-200 dark:border-orange-800">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Results</h3>
            <div class="space-y-3">
              <div class="flex justify-between items-center">
                <span class="text-gray-600 dark:text-gray-400">Break-Even Price:</span>
                <span class="font-bold text-gray-900 dark:text-white">
                  {{ formatCurrency(breakevenResults.breakevenPrice) }}/1000L
                </span>
              </div>
              <div class="flex justify-between items-center">
                <span class="text-gray-600 dark:text-gray-400">Market Price:</span>
                <span class="font-bold text-gray-900 dark:text-white">
                  {{ formatCurrency(breakevenCalc.marketPrice) }}/1000L
                </span>
              </div>
              <div class="border-t-2 border-orange-300 dark:border-orange-700 pt-3">
                <div class="flex justify-between items-center">
                  <span class="text-lg font-semibold text-gray-900 dark:text-white">Price Difference:</span>
                  <span :class="[
                    'text-xl font-bold',
                    breakevenResults.priceDifference >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                  ]">
                    {{ breakevenResults.priceDifference >= 0 ? '+' : '' }}{{ formatCurrency(breakevenResults.priceDifference) }}/1000L
                  </span>
                </div>
                <div class="mt-2">
                  <span :class="[
                    'text-sm font-medium',
                    breakevenResults.priceDifference >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                  ]">
                    {{ breakevenResults.priceDifference >= 0 ? '✓ Profitable - Sell now!' : '✗ Below break-even - Wait for better prices' }}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div class="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
            <h4 class="font-semibold text-gray-900 dark:text-white mb-2">📊 FS25 Strategy</h4>
            <ul class="text-sm text-gray-600 dark:text-gray-400 space-y-1">
              <li>• Store crops if prices are below break-even</li>
              <li>• Prices change monthly and by location</li>
              <li>• Great Demands offer 50% price bonus</li>
              <li>• Check all sell points for best price</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useFarmStore } from '../stores/farm'
import { api } from '../utils/api'

const farmStore = useFarmStore()

const currency = computed(() => farmStore.currentFarm?.currency || '£')

// Map currency codes to symbols
const currencySymbols: Record<string, string> = {
  'GBP': '£',
  'EUR': '€',
  'USD': '$',
  'AUD': 'A$',
  'CAD': 'C$',
  'CHF': 'CHF',
  'PLN': 'zł',
  'CZK': 'Kč',
  'HUF': 'Ft',
  'RUB': '₽',
  'BRL': 'R$',
  'JPY': '¥',
  'CNY': '¥',
}

const currencySymbol = computed(() => {
  const curr = farmStore.currentFarm?.currency || '£'
  // If currency is already a symbol, return it
  if (curr.length <= 2 && !curr.match(/^[A-Z]{3}$/)) {
    return curr
  }
  // Otherwise, look up the symbol from the code
  return currencySymbols[curr] || curr
})

// Field selection for auto-fill
const fields = ref<any[]>([])
const selectedFieldId = ref<number | null>(null)

// Fetch fields when component mounts
onMounted(async () => {
  if (farmStore.currentFarmId) {
    try {
      fields.value = await api.get(`/farms/${farmStore.currentFarmId}/fields`)
      console.log('Loaded fields for calculator:', fields.value)
    } catch (error) {
      console.error('Failed to load fields:', error)
    }
  }
})

// Auto-fill calculator from selected field
function autofillFromField() {
  if (!selectedFieldId.value) return
  
  const field = fields.value.find(f => f.id === selectedFieldId.value)
  console.log('Autofilling from field:', field)
  if (!field) return

  // Auto-fill profitability calculator
  profitCalc.value.fieldSize = field.sizeHectares || 0
  
  // Calculate seed cost per hectare from stored data
  if (field.seedCost && field.sizeHectares) {
    profitCalc.value.seedCost = field.seedCost / field.sizeHectares
    console.log('Set seed cost per ha:', profitCalc.value.seedCost)
  }
  
  // Use expected yield if available
  if (field.expectedYield && field.sizeHectares) {
    profitCalc.value.yieldPerHa = field.expectedYield / field.sizeHectares
    console.log('Set yield per ha:', profitCalc.value.yieldPerHa)
  }
  
  // Calculate operating cost per hectare from all stored costs
  const totalOtherCosts = (field.fertilizerCost || 0) + 
                          (field.limeCost || 0) + 
                          (field.weedingCost || 0) + 
                          (field.fuelCost || 0) + 
                          (field.equipmentCost || 0) + 
                          (field.otherCosts || 0)
  
  console.log('Total other costs:', totalOtherCosts)
  
  if (totalOtherCosts && field.sizeHectares) {
    profitCalc.value.operatingCost = totalOtherCosts / field.sizeHectares
    console.log('Set operating cost per ha:', profitCalc.value.operatingCost)
  }
  
  // Update seeding calculator too
  seedCalc.value.fieldSize = field.sizeHectares || 0
  if (field.seedingRate) {
    seedCalc.value.ratePerHa = field.seedingRate
    console.log('Set seeding rate:', seedCalc.value.ratePerHa)
  }
  
  console.log('✅ Autofill complete!')
}

const calculators = [
  { id: 'profitability', name: 'Field Profitability' },
  { id: 'loan', name: 'Loan Payment' },
  { id: 'seeding', name: 'Seeding Rate' },
  { id: 'breakeven', name: 'Break-Even' },
]

const activeCalculator = ref('profitability')

// Field Profitability Calculator
const profitCalc = ref({
  fieldSize: 10,
  seedCost: 200,
  yieldPerHa: 5000,
  sellingPrice: 500,
  operatingCost: 400,
})

const profitResults = computed(() => {
  const revenue = (profitCalc.value.fieldSize * profitCalc.value.yieldPerHa * profitCalc.value.sellingPrice) / 1000
  const costs = profitCalc.value.fieldSize * (profitCalc.value.seedCost + profitCalc.value.operatingCost)
  const profit = revenue - costs
  const profitPerHa = profitCalc.value.fieldSize > 0 ? profit / profitCalc.value.fieldSize : 0

  return {
    revenue,
    costs,
    profit,
    profitPerHa,
  }
})

// Loan Payment Calculator
const loanCalc = ref({
  amount: 100000,
  interestRate: 3.5,
  termMonths: 48,
})

const loanResults = computed(() => {
  const principal = loanCalc.value.amount
  const monthlyRate = loanCalc.value.interestRate / 100 / 12
  const numPayments = loanCalc.value.termMonths

  let monthlyPayment = 0
  if (monthlyRate > 0) {
    monthlyPayment = principal * (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / (Math.pow(1 + monthlyRate, numPayments) - 1)
  } else {
    monthlyPayment = principal / numPayments
  }

  const totalPayback = monthlyPayment * numPayments
  const totalInterest = totalPayback - principal

  return {
    monthlyPayment: isNaN(monthlyPayment) ? 0 : monthlyPayment,
    totalPayback: isNaN(totalPayback) ? 0 : totalPayback,
    totalInterest: isNaN(totalInterest) ? 0 : totalInterest,
  }
})

// Seeding Rate Calculator
const seedCalc = ref({
  fieldSize: 10,
  ratePerHa: 120,
  pricePerKg: 1.50,
})

const seedResults = computed(() => {
  const totalSeed = seedCalc.value.fieldSize * seedCalc.value.ratePerHa
  const totalCost = totalSeed * seedCalc.value.pricePerKg

  return {
    totalSeed,
    totalCost,
  }
})

// Break-Even Calculator
const breakevenCalc = ref({
  totalCosts: 6000,
  expectedYield: 50000,
  marketPrice: 500,
})

const breakevenResults = computed(() => {
  const breakevenPrice = breakevenCalc.value.expectedYield > 0 
    ? (breakevenCalc.value.totalCosts / breakevenCalc.value.expectedYield) * 1000
    : 0
  const priceDifference = breakevenCalc.value.marketPrice - breakevenPrice

  return {
    breakevenPrice,
    priceDifference,
  }
})

function formatCurrency(value: number): string {
  return `${currencySymbol.value}${value.toFixed(2)}`
}
</script>
