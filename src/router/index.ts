import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useFarmStore } from '../stores/farm'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('../views/Login.vue')
    },
    {
      path: '/register',
      name: 'register',
      component: () => import('../views/Register.vue')
    },
    {
      path: '/create-farm',
      name: 'create-farm',
      component: () => import('../views/CreateFarm.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/app',
      name: 'app',
      component: () => import('../views/AppLayout.vue'),
      meta: { requiresAuth: true, requiresFarm: true },
      children: [
        {
          path: '',
          name: 'dashboard',
          component: () => import('../views/Dashboard.vue')
        },
        {
          path: 'fields',
          name: 'fields',
          component: () => import('../views/Fields.vue')
        },
        {
          path: 'crops',
          name: 'crops',
          component: () => import('../views/CropRotation.vue')
        },
        {
          path: 'money',
          name: 'money',
          component: () => import('../views/Money.vue')
        },
        {
          path: 'animals',
          name: 'animals',
          component: () => import('../views/Animals.vue')
        },
        {
          path: 'equipment',
          name: 'equipment',
          component: () => import('../views/Equipment.vue')
        },
        {
          path: 'guide',
          name: 'guide',
          component: () => import('../views/UKGuide.vue')
        },
        {
          path: 'calculator',
          name: 'calculator',
          component: () => import('../views/Calculator.vue')
        },
        {
          path: 'crop-calendar',
          name: 'crop-calendar',
          component: () => import('../views/CropCalendar.vue')
        },
        {
          path: 'settings',
          name: 'settings',
          component: () => import('../views/FarmSettings.vue')
        },
        {
          path: 'account',
          name: 'account',
          component: () => import('../views/AccountSettings.vue')
        },
        {
          path: 'storage',
          name: 'storage',
          component: () => import('../views/CropStorage.vue')
        }
      ]
    },
    {
      path: '/',
      redirect: '/app'
    }
  ]
})

router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()
  const farmStore = useFarmStore()
  
  // Check authentication first
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    next('/login')
    return
  }
  
  // Redirect authenticated users away from login/register
  if ((to.name === 'login' || to.name === 'register') && authStore.isAuthenticated) {
    next('/app')
    return
  }
  
  // Check if route requires a farm
  if (to.meta.requiresFarm && authStore.isAuthenticated) {
    // Ensure farms are loaded
    if (farmStore.farms.length === 0) {
      try {
        await farmStore.fetchFarms()
      } catch (err) {
        // console.error('Failed to load farms during route guard:', err)
        // Don't block navigation on transient API failures — allow route to continue
      }
    }
    
    // If no farm exists, redirect to create-farm
    if (farmStore.farms.length === 0 || !farmStore.currentFarmId) {
      next('/create-farm')
      return
    }
  }
  
  next()
})

export default router
