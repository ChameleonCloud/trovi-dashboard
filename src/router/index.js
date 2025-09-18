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
      meta: {
        title: 'Home - Trovi',
      },
    },
    {
      path: '/artifacts',
      name: 'artifacts',
      component: ArtifactsView,
      meta: {
        title: 'Artifacts - Trovi',
      },
    },
    {
      path: '/artifacts/:uuid',
      name: 'artifact',
      component: ArtifactView,
      meta: {},
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
        title: 'Add Artifact - Trovi',
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
      meta: {
        title: 'About - Trovi',
      },
    },
    {
      path: '/login',
      name: 'login',
      component: LoginView,
      meta: {
        title: 'Login - Trovi',
      },
    },
    {
      path: '/:catchAll(.*)',
      name: 'not-found',
      component: NotFoundView,
      meta: {
        title: 'Not Found - Trovi',
      },
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

router.beforeEach((to, from, next) => {
  if (to.meta.title) {
    document.title = to.meta.title
  }
  next()
})

export default router
