import { useNavigate } from 'react-router-dom'
import { XCircle } from 'lucide-react'

export default function BillingCancel() {
  const navigate = useNavigate()
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
        <XCircle size={52} color="var(--color-muted)" style={{ margin: '0 auto 24px', display: 'block' }} />
        <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20, color: 'var(--color-text)', margin: '0 0 10px' }}>
          Payment Cancelled
        </h2>
        <p style={{ fontSize: 14, color: 'var(--color-muted)', marginBottom: 32, lineHeight: 1.7 }}>
          You cancelled the payment. Your current plan is unchanged. You can upgrade anytime.
        </p>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => navigate('/dashboard')} style={{
            flex: 1, padding: '11px 20px', borderRadius: 5,
            background: 'transparent', color: 'var(--color-muted)',
            border: '1px solid var(--color-border)', fontWeight: 500,
            fontSize: 14, fontFamily: 'var(--font-sans)', cursor: 'pointer',
          }}>
            Dashboard
          </button>
          <button onClick={() => navigate('/billing')} style={{
            flex: 1, padding: '11px 20px', borderRadius: 5,
            background: 'var(--color-accent)', color: '#ffffff',
            border: 'none', fontWeight: 600, fontSize: 14,
            fontFamily: 'var(--font-sans)', cursor: 'pointer',
          }}>
            View Plans
          </button>
        </div>
      </div>
    </div>
  )
}