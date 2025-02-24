<script setup>
import NavBar from '@/components/NavBar.vue'
import { RouterView } from 'vue-router'

import axios from 'axios'

axios.defaults.baseURL = import.meta.env.VITE_TROVI_BASE_URL
</script>

<template>
  <NavBar />
  <RouterView />
</template>
