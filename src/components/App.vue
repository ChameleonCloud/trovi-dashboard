<script setup>
import NavBar from '@/components/NavBar.vue';
import { RouterView } from 'vue-router';

import axios from 'axios';

if(import.meta.env.PROD){
  axios.defaults.baseURL = "https://trovi.chameleoncloud.org"
} else {
  axios.defaults.baseURL = "https://trovi-dev.chameleoncloud.org"
}
</script>

<template>
  <NavBar />
  <RouterView />
</template>