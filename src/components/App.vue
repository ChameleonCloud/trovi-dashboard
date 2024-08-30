<script setup>
import Navbar from '@/components/Navbar.vue';
import { RouterView } from 'vue-router';

import axios from 'axios';

axios.defaults.baseURL = import.meta.env.VITE_API_BASE_URL
</script>

<template>
  <Navbar />
  <RouterView />
</template>