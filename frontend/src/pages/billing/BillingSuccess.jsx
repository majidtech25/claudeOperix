import { useEffect, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { CheckCircle2, XCircle, Loader } from 'lucide-react'
import api from '../../api/client'

export default function BillingSuccess() {
  const [params]   = useSearchParams()
  const navigate   = useNavigate()
  const [status, setStatus] = useState('verifying') // verifying | success | failed

  useEffect(() => {
    const sessionId = params.get('session_id')
    const plan      = params.get('plan')

    if (!sessionId) { setStatus('failed'); return }

    api.get(`/billing/stripe/verify?session_id=${sessionId}`)
      .then(r => {
        if (r.data.status === 'success') setStatus('success')
        else setStatus('failed')
      })
      .catch(() => setStatus('failed'))
  }, [])

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', background: 'var(--color-base)',
      fontFamily: 'var(--font-sans)',
    }}>
      <div style={{
        background: 'var(--color-base-50)', border: '1px solid var(--color-border)',
        borderRadius: 10, padding: '52px 48px', maxWidth: 440, width: '100%',
        textAlign: 'center',
      }}>
        {status === 'verifying' && (
          <>
            <div className="spin" style={{
              width: 48, height: 48, borderRadius: '50%', margin: '0 auto 24px',
              border: '3px solid var(--color-border)',
              borderTopColor: 'var(--color-accent)',
            }} />
            <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20, color: 'var(--color-text)', margin: '0 0 10px' }}>
              Verifying Payment…
            </h2>
            <p style={{ fontSize: 14, color: 'var(--color-muted)' }}>Please wait while we confirm your payment.</p>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircle2 size={52} color="var(--color-accent)" style={{ margin: '0 auto 24px', display: 'block' }} />
            <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20, color: 'var(--color-text)', margin: '0 0 10px' }}>
              Payment Successful!
            </h2>
            <p style={{ fontSize: 14, color: 'var(--color-muted)', marginBottom: 32, lineHeight: 1.7 }}>
              Your subscription has been upgraded. You now have full access to all features in your plan.
            </p>
            <button onClick={() => navigate('/dashboard')} style={{
              width: '100%', padding: '11px 20px', borderRadius: 5,
              background: 'var(--color-accent)', color: '#ffffff',
              border: 'none', fontWeight: 600, fontSize: 14,
              fontFamily: 'var(--font-sans)', cursor: 'pointer',
            }}>
              Go to Dashboard →
            </button>
          </>
        )}

        {status === 'failed' && (
          <>
            <XCircle size={52} color="var(--color-danger)" style={{ margin: '0 auto 24px', display: 'block' }} />
            <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20, color: 'var(--color-text)', margin: '0 0 10px' }}>
              Payment Failed
            </h2>
            <p style={{ fontSize: 14, color: 'var(--color-muted)', marginBottom: 32, lineHeight: 1.7 }}>
              Something went wrong with your payment. No charges were made. Please try again.
            </p>
            <button onClick={() => navigate('/billing')} style={{
              width: '100%', padding: '11px 20px', borderRadius: 5,
              background: 'var(--color-accent)', color: '#ffffff',
              border: 'none', fontWeight: 600, fontSize: 14,
              fontFamily: 'var(--font-sans)', cursor: 'pointer',
            }}>
              Try Again
            </button>
          </>
        )}
      </div>
    </div>
  )
}