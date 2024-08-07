import '@/assets/main.css';
// import '@fortawesome/fontawesome-free/css/all.css';
import 'primeicons/primeicons.css';
import Toast from 'vue-toastification';
import 'vue-toastification/dist/index.css';
import router from './router';
import { createApp } from 'vue';
import App from './components/App.vue';
import { createPinia } from 'pinia'; // Import Pinia

const app = createApp(App);

const pinia = createPinia(); // Create Pinia instance
app.use(pinia); // Use Pinia
app.use(router);
app.use(Toast);

app.mount('#app');
