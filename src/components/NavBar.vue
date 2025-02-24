<script setup>
import { RouterLink, useRoute } from 'vue-router'
import logo from '@/assets/img/logo.png'
import { useAuthStore } from '@/stores/auth'

const isActiveLink = (routePath) => {
  const route = useRoute()
  return route.path === routePath
}

const authStore = useAuthStore()
</script>

<template>
  <nav class="bg-stone-700 border-b border-lime-700">
    <div class="mx-auto max-w-7xl px-2 sm:px-6 lg:px-8">
      <div class="flex h-20 items-center justify-between">
        <div class="flex flex-1 items-center justify-center md:items-stretch md:justify-start">
          <!-- Logo -->
          <RouterLink class="flex flex-shrink-0 items-center mr-4" to="/">
            <img class="h-10 w-auto" :src="logo" alt="Trovi Artifacts" />
            <span class="hidden md:block text-white text-2xl font-bold ml-2">Trovi</span>
          </RouterLink>
          <div class="md:ml-auto">
            <div class="flex space-x-2">
              <RouterLink
                to="/"
                :class="[
                  isActiveLink('/') ? 'bg-gray-900' : 'hover:bg-gray-900 hover:text-white',
                  'text-white',
                  'px-3',
                  'py-2',
                  'rounded-md',
                ]"
                >Home</RouterLink
              >
              <RouterLink
                to="/about"
                :class="[
                  isActiveLink('/about') ? 'bg-gray-900' : 'hover:bg-gray-900 hover:text-white',
                  'text-white',
                  'px-3',
                  'py-2',
                  'rounded-md',
                ]"
                >About</RouterLink
              >
              <RouterLink
                to="/artifacts"
                :class="[
                  isActiveLink('/artifacts') ? 'bg-gray-900' : 'hover:bg-gray-900 hover:text-white',
                  'text-white',
                  'px-3',
                  'py-2',
                  'rounded-md',
                ]"
                >Artifacts</RouterLink
              >
              <RouterLink
                to="/artifacts/add"
                :class="[
                  isActiveLink('/artifacts/add')
                    ? 'bg-gray-900'
                    : 'hover:bg-gray-900 hover:text-white',
                  'text-white',
                  'px-3',
                  'py-2',
                  'rounded-md',
                ]"
                >Import</RouterLink
              >
              <RouterLink
                to="/login"
                :class="[
                  isActiveLink('/login') ? 'bg-gray-900' : 'hover:bg-gray-900 hover:text-white',
                  'text-white',
                  'px-3',
                  'py-2',
                  'rounded-md',
                ]"
              >
                {{
                  authStore.isAuthenticated
                    ? `Sign Out: ${authStore.userInfo.preferred_username}`
                    : 'Log in'
                }}
              </RouterLink>
            </div>
          </div>
        </div>
      </div>
    </div>
  </nav>
</template>
