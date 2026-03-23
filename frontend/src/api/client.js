import axios from 'axios'

// In production, API calls go to the Render backend URL
// In development, Vite proxy handles /api → localhost:8000
const BASE_URL = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api/v1`
  : '/api/v1'

const api = axios.create({ baseURL: BASE_URL })

// ── Request interceptor — attach correct token ────────────────
api.interceptors.request.use((cfg) => {
  const impersonateToken = localStorage.getItem('impersonate_token')
  const accessToken      = localStorage.getItem('access_token')
  const token = impersonateToken || accessToken
  if (token) cfg.headers.Authorization = `Bearer ${token}`
  return cfg
})

// ── Response interceptor — refresh on 401 ────────────────────
let isRefreshing = false
let failedQueue  = []

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) prom.reject(error)
    else prom.resolve(token)
  })
  failedQueue = []
}

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const original = err.config

    if (err.response?.status === 401 && !original._retry) {

      if (localStorage.getItem('impersonate_token')) {
        localStorage.removeItem('impersonate_token')
        localStorage.removeItem('impersonate_org')
        window.location.href = '/admin/dashboard'
        return Promise.reject(err)
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        }).then(token => {
          original.headers.Authorization = `Bearer ${token}`
          return api(original)
        }).catch(e => Promise.reject(e))
      }

      original._retry  = true
      isRefreshing     = true

      const refreshToken = localStorage.getItem('refresh_token')

      if (!refreshToken) {
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        window.location.href = '/login'
        return Promise.reject(err)
      }

      try {
        const { data } = await axios.post(
          import.meta.env.VITE_API_URL
            ? `${import.meta.env.VITE_API_URL}/api/v1/auth/refresh`
            : '/api/v1/auth/refresh',
          { refresh_token: refreshToken }
        )

        const newToken = data.access_token
        localStorage.setItem('access_token', newToken)
        if (data.refresh_token) {
          localStorage.setItem('refresh_token', data.refresh_token)
        }

        api.defaults.headers.common.Authorization = `Bearer ${newToken}`
        processQueue(null, newToken)
        original.headers.Authorization = `Bearer ${newToken}`
        return api(original)

      } catch (refreshErr) {
        processQueue(refreshErr, null)
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        window.location.href = '/login'
        return Promise.reject(refreshErr)

      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(err)
  }
)

export default api