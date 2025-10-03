<script setup>
import { reactive, onMounted, ref, watch } from 'vue'
import { useArtifactsStore } from '@/stores/artifact'
import { useAuthStore } from '@/stores/auth'
import { useRoute } from 'vue-router'
import router from '@/router'
import { parseUrn, usernameToUrn, gitToUrn } from '@/util'
import MainSection from '@/components/MainSection.vue'
import Loading from '@/components/Loading.vue'
import { Dialog, Notify, QSpinner } from 'quasar'
import axios from 'axios'

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
  availableTags: [],
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
      .filter(([value, label]) => label.toLowerCase().indexOf(needle) > -1)
      .map(([value, label]) => ({ value, label }))
  })
}

const submitGitVersion = async () => {
  if (!gitForm.gitUrl || !gitForm.selectedOption) {
    Notify.create({ type: 'negative', message: 'Please fill in both fields' })
    return
  }
  gitForm.submitting = true
  let contents_urn = gitToUrn(gitForm.gitUrl, gitForm.selectedOption)
  artifactsStore.createVersion(artifactUUID, { contents: { urn: contents_urn } })
  gitForm.submitting = false
  gitDialog.value = false
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

const confirmDelete = () => {
  Dialog.create({
    title: 'Confirm Deletion',
    message: `Are you sure you want to delete artifact "${state.artifact.title}"? This action cannot be undone.`,
    cancel: true,
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
              />
              <q-btn label="Save Metadata" color="positive" @click="submitMetadata" />
            </div>
          </q-card>

          <!-- Roles -->
          <q-card class="q-pa-md q-mb-md">
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
                  @click="state.artifact.versions.splice(index, 1)"
                  label="Delete"
                />
              </div>
            </div>

            <div class="row q-gutter-sm q-mt-md">
              <q-btn label="Save Versions" color="positive" @click="submitVersions" />
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
