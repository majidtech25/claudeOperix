import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import { Alert, Field, Input, BtnPrimary, Spinner } from '../../components/ui'
import { Sun, Moon } from 'lucide-react'
import api from '../../api/client'

export default function Settings() {
  const { user } = useAuth()
  const [tab, setTab] = useState('profile')

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 640 }}>
      <div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 20, color: 'var(--color-text)', margin: 0 }}>
          Settings
        </h1>
        <p style={{ fontSize: 13, color: 'var(--color-muted)', marginTop: 4 }}>
          Manage your business profile and account
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--color-border)', overflowX: 'auto' }}>
        {['profile', 'password', 'appearance'].map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: '8px 16px', background: 'none', border: 'none', cursor: 'pointer',
            fontFamily: 'var(--font-sans)', fontSize: 13, whiteSpace: 'nowrap',
            color: tab === t ? 'var(--color-accent)' : 'var(--color-muted)',
            borderBottom: tab === t ? '2px solid var(--color-accent)' : '2px solid transparent',
            marginBottom: -1,
          }}>
            {t === 'profile' ? 'Business Profile' : t === 'password' ? 'Change Password' : 'Appearance'}
          </button>
        ))}
      </div>

      {tab === 'profile'    && <ProfileForm />}
      {tab === 'password'   && <PasswordForm />}
      {tab === 'appearance' && <AppearanceForm />}
    </div>
  )
}

function AppearanceForm() {
  const { theme, toggle } = useTheme()
  const isDark = theme === 'dark'
  const isMobile = window.innerWidth < 640
  const card = { background: 'var(--color-base-50)', border: '1px solid var(--color-border)', borderRadius: 6, padding: isMobile ? '16px' : '24px' }

  return (
    <div style={card}>
      <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text)', margin: '0 0 4px' }}>
        Theme
      </p>
      <p style={{ fontSize: 12, color: 'var(--color-muted)', margin: '0 0 20px' }}>
        Choose how Operix looks on your device
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        {/* Light mode option */}
        <button onClick={() => isDark && toggle()} style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
          padding: '20px 16px', borderRadius: 8, cursor: 'pointer',
          border: !isDark ? '2px solid var(--color-accent)' : '2px solid var(--color-border)',
          background: !isDark ? 'rgba(5,150,105,0.05)' : 'var(--color-base)',
          transition: 'all .15s',
        }}>
          <div style={{
            width: 48, height: 48, borderRadius: 12,
            background: '#ffffff', border: '1px solid #e5e7eb',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          }}>
            <Sun size={22} color="#f59e0b" />
          </div>
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text)', margin: '0 0 2px' }}>Light</p>
            <p style={{ fontSize: 11, color: 'var(--color-muted)', margin: 0 }}>Clean & bright</p>
          </div>
          {!isDark && (
            <span style={{
              fontSize: 10, padding: '2px 8px', borderRadius: 999,
              background: 'var(--color-accent)', color: '#fff',
              fontWeight: 600, letterSpacing: '0.05em',
            }}>ACTIVE</span>
          )}
        </button>

        {/* Dark mode option */}
        <button onClick={() => !isDark && toggle()} style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
          padding: '20px 16px', borderRadius: 8, cursor: 'pointer',
          border: isDark ? '2px solid var(--color-accent)' : '2px solid var(--color-border)',
          background: isDark ? 'rgba(110,231,183,0.05)' : 'var(--color-base)',
          transition: 'all .15s',
        }}>
          <div style={{
            width: 48, height: 48, borderRadius: 12,
            background: '#0a0d14', border: '1px solid #1f2937',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
          }}>
            <Moon size={22} color="#6ee7b7" />
          </div>
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text)', margin: '0 0 2px' }}>Dark</p>
            <p style={{ fontSize: 11, color: 'var(--color-muted)', margin: 0 }}>Easy on the eyes</p>
          </div>
          {isDark && (
            <span style={{
              fontSize: 10, padding: '2px 8px', borderRadius: 999,
              background: 'var(--color-accent)', color: '#fff',
              fontWeight: 600, letterSpacing: '0.05em',
            }}>ACTIVE</span>
          )}
        </button>
      </div>

      <p style={{ fontSize: 12, color: 'var(--color-muted)', marginTop: 16, textAlign: 'center' }}>
        Your preference is saved automatically
      </p>
    </div>
  )
}

function ProfileForm() {
  const [form, setForm]       = useState({ name: '', email: '', phone: '', address: '' })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving]   = useState(false)
  const [error, setError]     = useState('')
  const [success, setSuccess] = useState('')

  const isMobile = window.innerWidth < 640
  const card = { background: 'var(--color-base-50)', border: '1px solid var(--color-border)', borderRadius: 6, padding: isMobile ? '16px' : '24px' }

  useEffect(() => {
    api.get('/organizations/me')
      .then(r => setForm({
        name:    r.data.name    ?? '',
        email:   r.data.email   ?? '',
        phone:   r.data.phone   ?? '',
        address: r.data.address ?? '',
      }))
      .catch(() => setError('Failed to load profile'))
      .finally(() => setLoading(false))
  }, [])

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  const submit = async e => {
    e.preventDefault()
    setSaving(true); setError(''); setSuccess('')
    try {
      await api.patch('/organizations/me', form)
      setSuccess('Profile updated successfully.')
    } catch (err) {
      setError(err.response?.data?.detail ?? 'Update failed')
    } finally { setSaving(false) }
  }

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
      <Spinner size={24} />
    </div>
  )

  return (
    <div style={card}>
      <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <Alert type="error"   message={error}   onClose={() => setError('')}   />
        <Alert type="success" message={success} onClose={() => setSuccess('')} />
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 14 }}>
          <Field label="Business Name *">
            <Input value={form.name} onChange={set('name')} required placeholder="My Shop Ltd" />
          </Field>
          <Field label="Business Email">
            <Input type="email" value={form.email} onChange={set('email')} placeholder="info@myshop.com" />
          </Field>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 14 }}>
          <Field label="Phone">
            <Input value={form.phone} onChange={set('phone')} placeholder="+254 700 000 000" />
          </Field>
          <Field label="Address">
            <Input value={form.address} onChange={set('address')} placeholder="Nairobi, Kenya" />
          </Field>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 4 }}>
          <BtnPrimary type="submit" disabled={saving} style={{ width: isMobile ? '100%' : 'auto' }}>
            {saving ? 'Saving…' : 'Save Changes'}
          </BtnPrimary>
        </div>
      </form>
    </div>
  )
}

function PasswordForm() {
  const [form, setForm]       = useState({ current_password: '', new_password: '', confirm: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const [success, setSuccess] = useState('')

  const isMobile = window.innerWidth < 640
  const card = { background: 'var(--color-base-50)', border: '1px solid var(--color-border)', borderRadius: 6, padding: isMobile ? '16px' : '24px' }
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  const submit = async e => {
    e.preventDefault()
    if (form.new_password !== form.confirm) { setError('Passwords do not match'); return }
    if (form.new_password.length < 8) { setError('Password must be at least 8 characters'); return }
    setLoading(true); setError(''); setSuccess('')
    try {
      await api.post('/users/me/change-password', {
        current_password: form.current_password,
        new_password:     form.new_password,
      })
      setSuccess('Password changed successfully.')
      setForm({ current_password: '', new_password: '', confirm: '' })
    } catch (err) {
      setError(err.response?.data?.detail ?? 'Failed to change password')
    } finally { setLoading(false) }
  }

  return (
    <div style={card}>
      <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <Alert type="error"   message={error}   onClose={() => setError('')}   />
        <Alert type="success" message={success} onClose={() => setSuccess('')} />
        <Field label="Current Password *">
          <Input type="password" value={form.current_password} onChange={set('current_password')} required placeholder="Your current password" />
        </Field>
        <Field label="New Password *">
          <Input type="password" value={form.new_password} onChange={set('new_password')} required minLength={8} placeholder="Min 8 characters" />
        </Field>
        <Field label="Confirm New Password *">
          <Input type="password" value={form.confirm} onChange={set('confirm')} required placeholder="Repeat new password" />
        </Field>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 4 }}>
          <BtnPrimary type="submit" disabled={loading} style={{ width: isMobile ? '100%' : 'auto' }}>
            {loading ? 'Updating…' : 'Change Password'}
          </BtnPrimary>
        </div>
      </form>
    </div>
  )
}