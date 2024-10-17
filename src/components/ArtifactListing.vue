<!-- This is the individual artifact in the main landing page -->
<script setup>
import { RouterLink } from 'vue-router';
import { ref } from 'vue';
import ArtifactBadge from '@/components/ArtifactBadge.vue'

const props = defineProps({
  artifact: Object,
});

const showFullDescription = ref(false);
const toggleFullDescription = () => {
  showFullDescription.value = !showFullDescription.value;
};
</script>

<template>
  <div class="bg-white rounded-xl shadow-md relative">
    <div class="p-4">
      <div class="flex items-center justify-between mb-6">
        <div>
          <RouterLink :to="'/artifacts/' + props.artifact.uuid">
            <h3 class="text-xl font-bold">{{ props.artifact.title }}</h3>
          </RouterLink>
          <div class="mb-4">
            <div class="flex flex-wrap gap-2">
              <span v-for="tag in props.artifact.tags" :key="tag" class="text-lime-600 flex items-center">
                <i class="pi pi-tag mr-2"></i> {{ tag }}
              </span>
            </div>
          </div>
        </div>
        <div class="h-full flex">
          <template v-for="(badge, index) in props.artifact.badges" :key="index">
            <ArtifactBadge :badge=badge />
          </template>
          <button v-if="props.artifact.computed.github_url"
            class="text-gray-400 border border-gray-300 hover:bg-gray-200 px-1 py-1 my-3 rounded-lg flex items-center text-sm">
            <a target="_blank" :href="props.artifact.computed.github_url">
              <span><i class="pi pi-github mr-1"></i> GitHub</span>
            </a>
          </button>
        </div>
      </div>

      <div class="mb-5">
        <div class="marked" v-html="showFullDescription ? artifact.computed.long_description_markup : artifact.short_description">
        </div>
        <button @click="toggleFullDescription" class="text-lime-600 hover:text-stone-700 mb-5">
          {{ showFullDescription ? 'Less' : 'More' }}
        </button>
      </div>

      <div class="border border-gray-100 mb-5"></div>

      <div class="flex flex-col lg:flex-row justify-between mb-4 items-center">
        <RouterLink :to="'/artifacts/' + artifact.uuid"
          class="h-[36px] bg-lime-600 hover:bg-black text-white px-4 py-2 rounded-lg text-center text-sm">
          View
        </RouterLink>
      </div>
    </div>
  </div>
</template>
