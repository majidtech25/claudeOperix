import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import { Shield, X } from 'lucide-react'

export default function Layout() {
  const impersonateOrg = localStorage.getItem('impersonate_org')
  const isImpersonating = !!localStorage.getItem('impersonate_token')
  const orgName = impersonateOrg ? JSON.parse(impersonateOrg).name : ''

  const stopImpersonating = () => {
    localStorage.removeItem('impersonate_token')
    localStorage.removeItem('impersonate_org')
    window.location.href = '/admin/dashboard'
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>

      {/* Impersonation banner */}
      {isImpersonating && (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '8px 20px', flexShrink: 0,
          background: 'rgba(251,191,36,0.12)',
          borderBottom: '1px solid rgba(251,191,36,0.35)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Shield size={14} color="#fbbf24" />
            <span style={{ fontSize: 12, color: '#fbbf24', fontFamily: 'var(--font-sans)' }}>
              <strong>Support Session</strong> — You are viewing{' '}
              <strong>{orgName}</strong> as their account owner.
              All actions are logged against your admin ID.
            </span>
          </div>
          <button onClick={stopImpersonating} style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: 'rgba(251,191,36,0.15)',
            border: '1px solid rgba(251,191,36,0.35)',
            borderRadius: 4, padding: '4px 10px',
            cursor: 'pointer', color: '#fbbf24', fontSize: 12,
            fontFamily: 'var(--font-sans)',
          }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(251,191,36,0.25)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(251,191,36,0.15)'}
          >
            <X size={12} /> End Session
          </button>
        </div>
      )}

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <Sidebar />
        <main style={{ flex: 1, overflowY: 'auto', padding: 28 }} className="page-enter">
          <Outlet />
        </main>
      </div>
    </div>
  )
}