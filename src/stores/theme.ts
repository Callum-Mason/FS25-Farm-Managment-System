import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

export const useThemeStore = defineStore('theme', () => {
  // Check localStorage or system preference
  const getInitialTheme = () => {
    const stored = localStorage.getItem('theme')
    if (stored) {
      return stored === 'dark'
    }
    // Check system preference
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  }

  const isDark = ref(getInitialTheme())

  // Apply theme to document
  const applyTheme = () => {
    if (isDark.value) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }

  // Watch for changes and apply theme
  watch(isDark, () => {
    try {
      // Don't re-write theme if we're suppressing auto-writes due to logout
      if (!sessionStorage.getItem('suppressAutoSet')) {
        localStorage.setItem('theme', isDark.value ? 'dark' : 'light')
      }
    } catch (e) {}
    applyTheme()
  }, { immediate: true })

  const toggleTheme = () => {
    isDark.value = !isDark.value
  }

  const setTheme = (dark: boolean) => {
    isDark.value = dark
  }

  return {
    isDark,
    toggleTheme,
    setTheme
  }
})
