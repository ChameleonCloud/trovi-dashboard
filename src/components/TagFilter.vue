<script setup>
import ArtifactBadge from '@/components/artifact/ArtifactBadge.vue'

defineProps({
  tags: { type: Array, default: () => [] },
  badges: { type: Object, default: () => {} },
  selectedTags: { type: Array, default: () => [] },
  selectedBadges: { type: Array, default: () => [] },
  filterOwned: { type: Boolean, default: false },
  filterPublic: { type: Boolean, default: false },
})

defineEmits([
  'update:selectedTags',
  'update:selectedBadges',
  'update:filterOwned',
  'update:filterPublic',
])
</script>

<template>
  <div class="mb-6 space-y-4">
    <div class="flex gap-2">
      <span class="text-stone-800 dark:text-stone-200">Tags:</span>
      <div class="flex flex-wrap gap-2">
        <label v-for="(tag, index) in tags" :key="index" class="flex items-center cursor-pointer">
          <input
            type="checkbox"
            :value="tag.tag"
            :checked="selectedTags.includes(tag.tag)"
            @change="
              $emit(
                'update:selectedTags',
                $event.target.checked
                  ? [...selectedTags, tag.tag]
                  : selectedTags.filter((t) => t !== tag.tag),
              )
            "
            class="mr-1 form-checkbox h-4 w-4 text-lime-600 border-gray-300 dark:border-gray-600 rounded"
          />
          <span
            class="text-lg font-medium text-gray-700 dark:text-stone-300 hover:text-lime-600 transition duration-300"
          >
            {{ tag.tag }}
          </span>
        </label>
      </div>
    </div>

    <div class="flex gap-2">
      <span class="text-stone-800 dark:text-stone-200">Badges:</span>
      <div class="flex flex-wrap gap-2">
        <label
          v-for="(badge, index) in badges"
          :key="index"
          class="flex items-center cursor-pointer"
        >
          <input
            type="checkbox"
            :value="badge.name"
            :checked="selectedBadges.includes(badge.name)"
            @change="
              $emit(
                'update:selectedBadges',
                $event.target.checked
                  ? [...selectedBadges, badge.name]
                  : selectedBadges.filter((b) => b !== badge.name),
              )
            "
            class="mr-1 form-checkbox h-4 w-4 text-lime-600 border-gray-300 dark:border-gray-600 rounded"
          />
          <span
            class="inline-flex text-lg font-medium text-gray-700 dark:text-stone-300 hover:text-lime-600 transition duration-300"
          >
            <ArtifactBadge :badge="badge" :link="false" /> {{ badge.name }}
          </span>
        </label>
      </div>
    </div>

    <div class="flex gap-2">
      <span class="text-stone-800 dark:text-stone-200">Filter:</span>
      <div class="flex flex-wrap gap-2">
        <label class="flex items-center cursor-pointer">
          <input
            type="checkbox"
            :checked="filterOwned"
            @change="$emit('update:filterOwned', $event.target.checked)"
            class="mr-1 form-checkbox h-4 w-4 text-lime-600 border-gray-300 dark:border-gray-600 rounded"
          />
          <span
            class="text-lg font-medium text-gray-700 dark:text-stone-300 hover:text-lime-600 transition duration-300"
          >
            My Artifacts
          </span>
        </label>
      </div>
      <div class="flex flex-wrap gap-2">
        <label class="flex items-center cursor-pointer">
          <input
            type="checkbox"
            :checked="filterPublic"
            @change="$emit('update:filterPublic', $event.target.checked)"
            class="mr-1 form-checkbox h-4 w-4 text-lime-600 border-gray-300 dark:border-gray-600 rounded"
          />
          <span
            class="text-lg font-medium text-gray-700 dark:text-stone-300 hover:text-lime-600 transition duration-300"
          >
            Public
          </span>
        </label>
      </div>
    </div>
  </div>
</template>
