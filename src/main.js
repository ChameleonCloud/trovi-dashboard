import '@/assets/main.css'
import 'primeicons/primeicons.css'
import router from './router'
import { createApp } from 'vue'
import App from './components/App.vue'
import { createPinia } from 'pinia'
import { Quasar, Notify, Dialog } from 'quasar'
import '@quasar/extras/material-icons/material-icons.css'
import 'quasar/src/css/index.sass'

const app = createApp(App)

const pinia = createPinia()

app.use(pinia)
app.use(router)
app.use(Quasar, {
  plugins: {
    Notify,
    Dialog,
  },
  config: {
    dark: 'auto',
  },
})

app.mount('#app')
