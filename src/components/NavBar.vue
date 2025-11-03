<script setup>
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const route = useRoute()
const authStore = useAuthStore()

const isActiveLink = (routePath) => route.path === routePath
</script>

<template>
  <q-toolbar>
    <!-- Logo + Title -->
    <router-link
      to="/"
      class="row items-center q-mr-lg"
      style="text-decoration: none; color: inherit"
    >
      <!-- <img :src="logo" alt="Trovi Artifacts" style="height: 32px" /> -->
      <span class="text-h6 q-ml-sm">Trovi</span>
    </router-link>

    <!-- Navigation Links -->
    <q-btn flat label="Home" to="/" :class="{ 'text-bold': isActiveLink('/') }" />
    <q-btn flat label="About" to="/about" :class="{ 'text-bold': isActiveLink('/about') }" />
    <q-btn
      flat
      label="Artifacts"
      to="/artifacts"
      :class="{ 'text-bold': isActiveLink('/artifacts') }"
    />
    <q-btn
      flat
      label="Create"
      to="/artifacts/add"
      :class="{ 'text-bold': isActiveLink('/artifacts/add') }"
    />

    <q-space />

    <q-btn
      flat
      dense
      :to="'/login'"
      :label="
        authStore.isAuthenticated ? `Sign Out: ${authStore.userInfo.preferred_username}` : 'Log in'
      "
      :class="{ 'text-bold': isActiveLink('/login') }"
    />
  </q-toolbar>
</template>
