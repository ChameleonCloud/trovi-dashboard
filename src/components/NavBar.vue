<script setup>
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import chameleonLogo from '@/assets/img/chameleon-logo.png'

const portalUrl = import.meta.env.VITE_CHAMELEON_PORTAL_URL
const route = useRoute()
const authStore = useAuthStore()

const isActiveLink = (routePath) => route.path === routePath
</script>

<template>
  <q-toolbar>
    <!-- Logo + Title -->
    <a :href="portalUrl" class="row items-center">
      <img :src="chameleonLogo" alt="Chameleon" style="height: 32px" />
    </a>
    <router-link
      to="/"
      class="row items-center q-mr-lg"
      style="text-decoration: none; color: inherit"
    >
      <span class="text-h6 q-ml-sm">Trovi</span>
    </router-link>

    <!-- Navigation Links -->
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

    <q-btn-dropdown
      v-if="authStore.isAuthenticated"
      flat
      no-caps
      icon="account_circle"
      :label="authStore.userInfo.name || authStore.userInfo.preferred_username"
    >
      <q-list>
        <q-item clickable v-close-popup to="/settings">
          <q-item-section avatar><q-icon name="settings" /></q-item-section>
          <q-item-section>Settings</q-item-section>
        </q-item>
        <q-item clickable v-close-popup @click="authStore.logout()">
          <q-item-section avatar><q-icon name="logout" /></q-item-section>
          <q-item-section>Sign out</q-item-section>
        </q-item>
      </q-list>
    </q-btn-dropdown>
    <q-btn v-else flat label="Log in" @click="authStore.login()" />
  </q-toolbar>
</template>
