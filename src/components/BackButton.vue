<script setup>
import { RouterLink } from 'vue-router'
</script>

<template>
  <section>
    <div class="container m-auto py-6 px-6">
      <RouterLink to="/artifacts" class="text-lime-600 hover:text-stone-900 flex items-center">
        <i class="pi pi-arrow-circle-left mr-3"></i> All Artifacts
      </RouterLink>
    </div>
  </section>
</template>
