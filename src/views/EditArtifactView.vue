<script setup>
import { reactive, onMounted } from 'vue'
import { useArtifactsStore } from '@/stores/artifact'
import { useAuthStore } from '@/stores/auth'
import { useRoute } from 'vue-router'
import router from '@/router'
import { parseUrn, usernameToUrn } from '@/util'

const route = useRoute()
const artifactUUID = route.params.uuid

const artifactsStore = useArtifactsStore()

const state = reactive({
  artifact: {},
  roles: [],
  originalRoles: [],
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
  state.originalRoles = state.roles.map((r) => ({ ...r }))
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
  <section class="bg-green-50">
    <div class="p-4">
      <RouterLink :to="'/artifacts/' + state.artifact.uuid">
        <h2 class="text-2xl font-bold mb-4">Editing "{{ state.artifact.title }}"</h2>
      </RouterLink>

      <div class="mb-6">
        <label class="flex items-center space-x-2">
          Visibility:
          <select
            v-model="state.artifact.visibility"
            class="border p-2 rounded"
            @change="updateVisibility"
          >
            <template v-for="visOption in VISIBILITY_OPTIONS" :key="visOption">
              <option :value="visOption">{{ visOption }}</option>
            </template>
          </select>
        </label>
      </div>

      <div class="mb-4">
        <h3 class="text-xl font-semibold mb-2">Roles</h3>

        <div
          v-for="(role, index) in state.roles"
          :key="index"
          class="mb-4 border p-4 rounded-lg shadow-md"
        >
          <div class="flex space-x-4">
            <input
              v-model="role.username"
              type="email"
              placeholder="User Email"
              class="border p-2 rounded w-full"
            />
            <select v-model="role.role" class="border p-2 rounded">
              <template v-for="roleOption in ROLES" :key="roleOption">
                <option :value="roleOption">{{ roleOption }}</option>
              </template>
            </select>
            <button @click="removeRole(index)" class="text-red-600">Remove</button>
          </div>
        </div>

        <div class="m-4">
          <button @click="addRole" class="bg-blue-500 text-white px-4 py-2 rounded">
            Add Role
          </button>
          <button @click="submitRoles" class="bg-green-500 text-white px-4 py-2 rounded">
            Save Changes
          </button>
        </div>
      </div>

      <div v-if="state.artifact.computed?.github_url">
        <h3 class="text-xl font-semibold mb-2">Import new version</h3>
        <p>
          Create a new version of this artifact from GitHub repo
          <a
            :href="state.artifact.computed.github_url"
            target="_blank"
            class="bg-blue-500 text-white px-4 py-2 rounded"
          >
            {{ state.artifact.computed.github_repo }}
          </a>
        </p>
        <button @click="reimportArtifact" class="bg-blue-500 text-white px-4 py-2 rounded">
          Import
        </button>
      </div>
    </div>
  </section>
</template>
