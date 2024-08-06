import { createRouter, createWebHistory } from 'vue-router';
import HomeView from '@/views/HomeView.vue';
import JobsView from '@/views/ArtifactsView.vue';
import NotFoundView from '@/views/NotFoundView.vue';
import JobView from '@/views/ArtifactView.vue';
import AddJobView from '@/views/AddArtifactView.vue';
import EditJobView from '@/views/EditArtifactView.vue';

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
    },
    {
      path: '/artifacts',
      name: 'artifacts',
      component: JobsView,
    },
    {
      path: '/artifacts/:id',
      name: 'artifact',
      component: JobView,
    },
    {
      path: '/artifacts/add',
      name: 'add-artifact',
      component: AddJobView,
    },
    {
      path: '/artifacts/edit/:id',
      name: 'edit-job',
      component: EditJobView,
    },
    {
      path: '/:catchAll(.*)',
      name: 'not-found',
      component: NotFoundView,
    },
  ],
});

export default router;
