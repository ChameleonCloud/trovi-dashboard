<script setup>
import MainSection from '@/components/MainSection.vue'
import ArtifactHeader from '@/components/artifact/ArtifactHeader.vue'
import ArtifactAbout from '@/components/artifact/ArtifactAbout.vue'
import ArtifactAuthors from '@/components/artifact/ArtifactAuthors.vue'
import ArtifactCitation from '@/components/artifact/ArtifactCitation.vue'
import ArtifactVersions from '@/components/artifact/ArtifactVersions.vue'
import Launch from '@/components/artifact/Launch.vue'
import Loading from '@/components/Loading.vue'

import { reactive, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useArtifactsStore } from '@/stores/artifact'
import { Notify } from 'quasar'

const route = useRoute()
const artifactId = route.params.uuid
const artifactsStore = useArtifactsStore()

const state = reactive({
  artifact: null,
  isLoading: true,
  selectedVersion: null,
})

onMounted(async () => {
  try {
    state.artifact = await artifactsStore.fetchArtifactById(
      artifactId,
      new URLSearchParams(window.location.search).get('sharing_key'),
    )
    document.title = `${state.artifact.title} - Trovi`
    const v = state.artifact?.versions.find(
      (v) => !route.params.version || v.slug.trim() === route.params.version.trim(),
    )
    if (v) state.selectedVersion = v
  } catch (error) {
    console.error('Error fetching artifact', error)
    Notify.create({
      type: 'negative',
      message: "Couldn't fetch artifact. It may not exist, or you do not have permission.",
    })
  } finally {
    state.isLoading = false
  }
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
              <ArtifactAbout :artifact="state.artifact" />
            </main>

            <aside class="col">
              <Launch :artifact="state.artifact" :version_slug="state.selectedVersion?.slug" />
              <ArtifactAuthors :authors="state.artifact.authors" />
              <ArtifactVersions
                :artifact="state.artifact"
                :version_slug="state.selectedVersion?.slug"
              />
              <ArtifactCitation :artifact="state.artifact" :version="state.selectedVersion" />
            </aside>
          </div>
        </q-card-section>
      </q-card>
    </MainSection>
  </Loading>
</template>
