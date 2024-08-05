import '@/assets/main.css';
import '@fortawesome/fontawesome-free/css/all.css';
import 'primeicons/primeicons.css';
import Toast from 'vue-toastification';
import 'vue-toastification/dist/index.css';
import router from './router';

import { createApp } from 'vue';
import App from './components/App.vue';

const app = createApp(App);

app.use(router);
app.use(Toast);

app.mount('#app');
