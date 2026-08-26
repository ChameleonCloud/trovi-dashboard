<script setup>
import NavBar from '@/components/NavBar.vue'
import { RouterView } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

import axios from 'axios'

axios.defaults.baseURL = import.meta.env.VITE_TROVI_BASE_URL

// Start the session check up front so the nav bar and artifact requests know the user
useAuthStore().restoreSession()
</script>

<template>
  <NavBar />
  <div class="chameleon-body">
    <RouterView />
  </div>
</template>
