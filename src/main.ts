import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import './assets/design.css'
import './style.css'

const app = createApp(App)
app.use(createPinia())
app.use(router)
// Debug: log route changes to help diagnose navigation issues (remove in prod)
router.afterEach((to) => {
  // eslint-disable-next-line no-console
  // console.log('[router] navigated to', to.fullPath)
})
app.mount('#app')
