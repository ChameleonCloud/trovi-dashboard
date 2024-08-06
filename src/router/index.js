import { createRouter, createWebHistory } from 'vue-router';
import HomeView from '@/views/HomeView.vue';
import ArtifactsView from '@/views/ArtifactsView.vue';
import NotFoundView from '@/views/NotFoundView.vue';
import ArtifactView from '@/views/ArtifactView.vue';
import AddArtifactView from '@/views/AddArtifactView.vue';
import EditArtifactView from '@/views/EditArtifactView.vue';

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
      component: ArtifactsView,
    },
    // pull this from the json file
    {
      path: '/artifacts/:uuid',
      name: 'artifact',
      component: ArtifactView,
    },
    {
      path: '/artifacts/add',
      name: 'add-artifact',
      component: AddArtifactView,
    },

    {
      path: '/artifacts/edit/:uuid',
      name: 'edit-artifact',
      component: EditArtifactView,
    },
    {
      path: '/:catchAll(.*)',
      name: 'not-found',
      component: NotFoundView,
    },
  ],
});

export default router;


// import { createRouter, createWebHistory } from 'vue-router';
// import HomeView from '@/views/HomeView.vue';
// import ArtifactsView from '@/views/ArtifactsView.vue';
// import NotFoundView from '@/views/NotFoundView.vue';
// import ArtifactView from '@/views/ArtifactView.vue';
// import AddArtifactView from '@/views/AddArtifactView.vue'; // This will now show options
// import NewArtifactForm from '@/views/NewArtifactForm.vue'; // New route for the form
// import EditArtifactView from '@/views/EditArtifactView.vue';

// const router = createRouter({
//   history: createWebHistory(import.meta.env.BASE_URL),
//   routes: [
//     {
//       path: '/',
//       name: 'home',
//       component: HomeView,
//     },
//     {
//       path: '/artifacts',
//       name: 'artifacts',
//       component: ArtifactsView,
//     },
//     // pull this from the json file
//     {
//       path: '/artifacts/:uuid',
//       name: 'artifact',
//       component: ArtifactView,
//     },
//     {
//       path: '/artifacts/add',
//       name: 'add-artifact',
//       component: AddArtifactView, // Intermediary page with options
//     },
//     {
//       path: '/artifacts/add/source',
//       name: 'new-artifact',
//       component: NewArtifactForm, // New route for the form
//     },
//     {
//       path: '/artifacts/edit/:uuid',
//       name: 'edit-artifact',
//       component: EditArtifactView,
//     },
//     {
//       path: '/:catchAll(.*)',
//       name: 'not-found',
//       component: NotFoundView,
//     },
//   ],
// });

// export default router;
