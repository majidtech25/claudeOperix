import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Boxes, ShoppingCart,
  BarChart2, Users, LogOut, ChevronLeft, ChevronRight,
  Sun, Moon, CreditCard, Settings
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'

const NAV = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/inventory',  icon: Boxes,           label: 'Inventory'  },
  { to: '/sales',      icon: ShoppingCart,    label: 'Sales'      },
  { to: '/reports',    icon: BarChart2,        label: 'Reports'    },
  { to: '/team',       icon: Users,           label: 'Team'       },
  { to: '/billing',    icon: CreditCard,      label: 'Billing'    },
  { to: '/settings', icon: Settings, label: 'Settings' },
]

export default function Sidebar() {
  const [open, setOpen]   = useState(true)
  const { user, logout }  = useAuth()
  const { theme, toggle } = useTheme()
  const navigate          = useNavigate()
  const W = open ? 210 : 52
  const isDark = theme === 'dark'

  return (
    <aside style={{
      width: W, minWidth: W, height: '100vh', flexShrink: 0,
      background: 'var(--color-base-50)',
      borderRight: '1px solid var(--color-border)',
      display: 'flex', flexDirection: 'column',
      transition: 'width .18s ease, min-width .18s ease',
      overflow: 'hidden',
    }}>

      {/* Logo */}
      <div style={{
        height: 52, display: 'flex', alignItems: 'center',
        justifyContent: open ? 'space-between' : 'center',
        padding: open ? '0 14px 0 16px' : '0',
        borderBottom: '1px solid var(--color-border)', flexShrink: 0,
      }}>
        {open && (
          <span style={{
            fontFamily: 'var(--font-display)', fontWeight: 800,
            fontSize: 18, color: 'var(--color-text)', letterSpacing: '-0.03em',
          }}>
            Oper<span style={{ color: 'var(--color-accent)' }}>ix</span>
          </span>
        )}
        <button onClick={() => setOpen(o => !o)} style={{
          background: 'none', border: 'none', cursor: 'pointer',
          padding: 6, color: 'var(--color-muted)',
          display: 'flex', borderRadius: 4,
          transition: 'color .15s',
        }}
          onMouseEnter={e => e.currentTarget.style.color = 'var(--color-text)'}
          onMouseLeave={e => e.currentTarget.style.color = 'var(--color-muted)'}
        >
          {open ? <ChevronLeft size={15} /> : <ChevronRight size={15} />}
        </button>
      </div>

      {/* Nav */}
      <nav style={{
        flex: 1, padding: '10px 8px',
        display: 'flex', flexDirection: 'column', gap: 2, overflowY: 'auto',
      }}>
        {open && (
          <p style={{
            fontSize: 9, color: 'var(--color-muted)', textTransform: 'uppercase',
            letterSpacing: '0.1em', padding: '4px 6px 8px',
            fontFamily: 'var(--font-sans)',
          }}>Menu</p>
        )}
        {NAV.map(({ to, icon: Icon, label }) => (
          <NavLink key={to} to={to} title={!open ? label : undefined}
            style={({ isActive }) => ({
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '8px 8px', borderRadius: 4, border: 'none',
              cursor: 'pointer', textDecoration: 'none', fontSize: 13,
              fontFamily: 'var(--font-sans)',
              justifyContent: open ? 'flex-start' : 'center',
              color: isActive ? 'var(--color-accent)' : 'var(--color-muted)',
              background: isActive ? isDark
                ? 'rgba(110,231,183,0.07)'
                : 'rgba(5,150,105,0.08)'
                : 'transparent',
              borderLeft: isActive && open
                ? '2px solid var(--color-accent)'
                : '2px solid transparent',
            })}
          >
            <Icon size={16} style={{ flexShrink: 0 }} />
            {open && <span>{label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div style={{ padding: 8, borderTop: '1px solid var(--color-border)', flexShrink: 0 }}>

        {/* User info */}
        {open && user && (
          <div style={{ padding: '6px 10px 10px' }}>
            <p style={{
              fontSize: 13, color: 'var(--color-text)', fontWeight: 500,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>{user.full_name}</p>
            <p style={{
              fontSize: 11, color: 'var(--color-muted)',
              fontFamily: 'var(--font-mono)', marginTop: 2,
            }}>{user.role}</p>
          </div>
        )}

        {/* Theme toggle */}
        <button
          onClick={toggle}
          title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          style={{
            display: 'flex', alignItems: 'center', gap: 10,
            width: '100%', padding: '8px 8px', borderRadius: 4,
            border: 'none', cursor: 'pointer', fontSize: 13,
            fontFamily: 'var(--font-sans)',
            justifyContent: open ? 'flex-start' : 'center',
            background: isDark ? 'rgba(251,191,36,0.06)' : 'rgba(99,102,241,0.07)',
            color: isDark ? 'var(--color-warning)' : 'var(--color-info)',
            marginBottom: 2,
            transition: 'all .15s',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = isDark
              ? 'rgba(251,191,36,0.12)'
              : 'rgba(99,102,241,0.14)'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = isDark
              ? 'rgba(251,191,36,0.06)'
              : 'rgba(99,102,241,0.07)'
          }}
        >
          {isDark
            ? <Sun  size={15} style={{ flexShrink: 0 }} />
            : <Moon size={15} style={{ flexShrink: 0 }} />
          }
          {open && (
            <span>{isDark ? 'Light Mode' : 'Dark Mode'}</span>
          )}
        </button>

        {/* Logout */}
        <button
          onClick={() => { logout(); navigate('/login') }}
          title={!open ? 'Logout' : undefined}
          style={{
            display: 'flex', alignItems: 'center', gap: 10,
            width: '100%', padding: '8px 8px', borderRadius: 4,
            border: 'none', background: 'transparent', cursor: 'pointer',
            color: 'var(--color-muted)', fontSize: 13,
            fontFamily: 'var(--font-sans)',
            justifyContent: open ? 'flex-start' : 'center',
            transition: 'all .15s',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.color = 'var(--color-danger)'
            e.currentTarget.style.background = isDark
              ? 'rgba(248,113,113,0.07)'
              : 'rgba(220,38,38,0.07)'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.color = 'var(--color-muted)'
            e.currentTarget.style.background = 'transparent'
          }}
        >
          <LogOut size={15} style={{ flexShrink: 0 }} />
          {open && <span>Logout</span>}
        </button>
      </div>
    </aside>
  )
}