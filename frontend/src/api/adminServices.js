import axios from 'axios'

const adminApi = axios.create({ baseURL: '/api/v1' })

adminApi.interceptors.request.use((cfg) => {
  const t = localStorage.getItem('admin_access_token')
  if (t) cfg.headers.Authorization = `Bearer ${t}`
  return cfg
})

adminApi.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('admin_access_token')
      window.location.href = '/admin/login'
    }
    return Promise.reject(err)
  }
)

export const superAdminApi = {
  login:           (email, password) => {
    const f = new URLSearchParams()
    f.append('username', email)
    f.append('password', password)
    return adminApi.post('/auth/login', f, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    })
  },
  stats:           ()        => adminApi.get('/admin/stats'),
  listOrgs:        (search)  => adminApi.get('/admin/organizations', { params: { search } }),
  getOrg:          (id)      => adminApi.get(`/admin/organizations/${id}`),
  activateOrg:     (id)      => adminApi.patch(`/admin/organizations/${id}/activate`),
  suspendOrg:      (id)      => adminApi.patch(`/admin/organizations/${id}/suspend`),
  updateSub:       (id, data)=> adminApi.patch(`/admin/organizations/${id}/subscription`, data),
  impersonate:     (id)      => adminApi.post(`/admin/organizations/${id}/impersonate`),
  changePassword: (data) => adminApi.post('/admin/change-password', data),
}