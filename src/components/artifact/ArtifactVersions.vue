<script setup>
import { computed } from 'vue'

const props = defineProps({
  artifact: Object,
  version_slug: String,
  goLatestView: Function,
})

const safeVersions = computed(() => props.artifact?.versions || [])
</script>

<template>
  <div class="q-mt-sm">
    <h2 class="text-h6 text-primary q-mb-xs">Versions</h2>

    <div v-if="safeVersions.length">
      <q-list bordered padding class="q-pa-none">
        <q-item
          v-if="goLatestView"
          clickable
          :active="!version_slug"
          @click="goLatestView && goLatestView()"
        >
          <q-item-section>
            <div class="text-subtitle2">Latest View</div>
            <div class="text-caption">Show most recent version state</div>
          </q-item-section>
        </q-item>

        <q-item
          v-for="version in safeVersions"
          :key="version.uuid"
          clickable
          :active="version.slug === version_slug"
          :to="`/artifacts/${artifact.uuid}/versions/${version.slug}`"
        >
          <q-item-section>
            <div class="row">
              <div class="col-7">
                <div class="text-subtitle2">{{ version.slug }}</div>
                <div class="text-caption">{{ version.created_at }}</div>
              </div>
              <div v-if="version.computed?.doi" class="col text-caption">
                <a
                  :href="version.computed.doi_url"
                  target="_blank"
                  rel="noopener noreferrer"
                  @click.stop
                >
                  {{ version.computed.doi }}
                </a>
              </div>
            </div>
          </q-item-section>
        </q-item>
      </q-list>
    </div>

    <div v-else class="text-grey-6">No versions available.</div>
  </div>
</template>
