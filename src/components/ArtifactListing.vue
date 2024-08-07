<!-- This is the individual artifact in the main landing page -->
<script setup>
import { RouterLink } from 'vue-router';
import { defineProps, ref, computed } from 'vue';

const props = defineProps({
  artifact: Object,
});


const showFullDescription = ref(false);

const toggleFullDescription = () => {
  showFullDescription.value = !showFullDescription.value;
};

const truncatedDescription = computed(() => {
  let short_description = props.artifact.short_description;
  if (!showFullDescription.value) {
    short_description = short_description.substring(0, 90) + '...';
  }
  return short_description;
});
</script>

<template>
  <div class="bg-white rounded-xl shadow-md relative">
    <div class="p-4">
      <div class="flex items-center justify-between mb-6">
        <div>
          <div class="text-gray-600 my-2">{{ artifact.uuid }}</div>
          <h3 class="text-xl font-bold">{{ artifact.title }}</h3>
          <div class="mb-4">
            <div class="flex flex-wrap gap-2">
              <span v-for="tag in artifact.tags" :key="tag" class="text-lime-600 flex items-center">
                <i class="pi pi-tag mr-2"></i> {{ tag }}
              </span>
            </div>
          </div>
        </div>

        <button
          class="text-gray-400 border border-gray-300 hover:bg-gray-200 px-2 py-1 rounded-lg flex items-center text-sm">
          <i class="pi pi-star mr-1"></i> Star
        </button>
      </div>

      <div class="mb-5">
        <div>
          {{ truncatedDescription }}
        </div>
        <button @click="toggleFullDescription" class="text-lime-600 hover:text-stone-700 mb-5">
          {{ showFullDescription ? 'Less' : 'More' }}
        </button>
      </div>



      <div class="border border-gray-100 mb-5"></div>

      <div class="flex flex-col lg:flex-row justify-between mb-4 items-center">
        <div class="text-orange-700 mb-3 flex items-center">
          <i class="pi pi-check text-orange-700 mr-2"></i>
          {{ artifact.updated_at }}
        </div>

        <!-- this is when I click the button view and it takes to the detail on the artifact -->
        <RouterLink :to="'/artifacts/' + artifact.id"
          class="h-[36px] bg-lime-600 hover:bg-black text-white px-4 py-2 rounded-lg text-center text-sm">
          View
        </RouterLink>
      </div>
    </div>
  </div>
</template>
