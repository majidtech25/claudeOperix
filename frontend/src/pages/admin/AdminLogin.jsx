import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Shield, Eye, EyeOff } from 'lucide-react'
import { superAdminApi } from '../../api/adminServices'

export default function AdminLogin() {
  const navigate = useNavigate()
  const [form, setForm]       = useState({ email: '', password: '' })
  const [showPw, setShowPw]   = useState(false)
  const [error, setError]     = useState('')
  const [loading, setLoading] = useState(false)

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  const submit = async e => {
    e.preventDefault()
    setError(''); setLoading(true)
    try {
      const { data } = await superAdminApi.login(form.email, form.password)
      if (data.user?.role !== 'super_admin') {
        setError('Access denied. Super Admin only.')
        return
      }
      localStorage.setItem('admin_access_token', data.access_token)
      localStorage.setItem('admin_user', JSON.stringify(data.user))
      navigate('/admin/dashboard')
    } catch (err) {
      setError(err.response?.data?.detail ?? 'Invalid credentials')
    } finally { setLoading(false) }
  }

  return (
    <div style={{
      minHeight: '100vh', background: '#0a0d14',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: '"Inter", sans-serif', padding: 20,
    }}>
      {/* Grid bg */}
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none',
        backgroundImage: `
          linear-gradient(rgba(96,165,250,0.025) 1px, transparent 1px),
          linear-gradient(90deg, rgba(96,165,250,0.025) 1px, transparent 1px)
        `,
        backgroundSize: '48px 48px',
      }} />

      <div style={{ width: '100%', maxWidth: 360, position: 'relative', zIndex: 1 }}>
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{
            width: 52, height: 52, borderRadius: 12, margin: '0 auto 16px',
            background: 'rgba(96,165,250,0.1)',
            border: '1px solid rgba(96,165,250,0.25)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Shield size={22} color="#60a5fa" />
          </div>
          <h1 style={{
            fontFamily: '"Poppins", sans-serif', fontWeight: 800,
            fontSize: 26, letterSpacing: '-0.03em', color: 'white', margin: '0 0 6px',
          }}>
            Oper<span style={{ color: '#60a5fa' }}>ix</span> Admin
          </h1>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', margin: 0 }}>
            Super Admin Portal
          </p>
        </div>

        <div style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 10, padding: 28,
        }}>
          {error && (
            <div style={{
              padding: '9px 12px', borderRadius: 4, marginBottom: 16,
              background: 'rgba(248,113,113,0.08)',
              border: '1px solid rgba(248,113,113,0.25)',
              fontSize: 13, color: '#f87171',
            }}>{error}</div>
          )}

          <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              <label style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Admin Email
              </label>
              <input
                type="email" value={form.email} onChange={set('email')}
                required autoFocus placeholder="admin@operix.co.ke"
                style={{
                  background: '#0a0d14', border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 4, padding: '8px 11px', color: 'white',
                  fontSize: 13, fontFamily: '"Inter", sans-serif', outline: 'none',
                }}
                onFocus={e => e.target.style.borderColor = 'rgba(96,165,250,0.5)'}
                onBlur={e  => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              <label style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPw ? 'text' : 'password'}
                  value={form.password} onChange={set('password')}
                  required placeholder="••••••••"
                  style={{
                    width: '100%', background: '#0a0d14',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 4, padding: '8px 36px 8px 11px',
                    color: 'white', fontSize: 13,
                    fontFamily: '"Inter", sans-serif', outline: 'none',
                    boxSizing: 'border-box',
                  }}
                  onFocus={e => e.target.style.borderColor = 'rgba(96,165,250,0.5)'}
                  onBlur={e  => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                />
                <button type="button" onClick={() => setShowPw(p => !p)} style={{
                  position: 'absolute', right: 10, top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'rgba(255,255,255,0.4)', display: 'flex',
                }}>
                  {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading} style={{
              marginTop: 6, padding: '10px', borderRadius: 4, border: 'none',
              background: loading ? 'rgba(96,165,250,0.5)' : '#60a5fa',
              color: '#0a0d14', fontWeight: 700, fontSize: 14,
              fontFamily: '"Inter", sans-serif', cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'background .2s',
            }}>
              {loading ? 'Signing in…' : 'Sign In to Admin'}
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', fontSize: 12, color: 'rgba(255,255,255,0.2)', marginTop: 20 }}>
          This portal is restricted to Operix platform administrators only.
        </p>
      </div>
    </div>
  )
}