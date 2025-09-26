<script setup>
import ArtifactBadge from '@/components/artifact/ArtifactBadge.vue'

defineProps({
  tags: { type: Array, default: () => [] },
  badges: { type: Object, default: () => {} },
  selectedTags: { type: Array, default: () => [] },
  selectedBadges: { type: Array, default: () => [] },
  filterOwned: { type: Boolean, default: false },
  filterPublic: { type: Boolean, default: false },
  filterDoi: { type: Boolean, default: false },
})

defineEmits([
  'update:selectedTags',
  'update:selectedBadges',
  'update:filterOwned',
  'update:filterPublic',
  'update:filterDoi',
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
          :val="tag"
          :model-value="selectedTags.includes(tag)"
          @update:model-value="
            (checked) => {
              const newTags = checked
                ? [...selectedTags, tag]
                : selectedTags.filter((t) => t !== tag)
              $emit('update:selectedTags', newTags)
            }
          "
          label-class="text-subtitle2"
          :label="tag"
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
      <div class="col-auto">
        <q-checkbox
          :model-value="filterDoi"
          @update:model-value="$emit('update:filterDoi', $event)"
          label="Has DOI"
          dense
        />
      </div>
    </div>
  </div>
</template>
