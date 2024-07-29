<!-- composition API -->
<script setup>
import logo from '@/assets/img/logo.png'

</script>

<template>
  <nav class="bg-[#7AC555] border-b border-green-500">
    <div class="mx-auto max-w-7xl px-2 sm:px-6 lg:px-8">
      <div class="flex h-20 items-center justify-between">
        <div class="flex flex-1 items-center justify-center md:items-stretch md:justify-start">
          <!-- Logo -->
          <a class="flex flex-shrink-0 items-center mr-4" href="index.html">
            <img class="h-10 w-auto" :src="logo" alt="Trovi" />
            <span class="hidden md:block text-white text-2xl font-bold ml-2">Trovi</span>
          </a>
          <div class="md:ml-auto">
            <div class="flex space-x-2">
              <a href="index.html"
                class="text-white bg-[#7AC555] hover:bg-[#F5F5F5] hover:text-[#7AC555] rounded-md px-3 py-2">
                Home
              </a>
              <a href="artifacts.html" class="text-white hover:bg-[#7AC555] hover:text-[#F5F5F5] rounded-md px-3 py-2">
                Artifacts
              </a>
              <a href="add-artifact.html"
                class="text-white hover:bg-[#7AC555] hover:text-[#F5F5F5] rounded-md px-3 py-2">
                Add Artifact
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  </nav>
</template>
