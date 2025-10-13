import { defineStore } from 'pinia'
import axios from 'axios'
import { marked } from 'marked'
import { useAuthStore } from '@/stores/auth'
import { Notify } from 'quasar'
import { parseDoi } from '@/util'

function processArtifact(store, artifact) {
  /**
   * Generate computed properties for an artifact
   */
  artifact.computed = {}
  artifact.computed.latestVersion = artifact.versions.reduce(
    (latest, version) =>
      new Date(version.created_at) > new Date(latest.created_at) ? version : latest,
    artifact.versions[0],
  )
  artifact.computed.nonLatestVersions = artifact.versions.filter(
    (version) => version.created_at !== artifact.computed.latestVersion.created_at,
  )

  artifact.computed.summedMetrics = artifact.versions.reduce(
    (acc, version) => {
      acc.access_count += version.metrics.access_count
      acc.unique_access_count += version.metrics.unique_access_count
      acc.unique_cell_execution_count += version.metrics.unique_cell_execution_count
      return acc
    },
    {
      access_count: 0,
      unique_access_count: 0,
      unique_cell_execution_count: 0,
    },
  )
  artifact.computed.long_description_markup = marked(
    artifact.long_description ? artifact.long_description : '',
  )
  artifact.computed.get_chameleon_launch_url = function (version_slug, sharing_key) {
    let sharing_key_param = ''
    if (sharing_key) {
      sharing_key_param = `&${sharing_key}`
    }
    return `${import.meta.env.VITE_CHAMELEON_PORTAL_URL}/experiment/share/${artifact.uuid}/version/${version_slug}/launch?${sharing_key_param}`
  }
  artifact.computed.get_chameleon_download_url = function (version_slug, sharing_key) {
    let sharing_key_param = ''
    if (sharing_key) {
      sharing_key_param = `&${sharing_key}`
    }
    return `${import.meta.env.VITE_CHAMELEON_PORTAL_URL}/experiment/share/${artifact.uuid}/version/${version_slug}/download?${sharing_key_param}`
  }
  artifact.computed.get_chameleon_daypass_url = function () {
    return `${import.meta.env.VITE_CHAMELEON_PORTAL_URL}/experiment/share/${artifact.uuid}/share`
  }
  artifact.computed.get_chameleon_request_daypass_url = function () {
    return `${import.meta.env.VITE_CHAMELEON_PORTAL_URL}/experiment/share/${artifact.uuid}/request`
  }

  let v = artifact.versions.find((version) => {
    return version.contents.urn.includes('github.com')
  })
  artifact.computed.github_url = undefined
  const regex = /github\.com[:/]([^/]+\/[^/]+?)(?:\.git)?(?:@(.+))?$/i
  const match = v?.contents.urn.match(regex)

  if (match) {
    const repo = match[1].replace(/\.git$/, '')
    artifact.computed.github_url = `https://github.com/${repo}`
    artifact.computed.github_repo = repo
    artifact.computed.git_ref = match[2] || null // will be the hash/tag/branch if present
  }

  if (store.processed_badges.artifact_badges[artifact.uuid]) {
    artifact.badges = Array.from(store.processed_badges.artifact_badges[artifact.uuid]).map(
      (ab) => store.processed_badges.badges[ab],
    )
  } else {
    artifact.badges = []
  }

  artifact.computed.isOwnedByUser = function () {
    // user info may change between when this was loaded & used
    return artifact.owner_urn === store.authStore.userInfo?.userUrn
  }
  artifact.computed.canEdit = function () {
    let userUrn = store.authStore.userInfo?.userUrn
    return (
      artifact.computed.isOwnedByUser() ||
      artifact.roles.some(
        (role) =>
          role.user === userUrn && (role.role === 'collaborator' || role.role === 'administrator'),
      )
    )
  }
  artifact.computed.canEditRoles = function () {
    let userUrn = store.authStore.userInfo?.userUrn
    return (
      artifact.computed.isOwnedByUser() ||
      artifact.roles.some((role) => role.user === userUrn && role.role === 'administrator')
    )
  }

  artifact.computed.hasDoi = false
  artifact.versions.forEach((v) => {
    v.computed = {}
    if (v.contents.urn.includes('zenodo')) {
      v.computed.doi = parseDoi(v.contents.urn)
      v.computed.doi_url = `https://doi.org/${v.computed.doi}`
      artifact.computed.hasDoi = true
    }
    if (v.contents.urn.includes('git')) {
      v.computed.is_git = true
    }
  })

  return artifact
}

function errObjToMessage(errObj) {
  let messages = []
  if (Array.isArray(errObj)) {
    errObj.forEach((error) => {
      messages.push(error)
    })
  } else if (errObj.detail) {
    messages.push(errObj.detail)
  } else {
    for (const [field, errors] of Object.entries(errObj)) {
      if (Array.isArray(errors)) {
        errors.forEach((error) => {
          if (typeof error === 'string') {
            messages.push(`${field.replace(/_/g, ' ')}: ${error}`)
          } else if (typeof error === 'object') {
            for (const [nestedField, nestedErrors] of Object.entries(error)) {
              if (typeof nestedErrors === 'string') {
                messages.push(`${field} (${nestedField}): ${nestedErrors}`)
                continue
              } else {
                nestedErrors.forEach((nestedError) => {
                  messages.push(`${field} (${nestedField}): ${nestedError}`)
                })
              }
            }
          }
        })
      }
    }
  }
  return messages.join('\n')
}

export const useArtifactsStore = defineStore('artifacts', {
  state: () => ({
    artifacts: [],
    artifactDetails: {},
    loading: false,
    badges_loaded: false,
    processed_badges: {
      badges: {},
      artifact_badges: {},
    },
    tags: [],
    authStore: useAuthStore(),
  }),
  actions: {
    async fetchBadges() {
      if (this.badges_loaded) {
        return
      }
      try {
        const badge_data = await axios.get(
          `${import.meta.env.VITE_CHAMELEON_PORTAL_URL}/experiment/share/api/badges`,
        )
        badge_data.data.badges.forEach((badge) => {
          this.processed_badges.badges[badge.name] = badge
        })
        badge_data.data.artifact_badges.forEach((artifact_badge) => {
          if (!this.processed_badges.artifact_badges[artifact_badge.artifact_uuid]) {
            this.processed_badges.artifact_badges[artifact_badge.artifact_uuid] = new Set()
          }
          this.processed_badges.artifact_badges[artifact_badge.artifact_uuid].add(
            artifact_badge.badge,
          )
        })
        this.badges_loaded = true
      } catch (error) {
        console.error('Failed to load badges:', error)
      }
    },
    async fetchAllArtifacts() {
      if (this.artifacts.length > 0) {
        return
      }

      await this.fetchBadges()
      this.loading = true
      let after = null

      var token = undefined
      if (this.authStore.isAuthenticated) {
        token = await this.authStore.getTroviToken()
      }
      let tokenParam = token ? `?access_token=${token}` : ''

      do {
        try {
          const response = await axios.get(`/artifacts/${tokenParam}`, {
            params: { after, limit: 21 },
          })

          // Append the new artifacts to the store
          // After includes first artifact, so ignore it if set
          let newArtifacts = response.data.artifacts.slice(after ? 1 : 0)
          this.artifacts.push(...newArtifacts)
          newArtifacts.forEach((artifact) => {
            this.artifactDetails[artifact.uuid] = processArtifact(this, artifact)
          })

          // Update the `after` parameter for the next call
          after =
            response.data.next.after && newArtifacts.length > 0
              ? newArtifacts[newArtifacts.length - 1].uuid
              : null
        } catch (error) {
          console.error('Failed to load artifacts:', error)
          break
        }
      } while (after !== null)
      this.loading = false
    },
    async fetchArtifactById(uuid, sharing_key) {
      await this.fetchBadges()
      // Check if the artifact is already in the cache
      var token = undefined
      if (this.authStore.isAuthenticated) {
        token = await this.authStore.getTroviToken()
      }
      let tokenParam = token ? `access_token=${token}` : ''
      if (!this.artifactDetails[uuid]) {
        const response = await axios.get(
          `/artifacts/${uuid}/?${tokenParam}&sharing_key=${sharing_key}`,
        )
        if (response.status != 200) {
          Notify.create({
            type: 'negative',
            message: `Error fetching artifact: ${response.status}`,
          })
        } else {
          this.artifactDetails[uuid] = processArtifact(this, response.data)
        }
      }
      return this.artifactDetails[uuid]
    },
    async fetchTags() {
      if (this.tags.length > 0) {
        return
      }
      const response = await axios.get(`/meta/tags`)
      this.tags = response.data.tags.map((t) => t.tag)
    },
    async importArtifact(githubRepo, uuid = undefined) {
      if (!this.authStore.isAuthenticated) {
        await this.authStore.initKeycloak()
      }
      let token = await this.authStore.getTroviToken()
      if (token) {
        try {
          var res
          if (uuid) {
            res = await axios.put(`/import/${uuid}/?access_token=${token}`, {
              github_url: githubRepo,
            })
          } else {
            res = await axios.post(`/import/?access_token=${token}`, {
              github_url: githubRepo,
            })
          }
          if (res.status == 200) {
            Notify.create({ type: 'positive', message: 'Imported artifact' })
            this.artifactDetails[uuid] = processArtifact(this, res.data)
            return this.artifactDetails[uuid]
          } else {
            let message = errObjToMessage(res.data)
            Notify.create({
              type: 'negative',
              message: `Could not import artifact. Is trovi.json file invalid?\n${message}`,
            })
            return undefined
          }
        } catch (error) {
          console.error(error.response.data)
          Notify.create({
            type: 'negative',
            message: `Error ${error.message}\n${errObjToMessage(error.response.data)}`,
          })
        }
      } else {
        return undefined
      }
    },
    async createArtifact(artifact_obj) {
      if (!this.authStore.isAuthenticated) {
        await this.authStore.initKeycloak()
      }
      let token = await this.authStore.getTroviToken()
      if (token) {
        try {
          let res = await axios.post(`/artifacts/?access_token=${token}`, artifact_obj)
          if (res.status == 201) {
            Notify.create({ type: 'positive', message: 'Created artifact' })
            let artifact = processArtifact(this, res.data)
            this.artifacts.push(artifact)
            this.artifactDetails[artifact.uuid] = artifact
            return artifact
          } else {
            let message = errObjToMessage(res.data)
            Notify.create({
              type: 'negative',
              message: `Could not create artifact.\n${message}`,
            })
            return undefined
          }
        } catch (error) {
          console.error(error)
          Notify.create({
            type: 'negative',
            message: `Error ${error.message}\n${errObjToMessage(error.response.data)}`,
          })
        }
      } else {
        return undefined
      }
    },
    async updateArtifactRoles(uuid, rolesToAdd, rolesToRemove) {
      if (!this.authStore.isAuthenticated) {
        await this.authStore.initKeycloak()
      }
      let token = await this.authStore.getTroviToken()
      if (token) {
        try {
          rolesToAdd.forEach(async (role) => {
            const response = await axios.post(
              `/artifacts/${uuid}/roles/?access_token=${token}`,
              role,
            )
            if (response.status !== 204) {
              throw new Error(`Failed to add role ${role}`)
            }
          })
          rolesToRemove.forEach(async (role) => {
            let urlParamRole = `&user=${role.user}&role=${role.role}`
            const response = await axios.delete(
              `/artifacts/${uuid}/roles/?access_token=${token}${urlParamRole}`,
            )
            if (response.status !== 204) {
              throw new Error(`Failed to add role ${role}`)
            }
          })
        } catch (error) {
          console.error(error)
          if (error.response) {
            Notify.create({
              type: 'negative',
              message: `Error ${error.message}\n${error.response.data.detail}`,
            })
          } else {
            Notify.create({ type: 'negative', message: `Error ${error.message}` })
          }
        }
        Notify.create({ type: 'positive', message: 'Updated roles' })
      } else {
        Notify.create({
          type: 'negative',
          message: 'Could not update roles, try refreshing the page.',
        })
      }
    },
    async updateArtifactVersions(uuid, versionsToRemove) {
      if (!this.authStore.isAuthenticated) {
        await this.authStore.initKeycloak()
      }
      let token = await this.authStore.getTroviToken()
      if (token) {
        try {
          versionsToRemove.forEach(async (version_slug) => {
            const response = await axios.delete(
              `/artifacts/${uuid}/versions/${version_slug}/?access_token=${token}`,
            )
            if (response.status !== 204) {
              throw new Error(`Failed to remove version ${version_slug}`)
            }
          })
        } catch (error) {
          console.error(error)
          if (error.response) {
            Notify.create({
              type: 'negative',
              message: `Error ${error.message}\n${error.response.data.detail}`,
            })
          } else {
            Notify.create({ type: 'negative', message: `Error ${error.message}` })
          }
        }
        Notify.create({ type: 'positive', message: 'Updated versions' })
      } else {
        Notify.create({
          type: 'negative',
          message: 'Could not update versions, try refreshing the page.',
        })
      }
    },
    async migrateArtifactVersion(uuid, slug, backed = 'zenodo') {
      if (!this.authStore.isAuthenticated) {
        await this.authStore.initKeycloak()
      }
      const token = await this.authStore.getTroviToken()
      if (!token) {
        Notify.create({
          type: 'negative',
          message: 'Could not request DOI, try refreshing the page.',
        })
      }

      try {
        const response = await axios.post(
          `/artifacts/${uuid}/versions/${slug}/migration/?access_token=${token}`,
          { backend: backed },
        )

        if (response.status !== 201) {
          Notify.create({
            type: 'negative',
            message: `DOI request failed: ${response.status} ${response.statusText}`,
          })
          return null
        }
        Notify.create({
          type: 'positive',
          message: `DOI request accepted, please check back momentarily.`,
        })
        return response.data
      } catch (err) {
        Notify.create({
          type: 'negative',
          message: `DOI request failed: ${err.message}`,
        })
        throw err
      }
    },
    async createVersion(uuid, version_obj) {
      if (!this.authStore.isAuthenticated) {
        await this.authStore.initKeycloak()
      }
      const token = await this.authStore.getTroviToken()
      if (!token) {
        Notify.create({
          type: 'negative',
          message: 'Could not create version, try refreshing the page.',
        })
      }

      try {
        const response = await axios.post(
          `/artifacts/${uuid}/versions/?access_token=${token}`,
          version_obj,
        )

        if (response.status !== 201) {
          Notify.create({
            type: 'negative',
            message: `Version create failed: ${response.status} ${response.statusText}`,
          })
          return null
        }
        Notify.create({
          type: 'positive',
          message: `New version created.`,
        })
        return response.data
      } catch (err) {
        Notify.create({
          type: 'negative',
          message: `Version create failed: ${err.message}`,
        })
        throw err
      }
    },
    async updateArtifactMetadata(uuid, patch) {
      if (!this.authStore.isAuthenticated) {
        await this.authStore.initKeycloak()
      }
      const token = await this.authStore.getTroviToken()
      if (!token) return

      try {
        const response = await axios.put(
          `/artifacts/${uuid}/?access_token=${token}&partial=true`,
          { patch },
          { headers: { 'Content-Type': 'application/json' } },
        )

        if (response.status === 200) {
          Notify.create({
            type: 'positive',
            message: `Updated metadata successfully`,
          })
          this.artifactDetails[uuid] = processArtifact(this, response.data)
        } else {
          let message = errObjToMessage(response.data)
          Notify.create({
            type: 'negative',
            message: `Failed to update metadata:\n${message}`,
          })
        }
      } catch (error) {
        console.error(error)
        if (error.response) {
          Notify.create({
            type: 'negative',
            message: `Error ${error.message}\n${error.response.data.detail}`,
          })
        } else {
          Notify.create({ type: 'negative', message: `Error ${error.message}` })
        }
      }
    },
    async deleteArtifact(uuid) {
      if (!this.authStore.isAuthenticated) {
        await this.authStore.initKeycloak()
      }
      const token = await this.authStore.getTroviToken()
      if (!token) return false

      try {
        const response = await axios.delete(`/artifacts/${uuid}/?access_token=${token}`, {})

        if (response.status === 204) {
          Notify.create({
            type: 'positive',
            message: `Deleted artifact successfully`,
          })
          this.artifacts = this.artifacts.filter((a) => a.uuid !== uuid)
          delete this.artifactDetails[uuid]
          return true
        } else {
          let message = errObjToMessage(response.data)
          Notify.create({
            type: 'negative',
            message: `Failed to delete artifact:\n${message}`,
          })
          return false
        }
      } catch (error) {
        console.error(error)
        if (error.response) {
          Notify.create({
            type: 'negative',
            message: `Error ${error.message}\n${error.response.data.detail}`,
          })
        } else {
          Notify.create({ type: 'negative', message: `Error ${error.message}` })
        }
        return false
      }
    },
  },
})
