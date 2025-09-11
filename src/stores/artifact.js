import { defineStore } from 'pinia'
import axios from 'axios'
import { marked } from 'marked'
import { useAuthStore } from '@/stores/auth'
import { useToast } from 'vue-toastification'

const toast = useToast()

function processArtifact(store, artifact) {
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
  artifact.computed.get_chameleon_launch_url = function (version_slug) {
    return `${import.meta.env.VITE_CHAMELEON_PORTAL_URL}/experiment/share/${artifact.uuid}/version/${version_slug}/launch`
  }
  artifact.computed.get_chameleon_download_url = function (version_slug) {
    return `${import.meta.env.VITE_CHAMELEON_PORTAL_URL}/experiment/share/${artifact.uuid}/version/${version_slug}/download`
  }

  let v = artifact.versions.find((version) => {
    return version.contents.urn.includes('github.com')
  })
  artifact.computed.github_url = undefined
  const regex = /github\.com\/[^@]+\.git/
  const match = v?.contents.urn.match(regex)
  if (match) {
    artifact.computed.github_url = `https://${match[0]}`
    artifact.computed.github_repo = match[0].substring('github.com/'.length)
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

  artifact.computed.hasDoi = artifact.versions.some((v) => v.contents.urn.includes('zenodo'))

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
              nestedErrors.forEach((nestedError) => {
                messages.push(`${field} (${nestedField}): ${nestedError}`)
              })
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
    async fetchArtifactById(uuid, version) {
      await this.fetchBadges()
      // Check if the artifact is already in the cache
      var token = undefined
      if (this.authStore.isAuthenticated) {
        token = await this.authStore.getTroviToken()
      }
      let tokenParam = token ? `?access_token=${token}` : ''
      if (!this.artifactDetails[uuid]) {
        const response = await axios.get(`/artifacts/${uuid}/${tokenParam}`)
        if (response.status != 200) {
          toast.error(`Error fetching artifact: ${response.status}`)
        } else {
          this.artifactDetails[uuid] = processArtifact(this, response.data)
        }
      }
      return this.artifactDetails[uuid]
    },
    async fetchTags() {
      const response = await axios.get(`/meta/tags`)
      this.tags = response.data.tags
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
            toast.success('Imported artifact')
            this.artifactDetails[uuid] = processArtifact(this, res.data)
            return this.artifactDetails[uuid]
          } else {
            let message = errObjToMessage(res.data)
            toast.error(`Could not import artifact. Is trovi.json file invalid?\n${message}`, {
              timeout: false,
            })
            return undefined
          }
        } catch (error) {
          console.log(error.response.data)
          toast.error(`Error ${error.message}\n${errObjToMessage(error.response.data)}`)
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
            toast.error(`Error ${error.message}\n${error.response.data.detail}`)
          } else {
            toast.error(`Error ${error.message}`)
          }
        }
      }
      toast.success('Updated roles')
    },
    async updateArtifactVisibility(uuid, visibility) {
      if (!this.authStore.isAuthenticated) {
        await this.authStore.initKeycloak()
      }
      let token = await this.authStore.getTroviToken()
      if (token) {
        try {
          const response = await axios.patch(`/artifacts/${uuid}/?access_token=${token}`, {
            patch: [
              {
                op: 'replace',
                path: '/visibility',
                value: visibility,
              },
            ],
          })
          if (response.status == 200) {
            toast.success(`Updated visibility to ${visibility}`)
            this.artifactDetails[uuid] = processArtifact(this, response.data)
          } else {
            let message = errObjToMessage(response.data)
            toast.error(`Failed to update visibility:\n${message}`, { timeout: false })
          }
        } catch (error) {
          console.error(error)
          if (error.response) {
            toast.error(`Error ${error.message}\n${error.response.data.detail}`)
          } else {
            toast.error(`Error ${error.message}`)
          }
        }
      }
    },
  },
})
