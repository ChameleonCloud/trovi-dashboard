<script setup>
import { reactive, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import ArtifactBadge from '@/components/artifact/ArtifactBadge.vue'

const props = defineProps({
  tags: { type: Array, default: () => [] },
  badges: { type: Object, default: () => {} },
})
const emit = defineEmits([
  'update:selectedTags',
  'update:selectedBadges',
  'update:filterOwned',
  'update:filterPublic',
  'update:filterDoi',
  'update:searchText',
])

const route = useRoute()
const router = useRouter()

// Local reactive state synced with query params
const state = reactive({
  selectedTags: route.query.tags ? route.query.tags.split(',') : [],
  selectedBadges: route.query.badges ? route.query.badges.split(',') : [],
  filterOwned: route.query.owned === '1',
  filterPublic: route.query.public === '1',
  filterDoi: route.query.doi === '1',
  searchText: route.query.q || '',
})

// Watchers to emit events and update query params
watch(
  () => state.selectedTags,
  (val) => {
    emit('update:selectedTags', val)
    updateQuery({ tags: val.join(',') })
  },
  { deep: true },
)

watch(
  () => state.selectedBadges,
  (val) => {
    emit('update:selectedBadges', val)
    updateQuery({ badges: val.join(',') })
  },
  { deep: true },
)

watch(
  () => state.filterOwned,
  (val) => {
    emit('update:filterOwned', val)
    updateQuery({ owned: val ? '1' : undefined })
  },
)
watch(
  () => state.filterPublic,
  (val) => {
    emit('update:filterPublic', val)
    updateQuery({ public: val ? '1' : undefined })
  },
)
watch(
  () => state.filterDoi,
  (val) => {
    emit('update:filterDoi', val)
    updateQuery({ doi: val ? '1' : undefined })
  },
)
watch(
  () => state.searchText,
  (val) => {
    emit('update:searchText', val)
    updateQuery({ q: val || undefined })
  },
)

function updateQuery(newParams) {
  router.replace({ query: { ...route.query, ...newParams } })
}
</script>

<template>
  <div class="q-pa-xs q-gutter-xs">
    <div class="row items-center q-gutter-sm">
      <q-input
        filled
        v-model="state.searchText"
        placeholder="Search artifacts..."
        clearable
        class="full-width"
      />

      <div class="col-auto">
        <span>Tags:</span>
      </div>
      <div class="col q-gutter-sm row wrap">
        <q-checkbox
          v-for="(tag, index) in tags"
          :key="index"
          :val="tag"
          v-model="state.selectedTags"
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
          v-model="state.selectedBadges"
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
        <q-checkbox v-model="state.filterOwned" label="My Artifacts" dense />
      </div>
      <div class="col-auto">
        <q-checkbox v-model="state.filterPublic" label="Public" dense />
      </div>
      <div class="col-auto">
        <q-checkbox v-model="state.filterDoi" label="Has DOI" dense />
      </div>
    </div>
  </div>
</template>
