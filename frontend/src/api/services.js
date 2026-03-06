import api from './client'

export const authApi = {
  login: (email, password) => {
    const f = new URLSearchParams()
    f.append('username', email)
    f.append('password', password)
    return api.post('/auth/login', f, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    })
  },
  me:      ()    => api.get('/auth/me'),
  refresh: (tok) => api.post('/auth/refresh', { refresh_token: tok }),
}

export const orgApi = {
  register:        (data) => api.post('/organizations/register', data),
  getMe:           ()     => api.get('/organizations/me'),
  update:          (data) => api.patch('/organizations/me', data),
  getSubscription: ()     => api.get('/organizations/me/subscription'),
}

export const usersApi = {
  list:           ()         => api.get('/users/'),
  create:         (data)     => api.post('/users/', data),
  update:         (id, data) => api.patch(`/users/${id}`, data),
  changePassword: (data)     => api.post('/users/me/change-password', data),
}

export const categoriesApi = {
  list:   ()         => api.get('/categories/'),
  create: (data)     => api.post('/categories/', data),
  update: (id, data) => api.patch(`/categories/${id}`, data),
}

export const productsApi = {
  list:   ()         => api.get('/products/'),
  get:    (id)       => api.get(`/products/${id}`),
  create: (data)     => api.post('/products/', data),
  update: (id, data) => api.patch(`/products/${id}`, data),
}

export const inventoryApi = {
  adjust:   (data)       => api.post('/inventory/adjust', data),
  logs:     (product_id) => api.get('/inventory/logs', { params: product_id ? { product_id } : {} }),
  lowStock: ()           => api.get('/inventory/low-stock'),
}

export const salesDaysApi = {
  current: ()           => api.get('/sales-days/current'),
  list:    ()           => api.get('/sales-days/'),
  get:     (id)         => api.get(`/sales-days/${id}`),
  open:    (date)       => api.post('/sales-days/open', { business_date: date }),
  close:   (note=null)  => api.post('/sales-days/close', { closing_note: note }),
}

export const salesApi = {
  list:        (day_id) => api.get('/sales/', { params: day_id ? { sales_day_id: day_id } : {} }),
  get:         (id)     => api.get(`/sales/${id}`),
  create:      (data)   => api.post('/sales/', data),
  dailyReport: (day_id) => api.get(`/sales/report/daily/${day_id}`),
}