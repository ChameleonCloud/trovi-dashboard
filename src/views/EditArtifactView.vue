<script setup>
import { reactive, onMounted } from 'vue'
import { useArtifactsStore } from '@/stores/artifact'
import { useAuthStore } from '@/stores/auth'
import { useRoute } from 'vue-router'
import router from '@/router'
import { parseUrn, usernameToUrn } from '@/util'
import MainSection from '@/components/MainSection.vue'
import Loading from '@/components/Loading.vue'

const route = useRoute()
const artifactUUID = route.params.uuid
const artifactsStore = useArtifactsStore()
const authStore = useAuthStore()
authStore.initKeycloak()

const state = reactive({
  artifact: {},
  roles: [],
  versions: [],
  originalRoles: [],
  loading: true,
})

const VISIBILITY_OPTIONS = ['public', 'private']
const ROLES = ['collaborator', 'administrator']

onMounted(async () => {
  state.artifact = await artifactsStore.fetchArtifactById(artifactUUID)
  state.roles = state.artifact.roles.map((role) => ({
    username: parseUrn(role.user).username,
    user: role.user,
    role: role.role,
  }))
  state.versions = state.artifact.versions.map((version) => ({
    slug: version.slug,
    created_at: version.created_at,
  }))
  state.originalRoles = state.roles.map((r) => ({ ...r }))
  state.loading = false
})

const updateVisibility = async () => {
  await artifactsStore.updateArtifactVisibility(state.artifact.uuid, state.artifact.visibility)
}

const addRole = () => state.roles.push({ username: '', role: ROLES[0] })
const removeRole = (index) => state.roles.splice(index, 1)[0]

const submitRoles = async () => {
  state.roles.forEach((role) => {
    role.user = usernameToUrn(role.username)
  })

  const addedRoles = state.roles.filter(
    (newRole) =>
      !state.originalRoles.some(
        (oldRole) => oldRole.username === newRole.username && oldRole.role === newRole.role,
      ),
  )

  const removedRoles = state.originalRoles.filter(
    (oldRole) =>
      !state.roles.some(
        (newRole) => newRole.username === oldRole.username && newRole.role === oldRole.role,
      ),
  )

  await artifactsStore.updateArtifactRoles(
    state.artifact.uuid,
    addedRoles.map((r) => ({ role: r.role, user: r.user })),
    removedRoles.map((r) => ({ role: r.role, user: r.user })),
  )

  state.originalRoles = state.roles.map((r) => ({ ...r }))
}

const removeVersion = (index) => state.versions.splice(index, 1)[0]
const submitVersions = async () => {
  /* TODO API call */
}

const reimportArtifact = async () => {
  const resArtifact = await artifactsStore.importArtifact(
    state.artifact.computed.github_url,
    state.artifact.uuid,
  )
  if (resArtifact) state.artifact = resArtifact
  router.push({ path: `/artifacts/${state.artifact.uuid}` })
}
</script>

<template>
  <Loading :loading="state.loading">
    <MainSection>
      <q-card class="q-mb-md">
        <q-card-section>
          <RouterLink :to="'/artifacts/' + state.artifact.uuid">
            <h2 class="text-h5 q-mb-md">Editing "{{ state.artifact.title }}"</h2>
          </RouterLink>

          <q-card class="q-pa-md q-mb-md">
            <div>
              <q-select
                v-model="state.artifact.visibility"
                :options="VISIBILITY_OPTIONS"
                label="Visibility"
                @update:model-value="updateVisibility"
                dense
              />
            </div>
          </q-card>

          <q-card class="q-pa-md q-mb-md">
            <h3 class="text-h6 q-mb-sm">Roles</h3>
            <div
              v-for="(role, index) in state.roles"
              :key="index"
              class="q-mb-sm row items-center q-gutter-sm"
            >
              <q-input v-model="role.username" type="email" label="User Email" dense class="col" />
              <q-select v-model="role.role" :options="ROLES" dense class="col-3" />
              <q-btn color="negative" flat icon="delete" @click="removeRole(index)" round dense />
            </div>
            <div class="row q-gutter-sm q-mt-md">
              <q-btn label="Add Role" color="primary" @click="addRole" />
              <q-btn label="Save Changes" color="positive" @click="submitRoles" />
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
                <span>Create a new version from GitHub repo </span>
                <a :href="state.artifact.computed.github_url" target="_blank">{{
                  state.artifact.computed.github_repo
                }}</a>
              </div>
              <q-btn label="Import" color="primary" @click="reimportArtifact" />
            </div>

            <div
              v-for="(version, index) in state.versions"
              :key="index"
              class="row justify-between items-center q-mb-sm"
            >
              <div>{{ version.slug }}</div>
              <div>{{ version.created_at }}</div>
              <q-btn color="negative" icon="delete" @click="removeVersion(index)" label="Delete" />
            </div>

            <div class="q-mt-md">
              <q-btn label="Save Changes" color="positive" @click="submitVersions" />
            </div>
          </q-card>
        </q-card-section>
      </q-card>
    </MainSection>
  </Loading>
</template>
