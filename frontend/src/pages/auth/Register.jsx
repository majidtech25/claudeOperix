import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { orgApi } from '../../api/services'
import { Alert, Field, Input, BtnPrimary, BtnGhost } from '../../components/ui'

export default function Register() {
  const { login }        = useAuth()
  const navigate         = useNavigate()
  const [searchParams]   = useSearchParams()
  const selectedPlan     = searchParams.get('plan') // 'basic' | 'pro' | null

  const [step, setStep]       = useState(1)
  const [error, setError]     = useState('')
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    name: '', email: '', phone: '',
    owner_full_name: '', owner_email: '', owner_password: '', confirm: '',
  })
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  const next = e => { e.preventDefault(); setError(''); setStep(2) }

  const submit = async e => {
    e.preventDefault()
    if (form.owner_password !== form.confirm) { setError('Passwords do not match'); return }
    setLoading(true); setError('')
    try {
      const { confirm, ...payload } = form
      await orgApi.register(payload)
      await login(form.owner_email, form.owner_password)
      // If came from a paid plan selection, go straight to billing
      if (selectedPlan && selectedPlan !== 'trial') {
        navigate(`/billing?plan=${selectedPlan}`, { replace: true })
      } else {
        navigate('/dashboard', { replace: true })
      }
    } catch (err) { setError(err.response?.data?.detail ?? 'Registration failed.') }
    finally { setLoading(false) }
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex',
      alignItems: 'center', justifyContent: 'center', padding: 20,
      background: 'var(--color-base)',
    }}>
      <div style={{ width: '100%', maxWidth: 380 }}>

        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <h1 style={{
            fontFamily: 'var(--font-display)', fontWeight: 800,
            fontSize: 34, color: 'var(--color-text)', letterSpacing: '-0.03em'
          }}>
            Oper<span style={{ color: 'var(--color-accent)' }}>ix</span>
          </h1>
          <p style={{ color: 'var(--color-muted)', fontSize: 13, marginTop: 6 }}>
            14-day free trial · No card required
          </p>
          {/* Show selected plan badge if coming from landing */}
          {selectedPlan && selectedPlan !== 'trial' && (
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              marginTop: 10, padding: '4px 12px', borderRadius: 999,
              background: 'rgba(110,231,183,0.1)',
              border: '1px solid rgba(110,231,183,0.25)',
              fontSize: 12, color: 'var(--color-accent)',
              fontFamily: 'var(--font-mono)',
            }}>
              ✓ {selectedPlan.charAt(0).toUpperCase() + selectedPlan.slice(1)} plan selected
            </div>
          )}
        </div>

        {/* Step indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
          {[1, 2].map((s, i) => (
            <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
              <div style={{
                width: 24, height: 24, borderRadius: 4,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, fontFamily: 'var(--font-mono)', fontWeight: 600,
                background: step >= s ? 'var(--color-accent)' : 'var(--color-base-200)',
                color: step >= s ? '#ffffff' : 'var(--color-muted)',
              }}>{s}</div>
              <span style={{
                fontSize: 12,
                color: step >= s ? 'var(--color-text)' : 'var(--color-muted)'
              }}>
                {s === 1 ? 'Business' : 'Account'}
              </span>
              {i < 1 && <div style={{
                flex: 1, height: 1,
                background: step > s ? 'var(--color-accent)' : 'var(--color-border)'
              }} />}
            </div>
          ))}
        </div>

        <div style={{
          background: 'var(--color-base-50)',
          border: '1px solid var(--color-border)',
          borderRadius: 8, padding: '22px 24px'
        }}>
          {step === 1 && (
            <form onSubmit={next} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <p style={{
                fontFamily: 'var(--font-display)', fontWeight: 700,
                fontSize: 14, color: 'var(--color-text)', marginBottom: 4
              }}>Business Information</p>
              <Alert type="error" message={error} onClose={() => setError('')} />
              <Field label="Business Name *">
                <Input placeholder="My Shop Ltd" value={form.name} onChange={set('name')} required autoFocus />
              </Field>
              <Field label="Business Email *">
                <Input type="email" placeholder="info@myshop.com" value={form.email} onChange={set('email')} required />
              </Field>
              <Field label="Phone">
                <Input placeholder="+254 700 000 000" value={form.phone} onChange={set('phone')} />
              </Field>
              <BtnPrimary type="submit" style={{ width: '100%', marginTop: 4 }}>Continue →</BtnPrimary>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <p style={{
                fontFamily: 'var(--font-display)', fontWeight: 700,
                fontSize: 14, color: 'var(--color-text)', marginBottom: 4
              }}>Owner Account</p>
              <Alert type="error" message={error} onClose={() => setError('')} />
              <Field label="Full Name *">
                <Input placeholder="Your name" value={form.owner_full_name} onChange={set('owner_full_name')} required autoFocus />
              </Field>
              <Field label="Email *">
                <Input type="email" placeholder="you@email.com" value={form.owner_email} onChange={set('owner_email')} required />
              </Field>
              <Field label="Password *">
                <Input type="password" placeholder="Min 8 characters" value={form.owner_password} onChange={set('owner_password')} required minLength={8} />
              </Field>
              <Field label="Confirm Password *">
                <Input type="password" placeholder="Repeat password" value={form.confirm} onChange={set('confirm')} required />
              </Field>

              {/* Show what happens next if paid plan */}
              {selectedPlan && selectedPlan !== 'trial' && (
                <div style={{
                  padding: '10px 12px', borderRadius: 4,
                  background: 'rgba(110,231,183,0.06)',
                  border: '1px solid rgba(110,231,183,0.2)',
                  fontSize: 12, color: 'var(--color-accent)', lineHeight: 1.6,
                }}>
                  After creating your account, you'll be taken directly to the billing page to activate your <strong>{selectedPlan.charAt(0).toUpperCase() + selectedPlan.slice(1)}</strong> plan.
                </div>
              )}

              <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                <BtnGhost type="button" style={{ flex: 1 }} onClick={() => setStep(1)}>← Back</BtnGhost>
                <BtnPrimary type="submit" style={{ flex: 1 }} disabled={loading}>
                  {loading ? 'Creating…' : selectedPlan && selectedPlan !== 'trial' ? 'Create & Pay →' : 'Create Account'}
                </BtnPrimary>
              </div>
            </form>
          )}
        </div>

        <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--color-muted)', marginTop: 18 }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: 'var(--color-accent)', textDecoration: 'none' }}>Sign in</Link>
        </p>
      </div>
    </div>
  )
}