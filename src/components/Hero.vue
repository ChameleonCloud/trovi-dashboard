<script setup>
import { defineProps, ref } from 'vue';

defineProps({
  title: {
    type: String,
    default: 'A collection of shared artifacts.',
  },
  subtitle: {
    type: String,
    default: 'And an open platform for practical reproducibility.',
  },
});

const searchQuery = ref('');
const handleSearch = () => {
  // Implement search functionality here
  console.log('Search query:', searchQuery.value);
};
</script>

<template>
  <section class="bg-lime-600 py-20 mb-4">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center">
      <div class="text-center">
        <h1 class="text-4xl font-extrabold text-white sm:text-5xl md:text-6xl">
          {{ title }}
        </h1>
        <p class="my-4 text-xl text-white">
          {{ subtitle }}
        </p>
        <!-- Search Bar -->
        <div class="w-full max-w-md mx-auto">
          <input type="text" v-model="searchQuery" @input="handleSearch" placeholder="Search artifacts..."
            class="w-full px-4 py-2 text-gray-900 rounded-md focus:outline-none focus:ring-2 focus:ring-lime-300" />
        </div>
      </div>
    </div>
  </section>
</template>
