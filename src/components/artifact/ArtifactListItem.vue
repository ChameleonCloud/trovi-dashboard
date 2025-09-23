<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import ArtifactBadge from '@/components/artifact/ArtifactBadge.vue'

const props = defineProps({
  artifact: Object,
})

const router = useRouter()
const showFullDescription = ref(false)
const toggleFullDescription = () => {
  showFullDescription.value = !showFullDescription.value
}
</script>

<template>
  <q-card flat bordered class="bg-white dark:bg-grey-9 q-pa-md full-height">
    <div class="flex flex-column full-height">
      <div class="row justify-between items-start q-mb-md">
        <div class="column">
          <q-btn
            flat
            unelevated
            class="text-left q-pa-none"
            @click="router.push(`/artifacts/${props.artifact.uuid}`)"
            no-caps
          >
            <h3 class="text-h6">{{ props.artifact.title }}</h3>
          </q-btn>

          <div class="row wrap q-gutter-sm q-mt-xs">
            <q-chip v-for="tag in props.artifact.tags" :key="tag" dense outline>
              <i class="pi pi-tag q-mr-xs"></i> {{ tag }}
            </q-chip>
          </div>
        </div>

        <div class="row wrap items-center q-gutter-sm">
          <div v-if="props.artifact.visibility === 'private' && !props.artifact.computed.hasDoi">
            <i class="pi pi-eye-slash"></i>
          </div>

          <ArtifactBadge
            v-for="(badge, index) in props.artifact.badges"
            :key="index"
            :badge="badge"
          />
          <q-btn
            v-if="props.artifact.computed.github_url"
            flat
            outline
            color="grey-7"
            class="q-pa-xs"
            :href="props.artifact.computed.github_url"
            target="_blank"
            round
          >
            <i class="pi pi-github q-mr-xs"></i>
          </q-btn>
        </div>
      </div>

      <!-- Description -->
      <div class="q-mb-md" style="max-height: 10rem; overflow-y: auto">
        <div
          v-html="
            showFullDescription
              ? props.artifact.computed.long_description_markup
              : props.artifact.short_description
          "
          class="text-dark"
        ></div>
      </div>
      <q-btn flat class="q-mb-md" @click="toggleFullDescription">
        {{ showFullDescription ? 'Less' : 'More' }}
      </q-btn>

      <q-separator class="q-mb-md" />

      <div class="row justify-between items-center q-gutter-sm q-mt-auto">
        <q-btn color="primary" @click="router.push(`/artifacts/${props.artifact.uuid}`)">
          View
        </q-btn>

        <q-btn
          v-if="props.artifact.computed.isOwnedByUser()"
          color="secondary"
          @click="router.push(`/artifacts/${props.artifact.uuid}/edit`)"
        >
          Edit
        </q-btn>
      </div>
    </div>
  </q-card>
</template>

<style scoped>
.full-height {
  display: flex;
  flex-direction: column;
  height: 100%;
}
</style>
