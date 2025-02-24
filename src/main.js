import '@/assets/main.css'
import PrimeVue from 'primevue/config'
import Tooltip from 'primevue/tooltip'
import Aura from '@primevue/themes/aura'
import 'primeicons/primeicons.css'
import Toast from 'vue-toastification'
import 'vue-toastification/dist/index.css'
import router from './router'
import { createApp } from 'vue'
import App from './components/App.vue'
import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate';

const app = createApp(App)

const pinia = createPinia()
pinia.use(piniaPluginPersistedstate)

app.use(pinia)
app.use(router)
app.use(Toast)
app.use(PrimeVue, {
  theme: {
    preset: Aura,
  },
})
app.directive('tooltip', Tooltip)

app.mount('#app')
