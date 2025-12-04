<template>
  <div class="min-h-screen bg-surface flex flex-col">
    <!-- Mobile Header -->
    <header class="bg-primary text-white shadow-lg lg:hidden">
      <div class="px-4 py-3">
        <div class="flex items-center justify-between">
          <!-- Logo/Title -->
          <div class="flex items-center gap-3">
            <button
              @click="sidebarOpen = true"
              class="p-2 hover:bg-white/10 rounded-lg transition"
              aria-label="Open menu"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div>
              <h1 class="text-lg font-bold">FS25 FMS</h1>
              <p class="text-xs text-white/70">{{ currentFarmName || 'No Farm' }}</p>
            </div>
          </div>

          <!-- Right Side -->
          <div class="flex items-center gap-2">
            <!-- Game Date & Advance Button -->
            <div v-if="farmStore.currentFarm" class="flex items-center gap-1.5 bg-white/10 rounded-lg px-2 py-1.5">
              <button
                @click="retreatGameDate"
                class="p-1 bg-white/20 hover:bg-white/30 rounded transition"
                title="Previous Day"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 00-2 0v3.586L7.707 9.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 10.586V7z" clip-rule="evenodd" transform="rotate(180 10 10)" />
                </svg>
              </button>
              <div class="text-xs font-medium whitespace-nowrap">{{ currentGameDateShort }}</div>
              <button
                @click="advanceGameDate"
                class="p-1 bg-white/20 hover:bg-white/30 rounded transition"
                title="Advance Date"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v3.586L7.707 9.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 10.586V7z" clip-rule="evenodd" />
                </svg>
              </button>
            </div>

            <!-- User Menu -->
            <button
              @click="userMenuOpen = !userMenuOpen"
              class="p-2 hover:bg-white/10 rounded-lg transition"
              aria-label="User menu"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <!-- User Dropdown Menu -->
      <div
        v-if="userMenuOpen"
        class="absolute right-4 top-16 bg-white dark:bg-gray-800 rounded-lg shadow-xl z-50 py-2 w-64 text-text border border-gray-200 dark:border-gray-700"
        @click.stop
      >
        <div class="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
          <p class="font-medium">{{ authStore.user?.name }}</p>
          <p class="text-sm text-text/60">{{ authStore.user?.email }}</p>
        </div>
        
        <div v-if="farmStore.farms.length > 1" class="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
          <label class="text-xs font-medium text-text/60 block mb-2">Current Farm</label>
          <select
            v-model="farmStore.currentFarmId"
            @change="handleFarmChange"
            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-gray-700"
          >
            <option v-for="farm in farmStore.farms" :key="farm.id" :value="farm.id">
              {{ farm.name }}
            </option>
          </select>
        </div>

        <!-- Dark Mode Toggle -->
        <button
          @click="themeStore.toggleTheme()"
          class="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition w-full text-left"
        >
          <svg v-if="themeStore.isDark" xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-text/60" viewBox="0 0 20 20" fill="currentColor">
            <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
          </svg>
          <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-text/60" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clip-rule="evenodd" />
          </svg>
          <span class="text-sm font-medium">{{ themeStore.isDark ? 'Light Mode' : 'Dark Mode' }}</span>
        </button>

        <RouterLink
          to="/app/account"
          @click="userMenuOpen = false"
          class="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-text/60" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd" />
          </svg>
          <span class="text-sm font-medium">Account Settings</span>
        </RouterLink>

        <button
          @click="handleLogout"
          class="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition w-full text-left text-red-600"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clip-rule="evenodd" />
          </svg>
          <span class="text-sm font-medium">Log Out</span>
        </button>
      </div>
    </header>

    <!-- Desktop Header -->
    <header class="hidden lg:block bg-primary text-white shadow-lg">
      <div class="max-w-7xl mx-auto px-6 py-4">
        <div class="flex items-center justify-between">
          <!-- Logo/Title -->
          <div>
            <h1 class="text-2xl font-bold">Farming Simulator 25</h1>
            <p class="text-white/80 text-sm">UK Farm Management System</p>
          </div>

          <!-- Right Side Actions -->
          <div class="flex items-center gap-4">
            <!-- Game Date & Navigation Buttons -->
            <div v-if="farmStore.currentFarm" class="flex items-center gap-3 bg-white/10 rounded-lg px-4 py-2">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clip-rule="evenodd" />
              </svg>
              <button
                @click="retreatGameDate"
                class="px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg transition flex items-center gap-2"
                title="Go Back One Day"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v3.586L7.707 9.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 10.586V7z" clip-rule="evenodd" transform="rotate(180 10 10)" />
                </svg>
                <span class="text-xs font-medium">Previous Day</span>
              </button>
              <div>
                <div class="text-sm font-medium">{{ currentGameDate }}</div>
              </div>
              <button
                @click="advanceGameDate"
                class="px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg transition flex items-center gap-2"
                title="Advance to Next Day"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v3.586L7.707 9.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 10.586V7z" clip-rule="evenodd" />
                </svg>
                <span class="text-xs font-medium">Next Day</span>
              </button>
            </div>

            <!-- User Menu Dropdown -->
            <div class="relative">
              <button
                @click="desktopUserMenuOpen = !desktopUserMenuOpen"
                class="flex items-center gap-2 px-4 py-2 hover:bg-white/10 rounded-lg transition"
                title="User Menu"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd" />
                </svg>
                <span class="font-medium">{{ authStore.user?.name }}</span>
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd" />
                </svg>
              </button>

              <!-- Dropdown Menu -->
              <div
                v-if="desktopUserMenuOpen"
                class="absolute right-0 top-full mt-2 bg-white dark:bg-gray-800 rounded-lg shadow-xl z-50 py-2 w-64 text-text border border-gray-200 dark:border-gray-700"
                @click.stop
              >
                <div class="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                  <p class="font-medium">{{ authStore.user?.name }}</p>
                  <p class="text-sm text-text/60">{{ authStore.user?.email }}</p>
                </div>

                <!-- Farm Selector in Dropdown -->
                <div v-if="farmStore.farms.length > 0" class="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                  <label class="text-xs font-medium text-text/60 block mb-2">Current Farm</label>
                  <select
                    v-if="farmStore.farms.length > 1"
                    v-model="farmStore.currentFarmId"
                    @change="handleFarmChange"
                    class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-gray-700"
                  >
                    <option v-for="farm in farmStore.farms" :key="farm.id" :value="farm.id">
                      {{ farm.name }}
                    </option>
                  </select>
                  <div v-else class="text-sm font-medium">{{ currentFarmName }}</div>
                </div>

                <!-- Dark Mode Toggle -->
                <button
                  @click="themeStore.toggleTheme()"
                  class="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition w-full text-left"
                >
                  <svg v-if="themeStore.isDark" xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-text/60" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                  </svg>
                  <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-text/60" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clip-rule="evenodd" />
                  </svg>
                  <span class="text-sm font-medium">{{ themeStore.isDark ? 'Light Mode' : 'Dark Mode' }}</span>
                </button>

                <RouterLink
                  to="/app/account"
                  @click="desktopUserMenuOpen = false"
                  class="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-text/60" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd" />
                  </svg>
                  <span class="text-sm font-medium">Account Settings</span>
                </RouterLink>

                <button
                  @click="handleLogout"
                  class="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition w-full text-left text-red-600"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clip-rule="evenodd" />
                  </svg>
                  <span class="text-sm font-medium">Log Out</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>

    <!-- Click outside handler for desktop user menu -->
    <div
      v-if="desktopUserMenuOpen"
      class="hidden lg:block fixed inset-0 z-40"
      @click="desktopUserMenuOpen = false"
    />

    <!-- Main Layout -->
    <div class="flex-1 flex overflow-hidden">
      <!-- Desktop Sidebar -->
      <aside class="hidden lg:block w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 overflow-y-auto">
        <nav class="p-4 space-y-2">
          <RouterLink
            v-for="item in navItems"
            :key="item.path"
            :to="item.path"
            class="flex items-center gap-3 px-4 py-3 rounded-lg transition"
            :class="isActive(item.path) 
              ? 'bg-primary text-white' 
              : 'text-text hover:bg-gray-100 dark:hover:bg-gray-700'"
          >
            <component :is="item.icon" class="h-5 w-5" />
            <span class="font-medium">{{ item.label }}</span>
          </RouterLink>
        </nav>
      </aside>

      <!-- Main Content -->
      <main class="flex-1 overflow-y-auto pb-20 lg:pb-4">
        <div class="max-w-7xl mx-auto p-4 lg:p-6">
          <RouterView />
        </div>
      </main>
    </div>

    <!-- Mobile Bottom Navigation -->
    <nav class="lg:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 z-40">
      <div class="grid grid-cols-5 gap-1">
        <RouterLink
          v-for="item in bottomNavItems"
          :key="item.path"
          :to="item.path"
          class="flex flex-col items-center justify-center py-2 transition"
          :class="isActive(item.path) 
            ? 'text-primary bg-primary/10' 
            : 'text-text/60 hover:text-primary'"
        >
          <component :is="item.icon" class="h-6 w-6" />
          <span class="text-xs font-medium mt-1">{{ item.label }}</span>
        </RouterLink>
      </div>
    </nav>

    <!-- Mobile Sidebar Overlay -->
    <Transition name="fade">
      <div
        v-if="sidebarOpen"
        class="lg:hidden fixed inset-0 bg-black/50 z-50"
        @click="sidebarOpen = false"
      />
    </Transition>

    <!-- Mobile Sidebar -->
    <Transition name="slide">
      <aside
        v-if="sidebarOpen"
        class="lg:hidden fixed top-0 left-0 bottom-0 w-80 max-w-[85vw] bg-white dark:bg-gray-800 z-50 overflow-y-auto"
      >
        <div class="p-4 bg-primary text-white flex items-center justify-between">
          <div>
            <h2 class="text-xl font-bold">Menu</h2>
            <p class="text-sm text-white/70">{{ currentFarmName || 'No Farm Selected' }}</p>
          </div>
          <button
            @click="sidebarOpen = false"
            class="p-2 hover:bg-white/10 rounded-lg transition"
            aria-label="Close menu"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <nav class="p-4 space-y-2">
          <RouterLink
            v-for="item in allNavItems"
            :key="item.path"
            :to="item.path"
            @click="sidebarOpen = false"
            class="flex items-center gap-3 px-4 py-3 rounded-lg transition"
            :class="isActive(item.path) 
              ? 'bg-primary text-white' 
              : 'text-text hover:bg-gray-100 dark:hover:bg-gray-700'"
          >
            <component :is="item.icon" class="h-5 w-5" />
            <span class="font-medium">{{ item.label }}</span>
          </RouterLink>
        </nav>
      </aside>
    </Transition>

    <!-- Click outside handler for user menu -->
    <div
      v-if="userMenuOpen"
      class="fixed inset-0 z-40"
      @click="userMenuOpen = false"
    />
  </div>
</template>

<script setup lang="ts">
import { onMounted, computed, ref, h } from 'vue'
import { RouterView, useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useFarmStore } from '../stores/farm'
import { useThemeStore } from '../stores/theme'
import { formatGameDate, formatShortGameDate } from '../utils/gameDate'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const farmStore = useFarmStore()
const themeStore = useThemeStore()

const sidebarOpen = ref(false)
const userMenuOpen = ref(false)
const desktopUserMenuOpen = ref(false)

onMounted(async () => {
  await farmStore.fetchFarms()
})

const currentFarmName = computed(() => {
  if (!farmStore.currentFarmId) return null
  const farm = farmStore.farms.find(f => f.id === farmStore.currentFarmId)
  return farm?.name
})

const currentGameDate = computed(() => {
  const farm = farmStore.currentFarm
  if (!farm) return ''
  return formatGameDate(
    farm.currentYear || 1, 
    farm.currentMonth || 1, 
    farm.currentDay || 1
  )
})

const currentGameDateShort = computed(() => {
  const farm = farmStore.currentFarm
  if (!farm) return ''
  return formatShortGameDate(
    farm.currentYear || 1, 
    farm.currentMonth || 1, 
    farm.currentDay || 1
  )
})

async function advanceGameDate() {
  await farmStore.advanceDate()
}

async function retreatGameDate() {
  await farmStore.retreatDate()
}

// Icon components
const DashboardIcon = () => h('svg', {
  xmlns: 'http://www.w3.org/2000/svg',
  viewBox: '0 0 20 20',
  fill: 'currentColor'
}, [
  h('path', {
    d: 'M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z'
  })
])

const FieldIcon = () => h('svg', {
  xmlns: 'http://www.w3.org/2000/svg',
  viewBox: '0 0 20 20',
  fill: 'currentColor'
}, [
  h('path', {
    'fill-rule': 'evenodd',
    d: 'M5 2a1 1 0 011 1v1h1a1 1 0 010 2H6v1a1 1 0 01-2 0V6H3a1 1 0 010-2h1V3a1 1 0 011-1zm0 10a1 1 0 011 1v1h1a1 1 0 110 2H6v1a1 1 0 11-2 0v-1H3a1 1 0 110-2h1v-1a1 1 0 011-1zM12 2a1 1 0 01.967.744L14.146 7.2 17.5 9.134a1 1 0 010 1.732l-3.354 1.935-1.18 4.455a1 1 0 01-1.933 0L9.854 12.8 6.5 10.866a1 1 0 010-1.732l3.354-1.935 1.18-4.455A1 1 0 0112 2z',
    'clip-rule': 'evenodd'
  })
])

const CropIcon = () => h('svg', {
  xmlns: 'http://www.w3.org/2000/svg',
  viewBox: '0 0 20 20',
  fill: 'currentColor'
}, [
  h('path', {
    'fill-rule': 'evenodd',
    d: 'M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v3.586L7.707 9.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 10.586V7z',
    'clip-rule': 'evenodd'
  })
])

const MoneyIcon = () => h('svg', {
  xmlns: 'http://www.w3.org/2000/svg',
  viewBox: '0 0 20 20',
  fill: 'currentColor'
}, [
  h('path', {
    d: 'M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z'
  }),
  h('path', {
    'fill-rule': 'evenodd',
    d: 'M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z',
    'clip-rule': 'evenodd'
  })
])

const AnimalIcon = () => h('svg', {
  xmlns: 'http://www.w3.org/2000/svg',
  viewBox: '0 0 20 20',
  fill: 'currentColor'
}, [
  h('path', {
    'fill-rule': 'evenodd',
    d: 'M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z',
    'clip-rule': 'evenodd'
  })
])

const EquipmentIcon = () => h('svg', {
  xmlns: 'http://www.w3.org/2000/svg',
  viewBox: '0 0 64 64',
  fill: 'currentColor'
}, [
  // Tractor wheels (filled)
  h('circle', {
    cx: '51',
    cy: '51',
    r: '7'
  }),
  h('circle', {
    cx: '16',
    cy: '46',
    r: '12'
  }),
  // Tractor body (thicker stroke for visibility)
  h('path', {
    d: 'M2 31.7A20 20 0 0 1 36 46M8 27.7V8h22l4 22',
    fill: 'none',
    stroke: 'currentColor',
    'stroke-width': '3',
    'stroke-linecap': 'round',
    'stroke-linejoin': 'round'
  }),
  h('path', {
    d: 'M27.9 30H62l-2.5 14H35.9M46 30V15.7a3.7 3.7 0 0 1 3.7-3.7h.3',
    fill: 'none',
    stroke: 'currentColor',
    'stroke-width': '3',
    'stroke-linecap': 'round',
    'stroke-linejoin': 'round'
  })
])

const GuideIcon = () => h('svg', {
  xmlns: 'http://www.w3.org/2000/svg',
  viewBox: '0 0 20 20',
  fill: 'currentColor'
}, [
  h('path', {
    d: 'M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z'
  })
])

const SettingsIcon = () => h('svg', {
  xmlns: 'http://www.w3.org/2000/svg',
  viewBox: '0 0 20 20',
  fill: 'currentColor'
}, [
  h('path', {
    'fill-rule': 'evenodd',
    d: 'M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z',
    'clip-rule': 'evenodd'
  })
])

const CalculatorIcon = () => h('svg', {
  xmlns: 'http://www.w3.org/2000/svg',
  viewBox: '0 0 20 20',
  fill: 'currentColor'
}, [
  h('path', {
    'fill-rule': 'evenodd',
    d: 'M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V4a2 2 0 00-2-2H6zm1 2a1 1 0 000 2h6a1 1 0 100-2H7zm6 7a1 1 0 011 1v3a1 1 0 11-2 0v-3a1 1 0 011-1zm-3 3a1 1 0 100 2h.01a1 1 0 100-2H10zm-4 1a1 1 0 011-1h.01a1 1 0 110 2H7a1 1 0 01-1-1zm1-4a1 1 0 100 2h.01a1 1 0 100-2H7zm2 1a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1zm4-4a1 1 0 100 2h.01a1 1 0 100-2H13zM9 9a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1zM7 8a1 1 0 000 2h.01a1 1 0 000-2H7z',
    'clip-rule': 'evenodd'
  })
])

const CalendarIcon = () => h('svg', {
  xmlns: 'http://www.w3.org/2000/svg',
  viewBox: '0 0 20 20',
  fill: 'currentColor'
}, [
  h('path', {
    'fill-rule': 'evenodd',
    d: 'M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z',
    'clip-rule': 'evenodd'
  })
])

const StorageIcon = () => h('svg', {
  xmlns: 'http://www.w3.org/2000/svg',
  viewBox: '0 0 20 20',
  fill: 'currentColor'
}, [
  h('path', {
    d: 'M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z'
  })
])

// Navigation items for desktop sidebar
const navItems = [
  { path: '/app', label: 'Dashboard', icon: DashboardIcon },
  { path: '/app/fields', label: 'Fields', icon: FieldIcon },
  { path: '/app/crops', label: 'Crop Rotation', icon: CropIcon },
  { path: '/app/money', label: 'Finances', icon: MoneyIcon },
  { path: '/app/storage', label: 'Crop Storage', icon: StorageIcon },
  { path: '/app/animals', label: 'Animals', icon: AnimalIcon },
  { path: '/app/equipment', label: 'Equipment', icon: EquipmentIcon },
  { path: '/app/calculator', label: 'Calculators', icon: CalculatorIcon },
  { path: '/app/crop-calendar', label: 'Crop Calendar', icon: CalendarIcon },
  { path: '/app/guide', label: 'UK Guide', icon: GuideIcon },
  { path: '/app/settings', label: 'Farm Settings', icon: SettingsIcon },
]

// Bottom navigation for mobile (most important items)
const bottomNavItems = [
  { path: '/app', label: 'Home', icon: DashboardIcon },
  { path: '/app/fields', label: 'Fields', icon: FieldIcon },
  { path: '/app/money', label: 'Money', icon: MoneyIcon },
  { path: '/app/calculator', label: 'Calc', icon: CalculatorIcon },
  { path: '/app/settings', label: 'Settings', icon: SettingsIcon },
]

// All navigation items for mobile sidebar
const allNavItems = navItems

function isActive(path: string) {
  if (path === '/app') {
    return route.path === '/app' || route.name === 'dashboard'
  }
  return route.path.startsWith(path)
}

function handleLogout() {
  // Set suppress flag so other stores don't immediately re-persist values
  try { sessionStorage.setItem('suppressAutoSet', '1') } catch (e) {}
  authStore.logout()
  // Extra safeguard: explicitly clear all persisted auth/farm keys
  try {
    localStorage.removeItem('currentFarmId')
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    // Also clear theme to ensure a clean state on logout
    localStorage.removeItem('theme')
  } catch (e) {
    // ignore
  }
  // Navigate to login and force a hard reload to ensure any in-memory stores re-init cleanly
  router.replace('/login')
  try {
    setTimeout(() => {
      // Remove suppression flag then reload to ensure no other code re-writes keys during navigation
      try { sessionStorage.removeItem('suppressAutoSet') } catch (e) {}
      window.location.reload()
    }, 50)
  } catch (e) {}
}

function handleFarmChange() {
  if (farmStore.currentFarmId) {
    localStorage.setItem('currentFarmId', String(farmStore.currentFarmId))
    router.go(0)
  }
}
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.slide-enter-active,
.slide-leave-active {
  transition: transform 0.3s ease;
}

.slide-enter-from,
.slide-leave-to {
  transform: translateX(-100%);
}
</style>
