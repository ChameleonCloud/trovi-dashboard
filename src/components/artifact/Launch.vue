<script setup>
const props = defineProps({ artifact: Object })
</script>

<template>
  <div>
    <h2 class="text-xl font-bold mb-2">Launch</h2>
    <button
      class="text-black-400 border border-black-300 hover:bg-black-200 px-2 py-1 rounded-lg flex items-center text-sm"
    >
      <a target="_blank" :href="artifact.computed.chameleon_launch_url">
        <span>Chameleon</span>
      </a>
    </button>
  </div>
</template>
