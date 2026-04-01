import { useState, useEffect } from 'react'
import { CheckCircle2, CreditCard, Smartphone } from 'lucide-react'
import { useTheme } from '../../context/ThemeContext'
import { Alert, BtnPrimary, BtnGhost, Spinner } from '../../components/ui'
import api from '../../api/client'

const PLANS = [
  {
    key:      'basic',
    name:     'Basic',
    price:    2500,
    period:   'per month',
    desc:     'Perfect for small shops and kiosks',
    features: ['Up to 3 users', 'Unlimited products', 'Full POS & inventory', 'Sales reports', 'WhatsApp support'],
    featured: false,
  },
  {
    key:      'pro',
    name:     'Pro',
    price:    6500,
    period:   'per month',
    desc:     'For growing businesses with teams',
    features: ['Unlimited users', 'Multi-branch ready', 'Advanced analytics', 'Priority support', 'Custom onboarding'],
    featured: true,
  },
]

export default function Billing() {
  const { theme }             = useTheme()
  const isDark                = theme === 'dark'
  const [sub, setSub]         = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState('')
  const [modal, setModal]     = useState(null)
  const [history, setHistory] = useState([])

  const isMobile = window.innerWidth < 640

  useEffect(() => {
    api.get('/billing/status')
      .then(r => {
        setSub(r.data)
        const params = new URLSearchParams(window.location.search)
        const plan   = params.get('plan')
        if (plan && (plan === 'basic' || plan === 'pro')) {
          const found = PLANS.find(p => p.key === plan)
          if (found) setModal(found)
          window.history.replaceState({}, '', '/billing')
        }
      })
      .catch(() => setError('Failed to load billing info'))
      .finally(() => setLoading(false))

    api.get('/billing/history')
      .then(r => setHistory(r.data))
      .catch(() => {})
  }, [])

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}>
      <Spinner size={28} />
    </div>
  )

  const card = { background: 'var(--color-base-50)', border: '1px solid var(--color-border)', borderRadius: 6 }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 900 }}>

      <div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 20, color: 'var(--color-text)', margin: 0 }}>
          Billing & Subscription
        </h1>
        <p style={{ fontSize: 13, color: 'var(--color-muted)', marginTop: 4 }}>
          Manage your plan and payment method
        </p>
      </div>

      {error && <Alert type="error" message={error} onClose={() => setError('')} />}

      {/* Current plan — 2 cols on mobile, 4 on desktop */}
      {sub && (
        <div style={{ ...card, padding: '16px 20px' }}>
          <p style={{ fontSize: 10, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 16 }}>
            Current Plan
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)', gap: 16 }}>
            {[
              { label: 'Plan',      value: sub.plan.toUpperCase()                               },
              { label: 'Status',    value: sub.status.toUpperCase()                             },
              { label: 'Expires',   value: new Date(sub.expires_at).toLocaleDateString('en-KE') },
              { label: 'Days Left', value: `${sub.days_left} days`, accent: sub.days_left <= 5  },
            ].map((s, i) => (
              <div key={i}>
                <p style={{ fontSize: 10, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 6px' }}>{s.label}</p>
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: isMobile ? 14 : 16, margin: 0, fontWeight: 500, color: s.accent ? 'var(--color-danger)' : 'var(--color-text)' }}>{s.value}</p>
              </div>
            ))}
          </div>
          {sub.days_left <= 5 && (
            <div style={{ marginTop: 16, padding: '10px 14px', background: 'rgba(248,113,113,0.06)', border: '1px solid rgba(248,113,113,0.2)', borderRadius: 4 }}>
              <p style={{ fontSize: 13, color: 'var(--color-danger)', margin: 0 }}>
                ⚠ Your subscription expires in {sub.days_left} days. Upgrade now to avoid interruption.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Plan cards — stack on mobile */}
      <div>
        <p style={{ fontSize: 13, color: 'var(--color-muted)', marginBottom: 16 }}>
          Choose a plan to upgrade or renew your subscription. All prices in KES.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 16 }}>
          {PLANS.map(p => (
            <div key={p.key} style={{
              ...card, padding: '24px 20px', position: 'relative',
              border: p.featured
                ? '1px solid var(--color-accent)'
                : '1px solid var(--color-border)',
              background: p.featured
                ? isDark ? 'rgba(110,231,183,0.04)' : 'rgba(5,150,105,0.03)'
                : 'var(--color-base-50)',
            }}>
              {p.featured && (
                <div style={{
                  position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)',
                  background: 'var(--color-accent)', color: '#ffffff',
                  fontSize: 10, fontWeight: 800, padding: '3px 14px',
                  borderRadius: 999, letterSpacing: '0.08em', whiteSpace: 'nowrap',
                }}>MOST POPULAR</div>
              )}
              <p style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.1em', color: p.featured ? 'var(--color-accent)' : 'var(--color-muted)', margin: '0 0 8px' }}>{p.name}</p>
              <p style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 26, letterSpacing: '-0.025em', margin: '0 0 3px', color: 'var(--color-text)' }}>
                KES {p.price.toLocaleString()}
              </p>
              <p style={{ fontSize: 12, color: 'var(--color-muted)', margin: '0 0 8px' }}>{p.period}</p>
              <p style={{ fontSize: 13, color: 'var(--color-muted)', margin: '0 0 20px' }}>{p.desc}</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
                {p.features.map(f => (
                  <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <CheckCircle2 size={13} color="var(--color-accent)" style={{ flexShrink: 0 }} />
                    <span style={{ fontSize: 13, color: 'var(--color-text)' }}>{f}</span>
                  </div>
                ))}
              </div>
              <BtnPrimary style={{ width: '100%' }} onClick={() => setModal(p)}>
                {sub?.plan === p.key ? 'Renew Plan' : 'Upgrade to ' + p.name}
              </BtnPrimary>
            </div>
          ))}
        </div>
      </div>

      {/* Payment History */}
      {history.length > 0 && (
        <div style={card}>
          <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--color-border)' }}>
            <p style={{ fontSize: 10, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0 }}>
              Payment History
            </p>
          </div>

          {/* Mobile: card list */}
          {isMobile ? (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {history.map(p => (
                <div key={p.id} style={{ padding: '12px 16px', borderBottom: '1px solid var(--color-border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <span style={{ fontSize: 12, color: 'var(--color-muted)', fontFamily: 'var(--font-mono)' }}>
                      {new Date(p.created_at).toLocaleDateString('en-KE')}
                    </span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 14, color: 'var(--color-accent)', fontWeight: 600 }}>
                      KES {p.amount.toLocaleString()}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                    <span style={{
                      fontSize: 11, fontFamily: 'var(--font-mono)',
                      padding: '2px 8px', borderRadius: 3,
                      background: p.method === 'mpesa' ? 'rgba(110,231,183,0.1)' : 'rgba(96,165,250,0.1)',
                      color: p.method === 'mpesa' ? 'var(--color-accent)' : 'var(--color-info)',
                      border: p.method === 'mpesa' ? '1px solid rgba(110,231,183,0.25)' : '1px solid rgba(96,165,250,0.25)',
                    }}>
                      {p.method.toUpperCase()}
                    </span>
                    <span style={{
                      fontSize: 11, fontFamily: 'var(--font-mono)',
                      padding: '2px 8px', borderRadius: 3,
                      background: p.status === 'success' ? 'rgba(110,231,183,0.1)' : 'rgba(248,113,113,0.1)',
                      color: p.status === 'success' ? 'var(--color-accent)' : 'var(--color-danger)',
                      border: p.status === 'success' ? '1px solid rgba(110,231,183,0.25)' : '1px solid rgba(248,113,113,0.25)',
                    }}>
                      {p.status}
                    </span>
                    {p.transaction_reference && (
                      <span style={{ fontSize: 11, color: 'var(--color-muted)', fontFamily: 'var(--font-mono)', marginLeft: 'auto' }}>
                        {p.transaction_reference}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* Desktop: table */
            <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 420 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                    {['Date', 'Method', 'Amount', 'Reference', 'Status'].map(h => (
                      <th key={h} style={{ fontSize: 10, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', padding: '10px 12px', textAlign: 'left', fontWeight: 400 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {history.map(p => (
                    <tr key={p.id} style={{ borderBottom: '1px solid var(--color-border)' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--color-base-100)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <td style={{ fontSize: 12, color: 'var(--color-muted)', padding: '10px 12px', fontFamily: 'var(--font-mono)' }}>
                        {new Date(p.created_at).toLocaleDateString('en-KE')}
                      </td>
                      <td style={{ padding: '10px 12px' }}>
                        <span style={{
                          fontSize: 11, fontFamily: 'var(--font-mono)',
                          padding: '2px 8px', borderRadius: 3,
                          background: p.method === 'mpesa' ? 'rgba(110,231,183,0.1)' : 'rgba(96,165,250,0.1)',
                          color: p.method === 'mpesa' ? 'var(--color-accent)' : 'var(--color-info)',
                          border: p.method === 'mpesa' ? '1px solid rgba(110,231,183,0.25)' : '1px solid rgba(96,165,250,0.25)',
                        }}>
                          {p.method.toUpperCase()}
                        </span>
                      </td>
                      <td style={{ fontSize: 13, color: 'var(--color-accent)', padding: '10px 12px', fontFamily: 'var(--font-mono)', fontWeight: 500 }}>
                        KES {p.amount.toLocaleString()}
                      </td>
                      <td style={{ fontSize: 11, color: 'var(--color-muted)', padding: '10px 12px', fontFamily: 'var(--font-mono)' }}>
                        {p.transaction_reference ?? '—'}
                      </td>
                      <td style={{ padding: '10px 12px' }}>
                        <span style={{
                          fontSize: 11, fontFamily: 'var(--font-mono)',
                          padding: '2px 8px', borderRadius: 3,
                          background: p.status === 'success' ? 'rgba(110,231,183,0.1)' : 'rgba(248,113,113,0.1)',
                          color: p.status === 'success' ? 'var(--color-accent)' : 'var(--color-danger)',
                          border: p.status === 'success' ? '1px solid rgba(110,231,183,0.25)' : '1px solid rgba(248,113,113,0.25)',
                        }}>
                          {p.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {modal && <PaymentModal plan={modal} onClose={() => setModal(null)} />}
    </div>
  )
}

function PaymentModal({ plan, onClose }) {
  const [method, setMethod]             = useState(null)
  const [phone, setPhone]               = useState('')
  const [loading, setLoading]           = useState(false)
  const [error, setError]               = useState('')
  const [mpesaPending, setMpesaPending] = useState(null)
  const [polling, setPolling]           = useState(false)
  const [pollCount, setPollCount]       = useState(0)

  useEffect(() => {
    if (!mpesaPending) return
    if (pollCount >= 12) {
      setPolling(false)
      setError('Payment timed out. If you completed the payment, it will reflect shortly.')
      return
    }
    const timer = setTimeout(async () => {
      try {
        const r = await api.post('/billing/mpesa/query', null, {
          params: { checkout_request_id: mpesaPending.checkoutRequestId }
        })
        const code = r.data?.ResultCode
        if (code === 0) {
          window.location.href = '/billing/success?plan=' + plan.key
        } else if (code !== undefined && code !== 1032) {
          setMpesaPending(null); setPolling(false)
          setError('Payment failed. Please try again.')
        } else {
          setPollCount(c => c + 1)
        }
      } catch { setPollCount(c => c + 1) }
    }, 5000)
    return () => clearTimeout(timer)
  }, [mpesaPending, pollCount])

  const handleMpesa = async () => {
    if (!phone.trim()) { setError('Enter your M-Pesa phone number'); return }
    setLoading(true); setError('')
    try {
      const r = await api.post('/billing/mpesa/pay', { phone, plan: plan.key })
      setMpesaPending({ checkoutRequestId: r.data.checkout_request_id })
      setPolling(true); setPollCount(0)
    } catch (err) { setError(err.response?.data?.detail ?? 'M-Pesa request failed') }
    finally { setLoading(false) }
  }

  const handleStripe = async () => {
    setLoading(true); setError('')
    try {
      const r = await api.post('/billing/stripe/checkout', { plan: plan.key })
      window.location.href = r.data.checkout_url
    } catch (err) { setError(err.response?.data?.detail ?? 'Stripe checkout failed') }
    finally { setLoading(false) }
  }

  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, zIndex: 50,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 16, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        width: '100%', maxWidth: 440,
        background: 'var(--color-base-50)',
        border: '1px solid var(--color-border)',
        borderRadius: 8, overflow: 'hidden',
        maxHeight: '90vh', overflowY: 'auto',
      }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--color-border)' }}>
          <p style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15, color: 'var(--color-text)', margin: 0 }}>
            Upgrade to {plan.name}
          </p>
          <p style={{ fontSize: 12, color: 'var(--color-muted)', marginTop: 3 }}>
            KES {plan.price.toLocaleString()} / month · 30 days access
          </p>
        </div>

        <div style={{ padding: '20px' }}>
          {error && <Alert type="error" message={error} onClose={() => setError('')} />}

          {mpesaPending ? (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div style={{
                width: 40, height: 40, borderRadius: '50%', margin: '0 auto 20px',
                border: '3px solid var(--color-border)',
                borderTopColor: 'var(--color-accent)',
                animation: 'spin 1s linear infinite',
              }} />
              <p style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15, color: 'var(--color-text)', margin: '0 0 10px' }}>
                Check Your Phone
              </p>
              <p style={{ fontSize: 13, color: 'var(--color-muted)', lineHeight: 1.7, margin: '0 0 20px' }}>
                An M-Pesa prompt has been sent to <strong>{phone}</strong>.
                Enter your PIN to complete the payment.
              </p>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontSize: 12, color: 'var(--color-muted)' }}>
                <Spinner size={14} />
                Waiting for confirmation… ({pollCount}/12)
              </div>
              <button onClick={() => { setMpesaPending(null); setPolling(false) }} style={{
                marginTop: 20, fontSize: 12, color: 'var(--color-muted)',
                background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline',
              }}>
                Cancel
              </button>
            </div>

          ) : !method ? (
            <>
              <p style={{ fontSize: 13, color: 'var(--color-muted)', marginBottom: 16 }}>Choose your payment method:</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  { key: 'mpesa',  icon: <Smartphone size={18} color="var(--color-accent)" />, label: 'M-Pesa', sub: 'Pay via STK Push to your phone', bg: 'rgba(110,231,183,0.1)', border: 'rgba(110,231,183,0.2)', hover: 'var(--color-accent)' },
                  { key: 'stripe', icon: <CreditCard size={18} color="var(--color-info)" />,   label: 'Card (Stripe)', sub: 'Pay with Visa, Mastercard or any card', bg: 'rgba(96,165,250,0.1)', border: 'rgba(96,165,250,0.2)', hover: 'var(--color-info)' },
                ].map(m => (
                  <button key={m.key} onClick={() => setMethod(m.key)} style={{
                    display: 'flex', alignItems: 'center', gap: 14,
                    padding: '14px 16px', borderRadius: 6, cursor: 'pointer',
                    background: 'var(--color-base)', border: '1px solid var(--color-border)',
                    transition: 'border-color .15s', width: '100%',
                  }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = m.hover}
                    onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--color-border)'}
                  >
                    <div style={{ width: 36, height: 36, borderRadius: 8, background: m.bg, border: `1px solid ${m.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {m.icon}
                    </div>
                    <div style={{ textAlign: 'left' }}>
                      <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text)', margin: 0 }}>{m.label}</p>
                      <p style={{ fontSize: 12, color: 'var(--color-muted)', margin: '2px 0 0' }}>{m.sub}</p>
                    </div>
                  </button>
                ))}
              </div>
              <div style={{ marginTop: 16 }}>
                <BtnGhost style={{ width: '100%' }} onClick={onClose}>Cancel</BtnGhost>
              </div>
            </>

          ) : method === 'mpesa' ? (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
                <button onClick={() => setMethod(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-muted)', fontSize: 18, padding: 0, lineHeight: 1 }}>←</button>
                <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text)', margin: 0 }}>Pay with M-Pesa</p>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 16 }}>
                <label style={{ fontSize: 10, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  M-Pesa Phone Number
                </label>
                <input
                  value={phone} onChange={e => setPhone(e.target.value)}
                  placeholder="0712 345 678"
                  style={{
                    width: '100%', padding: '9px 12px', borderRadius: 4,
                    background: 'var(--color-base)', border: '1px solid var(--color-border)',
                    color: 'var(--color-text)', fontSize: 14,
                    fontFamily: 'var(--font-mono)', outline: 'none', boxSizing: 'border-box',
                  }}
                  onFocus={e => e.target.style.borderColor = 'var(--color-accent)'}
                  onBlur={e => e.target.style.borderColor = 'var(--color-border)'}
                />
                <p style={{ fontSize: 11, color: 'var(--color-muted)' }}>
                  You'll receive an STK push prompt. Enter your PIN to pay KES {plan.price.toLocaleString()}.
                </p>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <BtnGhost style={{ flex: 1 }} onClick={() => setMethod(null)}>Back</BtnGhost>
                <BtnPrimary style={{ flex: 1 }} onClick={handleMpesa} disabled={loading}>
                  {loading ? <Spinner size={14} /> : 'Send STK Push'}
                </BtnPrimary>
              </div>
            </>

          ) : (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
                <button onClick={() => setMethod(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-muted)', fontSize: 18, padding: 0, lineHeight: 1 }}>←</button>
                <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text)', margin: 0 }}>Pay with Card</p>
              </div>
              <div style={{ background: 'var(--color-base)', border: '1px solid var(--color-border)', borderRadius: 6, padding: 16, marginBottom: 20 }}>
                {[['Plan', `Operix ${plan.name}`], ['Duration', '30 days']].map(([k, v]) => (
                  <div key={k} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ fontSize: 13, color: 'var(--color-muted)' }}>{k}</span>
                    <span style={{ fontSize: 13, color: 'var(--color-text)', fontWeight: 500 }}>{v}</span>
                  </div>
                ))}
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 10, borderTop: '1px solid var(--color-border)' }}>
                  <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text)' }}>Total</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 16, color: 'var(--color-accent)', fontWeight: 600 }}>KES {plan.price.toLocaleString()}</span>
                </div>
              </div>
              <p style={{ fontSize: 12, color: 'var(--color-muted)', marginBottom: 16 }}>
                You'll be redirected to Stripe's secure checkout page to complete payment.
              </p>
              <div style={{ display: 'flex', gap: 8 }}>
                <BtnGhost style={{ flex: 1 }} onClick={() => setMethod(null)}>Back</BtnGhost>
                <BtnPrimary style={{ flex: 1 }} onClick={handleStripe} disabled={loading}>
                  {loading ? <Spinner size={14} /> : 'Continue to Stripe →'}
                </BtnPrimary>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}