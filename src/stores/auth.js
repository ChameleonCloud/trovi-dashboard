import { defineStore } from 'pinia'
import Keycloak from 'keycloak-js'
import axios from 'axios'
import { useToast } from 'vue-toastification'

const toast = useToast()

const keycloakConfig = {
  url: import.meta.env.VITE_KEYCLOAK_URL,
  realm: import.meta.env.VITE_KEYCLOAK_REALM,
  clientId: import.meta.env.VITE_KEYCLOAK_CLIENT_ID,
}

export const useAuthStore = defineStore('auth', {
  state: () => ({
    keycloak: null,
    isAuthenticated: false,
    userInfo: null,
    token: null,
    troviToken: null,
  }),
  actions: {
    async initKeycloak(options = { onLoad: 'login-required' }) {
      if (this.keycloak) {
        return
      }
      this.keycloak = new Keycloak(keycloakConfig)
      try {
        const authenticated = await this.keycloak.init(options)
        this.isAuthenticated = authenticated

        if (authenticated) {
          this.token = this.keycloak.token
          this.userInfo = this.keycloak.tokenParsed
          this.userInfo.userUrn = `urn:trovi:user:chameleon:${this.userInfo.preferred_username}`
        }
        this.setupTokenRefresh()
        return authenticated
      } catch (err) {
        console.error('Failed to initialize Keycloak:', err)
        return false
      }
    },
    setupTokenRefresh() {
      if (!this.keycloak) return
      setInterval(async () => {
        try {
          const refreshed = await this.keycloak.updateToken(30)
          if (refreshed) {
            this.token = this.keycloak.token
          }
        } catch (err) {
          console.error('Failed to refresh token:', err)
        }
      }, 15 * 1000)
    },
    async getTroviToken() {
      await this.initKeycloak()
      let res = await axios.post('/token/', {
        grant_type: 'token_exchange',
        subject_token: this.token,
        subject_token_type: 'urn:ietf:params:oauth:token-type:jwt',
        scope: 'artifacts:read artifacts:write',
      })
      if (res.status == 201) {
        this.troviToken = res.data.access_token
        return this.troviToken
      } else {
        toast.error(`Could not get token. If this issue persists, please try to relog.`)
        return undefined
      }
    },
    async logout() {
      if (this.keycloak) {
        this.keycloak.logout()
        this.keycloak = undefined
        this.isAuthenticated = false
        this.userInfo = null
        this.token = null
        this.troviToken = null
      }
    },
  },
  persist: {
    storage: localStorage,
    pick: [
      "isAuthenticated",
      "userInfo",
      "token",
      "troviToken"
    ]
  },
})
