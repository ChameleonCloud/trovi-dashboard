<script setup>
import Navbar from '@/components/Navbar.vue';
import { RouterView } from 'vue-router';

import axios from 'axios';

// TODO move this to env
axios.defaults.baseURL = "https://trovi.chameleoncloud.org"
</script>

<template>
  <Navbar />
  <RouterView />
</template>