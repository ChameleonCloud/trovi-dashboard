import { createRouter, createWebHistory } from "vue-router";
import HomeView from "@/views/HomeView.vue";

const router = createRouter({
    // to go back with the back button
    history: createWebHistory(import.meta.env.BASE_URL),
    // array of objects
    routes: [
        {
            path: '/',
            name: 'home',
            component: HomeView,
        },
    ],
});

export default router;


// home page to home vue
// main router about page to about view
