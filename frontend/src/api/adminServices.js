import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api/v1`
  : '/api/v1'

const adminApi = axios.create({ baseURL: BASE_URL })

// Use the same access_token as the main app
adminApi.interceptors.request.use((cfg) => {
  const t = localStorage.getItem('access_token')
  if (t) cfg.headers.Authorization = `Bearer ${t}`
  return cfg
})

adminApi.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export const superAdminApi = {
  stats:          ()         => adminApi.get('/admin/stats'),
  listOrgs:       (search)   => adminApi.get('/admin/organizations', { params: { search } }),
  getOrg:         (id)       => adminApi.get(`/admin/organizations/${id}`),
  activateOrg:    (id)       => adminApi.patch(`/admin/organizations/${id}/activate`),
  suspendOrg:     (id)       => adminApi.patch(`/admin/organizations/${id}/suspend`),
  updateSub:      (id, data) => adminApi.patch(`/admin/organizations/${id}/subscription`, data),
  impersonate:    (id)       => adminApi.post(`/admin/organizations/${id}/impersonate`),
  changePassword: (data)     => adminApi.post('/admin/change-password', data),
}