import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Boxes, ShoppingCart,
  BarChart2, Users, LogOut, ChevronLeft, ChevronRight
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const NAV = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/inventory',  icon: Boxes,           label: 'Inventory'  },
  { to: '/sales',      icon: ShoppingCart,    label: 'Sales'      },
  { to: '/reports',    icon: BarChart2,        label: 'Reports'    },
  { to: '/team',       icon: Users,           label: 'Team'       },
]

export default function Sidebar() {
  const [open, setOpen] = useState(true)
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const W = open ? 210 : 52

  return (
    <aside style={{
      width: W, minWidth: W, height: '100vh', flexShrink: 0,
      background: 'var(--color-base-50)',
      borderRight: '1px solid var(--color-border)',
      display: 'flex', flexDirection: 'column',
      transition: 'width .18s ease, min-width .18s ease',
      overflow: 'hidden'
    }}>

      {/* Logo */}
      <div style={{
        height: 52, display: 'flex', alignItems: 'center',
        justifyContent: open ? 'space-between' : 'center',
        padding: open ? '0 14px 0 16px' : '0',
        borderBottom: '1px solid var(--color-border)', flexShrink: 0
      }}>
        {open && (
          <span style={{
            fontFamily: 'var(--font-display)', fontWeight: 800,
            fontSize: 18, color: 'white', letterSpacing: '-0.03em'
          }}>
            Oper<span style={{ color: 'var(--color-accent)' }}>ix</span>
          </span>
        )}
        <button onClick={() => setOpen(o => !o)} style={{
          background: 'none', border: 'none', cursor: 'pointer',
          padding: 6, color: 'var(--color-muted)', display: 'flex', borderRadius: 4
        }}
          onMouseEnter={e => e.currentTarget.style.color = 'white'}
          onMouseLeave={e => e.currentTarget.style.color = 'var(--color-muted)'}
        >
          {open ? <ChevronLeft size={15} /> : <ChevronRight size={15} />}
        </button>
      </div>

      {/* Nav */}
      <nav style={{
        flex: 1, padding: '10px 8px',
        display: 'flex', flexDirection: 'column', gap: 2, overflowY: 'auto'
      }}>
        {open && (
          <p style={{
            fontSize: 9, color: 'var(--color-muted)', textTransform: 'uppercase',
            letterSpacing: '0.1em', padding: '4px 6px 8px',
            fontFamily: 'var(--font-sans)'
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
              background: isActive ? 'rgba(110,231,183,0.07)' : 'transparent',
              borderLeft: isActive && open ? '2px solid var(--color-accent)' : '2px solid transparent',
            })}
          >
            <Icon size={16} style={{ flexShrink: 0 }} />
            {open && <span>{label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* User + logout */}
      <div style={{ padding: 8, borderTop: '1px solid var(--color-border)', flexShrink: 0 }}>
        {open && user && (
          <div style={{ padding: '6px 10px 10px' }}>
            <p style={{
              fontSize: 13, color: 'white', fontWeight: 500,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
            }}>{user.full_name}</p>
            <p style={{
              fontSize: 11, color: 'var(--color-muted)',
              fontFamily: 'var(--font-mono)', marginTop: 2
            }}>{user.role}</p>
          </div>
        )}
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
          }}
          onMouseEnter={e => {
            e.currentTarget.style.color = 'var(--color-danger)'
            e.currentTarget.style.background = 'rgba(248,113,113,0.07)'
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