import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { authApi } from '../api/services'

const Ctx = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null)
  const [loading, setLoading] = useState(true)

  const loadUser = useCallback(async () => {
    if (!localStorage.getItem('access_token')) { setLoading(false); return }
    try {
      const { data } = await authApi.me()
      setUser(data)
    } catch {
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
    } finally { setLoading(false) }
  }, [])

  useEffect(() => { loadUser() }, [loadUser])

  const login = async (email, password) => {
    const { data } = await authApi.login(email, password)
    localStorage.setItem('access_token',  data.access_token)
    localStorage.setItem('refresh_token', data.refresh_token)
    setUser(data.user)
    return data.user
  }

  const logout = () => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    setUser(null)
  }

  return <Ctx.Provider value={{ user, loading, login, logout }}>{children}</Ctx.Provider>
}

export const useAuth = () => {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useAuth must be inside AuthProvider')
  return ctx
}