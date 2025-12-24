<script setup>
import MainSection from '@/components/MainSection.vue'
import ArtifactHeader from '@/components/artifact/ArtifactHeader.vue'
import ArtifactAbout from '@/components/artifact/ArtifactAbout.vue'
import ArtifactAuthors from '@/components/artifact/ArtifactAuthors.vue'
import ArtifactCitation from '@/components/artifact/ArtifactCitation.vue'
import ArtifactVersions from '@/components/artifact/ArtifactVersions.vue'
import ArtifactLinks from '@/components/artifact/ArtifactLinks.vue'
import ArtifactLinksFrom from '@/components/artifact/ArtifactLinksFrom.vue'
import Launch from '@/components/artifact/Launch.vue'
import Loading from '@/components/Loading.vue'

import { reactive, onMounted, watch, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useArtifactsStore } from '@/stores/artifact'
import { Notify } from 'quasar'

const route = useRoute()
const router = useRouter()
const artifactsStore = useArtifactsStore()

const state = reactive({
  artifact: null,
  isLoading: true,
  selectedVersion: null,
  viewKey: 0,
})

async function goLatestView() {
  if (route.params.version) {
    await router.replace({
      name: route.name,
      params: { uuid: route.params.uuid },
      query: route.query,
    })
  }
  state.selectedVersion = null
  state.viewKey++
}

async function loadArtifact() {
  state.isLoading = true
  try {
    const artifactId = route.params.uuid
    state.artifact = await artifactsStore.fetchArtifactById(
      artifactId,
      new URLSearchParams(window.location.search).get('sharing_key'),
    )
    document.title = `${state.artifact.title} - Trovi`

    if (route.params.version) {
      const v = state.artifact?.versions.find(
        (v) => v.slug.trim() === route.params.version.trim(),
      )
      state.selectedVersion = v || null
    } else {
      state.selectedVersion = null
    }

    state.viewKey++
  } catch (error) {
    console.error('Error fetching artifact', error)
    Notify.create({
      type: 'negative',
      message: "Couldn't fetch artifact. It may not exist, or you do not have permission.",
    })
  } finally {
    state.isLoading = false
  }
}

onMounted(loadArtifact)

watch(
  () => [route.params.uuid, route.params.version],
  async () => {
    await loadArtifact()
  },
)

const launchVersionSlug = computed(() => {
  if (state.selectedVersion) return state.selectedVersion.slug
  const versions = (state.artifact?.versions || []).filter((v) => v && !v.deleted)
  if (!versions.length) return null
  const sorted = versions
    .slice()
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
  return sorted[0]?.slug || null
})
</script>

<template>
  <Loading :loading="state.isLoading">
    <MainSection>
      <q-card>
        <q-card-section>
          <div v-if="state.artifact" class="row q-gutter-md">
            <main class="col-8">
              <ArtifactHeader :artifact="state.artifact" />
              <ArtifactAbout
                :key="state.viewKey"
                :artifact="state.artifact"
                :selectedVersion="state.selectedVersion"
              />
              <ArtifactLinks :artifact="state.artifact" />
            </main>

            <aside class="col">
              <Launch :artifact="state.artifact" :version_slug="launchVersionSlug" />

              <ArtifactAuthors :authors="state.artifact.authors" />
              <ArtifactVersions
                :artifact="state.artifact"
                :version_slug="state.selectedVersion?.slug"
                :goLatestView="goLatestView"
              />
              <ArtifactLinksFrom :artifact="state.artifact" />
              <ArtifactCitation :artifact="state.artifact" :version="state.selectedVersion" />
            </aside>
          </div>
        </q-card-section>
      </q-card>
    </MainSection>
  </Loading>
</template>
