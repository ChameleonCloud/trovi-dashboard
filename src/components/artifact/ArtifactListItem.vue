<script setup>
import { RouterLink } from 'vue-router'
import { ref } from 'vue'
import ArtifactBadge from '@/components/artifact/ArtifactBadge.vue'

const props = defineProps({
  artifact: Object,
})

const showFullDescription = ref(false)
const toggleFullDescription = () => {
  showFullDescription.value = !showFullDescription.value
}
</script>

<template>
  <div
    class="bg-white dark:bg-stone-800 rounded-xl shadow-md relative transition-colors duration-300"
  >
    <div class="p-4">
      <!-- Header -->
      <div class="flex items-center justify-between mb-6">
        <div>
          <RouterLink :to="'/artifacts/' + props.artifact.uuid">
            <h3 class="text-xl font-bold text-stone-900 dark:text-white">
              {{ props.artifact.title }}
            </h3>
          </RouterLink>

          <span
            v-if="props.artifact.visibility == 'private' && !props.artifact.computed.hasDoi"
            class="rounded-full"
          >
            <h1><i class="pi pi-eye-slash text-gray-500 dark:text-gray-400"></i></h1>
          </span>

          <!-- Tags -->
          <div class="mb-4">
            <div class="flex flex-wrap gap-2">
              <span
                v-for="tag in props.artifact.tags"
                :key="tag"
                class="text-lime-600 dark:text-lime-400 flex items-center"
              >
                <i class="pi pi-tag mr-2"></i> {{ tag }}
              </span>
            </div>
          </div>
        </div>

        <!-- Badges & GitHub -->
        <div class="h-full flex gap-2">
          <template v-for="(badge, index) in props.artifact.badges" :key="index">
            <ArtifactBadge :badge="badge" />
          </template>

          <button
            v-if="props.artifact.computed.github_url"
            class="text-gray-400 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-700 px-2 py-1 my-3 rounded-lg flex items-center text-sm transition-colors duration-200"
          >
            <a target="_blank" :href="props.artifact.computed.github_url" class="flex items-center">
              <i class="pi pi-github mr-1"></i> GitHub
            </a>
          </button>
        </div>
      </div>

      <!-- Description -->
      <div class="mb-5">
        <div
          class="marked text-stone-800 dark:text-stone-200"
          v-html="
            showFullDescription
              ? artifact.computed.long_description_markup
              : artifact.short_description
          "
        ></div>

        <button
          @click="toggleFullDescription"
          class="text-lime-600 dark:text-lime-400 hover:text-stone-700 dark:hover:text-stone-100 mb-5 transition-colors duration-200"
        >
          {{ showFullDescription ? 'Less' : 'More' }}
        </button>
      </div>

      <div class="border border-gray-100 dark:border-gray-700 mb-5"></div>

      <!-- Action Buttons -->
      <div class="flex flex-col lg:flex-row justify-between mb-4 items-center gap-2">
        <RouterLink
          :to="'/artifacts/' + artifact.uuid"
          class="h-[36px] bg-lime-600 dark:bg-lime-500 hover:bg-black dark:hover:bg-black text-white dark:text-black px-4 py-2 rounded-lg text-center text-sm transition-colors duration-200 w-full lg:w-auto"
        >
          View
        </RouterLink>

        <RouterLink
          v-if="artifact.computed.isOwnedByUser()"
          :to="'/artifacts/' + artifact.uuid + '/edit'"
          class="h-[36px] bg-pink-600 dark:bg-pink-500 hover:bg-black dark:hover:bg-black text-white dark:text-black px-4 py-2 rounded-lg text-center text-sm transition-colors duration-200 w-full lg:w-auto"
        >
          Edit
        </RouterLink>
      </div>
    </div>
  </div>
</template>
