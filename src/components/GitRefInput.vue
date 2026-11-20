<script setup>
import { ref, watch } from 'vue'
import axios from 'axios'
import { Notify, QSpinner } from 'quasar'

// A Git repository, and one of the branches, tags or commits the portal lists for it
const url = defineModel('url', { type: String, default: '' })
const gitRef = defineModel('gitRef', { type: String, default: null })

const options = ref([])
const loading = ref(false)
let allOptions = []

watch(
  url,
  async (remote) => {
    gitRef.value = null
    options.value = allOptions = []
    if (!remote) return
    loading.value = true
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_CHAMELEON_PORTAL_URL}/experiment/share/api/git/`,
        { params: { remote_url: remote } },
      )
      options.value = allOptions = res.data.result.map(([value, label]) => ({ value, label }))
      // HEAD is the default branch's latest commit
      gitRef.value = allOptions.find((o) => o.label === 'HEAD')?.value ?? null
    } catch (err) {
      Notify.create({ type: 'negative', message: `Failed to fetch options: ${err.message}` })
    } finally {
      loading.value = false
    }
  },
  { immediate: true },
)

const filterOptions = (val, update) => {
  const needle = val.toLowerCase()
  update(() => {
    options.value = allOptions.filter((o) => o.label.toLowerCase().includes(needle))
  })
}
</script>

<template>
  <q-input
    filled
    v-model="url"
    label="Git Clone URL"
    type="url"
    placeholder="https://github.com/owner/repo.git"
    class="q-mb-md"
    clearable
    debounce="500"
  />
  <q-select
    v-if="url"
    v-model="gitRef"
    :options="options"
    label="Branch, Tag or Commit"
    dense
    emit-value
    map-options
    use-input
    class="q-mb-md"
    @filter="filterOptions"
  >
    <template v-slot:append>
      <QSpinner v-if="loading" size="24px" />
    </template>
  </q-select>
</template>
