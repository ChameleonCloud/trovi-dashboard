<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import ArtifactBadge from '@/components/artifact/ArtifactBadge.vue'

const props = defineProps({
  tags: { type: Array, default: () => [] },
  badges: { type: [Array, Object], default: () => [] },
  // optional v-model bindings so TagFilter can be controlled by parent
  selectedTags: { type: Array, default: null },
  selectedBadges: { type: Array, default: null },
  filterOwned: { type: Boolean, default: null },
  filterPublic: { type: Boolean, default: null },
  filterDoi: { type: Boolean, default: null },
  filterCollection: { type: Boolean, default: null },
  searchText: { type: String, default: null },
})
const emit = defineEmits([
  'update:selectedTags',
  'update:selectedBadges',
  'update:filterOwned',
  'update:filterPublic',
  'update:filterCollection',
  'update:filterDoi',
  'update:searchText',
])

const route = useRoute()
const router = useRouter()

// Component is largely stateless: expose computed getters/setters that
// read from provided props when present, otherwise fall back to route query.
// Setters emit update events and update the URL query parameters.

const selectedTags = computed({
  get() {
    if (Array.isArray(props.selectedTags)) return props.selectedTags
    if (route.query.tags) return String(route.query.tags).split(',')
    return []
  },
  set(val) {
    const next = Array.isArray(val) ? val : []
    emit('update:selectedTags', next)
    updateQuery({ tags: next.length ? next.join(',') : undefined })
  },
})

const selectedBadges = computed({
  get() {
    if (Array.isArray(props.selectedBadges)) return props.selectedBadges
    if (route.query.badges) return String(route.query.badges).split(',')
    return []
  },
  set(val) {
    const next = Array.isArray(val) ? val : []
    emit('update:selectedBadges', next)
    updateQuery({ badges: next.length ? next.join(',') : undefined })
  },
})

const filterOwned = computed({
  get() {
    if (typeof props.filterOwned === 'boolean') return props.filterOwned
    return route.query.owned === '1'
  },
  set(val) {
    const b = !!val
    emit('update:filterOwned', b)
    updateQuery({ owned: b ? '1' : undefined })
  },
})

const filterPublic = computed({
  get() {
    if (typeof props.filterPublic === 'boolean') return props.filterPublic
    return route.query.public === '1'
  },
  set(val) {
    const b = !!val
    emit('update:filterPublic', b)
    updateQuery({ public: b ? '1' : undefined })
  },
})

const filterDoi = computed({
  get() {
    if (typeof props.filterDoi === 'boolean') return props.filterDoi
    return route.query.doi === '1'
  },
  set(val) {
    const b = !!val
    emit('update:filterDoi', b)
    updateQuery({ doi: b ? '1' : undefined })
  },
})

const filterCollection = computed({
  get() {
    if (typeof props.filterCollection === 'boolean') return props.filterCollection
    return route.query.collection === '1'
  },
  set(val) {
    const b = !!val
    emit('update:filterCollection', b)
    updateQuery({ collection: b ? '1' : undefined })
  },
})

const searchText = computed({
  get() {
    if (typeof props.searchText === 'string') return props.searchText
    return route.query.q || ''
  },
  set(val) {
    const s = val || ''
    emit('update:searchText', s)
    updateQuery({ q: s || undefined })
  },
})

const badgesList = computed(() => {
  if (Array.isArray(props.badges)) return props.badges
  if (props.badges && typeof props.badges === 'object') return Object.values(props.badges)
  return []
})

function updateQuery(newParams) {
  router.replace({ query: { ...route.query, ...newParams } })
}
</script>

<template>
  <div class="q-pa-xs q-gutter-xs">
    <div class="row items-center q-gutter-sm">
      <q-input
        filled
        v-model="searchText"
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
          v-model="selectedTags"
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
          v-for="(badge, index) in badgesList"
          :key="index"
          :val="badge.name"
          v-model="selectedBadges"
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
        <q-checkbox v-model="filterOwned" label="My Artifacts" dense />
      </div>
      <div class="col-auto">
        <q-checkbox v-model="filterPublic" label="Public" dense />
      </div>
      <div class="col-auto">
        <q-checkbox v-model="filterCollection" label="Is collection" dense />
      </div>
      <div class="col-auto">
        <q-checkbox v-model="filterDoi" label="Has DOI" dense />
      </div>
    </div>
  </div>
</template>
