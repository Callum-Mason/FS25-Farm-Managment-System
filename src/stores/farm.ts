import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { api } from '../utils/api'

export interface Farm {
  id: number
  name: string
  mapName: string
  currency: string
  createdByUserId: number
  createdAt: string
  currentYear: number
  currentMonth: number
  currentDay: number
  daysPerMonth: number
  areaUnit?: string
  userRole?: string
}

export interface FarmMember {
  id: number
  userId: number
  role: string
  name: string
  email: string
  joinedAt: string
}

export const useFarmStore = defineStore('farm', () => {
  const farms = ref<Farm[]>([])
  const currentFarmId = ref<number | null>(
    Number(localStorage.getItem('currentFarmId')) || null
  )

  const currentFarm = computed(() => {
    if (!currentFarmId.value) return null
    return farms.value.find(f => f.id === currentFarmId.value) || null
  })

  const currentUserRole = computed(() => {
    return currentFarm.value?.userRole || 'viewer'
  })

  async function fetchFarms() {
    farms.value = await api.get('/farms')
    // console.log('Fetched farms:', farms.value)
    const fetchedIds = farms.value.map(f => Number(f.id))
    // console.log('Fetched farm ids:', fetchedIds, 'currentFarmId (before):', currentFarmId.value)

    if (farms.value.length === 0) {
      // No farms available for this user
      currentFarmId.value = null
      localStorage.removeItem('currentFarmId')
      return
    }

    // If we don't have a current farm, default to the first one
    if (!currentFarmId.value) {
      currentFarmId.value = farms.value[0].id
      // Only persist to localStorage if logout suppression flag is not set
      try {
        if (!sessionStorage.getItem('suppressAutoSet')) {
          localStorage.setItem('currentFarmId', String(currentFarmId.value))
        }
      } catch (e) {}
      return
    }

    // If currentFarmId is set (from localStorage) but no longer present in the fetched farms
    // (e.g. localStorage was stale), reset it to the first available farm.
    const exists = farms.value.some(f => Number(f.id) === Number(currentFarmId.value))
    // console.log('Current farm exists in fetched list?', exists)
    if (!exists) {
      currentFarmId.value = Number(farms.value[0].id)
      try {
        if (!sessionStorage.getItem('suppressAutoSet')) {
          localStorage.setItem('currentFarmId', String(currentFarmId.value))
        }
      } catch (e) {}
      // console.log('Reset currentFarmId to first fetched farm:', currentFarmId.value)
    }
  }

  async function createFarm(
    name: string, 
    mapName: string, 
    startingFunds?: number,
    currentYear?: number,
    currentMonth?: number,
    currentDay?: number,
    currency?: string,
    areaUnit?: string,
    daysPerMonth?: number
  ) {
    const farm = await api.post('/farms', { 
      name, 
      mapName, 
      startingFunds,
      currentYear,
      currentMonth,
      currentDay,
      currency,
      areaUnit,
      daysPerMonth
    })
    farms.value.push(farm)
    currentFarmId.value = farm.id
    try {
      if (!sessionStorage.getItem('suppressAutoSet')) {
        localStorage.setItem('currentFarmId', String(currentFarmId.value))
      }
    } catch (e) {}
    return farm
  }

  async function updateFarm(farmId: number, updates: Partial<Pick<Farm, 'name' | 'mapName' | 'currency' | 'daysPerMonth' | 'areaUnit'>>) {
    const farm = await api.patch(`/farms/${farmId}`, updates)
    const index = farms.value.findIndex(f => f.id === farmId)
    if (index !== -1) {
      farms.value[index] = farm
    }
    return farm
  }

  async function getMembers(farmId: number): Promise<FarmMember[]> {
    return await api.get(`/farms/${farmId}/members`)
  }

  async function updateMemberRole(farmId: number, memberId: number, role: string) {
    await api.patch(`/farms/${farmId}/members/${memberId}`, { role })
  }

  async function removeMember(farmId: number, memberId: number) {
    await api.delete(`/farms/${farmId}/members/${memberId}`)
  }

  async function getJoinCodes(farmId: number) {
    return await api.get(`/farms/${farmId}/codes`)
  }

  async function getUserRole(farmId: number): Promise<string> {
    const response = await api.get(`/farms/${farmId}/role`)
    return response.role
  }

  async function createJoinCode(farmId: number) {
    return await api.post(`/farms/${farmId}/codes`, {})
  }

  async function joinFarm(joinCode: string) {
    const response = await api.post('/farms/join', { joinCode })
    await fetchFarms() // Refresh the farms list
    if (response.farm) {
      currentFarmId.value = response.farm.id
      try {
        if (!sessionStorage.getItem('suppressAutoSet')) {
          localStorage.setItem('currentFarmId', String(response.farm.id))
        }
      } catch (e) {}
    }
    return response
  }

  function setCurrentFarm(farmId: number) {
    currentFarmId.value = farmId
    try {
      if (!sessionStorage.getItem('suppressAutoSet')) {
        localStorage.setItem('currentFarmId', String(farmId))
      }
    } catch (e) {}
  }

  async function deleteFarm(farmId: number) {
    await api.delete(`/farms/${farmId}`)
    farms.value = farms.value.filter(f => f.id !== farmId)
    if (currentFarmId.value === farmId) {
      currentFarmId.value = null
      localStorage.removeItem('currentFarmId')
    }
  }

  async function advanceDate() {
    if (!currentFarmId.value) return
    const updatedFarm = await api.post(`/farms/${currentFarmId.value}/advance-date`, {})
    const index = farms.value.findIndex(f => f.id === currentFarmId.value)
    if (index !== -1) {
      farms.value[index] = { ...farms.value[index], ...updatedFarm }
    }
  }

  async function retreatDate() {
    if (!currentFarmId.value) return
    try {
      // console.log('Calling retreat-date endpoint for farm:', currentFarmId.value)
      const updatedFarm = await api.post(`/farms/${currentFarmId.value}/retreat-date`, {})
      // console.log('Received updated farm:', updatedFarm)
      const index = farms.value.findIndex(f => f.id === currentFarmId.value)
      if (index !== -1) {
        farms.value[index] = { ...farms.value[index], ...updatedFarm }
      }
    } catch (error: any) {
      // console.error('Retreat date error:', error)
      // If we hit the Year 1 boundary, just ignore the error
      if (error?.response?.status !== 400) {
        throw error
      }
    }
  }

  async function jumpToDate(year: number, month: number, day: number) {
    if (!currentFarmId.value) return
    const updatedFarm = await api.post(`/farms/${currentFarmId.value}/jump-to-date`, { year, month, day })
    const index = farms.value.findIndex(f => f.id === currentFarmId.value)
    if (index !== -1) {
      farms.value[index] = { ...farms.value[index], ...updatedFarm }
    }
  }

  return {
    farms,
    currentFarmId,
    currentFarm,
    currentUserRole,
    fetchFarms,
    createFarm,
    updateFarm,
    deleteFarm,
    advanceDate,
    retreatDate,
    jumpToDate,
    getMembers,
    updateMemberRole,
    removeMember,
    getJoinCodes,
    getUserRole,
    createJoinCode,
    joinFarm,
    setCurrentFarm
  }
})
