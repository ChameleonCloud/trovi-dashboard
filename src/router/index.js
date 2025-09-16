import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '@/views/HomeView.vue'
import ArtifactsView from '@/views/ArtifactsView.vue'
import NotFoundView from '@/views/NotFoundView.vue'
import ArtifactView from '@/views/ArtifactView.vue'
import AddArtifactView from '@/views/AddArtifactView.vue'
import EditArtifactView from '@/views/EditArtifactView.vue'
import AboutView from '@/views/AboutView.vue'
import LoginView from '@/views/LoginView.vue'

let lastRoute = null

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
    {
      path: '/artifacts/:uuid',
      name: 'artifact',
      component: ArtifactView,
    },
    {
      path: '/artifacts/:uuid/versions/:version',
      name: 'artifactVersion',
      component: ArtifactView,
    },
    {
      path: '/artifacts/add',
      name: 'add-artifact',
      component: AddArtifactView,
      meta: {
        requiresAuth: true,
      },
    },

    {
      path: '/artifacts/:uuid/edit',
      name: 'edit-artifact',
      component: EditArtifactView,
      meta: {
        requiresAuth: true,
      },
    },
    {
      path: '/about',
      name: 'about',
      component: AboutView,
    },
    {
      path: '/login',
      name: 'login',
      component: LoginView,
    },
    {
      path: '/:catchAll(.*)',
      name: 'not-found',
      component: NotFoundView,
    },
  ],
})

router.beforeEach((to, from, next) => {
  if (lastRoute?.name == 'login' && to.meta.requiresAuth) {
    router.push({ path: '/' })
  }
  lastRoute = to
  next()
})

export default router
