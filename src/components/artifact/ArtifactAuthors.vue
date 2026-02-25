<script setup>
import { computed } from 'vue'

const props = defineProps({ authors: Array })

const isContactSupportOnly = computed(() =>
  props.authors?.length > 0 &&
  props.authors[0].full_name === "Contact Chameleon Support"
)

const hasSupportEmail = computed(() =>
  props.authors?.some(
    author => author.email === "help@chameleoncloud.org"
  )
)
</script>

<template>
  <div v-if="authors?.length" class="q-mt-sm">

    <div v-if="isContactSupportOnly" class="text-body2">
      No author information found. View source artifact linked in description.
    </div>

    <template v-else>
      <h2 class="text-h6 text-primary q-mb-xs">Authors</h2>

      <ul class="column q-pl-xs q-gutter-md">
        <li
          v-for="(author, index) in authors"
          :key="index"
          class="row items-start q-gutter-xs"
        >
          <div>
            <div class="text-subtitle2">{{ author.full_name }}</div>
            <div class="text-body2">{{ author.affiliation }}</div>

            <!-- Hide support email -->
            <div
              v-if="author.email !== 'help@chameleoncloud.org'"
              class="text-body2"
            >
              {{ author.email }}
            </div>
          </div>
        </li>
      </ul>

      <!-- Footer message if support email was hidden -->
      <div
        v-if="hasSupportEmail"
        class="text-body2 q-mt-sm"
      >
        Author contact information not found. View source artifact linked in description for author contacts.
      </div>
    </template>

  </div>
</template>
