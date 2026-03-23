import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { Alert, Field, Input, BtnPrimary } from '../../components/ui'

export default function Login() {
  const { login }        = useAuth()
  const navigate         = useNavigate()
  const [searchParams]   = useSearchParams()
  const [form, setForm]       = useState({ email: '', password: '' })
  const [showPw, setShowPw]   = useState(false)
  const [error, setError]     = useState('')
  const [loading, setLoading] = useState(false)

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  const submit = async e => {
    e.preventDefault()
    setError(''); setLoading(true)
    try {
      await login(form.email, form.password)
      // Honour redirect param — e.g. from landing page "I already have an account"
      const redirect = searchParams.get('redirect') || '/dashboard'
      navigate(redirect, { replace: true })
    }
    catch (err) { setError(err.response?.data?.detail ?? 'Invalid email or password.') }
    finally { setLoading(false) }
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex',
      alignItems: 'center', justifyContent: 'center', padding: 20,
      background: 'var(--color-base)',
    }}>
      <div style={{ width: '100%', maxWidth: 360 }}>
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <h1 style={{
            fontFamily: 'var(--font-display)', fontWeight: 800,
            fontSize: 36, color: 'var(--color-text)', letterSpacing: '-0.03em'
          }}>
            Oper<span style={{ color: 'var(--color-accent)' }}>ix</span>
          </h1>
          <p style={{ color: 'var(--color-muted)', fontSize: 13, marginTop: 6 }}>
            Sales discipline. Inventory control.
          </p>
        </div>

        <div style={{
          background: 'var(--color-base-50)',
          border: '1px solid var(--color-border)',
          borderRadius: 8, padding: 28
        }}>
          <p style={{
            fontFamily: 'var(--font-display)', fontWeight: 700,
            fontSize: 15, color: 'var(--color-text)', marginBottom: 20
          }}>Sign in to your workspace</p>

          <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Alert type="error" message={error} onClose={() => setError('')} />
            <Field label="Email">
              <Input type="email" placeholder="owner@business.com"
                value={form.email} onChange={set('email')} required autoFocus />
            </Field>
            <Field label="Password">
              <div style={{ position: 'relative' }}>
                <Input type={showPw ? 'text' : 'password'}
                  style={{ paddingRight: 38 }} placeholder="••••••••"
                  value={form.password} onChange={set('password')} required />
                <button type="button" onClick={() => setShowPw(p => !p)} style={{
                  position: 'absolute', right: 10, top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'var(--color-muted)', display: 'flex'
                }}
                  onMouseEnter={e => e.currentTarget.style.color = 'var(--color-text)'}
                  onMouseLeave={e => e.currentTarget.style.color = 'var(--color-muted)'}
                >
                  {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </Field>
            <BtnPrimary type="submit" style={{ width: '100%', marginTop: 4 }} disabled={loading}>
              {loading ? 'Signing in…' : 'Sign In'}
            </BtnPrimary>
          </form>
        </div>

        <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--color-muted)', marginTop: 18 }}>
          New business?{' '}
          <Link to="/register" style={{ color: 'var(--color-accent)', textDecoration: 'none' }}>
            Register here
          </Link>
        </p>
      </div>
    </div>
  )
}