<script setup>
import { reactive, onMounted, ref, watch, computed } from 'vue'
import { useArtifactsStore } from '@/stores/artifact'
import { useAuthStore } from '@/stores/auth'
import { useRoute } from 'vue-router'
import router from '@/router'
import { parseUrn, usernameToUrn, gitToUrn, filterArtifacts } from '@/util'
import TagFilter from '@/components/TagFilter.vue'
import MainSection from '@/components/MainSection.vue'
import Loading from '@/components/Loading.vue'
import { Dialog, Notify, QSpinner } from 'quasar'
import axios from 'axios'
import draggable from 'vuedraggable'

const route = useRoute()
const artifactUUID = route.params.uuid
const artifactsStore = useArtifactsStore()
const authStore = useAuthStore()
authStore.initKeycloak()

const VISIBILITY_OPTIONS = ['public', 'private']
const ROLES = ['collaborator', 'administrator']

const state = reactive({
  artifact: null, // editable artifact
  originalArtifact: null, // keep original for comparison if needed
  loading: true,
  loadingLinkOptions: true,
  availableTags: [],
  // local linked artifacts view: array of { relation, linked_artifact, artifact }
  linked_list: [],
  // linked-artifact filter state (used by TagFilter)
  selectedTags: [],
  selectedBadges: [],
  filterOwned: false,
  filterPublic: false,
  filterDoi: false,
  filterCollection: false,
})

// helper to make a plain editable copy without cloning computed properties
function makeEditableArtifact(raw) {
  return reactive({
    uuid: raw.uuid,
    title: raw.title || '',
    short_description: raw.short_description || '',
    long_description: raw.long_description || '',
    visibility: raw.visibility || 'private',
    tags: raw.tags ? [...raw.tags] : [],
    authors: raw.authors ? raw.authors.map((a) => ({ ...a })) : [],
    roles: raw.roles
      ? raw.roles.map((r) => ({
          username: parseUrn(r.user).username,
          role: r.role,
          user: r.user,
        }))
      : [],
    versions: raw.versions.map((v) => v),
    computed: raw.computed, // keep as reference, do NOT clone
    sharing_key: raw.sharing_key,
    linked_artifacts: raw.linked_artifacts ? [...raw.linked_artifacts] : [],
  })
}

onMounted(async () => {
  const rawArtifact = await artifactsStore.fetchArtifactById(artifactUUID)
  state.originalArtifact = rawArtifact
  state.artifact = makeEditableArtifact(rawArtifact)
  await artifactsStore.fetchTags()
  state.availableTags = artifactsStore.tags
  state.loading = false
  gitForm.gitUrl = state.artifact.computed?.github_url || ''

  // fetch available artifacts for linking
  await artifactsStore.fetchAllArtifacts()

  // Ensure the boolean flag exists for each artifact so checkboxes
  // are not rendered as indeterminate. initSelectionFromLinks will
  // overwrite these values for actual linked artifacts.
  artifactsStore.artifacts.forEach((a) => {
    a.computed.isLinkedToArtifact = false
  })

  state.linked_list = []
  if (state.artifact.linked_artifacts) {
    state.artifact.linked_artifacts.forEach((link, index) => {
      state.linked_list.push({
        ...link,
        order: index, // track position
      })
    })
  }
  initSelectionFromLinks()
  state.loadingLinkOptions = false
})

const gitDialog = ref(false)
const gitForm = reactive({
  gitUrl: '',
  selectedOption: null,
  loadingOptions: false,
  submitting: false,
})

const gitOptions = ref([])
let rawGitOptions = []

// Fetch options when Git URL changes
watch(
  () => gitForm.gitUrl,
  async (newUrl) => {
    gitForm.selectedOption = null
    gitOptions.value = []
    if (!newUrl) return
    gitForm.loadingOptions = true
    try {
      // Call the portal API to list remote branches/tags/commits
      const res = await axios.get(
        `${import.meta.env.VITE_CHAMELEON_PORTAL_URL}/experiment/share/api/git/`,
        {
          params: { remote_url: newUrl },
        },
      )
      rawGitOptions = res.data.result.map((i) => i)
      gitOptions.value = rawGitOptions.map(([value, label]) => ({ value, label }))
      // gitOptions.value = (res.data.result || []).map(([value, label]) => ({ value, label }))
    } catch (err) {
      Notify.create({ type: 'negative', message: `Failed to fetch options: ${err.message}` })
    } finally {
      gitForm.loadingOptions = false
    }
  },
)

const onGitFilter = async function (val, update) {
  const needle = val.toLowerCase()
  // gitOptions.value = stringOptions.filter((v) => v.toLowerCase().indexOf(needle) > -1)
  update(() => {
    gitOptions.value = rawGitOptions
      .filter(([_val, label]) => label.toLowerCase().indexOf(needle) > -1)
      .map(([value, label]) => ({ value, label }))
  })
}

const submitGitVersion = async () => {
  if (!gitForm.gitUrl || !gitForm.selectedOption) {
    Notify.create({ type: 'negative', message: 'Please fill in both fields' })
    return
  }
  gitForm.submitting = true
  try {
    const contents_urn = gitToUrn(gitForm.gitUrl, gitForm.selectedOption)
    const newVersion = await artifactsStore.createVersion(artifactUUID, {
      contents: { urn: contents_urn },
    })
    if (newVersion) {
      state.artifact.versions.push(newVersion)
    }
  } finally {
    gitForm.submitting = false
    gitDialog.value = false
  }
}

const SITE_MAP = {
  'CHI@UC': 'chi-uc',
  'CHI@TACC': 'chi-tacc',
  'KVM@TACC': 'kvm-tacc',
  Other: 'other',
}

const imageForm = reactive({
  selectedSite: null,
  imageUuid: '',
  submitting: false,
  siteOptions: ['CHI@UC', 'CHI@TACC', 'KVM@TACC', 'Other'],
})

const submitImageVersion = async () => {
  if (!imageForm.selectedSite) {
    Notify.create({ type: 'negative', message: 'Please select a site' })
    return
  }
  if (!imageForm.imageUuid) {
    Notify.create({ type: 'negative', message: 'Please enter an image UUID' })
    return
  }

  imageForm.submitting = true
  try {
    const siteKey = SITE_MAP[imageForm.selectedSite] || 'other'
    const linkUrn = `urn:trovi:image:${siteKey}:${imageForm.imageUuid}`

    const urnExists = state.artifact.versions.some(
      (v) => v.contents?.urn === linkUrn || v.links?.some((l) => l.urn === linkUrn),
    )
    if (urnExists) {
      Notify.create({
        type: 'negative',
        message: 'An artifact version with this image already exists.',
      })
      imageForm.submitting = false
      return
    }
    const version_obj = {
      contents: { urn: linkUrn },
      environment_setup: [{ type: 'image', arguments: '' }],
      links: [{ urn: linkUrn, label: imageForm.selectedSite }],
    }
    const newVersion = await artifactsStore.createVersion(state.artifact.uuid, version_obj)
    if (newVersion) {
      state.artifact.versions.push(newVersion)
    }
    imageForm.selectedSite = null
    imageForm.imageUuid = ''
    Notify.create({ type: 'positive', message: 'Image version created' })
  } catch (err) {
    Notify.create({
      type: 'negative',
      message: `Failed to create image version: ${err?.message || err}`,
    })
  } finally {
    imageForm.submitting = false
  }
}

const infrastructureTemplateContent = ref('')
const infrastructureTemplateSubmitting = ref(false)

const submitInfrastructureTemplate = async () => {
  if (!infrastructureTemplateContent.value) {
    Notify.create({ type: 'negative', message: 'Please enter a template' })
    return
  }

  infrastructureTemplateSubmitting.value = true
  try {
    const version_obj = {
      contents: { urn: `urn:trovi:contents:heat_template:embedded-${Date.now()}` },
      environment_setup: [{ type: 'heat_template', arguments: infrastructureTemplateContent.value }],
    }

    const newVersion = await artifactsStore.createVersion(state.artifact.uuid, version_obj)
    if (newVersion) {
      state.artifact.versions.push(newVersion)
    }

    infrastructureTemplateContent.value = ''
    Notify.create({ type: 'positive', message: 'Infrastructure template version created' })
  } catch (err) {
    Notify.create({
      type: 'negative',
      message: `Failed to create template version: ${err?.message || err}`,
    })
  } finally {
    infrastructureTemplateSubmitting.value = false
  }
}

/* --------- Linked Artifacts (checkbox UI) ---------- */
const linkSearch = ref('')

const filteredCandidates = computed(() => {
  // Start from all artifacts except the one being edited
  const candidates = (artifactsStore.artifacts || []).filter((a) => a.uuid !== state.artifact?.uuid)

  // Use the shared filterArtifacts util; combine TagFilter's search (bound to linkSearch)
  const filtered = filterArtifacts(candidates, {
    searchText: linkSearch.value,
    selectedTags: state.selectedTags,
    selectedBadges: state.selectedBadges,
    filterOwned: state.filterOwned,
    filterPublic: state.filterPublic,
    filterDoi: state.filterDoi,
    filterCollection: state.filterCollection,
  })
  return filtered
})

// initialize selection state from existing linked_artifacts
const initSelectionFromLinks = () => {
  const linkedArtifactUUIDs = new Set()
  for (const link of state.artifact.linked_artifacts) {
    linkedArtifactUUIDs.add(link.linked_artifact)
  }
  artifactsStore.artifacts.forEach((a) => {
    a.computed.isLinkedToArtifact = linkedArtifactUUIDs.has(a.uuid)
  })
}

/* --------- Metadata ---------- */
const submitMetadata = async () => {
  const patch = []

  const original = state.originalArtifact
  const edited = state.artifact

  // compare primitive fields
  if (edited.title !== original.title) {
    patch.push({ op: 'replace', path: '/title', value: edited.title })
  }
  if (edited.short_description !== original.short_description) {
    patch.push({ op: 'replace', path: '/short_description', value: edited.short_description })
  }
  if (edited.long_description !== original.long_description) {
    patch.push({ op: 'replace', path: '/long_description', value: edited.long_description })
  }
  if (edited.visibility !== original.visibility) {
    patch.push({ op: 'replace', path: '/visibility', value: edited.visibility })
  }

  // compare tags array (shallow)
  if (JSON.stringify(edited.tags) !== JSON.stringify(original.tags)) {
    patch.push({ op: 'replace', path: '/tags', value: edited.tags })
  }

  // compare authors array (shallow, by JSON.stringify)
  if (JSON.stringify(edited.authors) !== JSON.stringify(original.authors)) {
    patch.push({ op: 'replace', path: '/authors', value: edited.authors })
  }

  if (patch.length > 0) {
    await artifactsStore.updateArtifactMetadata(edited.uuid, patch)
  } else {
    Notify.create({
      type: 'info',
      message: 'No changes to save',
    })
  }
}

/* --------- Roles ---------- */
const submitRoles = async () => {
  // compute role changes
  state.artifact.roles.forEach((role) => {
    role.user = usernameToUrn(role.username)
  })
  const addedRoles = state.artifact.roles.filter(
    (newRole) =>
      !state.originalArtifact.roles.some(
        (oldRole) =>
          parseUrn(oldRole.user).username === newRole.username && oldRole.role === newRole.role,
      ),
  )
  const removedRoles = state.originalArtifact.roles.filter(
    (oldRole) =>
      !state.artifact.roles.some(
        (newRole) =>
          parseUrn(oldRole.user).username === newRole.username && oldRole.role === newRole.role,
      ),
  )

  await artifactsStore.updateArtifactRoles(
    state.artifact.uuid,
    addedRoles.map((r) => ({ role: r.role, user: r.user })),
    removedRoles.map((r) => ({ role: r.role, user: r.user })),
  )
}

/* --------- Versions ---------- */
const submitVersions = async () => {
  const removedVersions = state.originalArtifact.versions.filter(
    (oldVersion) =>
      !state.artifact.versions.some((newVersion) => newVersion.slug === oldVersion.slug),
  )
  await artifactsStore.updateArtifactVersions(
    state.artifact.uuid,
    removedVersions.map((v) => v.slug),
  )
  // update original copy
  state.originalArtifact.versions = state.artifact.versions.map((v) => ({ ...v }))
  // Handle DOI requests
  const versionsToRequestDOI = state.artifact.versions.filter((v) => v.doi_request)
  for (const version of versionsToRequestDOI) {
    await artifactsStore.migrateArtifactVersion(state.artifact.uuid, version.slug)
    version.doi_request = false // reset flag
  }
  // TODO we don't know the DOI unless we wait a while and refetch
}

function isDiskImageVersion(version) {
  return version.environment_setup && version.environment_setup.some((e) => e.type === 'image')
}

const deleteVersion = (index) => {
  const version = state.artifact.versions[index]
  if (!version) return

  Dialog.create({
    title: 'Confirm Deletion',
    message: `Are you sure you want to delete this version? This action happens immediately.`,
    persistent: true,
    ok: { label: 'Delete', color: 'negative' },
    cancel: { label: 'Cancel' },
  }).onOk(async () => {
    try {
      await artifactsStore.updateArtifactVersions(state.artifact.uuid, [version.slug])
      state.artifact.versions.splice(index, 1)
      Notify.create({ type: 'positive', message: 'Version deleted' })
    } catch (err) {
      Notify.create({ type: 'negative', message: `Failed to delete: ${err.message}` })
    }
  })
}

/* --------- Linked Artifacts submission ---------- */
const submitLinks = async () => {
  if (!state.artifact) return

  try {
    // Send the ordered linked_artifacts
    const linksPayload = state.linked_list.map((link, index) => ({
      linked_artifact: link.linked_artifact,
      relation: link.relation,
      order: index, // include order
    }))

    await artifactsStore.updateArtifactLinks(state.artifact.uuid, linksPayload)

    // Refresh local copies
    const refreshed = await artifactsStore.fetchArtifactById(state.artifact.uuid)
    state.originalArtifact = refreshed
    state.artifact = makeEditableArtifact(refreshed)

    // Reinitialize linked_list with proper order
    state.linked_list = refreshed.linked_artifacts.map((link, index) => ({
      ...link,
      order: index,
    }))

    initSelectionFromLinks()
  } catch (err) {
    Notify.create({ type: 'negative', message: `Failed to update links: ${err?.message || err}` })
  }
}

const confirmDelete = () => {
  Dialog.create({
    title: 'Confirm Deletion',
    message: `Are you sure you want to delete artifact "${state.artifact.title}"? This action cannot be undone.`,
    persistent: true,
    ok: { label: 'Delete', color: 'negative' },
    cancel: { label: 'Cancel' },
  }).onOk(async () => {
    try {
      await artifactsStore.deleteArtifact(state.artifact.uuid)
      Notify.create({ type: 'positive', message: 'Artifact deleted' })
      router.push('/artifacts')
    } catch (err) {
      Notify.create({ type: 'negative', message: `Failed to delete: ${err.message}` })
    }
  })
}

const reimportArtifact = async () => {
  const resArtifact = await artifactsStore.importArtifact(
    state.artifact.computed.github_url,
    state.artifact.uuid,
  )
  if (resArtifact) {
    state.artifact = resArtifact
    router.push({ path: `/artifacts/${state.artifact.uuid}` })
  }
}
</script>

<template>
  <Loading :loading="state.loading">
    <MainSection>
      <q-card v-if="state.artifact" class="q-mb-md">
        <q-card-section>
          <h2 class="text-h5 q-mb-md">
            Editing
            <RouterLink :to="'/artifacts/' + state.artifact.uuid">
              "{{ state.artifact.title }}"
            </RouterLink>
          </h2>

          <!-- Metadata -->
          <q-card class="q-pa-md q-mb-md">
            <h3 class="text-h6 q-mb-sm">Metadata</h3>
            <q-input
              v-model="state.artifact.title"
              label="Title"
              dense
              class="q-mb-sm"
              :rules="[(val) => val.length <= 140 || 'Please use maximum 140 characters']"
              hint="Max 140 characters"
            />
            <q-input
              v-model="state.artifact.short_description"
              type="textarea"
              autogrow
              label="Short Description"
              dense
              class="q-mb-sm"
              :rules="[(val) => val.length <= 200 || 'Please use maximum 200 characters']"
              hint="Max 200 characters"
            />
            <q-input
              v-model="state.artifact.long_description"
              type="textarea"
              autogrow
              label="Long Description"
              class="q-mb-sm"
            />
            <q-select
              v-model="state.artifact.tags"
              :options="artifactsStore.tags"
              label="Tags"
              multiple
              use-chips
              dense
              class="q-mb-sm"
            />
            <q-select
              v-model="state.artifact.visibility"
              :options="VISIBILITY_OPTIONS"
              label="Visibility"
              dense
              class="q-mb-sm"
            />
            <p>
              <RouterLink
                v-if="state.artifact.visibility === 'private'"
                :to="
                  '/artifacts/' +
                  state.artifact.uuid +
                  '/?sharing_key=' +
                  state.artifact.sharing_key
                "
              >
                Shareable Secret Link
              </RouterLink>
            </p>

            <h3 class="text-h6 q-mb-sm">Authors</h3>
            <div
              v-for="(author, index) in state.artifact.authors"
              :key="index"
              class="q-mb-sm row items-center q-gutter-sm"
            >
              <q-input v-model="author.full_name" label="Full Name" dense class="col" />
              <q-input v-model="author.affiliation" label="Affiliation" dense class="col" />
              <q-input v-model="author.email" type="email" label="Email" dense class="col" />
              <q-btn
                color="negative"
                flat
                icon="delete"
                @click="state.artifact.authors.splice(index, 1)"
                round
                dense
              />
            </div>
            <div class="row q-gutter-sm q-mt-md">
              <q-btn
                label="Add Author"
                color="primary"
                @click="state.artifact.authors.push({ full_name: '', affiliation: '', email: '' })"
              />
            </div>
            <div class="row q-gutter-sm q-mt-md">
              <q-btn
                label="Configure Daypass"
                color="primary"
                :href="state.artifact.computed?.get_chameleon_daypass_url()"
                target="_blank"
              />
              <q-btn label="Save Metadata" color="positive" @click="submitMetadata" />
            </div>
          </q-card>

          <!-- Roles -->
          <q-card class="q-pa-md q-mb-md" v-if="state.originalArtifact.computed.canEditRoles()">
            <h3 class="text-h6 q-mb-sm">Roles</h3>
            <div
              v-for="(role, index) in state.artifact.roles"
              :key="index"
              class="q-mb-sm row items-center q-gutter-sm"
            >
              <q-input v-model="role.username" type="email" label="User Email" dense class="col" />
              <q-select v-model="role.role" :options="ROLES" dense class="col-3" />
              <q-btn
                color="negative"
                flat
                icon="delete"
                @click="state.artifact.roles.splice(index, 1)"
                round
                dense
              />
            </div>
            <div class="row q-gutter-sm q-mt-md">
              <q-btn
                label="Add Role"
                color="primary"
                @click="state.artifact.roles.push({ username: '', role: ROLES[0] })"
              />
              <q-btn label="Save Roles" color="positive" @click="submitRoles" />
            </div>
          </q-card>

          <!-- Versions -->
          <q-card class="q-pa-md q-mb-md">
            <h3 class="text-h6 q-mb-sm">Versions</h3>
            <div
              v-if="state.artifact.computed?.github_url"
              class="row items-center justify-between q-mb-md"
            >
              <div>
                <span
                  >Import latest changes from the linked GitHub repo
                  <a :href="state.artifact.computed.github_url" target="_blank">
                    {{ state.artifact.computed.github_repo }}
                  </a>
                  (requires a <a href="/dashboard/artifacts/add">trovi.json</a>)
                </span>
              </div>
              <q-btn label="Import Version" color="primary" @click="reimportArtifact" />
            </div>
            <div class="row items-center justify-between q-mb-md">
              <span>Create a new version from Git repo</span>
              <q-btn label="Create Version" color="primary" @click="gitDialog = true" />
            </div>
            <q-separator />

            <div
              v-for="(version, index) in state.artifact.versions"
              :key="index"
              class="row justify-between items-center q-mb-sm"
            >
              <div>{{ version.slug }}</div>
              <div>{{ version.created_at }}</div>
              <div class="row q-gutter-sm">
                <q-btn
                  v-if="!version.computed?.doi && !version.doi_request && !version.computed?.is_git"
                  color="secondary"
                  label="Request DOI"
                  @click="version.doi_request = true"
                />
                <span v-else-if="version.doi_request">Will Request DOI</span>
                <div v-else-if="version.computed?.doi">
                  <a :href="version.computed.doi_url" target="_blank">{{ version.computed.doi }}</a>
                </div>
                <q-btn
                  v-if="!version.computed?.doi"
                  color="negative"
                  icon="delete"
                  @click="deleteVersion(index)"
                  label="Delete"
                />
              </div>
            </div>

            <div class="row q-gutter-sm q-mt-md">
              <q-btn label="Save Versions" color="positive" @click="submitVersions" />
            </div>

            <div
              v-if="state.artifact.versions && state.artifact.versions.length"
              class="q-mt-md q-pa-sm rounded-borders"
            >
              <h4 class="text-subtitle2 q-mb-sm">Disk Images</h4>
              <div v-for="(v, vi) in state.artifact.versions" :key="vi">
                <div v-if="v.links">
                  <div
                    v-for="(l, li) in v.links.filter((link) =>
                      (link.urn || '').startsWith('urn:trovi:image:'),
                    )"
                    :key="li"
                    class="row items-center q-gutter-sm q-mb-sm"
                  >
                    <div class="col">
                      <div>{{ l.label || l.urn }}</div>
                      <div class="text-caption">{{ l.urn }}</div>
                    </div>
                    <div class="col-auto row q-gutter-sm">
                      <q-btn
                        v-if="isDiskImageVersion(v)"
                        color="negative"
                        icon="delete"
                        @click="deleteVersion(vi)"
                        label="Delete"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div class="q-mt-md q-pa-sm rounded-borders">
              <h4 class="text-subtitle2 q-mb-sm">Add Disk Image Version</h4>
              <div class="row q-gutter-sm items-center q-mb-sm">
                <q-select
                  v-model="imageForm.selectedSite"
                  :options="imageForm.siteOptions"
                  label="Site"
                  dense
                  class="col-6"
                />
                <q-input
                  v-model="imageForm.imageUuid"
                  label="Image UUID"
                  dense
                  class="col"
                />
              </div>
              <div class="row q-gutter-sm">
                <q-btn
                  label="Create Image Version"
                  color="primary"
                  :loading="imageForm.submitting"
                  @click="submitImageVersion"
                />
              </div>
            </div>

            <div v-if="state.artifact.versions && state.artifact.versions.length" class="q-mt-md q-pa-sm rounded-borders">
              <h4 class="text-subtitle2 q-mb-sm">Infrastructure Templates</h4>
              <div v-for="(v, vi) in state.artifact.versions" :key="vi">
                <div v-if="v.environment_setup && v.environment_setup.some((e) => e.type === 'heat_template')">
                  <div class="row items-center q-gutter-sm q-mb-sm">
                    <div class="col">
                      <div>{{ v.slug }}</div>
                    </div>
                    <div class="col-auto row q-gutter-sm">
                      <q-btn
                        color="negative" icon="delete" @click="deleteVersion(vi)"
                        label="Delete"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div class="q-mt-md q-pa-sm rounded-borders">
              <h4 class="text-subtitle2 q-mb-sm">Add Infrastructure Template</h4>
              <div class="row q-gutter-sm items-center q-mb-sm">
                <q-input
                  v-model="infrastructureTemplateContent"
                  type="textarea"
                  label="Add Template Text Here"
                  dense
                  class="col"
                />
              </div>
              <div class="row q-gutter-sm">
                <q-btn
                  label="Create Template Version"
                  color="primary"
                  :loading="infrastructureTemplateSubmitting"
                  @click="submitInfrastructureTemplate"
                />
              </div>
            </div>
            <div>
              <q-btn
                label="Delete Artifact and All Versions"
                color="negative"
                icon="delete"
                @click="confirmDelete"
                class="q-mt-md"
              />
            </div>
          </q-card>
        </q-card-section>

        <!-- Linked Artifacts -->
        <q-card-section>
          <q-card class="q-pa-md q-mb-md">
            <h3 class="text-h6 q-mb-sm">Linked Artifacts</h3>

            <!-- Filter/Search -->
            <div class="row q-gutter-sm q-mb-md items-center">
              <TagFilter
                :tags="artifactsStore.tags"
                :badges="artifactsStore.processed_badges?.badges || {}"
                v-model:selectedTags="state.selectedTags"
                v-model:selectedBadges="state.selectedBadges"
                v-model:filterOwned="state.filterOwned"
                v-model:filterPublic="state.filterPublic"
                v-model:filterCollection="state.filterCollection"
                v-model:filterDoi="state.filterDoi"
                v-model:searchText="linkSearch"
              />
            </div>

            <!-- Available artifacts table for linking -->
            <Loading :loading="state.loadingLinkOptions">
              <q-table
                hide-header
                :rows="filteredCandidates"
                row-key="uuid"
                :pagination="{ rowsPerPage: 10 }"
              >
                <template v-slot:body="props">
                  <q-tr :props="props">
                    <q-td style="width: 48px">
                      <q-checkbox
                        :key="props.row.uuid + '-' + String(props.row.computed.isLinkedToArtifact)"
                        v-model="props.row.computed.isLinkedToArtifact"
                        dense
                        @update:model-value="
                          (val) => {
                            if (val) {
                              // Add to linked_list if not already there
                              if (
                                !state.linked_list.find((l) => l.linked_artifact === props.row.uuid)
                              ) {
                                state.linked_list.push({
                                  linked_artifact: props.row.uuid,
                                  linked_title: props.row.title,
                                  computed: props.row.computed,
                                })
                              }
                            } else {
                              // Remove from linked_list
                              const index = state.linked_list.findIndex(
                                (l) => l.linked_artifact === props.row.uuid,
                              )
                              if (index !== -1) state.linked_list.splice(index, 1)
                            }
                          }
                        "
                      />
                    </q-td>
                    <q-td>
                      <RouterLink :to="'/artifacts/' + props.row.uuid" target="_blank">
                        {{ props.row.title || '(untitled)' }}
                      </RouterLink>
                      <div class="text-caption">{{ props.row.computed.authorString }}</div>
                    </q-td>
                    <q-td>{{ props.row.updated_at }}</q-td>
                  </q-tr>
                </template>
              </q-table>
            </Loading>
            <q-separator class="q-mt-md q-mb-md" />

            <!-- Draggable selected links -->
            <h4 class="text-subtitle2">Selected to link (Drag to reorder)</h4>
            <draggable
              v-model="state.linked_list"
              item-key="linked_artifact"
              handle=".drag-handle"
              animation="200"
            >
              <template #item="{ element, index }">
                <div>
                  <q-item clickable>
                    <q-item-section avatar>
                      <q-icon name="drag_indicator" class="drag-handle" />
                    </q-item-section>
                    <q-item-section>
                      <RouterLink :to="'/artifacts/' + element.linked_artifact" target="_blank">
                        {{ element.linked_title || '(untitled)' }}
                      </RouterLink>
                      <div class="text-caption">{{ element.computed?.authorString }}</div>
                    </q-item-section>
                    <q-item-section side>
                      <q-btn
                        color="negative"
                        icon="delete"
                        flat
                        dense
                        @click="
                          () => {
                            state.linked_list.splice(index, 1)
                            // Also uncheck table checkbox
                            const tableItem = artifactsStore.artifacts.find(
                              (a) => a.uuid === element.linked_artifact,
                            )
                            if (tableItem) tableItem.computed.isLinkedToArtifact = false
                          }
                        "
                      />
                    </q-item-section>
                  </q-item>
                  <q-separator />
                </div>
              </template>
            </draggable>

            <q-btn label="Save Links" color="positive" class="q-mt-md" @click="submitLinks" />
          </q-card>
        </q-card-section>
      </q-card>

      <q-dialog v-model="gitDialog" persistent>
        <q-card style="min-width: 400px; max-width: 600px">
          <q-card-section>
            <h3 class="text-h6 q-mb-md">Create Version from Git</h3>
            <p>
              Enter the Git repository URL and select a branch, tag, or commit to create a new
              artifact version.
            </p>
            <q-input
              filled
              v-model="gitForm.gitUrl"
              label="Git Clone URL"
              type="url"
              placeholder="https://github.com/owner/repo.git"
              class="q-mb-md"
              clearable
            />
            <q-select
              v-model="gitForm.selectedOption"
              :options="gitOptions"
              label="Select Git Branch/Tag"
              dense
              emit-value
              map-options
              use-input
              class="q-mb-md"
              @filter="onGitFilter"
            >
              <template v-slot:append>
                <QSpinner v-if="gitForm.loadingOptions" size="24px" />
              </template>
            </q-select>
          </q-card-section>
          <q-card-actions align="right">
            <q-btn flat label="Cancel" color="secondary" v-close-popup />
            <q-btn
              label="Create Version"
              color="primary"
              :loading="gitForm.submitting"
              @click="submitGitVersion"
            />
          </q-card-actions>
        </q-card>
      </q-dialog>
    </MainSection>
  </Loading>
</template>
