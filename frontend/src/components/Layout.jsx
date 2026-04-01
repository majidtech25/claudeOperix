import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import { Shield, X } from 'lucide-react'

const isMobileDevice = () => window.innerWidth < 640

export default function Layout() {
  const impersonateOrg  = localStorage.getItem('impersonate_org')
  const isImpersonating = !!localStorage.getItem('impersonate_token')
  const orgName = impersonateOrg ? JSON.parse(impersonateOrg).name : ''
  const isMobile = isMobileDevice()

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
          padding: '8px 16px', flexShrink: 0, flexWrap: 'wrap', gap: 8,
          background: 'rgba(251,191,36,0.12)',
          borderBottom: '1px solid rgba(251,191,36,0.35)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
            <Shield size={14} color="#fbbf24" style={{ flexShrink: 0 }} />
            <span style={{ fontSize: 12, color: '#fbbf24', fontFamily: 'var(--font-sans)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              <strong>Support Session</strong> — Viewing <strong>{orgName}</strong>
            </span>
          </div>
          <button onClick={stopImpersonating} style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: 'rgba(251,191,36,0.15)',
            border: '1px solid rgba(251,191,36,0.35)',
            borderRadius: 4, padding: '4px 10px', flexShrink: 0,
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
        {/* Sidebar — hidden on mobile (replaced by bottom nav) */}
        {!isMobile && <Sidebar />}

        {/* Main content */}
        <main style={{
          flex: 1,
          overflowY: 'auto',
          padding: isMobile ? '16px 16px 76px' : 28,
          // 76px bottom padding on mobile = 60px nav bar + 16px gap
        }} className="page-enter">
          <Outlet />
        </main>
      </div>

      {/* Mobile bottom nav rendered here so it's always on top */}
      {isMobile && <Sidebar />}
    </div>
  )
}