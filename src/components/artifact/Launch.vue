<script setup>
const props = defineProps({ artifact: Object, version_slug: String })
</script>

<template>
  <div>
    <h2 class="text-xl font-bold mb-2">Content</h2>
    <div>
      <button
        class="inline-block bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm"
      >
        <a target="_blank" :href="artifact.computed.get_chameleon_launch_url(version_slug)">
          <span>Launch on Chameleon</span>
        </a>
      </button>
    </div>
    <div class="mt-4">
      <button
        class="inline-block bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm"
      >
        <a target="_blank" :href="artifact.computed.get_chameleon_download_url(version_slug)">
          <span>Download Archive</span>
        </a>
      </button>
    </div>
    <div class="mt-4" v-if="artifact.computed.github_url">
      <a
        :href="artifact.computed.github_url"
        target="_blank"
        class="inline-block bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm"
      >
        View on GitHub
      </a>
    </div>
  </div>
</template>
