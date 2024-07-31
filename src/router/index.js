import { createRouter, createWebHistory } from "vue-router";
import HomeView from "@/views/HomeView.vue";
import JobsView from "@/views/JobsView.vue";
import NotFoundView from "@/views/NotFoundView.vue";
import JobView from "@/views/JobView.vue";

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
        {
            path: '/jobs',
            name: 'jobs',
            component: JobsView,
        },
        {
            path: '/jobs/:id',
            name: 'job',
            component: JobView,
        },
        {
            path: '/:catchAll(.*)',
            name: 'not-found',
            component: NotFoundView,
        },
    ],
});

export default router;

// home page to home vue
// main router about page to about view
