<template>
  <div class="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 p-6">
    <div class="max-w-7xl mx-auto">
      <!-- Header -->
      <div class="mb-8">
        <h1 class="text-4xl font-bold text-gray-800 dark:text-white mb-2">Crop Calendar</h1>
        <p class="text-gray-600 dark:text-gray-300">
          Plan your planting and harvesting schedule based on Farming Simulator 25 crop seasons
        </p>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-2 md:hidden">
          💡 Swipe left/right to view all months
        </p>
      </div>

      <!-- Calendar Grid -->
      <div ref="calendarContainer" class="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-x-auto relative pt-10">
        <div class="min-w-[800px]">
          <!-- Current Date Indicator Line -->
          <div 
            v-if="currentDatePosition !== null"
            class="absolute top-10 bottom-0 w-0.5 bg-red-500 z-10 pointer-events-none"
            :style="{ left: currentDatePosition + 'px' }"
          >
            <!-- Date label at top -->
            <div class="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-red-500 text-white text-xs font-semibold px-2 py-1 rounded whitespace-nowrap shadow-lg">
              {{ currentDateLabel }}
            </div>
            <!-- Arrow at top -->
            <div class="absolute -top-1 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-red-500"></div>
          </div>

          <!-- Month Headers -->
          <div class="grid grid-cols-13 border-b border-gray-200 dark:border-gray-700">
            <div class="p-4 font-semibold text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700">
              Crop
            </div>
            <div 
              v-for="month in months" 
              :key="month"
              class="p-2 text-center font-semibold text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700"
            >
              {{ month }}
            </div>
          </div>

          <!-- Crop Rows -->
          <div 
            v-for="crop in crops" 
            :key="crop.name"
            class="grid grid-cols-13 border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <!-- Crop Name -->
            <div class="p-4 font-medium text-gray-800 dark:text-white border-r border-gray-200 dark:border-gray-700 flex items-center">
              {{ crop.name }}
            </div>

            <!-- Month Cells -->
            <div 
              v-for="(month, index) in months" 
              :key="month"
              class="relative border-r border-gray-200 dark:border-gray-700 min-h-[60px] flex flex-col"
            >
              <!-- Planting Period (Top Half) -->
              <div 
                v-if="isInRange(index + 1, crop.plantingStart, crop.plantingEnd)"
                class="flex-1 bg-green-200 dark:bg-green-900 opacity-60 relative"
                :class="{
                  'rounded-tl-lg': index + 1 === crop.plantingStart,
                  'rounded-tr-lg': index + 1 === crop.plantingEnd
                }"
              >
                <div 
                  v-if="index + 1 === crop.plantingStart" 
                  class="absolute inset-0 flex items-center justify-center text-xs font-semibold text-green-800 dark:text-green-200"
                >
                  Plant
                </div>
              </div>

              <!-- Harvesting Period (Bottom Half) -->
              <div 
                v-if="isInRange(index + 1, crop.harvestStart, crop.harvestEnd)"
                class="flex-1 bg-yellow-200 dark:bg-yellow-900 opacity-60 relative"
                :class="{
                  'rounded-bl-lg': index + 1 === crop.harvestStart,
                  'rounded-br-lg': index + 1 === crop.harvestEnd,
                  'rounded-tl-lg': !isInRange(index + 1, crop.plantingStart, crop.plantingEnd) && index + 1 === crop.harvestStart,
                  'rounded-tr-lg': !isInRange(index + 1, crop.plantingStart, crop.plantingEnd) && index + 1 === crop.harvestEnd
                }"
              >
                <div 
                  v-if="index + 1 === crop.harvestStart" 
                  class="absolute inset-0 flex items-center justify-center text-xs font-semibold text-yellow-800 dark:text-yellow-200"
                >
                  Harvest
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Legend -->
      <div class="mt-6 flex gap-6 justify-center">
        <div class="flex items-center gap-2">
          <div class="w-6 h-6 bg-green-200 dark:bg-green-900 rounded border border-green-300 dark:border-green-700"></div>
          <span class="text-sm text-gray-700 dark:text-gray-300">Planting Period</span>
        </div>
        <div class="flex items-center gap-2">
          <div class="w-6 h-6 bg-yellow-200 dark:bg-yellow-900 rounded border border-yellow-300 dark:border-yellow-700"></div>
          <span class="text-sm text-gray-700 dark:text-gray-300">Harvesting Period</span>
        </div>
      </div>

      <!-- Notes -->
      <div class="mt-6 bg-blue-50 dark:bg-blue-900 rounded-lg p-4">
        <h3 class="font-semibold text-blue-900 dark:text-blue-100 mb-2">📅 Calendar Notes:</h3>
        <ul class="text-sm text-blue-800 dark:text-blue-200 space-y-1">
          <li>• Planting and harvesting periods are based on Farming Simulator 25 default settings</li>
          <li>• Some crops can be planted or harvested over multiple months</li>
          <li>• Weather conditions and map settings may affect actual timing</li>
          <li>• Plan ahead to maximize your farm's productivity</li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { useFarmStore } from '../stores/farm'

const farmStore = useFarmStore()
const calendarContainer = ref<HTMLElement | null>(null)

const months = ref([
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
])

// Track container measurements
const containerWidth = ref(0)
const cropColumnWidth = ref(0)

const updateMeasurements = () => {
  nextTick(() => {
    if (calendarContainer.value) {
      const container = calendarContainer.value.querySelector('.min-w-\\[800px\\]') as HTMLElement
      if (container) {
        containerWidth.value = container.offsetWidth
        
        // Find the first crop name cell to get its actual width
        const cropCell = container.querySelector('.grid-cols-13 > div:first-child') as HTMLElement
        if (cropCell) {
          cropColumnWidth.value = cropCell.offsetWidth
        }
      }
    }
  })
}

onMounted(() => {
  updateMeasurements()
  window.addEventListener('resize', updateMeasurements)
})

onUnmounted(() => {
  window.removeEventListener('resize', updateMeasurements)
})

// Farming Simulator 25 crop calendar data
// Based on FS25 default crop seasons
const crops = ref([
  {
    name: 'Wheat',
    plantingStart: 9,  // September
    plantingEnd: 10,   // October
    harvestStart: 7,   // July
    harvestEnd: 8      // August
  },
  {
    name: 'Barley',
    plantingStart: 9,  // September
    plantingEnd: 10,   // October
    harvestStart: 7,   // July
    harvestEnd: 8      // August
  },
  {
    name: 'Canola (Oilseed Rape)',
    plantingStart: 8,  // August
    plantingEnd: 9,    // September
    harvestStart: 7,   // July
    harvestEnd: 8      // August
  },
  {
    name: 'Oat',
    plantingStart: 3,  // March
    plantingEnd: 4,    // April
    harvestStart: 8,   // August
    harvestEnd: 9      // September
  },
  {
    name: 'Corn (Maize)',
    plantingStart: 4,  // April
    plantingEnd: 5,    // May
    harvestStart: 9,   // September
    harvestEnd: 11     // November
  },
  {
    name: 'Sunflower',
    plantingStart: 3,  // March
    plantingEnd: 5,    // May
    harvestStart: 8,   // August
    harvestEnd: 9      // September
  },
  {
    name: 'Soybean',
    plantingStart: 4,  // April
    plantingEnd: 5,    // May
    harvestStart: 9,   // September
    harvestEnd: 10     // October
  },
  {
    name: 'Potato',
    plantingStart: 3,  // March
    plantingEnd: 5,    // May
    harvestStart: 8,   // August
    harvestEnd: 10     // October
  },
  {
    name: 'Sugar Beet',
    plantingStart: 3,  // March
    plantingEnd: 5,    // May
    harvestStart: 9,   // September
    harvestEnd: 11     // November
  },
  {
    name: 'Cotton',
    plantingStart: 4,  // April
    plantingEnd: 5,    // May
    harvestStart: 9,   // September
    harvestEnd: 11     // November
  },
  {
    name: 'Sorghum',
    plantingStart: 4,  // April
    plantingEnd: 6,    // June
    harvestStart: 9,   // September
    harvestEnd: 11     // November
  },
  {
    name: 'Grape',
    plantingStart: 1,  // Year-round (permanent)
    plantingEnd: 12,
    harvestStart: 9,   // September
    harvestEnd: 10     // October
  },
  {
    name: 'Olive',
    plantingStart: 1,  // Year-round (permanent)
    plantingEnd: 12,
    harvestStart: 11,  // November
    harvestEnd: 12     // December
  },
  {
    name: 'Poplar',
    plantingStart: 1,  // Year-round (permanent)
    plantingEnd: 12,
    harvestStart: 1,   // Any time after maturity
    harvestEnd: 12
  },
  {
    name: 'Grass',
    plantingStart: 3,  // March
    plantingEnd: 9,    // September
    harvestStart: 4,   // April (multiple cuts possible)
    harvestEnd: 10     // October
  },
  {
    name: 'Onions',
    plantingStart: 3,  // March
    plantingEnd: 4,    // April
    harvestStart: 8,   // August
    harvestEnd: 9      // September
  }
])

// Calculate current date position in pixels
const currentDatePosition = computed(() => {
  if (!farmStore.currentFarm || !containerWidth.value || !cropColumnWidth.value) return null
  
  const currentMonth = farmStore.currentFarm.currentMonth || 1
  const currentDay = farmStore.currentFarm.currentDay || 1
  const daysPerMonth = farmStore.currentFarm.daysPerMonth || 28
  
  // Calculate the percentage through the current month
  // Day is 1-indexed, so (currentDay - 1) ensures day 1 = 0%
  const percentThroughCurrentMonth = (currentDay - 1) / daysPerMonth
  
  // Remaining width for the 12 month columns
  const monthsAreaWidth = containerWidth.value - cropColumnWidth.value
  const singleMonthWidth = monthsAreaWidth / 12
  
  // Calculate position in pixels from the left edge of the container
  const monthStartPosition = cropColumnWidth.value + ((currentMonth - 1) * singleMonthWidth)
  const positionInPixels = monthStartPosition + (percentThroughCurrentMonth * singleMonthWidth)
  
  return positionInPixels
})

// Label for current date
const currentDateLabel = computed(() => {
  if (!farmStore.currentFarm) return ''
  
  const month = months.value[(farmStore.currentFarm.currentMonth || 1) - 1]
  const day = farmStore.currentFarm.currentDay || 1
  
  return `${month} ${day}`
})

// Helper function to check if a month is in the planting/harvesting range
const isInRange = (month: number, start: number, end: number): boolean => {
  if (start <= end) {
    return month >= start && month <= end
  } else {
    // Handle wrap-around (e.g., October to March)
    return month >= start || month <= end
  }
}
</script>

<style scoped>
.grid-cols-13 {
  grid-template-columns: 150px repeat(12, minmax(60px, 1fr));
}

@media (min-width: 768px) {
  .grid-cols-13 {
    grid-template-columns: 180px repeat(12, 1fr);
  }
}

@media (min-width: 1024px) {
  .grid-cols-13 {
    grid-template-columns: 200px repeat(12, 1fr);
  }
}
</style>
