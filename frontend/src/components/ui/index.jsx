import { X, AlertCircle, CheckCircle2, Package } from 'lucide-react'

export const fmt = (v) =>
  new Intl.NumberFormat('en-KE', {
    style: 'currency', currency: 'KES', maximumFractionDigits: 0
  }).format(v || 0)

export function Spinner({ size = 20 }) {
  return (
    <div className="spin" style={{
      width: size, height: size, borderRadius: '50%',
      border: `2px solid var(--color-border)`,
      borderTopColor: 'var(--color-accent)',
      display: 'inline-block'
    }} />
  )
}

export function PageLoader() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 220 }}>
      <Spinner size={28} />
    </div>
  )
}

export function Alert({ type = 'error', message, onClose }) {
  if (!message) return null
  const map = {
    error:   { bg: 'rgba(248,113,113,.08)',  border: 'rgba(248,113,113,.3)',  color: 'var(--color-danger)'  },
    success: { bg: 'rgba(110,231,183,.08)',  border: 'rgba(110,231,183,.3)', color: 'var(--color-accent)'  },
    warning: { bg: 'rgba(251,191,36,.08)',   border: 'rgba(251,191,36,.3)',  color: 'var(--color-warning)' },
    info:    { bg: 'rgba(96,165,250,.08)',   border: 'rgba(96,165,250,.3)',  color: 'var(--color-info)'    },
  }
  const s = map[type]
  const Icon = type === 'success' ? CheckCircle2 : AlertCircle
  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', gap: 8,
      padding: '8px 12px', borderRadius: 4,
      background: s.bg, border: `1px solid ${s.border}`,
      color: s.color, fontSize: 13
    }}>
      <Icon size={14} style={{ marginTop: 1, flexShrink: 0 }} />
      <span style={{ flex: 1 }}>{message}</span>
      {onClose && (
        <X size={13} onClick={onClose}
          style={{ cursor: 'pointer', opacity: .6, marginTop: 1, flexShrink: 0 }} />
      )}
    </div>
  )
}

export function Modal({ open, onClose, title, children, width = 480 }) {
  if (!open) return null
  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, zIndex: 50,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 16, background: 'rgba(0,0,0,.6)', backdropFilter: 'blur(4px)'
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        position: 'relative', width: '100%', maxWidth: width,
        background: 'var(--color-base-50)',
        border: '1px solid var(--color-border)',
        borderRadius: 6, boxShadow: '0 32px 80px rgba(0,0,0,.5)'
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '14px 20px', borderBottom: '1px solid var(--color-border)'
        }}>
          <span style={{
            fontFamily: 'var(--font-display)', fontWeight: 700,
            fontSize: 14, color: 'white'
          }}>{title}</span>
          <button onClick={onClose} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--color-muted)', display: 'flex', padding: 2
          }}>
            <X size={15} />
          </button>
        </div>
        <div style={{ padding: '18px 20px' }}>{children}</div>
      </div>
    </div>
  )
}

export function Field({ label, error, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      {label && (
        <label style={{
          fontSize: 10, color: 'var(--color-muted)',
          textTransform: 'uppercase', letterSpacing: '0.08em',
          fontFamily: 'var(--font-sans)'
        }}>{label}</label>
      )}
      {children}
      {error && (
        <p style={{ fontSize: 11, color: 'var(--color-danger)', marginTop: 2 }}>{error}</p>
      )}
    </div>
  )
}

const inputBase = {
  width: '100%', background: 'var(--color-base)',
  border: '1px solid var(--color-border)',
  color: 'white', fontSize: 13, padding: '7px 10px',
  borderRadius: 4, fontFamily: 'var(--font-sans)', outline: 'none',
  boxSizing: 'border-box'
}

export function Input({ style: extra = {}, ...props }) {
  return (
    <input
      style={{ ...inputBase, ...extra }}
      onFocus={e => e.target.style.borderColor = 'rgba(110,231,183,.5)'}
      onBlur={e  => e.target.style.borderColor = 'var(--color-border)'}
      {...props}
    />
  )
}

export function Select({ style: extra = {}, children, ...props }) {
  return (
    <select style={{ ...inputBase, cursor: 'pointer', ...extra }} {...props}>
      {children}
    </select>
  )
}

export function BtnPrimary({ children, style: extra = {}, ...props }) {
  return (
    <button style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      gap: 6, padding: '7px 16px', borderRadius: 4, border: 'none',
      background: 'var(--color-accent)', color: 'var(--color-base)',
      fontSize: 13, fontWeight: 600, fontFamily: 'var(--font-sans)',
      cursor: 'pointer', ...extra
    }}
      onMouseEnter={e => e.currentTarget.style.background = 'var(--color-accent-dim)'}
      onMouseLeave={e => e.currentTarget.style.background = 'var(--color-accent)'}
      {...props}
    >
      {children}
    </button>
  )
}

export function BtnGhost({ children, style: extra = {}, ...props }) {
  return (
    <button style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      gap: 6, padding: '7px 16px', borderRadius: 4,
      background: 'transparent', color: 'var(--color-muted)',
      border: '1px solid var(--color-border)',
      fontSize: 13, fontFamily: 'var(--font-sans)',
      cursor: 'pointer', ...extra
    }}
      onMouseEnter={e => e.currentTarget.style.color = 'white'}
      onMouseLeave={e => e.currentTarget.style.color = 'var(--color-muted)'}
      {...props}
    >
      {children}
    </button>
  )
}

export function BtnDanger({ children, style: extra = {}, ...props }) {
  return (
    <button style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      gap: 6, padding: '7px 16px', borderRadius: 4,
      background: 'rgba(248,113,113,.08)', color: 'var(--color-danger)',
      border: '1px solid rgba(248,113,113,.3)',
      fontSize: 13, fontFamily: 'var(--font-sans)',
      cursor: 'pointer', ...extra
    }}
      onMouseEnter={e => e.currentTarget.style.background = 'rgba(248,113,113,.15)'}
      onMouseLeave={e => e.currentTarget.style.background = 'rgba(248,113,113,.08)'}
      {...props}
    >
      {children}
    </button>
  )
}

export function Badge({ status, label }) {
  const map = {
    active:    ['rgba(110,231,183,.1)', 'rgba(110,231,183,.25)', '#6ee7b7'],
    open:      ['rgba(110,231,183,.1)', 'rgba(110,231,183,.25)', '#6ee7b7'],
    trial:     ['rgba(251,191,36,.1)',  'rgba(251,191,36,.25)',  '#fbbf24'],
    basic:     ['rgba(96,165,250,.1)',  'rgba(96,165,250,.25)',  '#60a5fa'],
    pro:       ['rgba(110,231,183,.1)', 'rgba(110,231,183,.25)', '#6ee7b7'],
    expired:   ['rgba(248,113,113,.1)', 'rgba(248,113,113,.25)', '#f87171'],
    suspended: ['rgba(248,113,113,.1)', 'rgba(248,113,113,.25)', '#f87171'],
    closed:    ['rgba(100,116,139,.1)', 'rgba(100,116,139,.25)', '#64748b'],
    inactive:  ['rgba(100,116,139,.1)', 'rgba(100,116,139,.25)', '#64748b'],
    owner:     ['rgba(110,231,183,.1)', 'rgba(110,231,183,.25)', '#6ee7b7'],
    employee:  ['rgba(96,165,250,.1)',  'rgba(96,165,250,.25)',  '#60a5fa'],
  }
  const [bg, border, color] = map[status] ?? ['rgba(100,116,139,.1)', 'rgba(100,116,139,.25)', '#64748b']
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      padding: '2px 8px', borderRadius: 3,
      background: bg, border: `1px solid ${border}`, color,
      fontSize: 11, fontFamily: 'var(--font-mono)'
    }}>
      {label ?? status}
    </span>
  )
}

export function StatCard({ label, value, sub, accent, icon: Icon }) {
  return (
    <div style={{
      background: 'var(--color-base-50)',
      border: '1px solid var(--color-border)',
      borderRadius: 6, padding: '18px 20px',
      display: 'flex', flexDirection: 'column', gap: 4
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
        <span style={{
          fontSize: 10, color: 'var(--color-muted)',
          textTransform: 'uppercase', letterSpacing: '0.08em'
        }}>{label}</span>
        {Icon && <Icon size={13} color="var(--color-muted)" />}
      </div>
      <span style={{
        fontFamily: 'var(--font-mono)', fontSize: 22,
        color: accent ? 'var(--color-accent)' : 'white', fontWeight: 500
      }}>{value}</span>
      {sub && <span style={{ fontSize: 12, color: 'var(--color-muted)' }}>{sub}</span>}
    </div>
  )
}

export function Empty({ icon: Icon = Package, title, description, action }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', padding: '52px 24px',
      textAlign: 'center', gap: 8
    }}>
      <Icon size={28} color="var(--color-muted)" style={{ marginBottom: 4 }} />
      <p style={{
        fontFamily: 'var(--font-display)', fontWeight: 700,
        fontSize: 13, color: 'rgba(255,255,255,.5)'
      }}>{title}</p>
      {description && (
        <p style={{ fontSize: 12, color: 'var(--color-muted)', maxWidth: 300 }}>{description}</p>
      )}
      {action && <div style={{ marginTop: 12 }}>{action}</div>}
    </div>
  )
}