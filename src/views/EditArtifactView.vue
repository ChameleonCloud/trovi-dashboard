<script setup>
import { reactive, onMounted } from 'vue'
import { useArtifactsStore } from '@/stores/artifact'
import { useAuthStore } from '@/stores/auth'
import { useRoute } from 'vue-router'
import router from '@/router'
import { parseUrn, usernameToUrn } from '@/util'
import MainSection from '@/components/MainSection.vue'
import Card from '@/components/Card.vue'
import Loading from '@/components/Loading.vue'

const route = useRoute()
const artifactUUID = route.params.uuid

const artifactsStore = useArtifactsStore()

const state = reactive({
  artifact: {},
  roles: [],
  versions: [],
  originalRoles: [],
  loading: true,
})

const VISIBILITY_OPTIONS = ['public', 'private']

const authStore = useAuthStore()
authStore.initKeycloak()

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

const ROLES = ['collaborator', 'administrator']
const addRole = () => {
  state.roles.push({ username: '', role: ROLES[0] })
}

const removeRole = (index) => {
  state.roles.splice(index, 1)[0]
}

// Sync Roles
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
    addedRoles.map((r) => {
      return { role: r.role, user: r.user }
    }),
    removedRoles.map((r) => {
      return { role: r.role, user: r.user }
    }),
  )
  state.originalRoles = state.roles.map((r) => ({ ...r }))
}

const removeVersion = (index) => {
  state.versions.splice(index, 1)[0]
}

const submitVersions = async () => {
  const removedRoles = state.artifact.versions.filter(
    (version) => !state.versions.some((v) => v.slug === version.slug),
  )
  // TODO call API here
}

const reimportArtifact = async () => {
  let resArtifact = await artifactsStore.importArtifact(
    state.artifact.computed.github_url,
    state.artifact.uuid,
  )
  if (resArtifact) {
    state.artifact = resArtifact
  }
  router.push({ path: `/artifacts/${state.artifact.uuid}` })
}
</script>

<template>
  <Loading :loading="state.loading">
    <MainSection>
      <Card>
        <RouterLink :to="'/artifacts/' + state.artifact.uuid">
          <h2 class="text-2xl font-bold mb-4 text-gray-900 dark:text-gray-100">
            Editing "{{ state.artifact.title }}"
          </h2>
        </RouterLink>

        <div class="mb-6">
          <label class="flex items-center space-x-2 text-gray-800 dark:text-gray-200">
            Visibility:
            <select
              v-model="state.artifact.visibility"
              class="border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 p-2 rounded"
              @change="updateVisibility"
            >
              <template v-for="visOption in VISIBILITY_OPTIONS" :key="visOption">
                <option :value="visOption">{{ visOption }}</option>
              </template>
            </select>
          </label>
        </div>

        <div
          class="mb-4 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4 rounded-lg shadow-md"
        >
          <h3 class="text-xl font-semibold mb-2 text-gray-900 dark:text-gray-100">Roles</h3>

          <div v-for="(role, index) in state.roles" :key="index" class="mb-4">
            <div class="flex space-x-4">
              <input
                v-model="role.username"
                type="email"
                placeholder="User Email"
                class="border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 p-2 rounded w-full"
              />
              <select
                v-model="role.role"
                class="border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 p-2 rounded"
              >
                <template v-for="roleOption in ROLES" :key="roleOption">
                  <option :value="roleOption">{{ roleOption }}</option>
                </template>
              </select>
              <button @click="removeRole(index)" class="text-red-600 dark:text-red-400">
                Remove
              </button>
            </div>
          </div>

          <div class="m-4 space-x-2">
            <button
              @click="addRole"
              class="bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 text-white px-4 py-2 rounded"
            >
              Add Role
            </button>
            <button
              @click="submitRoles"
              class="bg-green-500 hover:bg-green-600 dark:bg-green-600 dark:hover:bg-green-700 text-white px-4 py-2 rounded"
            >
              Save Changes
            </button>
          </div>
        </div>

        <div
          class="mb-4 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4 rounded-lg shadow-md"
        >
          <h3 class="text-xl font-semibold mb-2 text-gray-900 dark:text-gray-100">Versions</h3>

          <div v-if="state.artifact.computed?.github_url" class="mt-4 mb-4 flex justify-between">
            <p class="text-gray-800 dark:text-gray-200">
              Create a new version of this artifact from GitHub repo
              <a :href="state.artifact.computed.github_url" target="_blank" class="underline">
                {{ state.artifact.computed.github_repo }}
              </a>
            </p>
            <button
              @click="reimportArtifact"
              class="bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 text-white px-4 py-2 rounded"
            >
              Import
            </button>
          </div>

          <div v-for="(version, index) in state.versions" :key="index" class="mb-4">
            <div class="flex justify-between">
              <div>{{ version.slug }}</div>
              <div>{{ version.created_at }}</div>
              <div>
                <button @click="removeVersion(index)" class="text-red-600 dark:text-red-400">
                  Remove
                </button>
              </div>
            </div>
          </div>
          <div class="m-4 space-x-2">
            <button
              @click="submitVersions"
              class="bg-green-500 hover:bg-green-600 dark:bg-green-600 dark:hover:bg-green-700 text-white px-4 py-2 rounded"
            >
              Save Changes
            </button>
          </div>
        </div>
      </Card>
    </MainSection>
  </Loading>
</template>
