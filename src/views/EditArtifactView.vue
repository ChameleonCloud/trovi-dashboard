<script setup>
import { reactive, onMounted, onBeforeUnmount, ref, watch, computed } from 'vue'
import { useArtifactsStore } from '@/stores/artifact'
import { useRoute, onBeforeRouteLeave } from 'vue-router'
import router from '@/router'
import {
  parseUrn,
  parseImageUrn,
  usernameToUrn,
  gitToUrn,
  filterArtifacts,
  parseBibtex,
} from '@/util'
import TagFilter from '@/components/TagFilter.vue'
import MainSection from '@/components/MainSection.vue'
import Loading from '@/components/Loading.vue'
import { Dialog, Notify, QSpinner, copyToClipboard } from 'quasar'
import axios from 'axios'
import draggable from 'vuedraggable'

const route = useRoute()
const artifactUUID = route.params.uuid
const artifactsStore = useArtifactsStore()

const VISIBILITY_OPTIONS = [
  {
    value: 'private',
    label: 'Private',
    description: 'Only its owner, collaborators, and anyone with the secret link can see it.',
  },
  { value: 'public', label: 'Public', description: 'Anyone can find and view it on Trovi.' },
]
const ROLES = ['collaborator', 'administrator']

const state = reactive({
  artifact: null, // editable artifact
  originalArtifact: null, // keep original for comparison if needed
  loading: true,
  saving: false,
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
  filterVideo: false,
  filterVerified: false,
})

// helper to make a plain editable copy without cloning computed properties
function makeEditableArtifact(raw) {
  return reactive({
    uuid: raw.uuid,
    title: raw.title || '',
    short_description: raw.short_description || '',
    long_description: raw.long_description || '',
    visibility: raw.visibility || 'private',
    comments_enabled: raw.comments_enabled,
    tags: raw.tags ? [...raw.tags] : [],
    authors: raw.authors ? raw.authors.map((a) => ({ ...a })) : [],
    videos: raw.videos ? raw.videos.map((v) => ({ ...v })) : [],
    publications: raw.publications ? raw.publications.map((p) => ({ ...p })) : [],
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

function resetForm(raw) {
  state.originalArtifact = raw
  state.artifact = makeEditableArtifact(raw)
  state.linked_list = state.artifact.linked_artifacts.map((link, index) => ({
    ...link,
    order: index,
  }))
}

onMounted(async () => {
  const rawArtifact = await artifactsStore.fetchArtifactById(artifactUUID)
  resetForm(rawArtifact)
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
      state.artifact.versions.unshift(newVersion)
      gitDialog.value = false
    }
  } finally {
    gitForm.submitting = false
  }
}

const SITE_MAP = {
  'CHI@UC': 'chi-uc',
  'CHI@TACC': 'chi-tacc',
  'CHI@NCAR': 'chi-ncar',
  'KVM@TACC': 'kvm-tacc',
  Other: 'other',
}

const imageDialog = ref(false)
const imageForm = reactive({
  selectedSite: null,
  imageUuid: '',
  submitting: false,
  siteOptions: ['CHI@UC', 'CHI@TACC', 'CHI@NCAR', 'KVM@TACC', 'Other'],
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
      state.artifact.versions.unshift(newVersion)
      imageForm.selectedSite = null
      imageForm.imageUuid = ''
      imageDialog.value = false
      Notify.create({ type: 'positive', message: 'Image version created' })
    }
  } catch (err) {
    Notify.create({
      type: 'negative',
      message: `Failed to create image version: ${err?.message || err}`,
    })
  } finally {
    imageForm.submitting = false
  }
}

const heatTemplateDialog = ref(false)
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
      state.artifact.versions.unshift(newVersion)
      infrastructureTemplateContent.value = ''
      heatTemplateDialog.value = false
      Notify.create({ type: 'positive', message: 'Infrastructure template version created' })
    }
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
const relatedDialog = ref(false)
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
    filterVideo: state.filterVideo,
    filterVerified: state.filterVerified,
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

const bibtexInput = ref('')

const addPublicationsFromBibtex = () => {
  const parsed = parseBibtex(bibtexInput.value)
  if (!parsed.length) {
    Notify.create({
      type: 'negative',
      message: 'No publications found. Check that the BibTeX entry has a title.',
    })
    return
  }
  state.artifact.publications.push(...parsed)
  bibtexInput.value = ''
  Notify.create({
    type: 'positive',
    message: `Added ${parsed.length} publication${parsed.length === 1 ? '' : 's'}. Review, then save.`,
  })
}

/* --------- Metadata ---------- */
const buildMetadataPatch = () => {
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
  if (edited.long_description !== (original.long_description ?? '')) {
    patch.push({ op: 'replace', path: '/long_description', value: edited.long_description || null })
  }
  if (edited.visibility !== original.visibility) {
    patch.push({ op: 'replace', path: '/visibility', value: edited.visibility })
  }
  if (edited.comments_enabled !== original.comments_enabled) {
    patch.push({ op: 'replace', path: '/comments_enabled', value: edited.comments_enabled })
  }

  // compare tags array (shallow)
  if (JSON.stringify(edited.tags) !== JSON.stringify(original.tags)) {
    patch.push({ op: 'replace', path: '/tags', value: edited.tags })
  }

  // compare authors array (shallow, by JSON.stringify)
  if (JSON.stringify(edited.authors) !== JSON.stringify(original.authors)) {
    patch.push({ op: 'replace', path: '/authors', value: edited.authors })
  }

  const videos = edited.videos.filter((v) => v.url?.trim())
  if (JSON.stringify(videos) !== JSON.stringify(original.videos ?? [])) {
    patch.push({ op: 'replace', path: '/videos', value: videos })
  }

  const publications = edited.publications
    .filter((p) => p.title?.trim())
    .map((p) => ({
      ...p,
      year: p.year === '' || p.year === null ? null : Number(p.year),
    }))
  if (JSON.stringify(publications) !== JSON.stringify(original.publications ?? [])) {
    patch.push({ op: 'replace', path: '/publications', value: publications })
  }

  return patch
}

/* --------- Sharing ---------- */
const secretLink = computed(() => {
  const { href } = router.resolve({
    name: 'artifact',
    params: { uuid: state.artifact.uuid },
    query: { sharing_key: state.artifact.sharing_key },
  })
  return new URL(href, window.location.origin).href
})

const copySecretLink = () =>
  copyToClipboard(secretLink.value).then(() =>
    Notify.create({ type: 'positive', message: 'Link copied' }),
  )

/* --------- Roles ---------- */
const isOwnerRole = (role) => role.user === state.originalArtifact.owner_urn

const roleChanges = () => {
  const roles = state.artifact.roles.filter((role) => role.username.trim())
  const addedRoles = roles.filter(
    (newRole) =>
      !state.originalArtifact.roles.some(
        (oldRole) =>
          parseUrn(oldRole.user).username === newRole.username.trim() &&
          oldRole.role === newRole.role,
      ),
  )
  const removedRoles = state.originalArtifact.roles.filter(
    (oldRole) =>
      !roles.some(
        (newRole) =>
          parseUrn(oldRole.user).username === newRole.username.trim() &&
          oldRole.role === newRole.role,
      ),
  )

  return {
    added: addedRoles.map((r) => ({ role: r.role, user: usernameToUrn(r.username.trim()) })),
    removed: removedRoles.map((r) => ({ role: r.role, user: r.user })),
  }
}

/* --------- Versions ---------- */
// The DOI only shows up once the migration finishes, so remember what was requested
const requestedDois = reactive(new Set())

const requestDoi = (version) => {
  if (hasChanges.value) {
    Notify.create({
      type: 'warning',
      message: 'Save your changes first. The DOI record uses the saved title, authors and tags.',
    })
    return
  }
  Dialog.create({
    title: 'Request a DOI?',
    message: `Version ${version.slug} will be published to Zenodo with a permanent DOI. Zenodo records are public, the artifact will be listed publicly on Trovi, and this version can no longer be deleted.`,
    persistent: true,
    ok: { label: 'Request DOI', color: 'primary' },
    cancel: { label: 'Cancel' },
  }).onOk(async () => {
    try {
      if (await artifactsStore.migrateArtifactVersion(state.artifact.uuid, version.slug)) {
        requestedDois.add(version.slug)
      }
    } catch (err) {
      // 409 means a migration for this version is already in progress
      if (err.response?.status === 409) requestedDois.add(version.slug)
    }
  })
}

const VERSION_TYPES = {
  chameleon: 'Archive',
  git: 'Git',
  github: 'Git',
  http: 'External',
  heat_template: 'Heat template',
  zenodo: 'Zenodo',
}

function versionType(version) {
  const urn = version.contents.urn
  if (urn.startsWith('urn:trovi:image:')) {
    const { siteKey } = parseImageUrn(urn)
    const site = Object.keys(SITE_MAP).find((name) => SITE_MAP[name] === siteKey)
    return `Disk image (${site ?? siteKey})`
  }
  const { provider } = parseUrn(urn)
  return VERSION_TYPES[provider] ?? provider
}

// Zenodo migration can only read files uploaded to Chameleon storage
function canRequestDoi(version) {
  return version.contents.urn.startsWith('urn:trovi:contents:chameleon:')
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
    if (await artifactsStore.updateArtifactVersions(state.artifact.uuid, [version.slug])) {
      state.artifact.versions.splice(index, 1)
      Notify.create({ type: 'positive', message: 'Version deleted' })
    }
  })
}

/* --------- Linked Artifacts changes ---------- */
// The API returns every link with order 0, so compare positions instead
const linkKey = (link) => `${link.linked_artifact} ${link.relation || 'collection'}`

const linksChanged = () =>
  state.linked_list.map(linkKey).join() !==
  state.originalArtifact.linked_artifacts.map(linkKey).join()

/* --------- Sections ---------- */
const SECTIONS = [
  { id: 'details', label: 'Details' },
  { id: 'authors', label: 'Authors' },
  { id: 'versions', label: 'Versions' },
  { id: 'sharing', label: 'Sharing' },
  { id: 'media', label: 'Videos & Publications' },
  { id: 'related', label: 'Related Artifacts' },
  { id: 'danger', label: 'Danger Zone' },
]

// The section of the page where each metadata field is edited
const SECTION_OF_PATH = {
  '/title': 'details',
  '/short_description': 'details',
  '/long_description': 'details',
  '/tags': 'details',
  '/authors': 'authors',
  '/visibility': 'sharing',
  '/comments_enabled': 'sharing',
  '/videos': 'media',
  '/publications': 'media',
}

const changedSections = computed(() => {
  if (!state.artifact) return new Set()
  const sections = new Set(buildMetadataPatch().map((op) => SECTION_OF_PATH[op.path]))
  const { added, removed } = roleChanges()
  if (added.length + removed.length > 0) sections.add('sharing')
  if (linksChanged()) sections.add('related')
  return sections
})

const scrollToSection = (id) => document.getElementById(id).scrollIntoView({ behavior: 'smooth' })

/* --------- Saving ---------- */
const hasChanges = computed(() => changedSections.value.size > 0)

const saveChanges = async () => {
  const uuid = state.artifact.uuid
  const patch = buildMetadataPatch()
  const { added, removed } = roleChanges()
  const rolesChanged = added.length + removed.length > 0
  state.saving = true
  try {
    const saved =
      (!patch.length || (await artifactsStore.updateArtifactMetadata(uuid, patch))) &&
      (!rolesChanged || (await artifactsStore.updateArtifactRoles(uuid, added, removed))) &&
      (!linksChanged() || (await artifactsStore.updateArtifactLinks(uuid, state.linked_list)))
    // The store caches artifacts, and role changes don't return the updated one
    delete artifactsStore.artifactDetails[uuid]
    const fresh = await artifactsStore.fetchArtifactById(uuid)
    if (saved) {
      resetForm(fresh)
      initSelectionFromLinks()
    } else {
      state.originalArtifact = fresh
    }
  } catch (err) {
    Notify.create({ type: 'negative', message: `Could not reload the artifact: ${err.message}` })
  } finally {
    state.saving = false
  }
}

const discardChanges = () => {
  // Version changes are saved as they happen, so keep the current list
  const versions = state.artifact.versions
  resetForm(state.originalArtifact)
  state.artifact.versions = versions
  initSelectionFromLinks()
}

let artifactDeleted = false

onBeforeRouteLeave(() => {
  if (artifactDeleted || !hasChanges.value) return true
  return new Promise((resolve) => {
    Dialog.create({
      title: 'Discard unsaved changes?',
      message: 'You have changes on this page that have not been saved.',
      persistent: true,
      ok: { label: 'Discard', color: 'negative' },
      cancel: { label: 'Keep editing' },
    })
      .onOk(() => resolve(true))
      .onCancel(() => resolve(false))
  })
})

const warnBeforeUnload = (event) => {
  if (hasChanges.value) event.preventDefault()
}
onMounted(() => window.addEventListener('beforeunload', warnBeforeUnload))
onBeforeUnmount(() => window.removeEventListener('beforeunload', warnBeforeUnload))

const confirmDelete = () => {
  Dialog.create({
    title: 'Confirm Deletion',
    message: `Are you sure you want to delete artifact "${state.artifact.title}"? This action cannot be undone.`,
    persistent: true,
    ok: { label: 'Delete', color: 'negative' },
    cancel: { label: 'Cancel' },
  }).onOk(async () => {
    if (await artifactsStore.deleteArtifact(state.artifact.uuid)) {
      Notify.create({ type: 'positive', message: 'Artifact deleted' })
      artifactDeleted = true
      router.push('/artifacts')
    }
  })
}

const reimportArtifact = () => {
  if (hasChanges.value) {
    Notify.create({ type: 'warning', message: 'Save or discard your changes before importing.' })
    return
  }
  Dialog.create({
    title: 'Sync from GitHub?',
    message: `This updates the title, descriptions, tags, authors, videos and publications from trovi.json in ${state.artifact.computed.github_repo}, and adds a version from its latest commit. Edits made here may be overwritten.`,
    persistent: true,
    ok: { label: 'Sync', color: 'primary' },
    cancel: { label: 'Cancel' },
  }).onOk(async () => {
    const resArtifact = await artifactsStore.importArtifact(
      state.artifact.computed.github_url,
      state.artifact.uuid,
    )
    if (resArtifact) {
      router.push({ path: `/artifacts/${state.artifact.uuid}` })
    }
  })
}
</script>

<template>
  <Loading :loading="state.loading || state.saving">
    <MainSection>
      <q-card v-if="state.artifact" class="q-mb-md">
        <q-card-section>
          <h2 class="text-h5 q-mb-md">
            Editing
            <RouterLink :to="'/artifacts/' + state.artifact.uuid">
              "{{ state.artifact.title }}"
            </RouterLink>
          </h2>

          <div class="row q-col-gutter-md">
            <div class="col-12 col-md-3">
              <nav class="edit-nav">
                <q-list dense>
                  <q-item
                    v-for="section in SECTIONS"
                    :key="section.id"
                    clickable
                    @click="scrollToSection(section.id)"
                  >
                    <q-item-section>{{ section.label }}</q-item-section>
                    <q-item-section v-if="changedSections.has(section.id)" side>
                      <q-icon name="circle" size="10px" color="primary">
                        <q-tooltip>Unsaved changes</q-tooltip>
                      </q-icon>
                    </q-item-section>
                  </q-item>
                </q-list>
                <div class="column q-gutter-sm q-mt-md">
                  <q-btn
                    label="Save changes"
                    color="positive"
                    :disable="!hasChanges || state.loadingLinkOptions"
                    :loading="state.saving"
                    @click="saveChanges"
                  />
                  <q-btn flat label="Discard" :disable="!hasChanges" @click="discardChanges" />
                </div>
              </nav>
            </div>

            <div class="col-12 col-md-9">
              <!-- Details -->
              <q-card id="details" class="q-pa-md q-mb-md">
                <h3 class="text-h6 q-mt-none q-mb-xs">Details</h3>
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
                  hint="Markdown supported"
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
              </q-card>

              <!-- Authors -->
              <q-card id="authors" class="q-pa-md q-mb-md">
                <h3 class="text-h6 q-mt-none q-mb-xs">Authors</h3>
                <p class="text-caption">Listed on the artifact page and used in its citation.</p>
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
                    flat
                    icon="add"
                    @click="
                      state.artifact.authors.push({ full_name: '', affiliation: '', email: '' })
                    "
                  />
                </div>
              </q-card>

              <!-- Versions -->
              <q-card id="versions" class="q-pa-md q-mb-md">
                <div class="row items-center justify-between q-mb-xs">
                  <h3 class="text-h6 q-my-none">Versions</h3>
                  <q-btn-dropdown color="primary" icon="add" label="New Version">
                    <q-list>
                      <q-item clickable v-close-popup @click="gitDialog = true">
                        <q-item-section>
                          <q-item-label>From a Git repository</q-item-label>
                          <q-item-label caption>A branch, tag, or commit</q-item-label>
                        </q-item-section>
                      </q-item>
                      <q-item clickable v-close-popup @click="imageDialog = true">
                        <q-item-section>
                          <q-item-label>Disk image</q-item-label>
                          <q-item-label caption>An image on a Chameleon site</q-item-label>
                        </q-item-section>
                      </q-item>
                      <q-item clickable v-close-popup @click="heatTemplateDialog = true">
                        <q-item-section>
                          <q-item-label>Heat template</q-item-label>
                          <q-item-label caption>An orchestration template</q-item-label>
                        </q-item-section>
                      </q-item>
                      <template
                        v-if="
                          state.artifact.computed?.github_url &&
                          state.originalArtifact.computed.isOwnedByUser()
                        "
                      >
                        <q-separator />
                        <q-item clickable v-close-popup @click="reimportArtifact">
                          <q-item-section>
                            <q-item-label>Sync from GitHub</q-item-label>
                            <q-item-label caption>
                              Update details from trovi.json and add the latest commit
                            </q-item-label>
                          </q-item-section>
                        </q-item>
                      </template>
                    </q-list>
                  </q-btn-dropdown>
                </div>
                <p class="text-caption">
                  Creating or deleting a version and requesting a DOI take effect immediately.
                </p>
                <q-list v-if="state.artifact.versions.length" bordered separator>
                  <q-item v-for="(version, index) in state.artifact.versions" :key="version.slug">
                    <q-item-section>
                      <q-item-label>
                        {{ version.slug }}
                        <q-badge
                          outline
                          color="secondary"
                          class="q-ml-sm"
                          :label="versionType(version)"
                        />
                      </q-item-label>
                      <q-item-label caption>{{ version.created_at }}</q-item-label>
                    </q-item-section>
                    <q-item-section side>
                      <div class="row items-center q-gutter-sm">
                        <q-btn
                          v-if="version.computed?.doi"
                          flat
                          no-caps
                          color="primary"
                          :label="version.computed.doi"
                          :href="version.computed.doi_url"
                          target="_blank"
                        />
                        <span v-else-if="requestedDois.has(version.slug)">DOI requested</span>
                        <q-btn
                          v-else-if="canRequestDoi(version)"
                          flat
                          color="primary"
                          label="Request DOI"
                          @click="requestDoi(version)"
                        />
                        <q-btn
                          v-if="!version.computed?.doi && !requestedDois.has(version.slug)"
                          flat
                          round
                          color="negative"
                          icon="delete"
                          @click="deleteVersion(index)"
                        >
                          <q-tooltip>Delete version</q-tooltip>
                        </q-btn>
                      </div>
                    </q-item-section>
                  </q-item>
                </q-list>
                <div v-else class="text-grey-6">No versions yet.</div>
              </q-card>

              <!-- Sharing -->
              <q-card id="sharing" class="q-pa-md q-mb-md">
                <h3 class="text-h6 q-mt-none q-mb-xs">Sharing</h3>
                <p class="text-caption">Who can see this artifact, edit it, and comment on it.</p>
                <h4 class="text-subtitle2 q-mt-md q-mb-xs">Visibility</h4>
                <q-option-group
                  v-model="state.artifact.visibility"
                  :options="VISIBILITY_OPTIONS"
                  type="radio"
                >
                  <template #label="option">
                    <div>{{ option.label }}</div>
                    <div class="text-caption">{{ option.description }}</div>
                  </template>
                </q-option-group>
                <p v-if="state.originalArtifact.computed.hasDoi" class="text-caption q-mt-sm">
                  This artifact has a DOI, so it is listed publicly and its DOI versions are visible
                  to everyone, whatever its visibility.
                </p>
                <q-input
                  v-if="state.artifact.visibility === 'private'"
                  :model-value="secretLink"
                  label="Shareable Secret Link"
                  hint="Anyone with this link can view and launch the artifact."
                  readonly
                  dense
                  class="q-mt-md"
                >
                  <template #append>
                    <q-btn flat round dense icon="content_copy" @click="copySecretLink">
                      <q-tooltip>Copy link</q-tooltip>
                    </q-btn>
                  </template>
                </q-input>

                <h4 class="text-subtitle2 q-mt-lg q-mb-xs">Comments</h4>
                <q-checkbox
                  v-model="state.artifact.comments_enabled"
                  label="Allow comments"
                  dense
                  class="q-mb-sm"
                />

                <template v-if="state.originalArtifact.computed.canEditRoles()">
                  <h4 class="text-subtitle2 q-mt-lg q-mb-xs">Roles</h4>
                  <p class="text-caption">
                    Collaborators can edit this artifact, add and delete versions, and share it.
                    Administrators can also manage roles.
                  </p>
                  <div
                    v-for="(role, index) in state.artifact.roles"
                    :key="index"
                    class="q-mb-sm row items-center q-gutter-sm"
                  >
                    <q-input
                      v-model="role.username"
                      type="email"
                      :label="isOwnerRole(role) ? 'Owner' : 'User Email'"
                      :readonly="isOwnerRole(role)"
                      dense
                      class="col"
                    />
                    <q-select
                      v-model="role.role"
                      :options="ROLES"
                      label="Role"
                      :readonly="isOwnerRole(role)"
                      dense
                      class="col-3"
                    />
                    <q-btn
                      color="negative"
                      flat
                      icon="delete"
                      :disable="isOwnerRole(role)"
                      @click="state.artifact.roles.splice(index, 1)"
                      round
                      dense
                    />
                  </div>
                  <div class="row q-gutter-sm q-mt-md">
                    <q-btn
                      label="Add Role"
                      color="primary"
                      flat
                      icon="add"
                      @click="state.artifact.roles.push({ username: '', role: ROLES[0] })"
                    />
                  </div>
                </template>

                <h4 class="text-subtitle2 q-mt-lg q-mb-xs">Daypass</h4>
                <p class="text-caption">
                  Lets people without a Chameleon allocation request temporary access to reproduce
                  this artifact. Daypass is set up on the Chameleon portal.
                </p>
                <div class="row items-center q-gutter-md">
                  <span v-if="state.originalArtifact.reproducibility.enable_requests">
                    Requests are on, with
                    {{ state.originalArtifact.reproducibility.access_hours }} hours of access.
                  </span>
                  <span v-else>Requests are off.</span>
                  <q-btn
                    label="Configure Daypass"
                    color="primary"
                    outline
                    icon-right="open_in_new"
                    :href="state.artifact.computed?.get_chameleon_daypass_url()"
                    target="_blank"
                  />
                </div>
              </q-card>

              <!-- Videos & Publications -->
              <q-card id="media" class="q-pa-md q-mb-md">
                <h3 class="text-h6 q-mt-none q-mb-xs">Videos & Publications</h3>
                <p class="text-caption">
                  Shown after the description on the artifact page, in this order.
                </p>
                <h4 class="text-subtitle2 q-mt-md q-mb-sm">Videos</h4>
                <div
                  v-for="(video, index) in state.artifact.videos"
                  :key="index"
                  class="q-mb-sm row items-center q-gutter-sm"
                >
                  <q-input v-model="video.url" label="Video URL" dense class="col" />
                  <q-btn
                    color="negative"
                    flat
                    icon="delete"
                    @click="state.artifact.videos.splice(index, 1)"
                    round
                    dense
                  />
                </div>
                <div class="row q-gutter-sm q-mt-md">
                  <q-btn
                    label="Add Video"
                    color="primary"
                    flat
                    icon="add"
                    @click="state.artifact.videos.push({ url: '' })"
                  />
                </div>

                <h4 class="text-subtitle2 q-mt-lg q-mb-sm">Publications</h4>
                <div v-for="(publication, index) in state.artifact.publications" :key="index">
                  <div class="q-mb-sm row items-start q-gutter-sm">
                    <div class="col column q-gutter-sm">
                      <q-input v-model="publication.title" label="Title" dense />
                      <div class="row q-gutter-sm">
                        <q-input v-model="publication.authors" label="Authors" dense class="col" />
                        <q-input v-model="publication.venue" label="Venue" dense class="col" />
                        <q-input
                          v-model="publication.year"
                          type="number"
                          label="Year"
                          dense
                          class="col-2"
                        />
                      </div>
                      <div class="row q-gutter-sm">
                        <q-input
                          v-model="publication.doi"
                          label="DOI"
                          hint="e.g. 10.1145/3555776.3577766"
                          dense
                          class="col"
                        />
                        <q-input v-model="publication.url" label="URL" dense class="col" />
                      </div>
                    </div>
                    <q-btn
                      color="negative"
                      flat
                      icon="delete"
                      @click="state.artifact.publications.splice(index, 1)"
                      round
                      dense
                    />
                  </div>
                  <q-separator class="q-mb-md" />
                </div>
                <q-expansion-item
                  icon="content_paste"
                  label="Add from BibTeX"
                  caption="Paste one or more entries"
                  class="q-mt-sm bg-grey-2 rounded-borders"
                >
                  <div class="q-pa-md">
                    <q-input
                      v-model="bibtexInput"
                      type="textarea"
                      autogrow
                      dense
                      class="code"
                      input-class="code"
                      placeholder="@inproceedings{key,
  title = {...},
  author = {Last, First and Other, Author},
  booktitle = {...},
  year = {2026},
  doi = {10.1145/...}
}"
                    />
                    <q-btn
                      label="Add from BibTeX"
                      color="primary"
                      class="q-mt-sm"
                      :disable="!bibtexInput.trim()"
                      @click="addPublicationsFromBibtex"
                    />
                  </div>
                </q-expansion-item>

                <div class="row q-gutter-sm q-mt-md">
                  <q-btn
                    label="Add Publication"
                    color="primary"
                    flat
                    icon="add"
                    @click="
                      state.artifact.publications.push({
                        title: '',
                        authors: '',
                        venue: '',
                        year: null,
                        doi: '',
                        url: '',
                      })
                    "
                  />
                </div>
              </q-card>

              <!-- Related Artifacts -->
              <q-card id="related" class="q-pa-md q-mb-md">
                <div class="row items-center justify-between q-mb-xs">
                  <h3 class="text-h6 q-my-none">Related Artifacts</h3>
                  <q-btn
                    label="Add Related Artifacts"
                    color="primary"
                    flat
                    icon="add"
                    @click="relatedDialog = true"
                  />
                </div>
                <div v-if="!state.linked_list.length" class="text-grey-6">
                  No related artifacts yet.
                </div>
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
              </q-card>

              <!-- Danger Zone -->
              <q-card
                id="danger"
                flat
                class="q-pa-md q-mb-md"
                style="border: 1px solid var(--q-negative)"
              >
                <h3 class="text-h6 text-negative q-mt-none q-mb-sm">Danger Zone</h3>
                <div class="row items-center justify-between q-gutter-sm">
                  <span>Delete this artifact and all of its versions. This cannot be undone.</span>
                  <q-btn
                    label="Delete Artifact"
                    color="negative"
                    outline
                    icon="delete"
                    @click="confirmDelete"
                  />
                </div>
              </q-card>
            </div>
          </div>
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

      <q-dialog v-model="imageDialog" persistent>
        <q-card style="min-width: 400px; max-width: 600px">
          <q-card-section>
            <h3 class="text-h6 q-mb-md">Create Version from Disk Image</h3>
            <p>Choose the site where the image is stored and enter its UUID.</p>
            <q-select
              v-model="imageForm.selectedSite"
              :options="imageForm.siteOptions"
              label="Site"
              dense
              class="q-mb-md"
            />
            <q-input v-model="imageForm.imageUuid" label="Image UUID" dense />
          </q-card-section>
          <q-card-actions align="right">
            <q-btn flat label="Cancel" color="secondary" v-close-popup />
            <q-btn
              label="Create Version"
              color="primary"
              :loading="imageForm.submitting"
              @click="submitImageVersion"
            />
          </q-card-actions>
        </q-card>
      </q-dialog>

      <q-dialog v-model="heatTemplateDialog" persistent>
        <q-card style="width: 700px; max-width: 90vw">
          <q-card-section>
            <h3 class="text-h6 q-mb-md">Create Version from Heat Template</h3>
            <p>
              Paste the template. It is shown on the artifact page so others can copy it into a
              stack on Chameleon.
            </p>
            <q-input
              v-model="infrastructureTemplateContent"
              type="textarea"
              label="Heat Template"
              input-class="code"
              dense
            />
          </q-card-section>
          <q-card-actions align="right">
            <q-btn flat label="Cancel" color="secondary" v-close-popup />
            <q-btn
              label="Create Version"
              color="primary"
              :loading="infrastructureTemplateSubmitting"
              @click="submitInfrastructureTemplate"
            />
          </q-card-actions>
        </q-card>
      </q-dialog>

      <q-dialog v-model="relatedDialog" no-route-dismiss>
        <q-card style="width: 900px; max-width: 90vw">
          <q-card-section>
            <h3 class="text-h6 q-mb-md">Add Related Artifacts</h3>
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
                v-model:filterVideo="state.filterVideo"
                v-model:filterVerified="state.filterVerified"
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
          </q-card-section>
          <q-card-actions align="right">
            <q-btn label="Done" color="primary" v-close-popup />
          </q-card-actions>
        </q-card>
      </q-dialog>
    </MainSection>
  </Loading>
</template>

<style scoped>
@media (min-width: 1024px) {
  .edit-nav {
    position: sticky;
    top: 16px;
  }
}
</style>
