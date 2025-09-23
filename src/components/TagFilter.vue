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
  <div class="q-pa-xs q-gutter-xs">
    <div class="row items-center q-gutter-sm">
      <div class="col-auto">
        <span>Tags:</span>
      </div>
      <div class="col q-gutter-sm row wrap">
        <q-checkbox
          v-for="(tag, index) in tags"
          :key="index"
          :val="tag.tag"
          :model-value="selectedTags.includes(tag.tag)"
          @update:model-value="
            (checked) => {
              const newTags = checked
                ? [...selectedTags, tag.tag]
                : selectedTags.filter((t) => t !== tag.tag)
              $emit('update:selectedTags', newTags)
            }
          "
          label-class="text-subtitle2"
          :label="tag.tag"
          dense
        />
      </div>
    </div>

    <div class="row items-center q-gutter-sm">
      <div class="col-auto">
        <span>Badges:</span>
      </div>
      <div class="col q-gutter-sm row wrap">
        <q-checkbox
          v-for="(badge, index) in badges"
          :key="index"
          :val="badge.name"
          :model-value="selectedBadges.includes(badge.name)"
          @update:model-value="
            (checked) => {
              const newBadges = checked
                ? [...selectedBadges, badge.name]
                : selectedBadges.filter((b) => b !== badge.name)
              $emit('update:selectedBadges', newBadges)
            }
          "
          dense
        >
          <ArtifactBadge :badge="badge" :link="false" />
        </q-checkbox>
      </div>
    </div>

    <!-- Filters -->
    <div class="row items-center q-gutter-sm">
      <div class="col-auto">
        <span>Filter:</span>
      </div>

      <div class="col-auto">
        <q-checkbox
          :model-value="filterOwned"
          @update:model-value="$emit('update:filterOwned', $event)"
          label="My Artifacts"
          dense
        />
      </div>

      <div class="col-auto">
        <q-checkbox
          :model-value="filterPublic"
          @update:model-value="$emit('update:filterPublic', $event)"
          label="Public"
          dense
        />
      </div>
    </div>
  </div>
</template>
