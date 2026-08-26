import { defineStore } from 'pinia'
import Keycloak from 'keycloak-js'
import axios from 'axios'
import { Notify } from 'quasar'
import { usernameToUrn } from '@/util'

const keycloakConfig = {
  url: import.meta.env.VITE_KEYCLOAK_URL,
  realm: import.meta.env.VITE_KEYCLOAK_REALM,
  clientId: import.meta.env.VITE_KEYCLOAK_CLIENT_ID,
}

// Keycloak's session-check iframe posts its result back here, so this has to be
// same-origin and registered as a valid redirect URI on the client
const silentCheckSsoRedirectUri = new URL(
  `${import.meta.env.BASE_URL}silent-check-sso.html`,
  window.location.origin,
).href

// Go anonymous rather than stall the page if the check never answers
const SESSION_CHECK_TIMEOUT_MS = 5000

// The check runs once per page load, however many callers await it
let sessionCheck = null
let refreshTimer = null

export const useAuthStore = defineStore('auth', {
  state: () => ({
    keycloak: null,
    isAuthenticated: false,
    userInfo: null,
    token: null,
    troviToken: null,
  }),
  actions: {
    // Finds an existing session without ever prompting, so public pages stay
    // public. Initializing only here makes login() the sole route to the login server.
    async restoreSession() {
      if (!sessionCheck) {
        sessionCheck = Promise.race([
          this.checkSso(),
          new Promise((resolve) => setTimeout(() => resolve(false), SESSION_CHECK_TIMEOUT_MS)),
        ])
      }
      return sessionCheck
    },
    async checkSso() {
      // a Keycloak instance can only be initialized once
      if (this.keycloak) {
        return this.isAuthenticated
      }
      try {
        // keep this in the try: missing config throws, and that shouldn't break reads
        this.keycloak = new Keycloak(keycloakConfig)
        const authenticated = await this.keycloak.init({
          onLoad: 'check-sso',
          silentCheckSsoRedirectUri,
          // Keycloak's fallback is a full page redirect to login, the bounce we're avoiding
          silentCheckSsoFallback: false,
        })
        this.setSession(authenticated)
        return authenticated
      } catch (err) {
        console.error('Failed to initialize Keycloak:', err)
        this.setSession(false)
        return false
      }
    },
    // Nothing is persisted; a remembered token is usually an expired one
    setSession(authenticated) {
      this.isAuthenticated = authenticated
      if (!authenticated) {
        this.userInfo = null
        this.token = null
        this.troviToken = null
        clearInterval(refreshTimer)
        refreshTimer = null
        return
      }
      this.token = this.keycloak.token
      this.userInfo = this.keycloak.tokenParsed
      this.userInfo.userUrn = usernameToUrn(this.userInfo.preferred_username)
      this.setupTokenRefresh()
    },
    setupTokenRefresh() {
      if (refreshTimer) return
      refreshTimer = setInterval(async () => {
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
    // Full page redirect, so nothing after it runs. Only for something the user asked for
    async login(redirectUri = window.location.href) {
      await this.restoreSession()
      try {
        // Keycloak needs an absolute URI, callers have router paths
        return await this.keycloak.login({
          redirectUri: new URL(redirectUri, window.location.href).href,
        })
      } catch (err) {
        console.error('Failed to start login:', err)
        Notify.create({
          type: 'negative',
          message: 'Could not reach the login server. Please try again.',
        })
      }
    },
    // Callers must still handle a missing token; the redirect can fail
    async requireLogin() {
      if (!(await this.restoreSession())) {
        await this.login()
      }
    },
    // Anonymous visitors get undefined, so callers must treat the token as optional
    async getTroviToken() {
      if (this.troviToken) {
        try {
          const b64 = this.troviToken.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
          const padded = b64 + '='.repeat((4 - (b64.length % 4)) % 4)
          const payload = JSON.parse(atob(padded))
          if (payload.exp && payload.exp > Date.now() / 1000 + 30) {
            return this.troviToken
          }
        } catch {
          // malformed token — fall through to re-fetch
        }
      }
      if (!(await this.restoreSession())) {
        return undefined
      }
      try {
        const res = await axios.post('/token/', {
          grant_type: 'token_exchange',
          subject_token: this.token,
          subject_token_type: 'urn:ietf:params:oauth:token-type:jwt',
          scope: 'artifacts:read artifacts:write',
        })
        if (res.data.access_token) {
          this.troviToken = res.data.access_token
          return this.troviToken
        }
      } catch (err) {
        console.error('Failed to exchange token:', err)
      }
      Notify.create({
        type: 'negative',
        message: 'Could not get token. If this issue persists, please try to relog.',
      })
      return undefined
    },
    async logout() {
      if (!this.keycloak) {
        return
      }
      this.setSession(false)
      return this.keycloak.logout()
    },
  },
})
