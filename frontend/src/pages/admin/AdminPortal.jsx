import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Settings, Shield, LayoutDashboard, Building2, CreditCard,
  LogOut, Search, ChevronRight, TrendingUp, Users,
  Package, ShoppingCart, CheckCircle2, XCircle,
  RefreshCw, Eye, AlertTriangle, X
} from 'lucide-react'
import { superAdminApi } from '../../api/adminServices'

const fmt = v => new Intl.NumberFormat('en-KE', {
  style: 'currency', currency: 'KES', maximumFractionDigits: 0
}).format(v || 0)

const fmtDate = d => d ? new Date(d).toLocaleDateString('en-KE', {
  year: 'numeric', month: 'short', day: 'numeric'
}) : '—'

// ── Layout ─────────────────────────────────────────────────────────────────────
function AdminLayout({ children, page, setPage }) {
  const navigate  = useNavigate()
  const adminUser = JSON.parse(localStorage.getItem('admin_user') || '{}')

  const logout = () => {
    localStorage.removeItem('admin_access_token')
    localStorage.removeItem('admin_user')
    navigate('/admin/login')
  }

  const NAV = [
    { id: 'dashboard',     icon: LayoutDashboard, label: 'Dashboard'     },
    { id: 'organizations', icon: Building2,        label: 'Organizations' },
    { id: 'subscriptions', icon: CreditCard,       label: 'Subscriptions' },
    { id: 'settings',      icon: Settings,         label: 'Settings'      },
  ]

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#0a0d14', fontFamily: '"Inter", sans-serif', overflow: 'hidden' }}>
      <aside style={{
        width: 220, flexShrink: 0, height: '100vh',
        background: 'rgba(255,255,255,0.02)',
        borderRight: '1px solid rgba(255,255,255,0.06)',
        display: 'flex', flexDirection: 'column',
      }}>
        <div style={{
          height: 56, display: 'flex', alignItems: 'center',
          padding: '0 18px', gap: 10,
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}>
          <Shield size={16} color="#60a5fa" />
          <span style={{
            fontFamily: '"Poppins", sans-serif', fontWeight: 800,
            fontSize: 17, letterSpacing: '-0.03em', color: 'white',
          }}>
            Oper<span style={{ color: '#60a5fa' }}>ix</span>
            <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', fontWeight: 400, marginLeft: 5, fontFamily: '"Inter", sans-serif' }}>
              ADMIN
            </span>
          </span>
        </div>

        <nav style={{ flex: 1, padding: '12px 8px', display: 'flex', flexDirection: 'column', gap: 2 }}>
          <p style={{ fontSize: 9, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: '0.1em', padding: '4px 8px 10px' }}>
            Platform
          </p>
          {NAV.map(({ id, icon: Icon, label }) => (
            <button key={id} onClick={() => setPage(id)} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '8px 10px', borderRadius: 5, border: 'none',
              background: page === id ? 'rgba(96,165,250,0.1)' : 'transparent',
              color: page === id ? '#60a5fa' : 'rgba(255,255,255,0.45)',
              fontSize: 13, cursor: 'pointer', width: '100%', textAlign: 'left',
              borderLeft: `2px solid ${page === id ? '#60a5fa' : 'transparent'}`,
              transition: 'all .15s',
            }}>
              <Icon size={15} style={{ flexShrink: 0 }} />
              {label}
            </button>
          ))}
        </nav>

        <div style={{ padding: 10, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ padding: '6px 8px 10px', cursor: 'pointer' }}
            onClick={() => setPage('settings')}
          >
            <p style={{ fontSize: 12, color: 'white', margin: '0 0 2px', fontWeight: 500 }}>{adminUser.full_name}</p>
            <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', margin: 0, fontFamily: '"DM Mono", monospace' }}>
              super_admin · <span style={{ color: '#60a5fa' }}>settings</span>
            </p>
          </div>
          <button onClick={logout} style={{
            display: 'flex', alignItems: 'center', gap: 8, width: '100%',
            padding: '8px 10px', borderRadius: 5, border: 'none',
            background: 'transparent', color: 'rgba(255,255,255,0.35)',
            fontSize: 13, cursor: 'pointer', transition: 'all .15s',
          }}
            onMouseEnter={e => { e.currentTarget.style.color = '#f87171'; e.currentTarget.style.background = 'rgba(248,113,113,0.07)' }}
            onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.35)'; e.currentTarget.style.background = 'transparent' }}
          >
            <LogOut size={14} /> Logout
          </button>
        </div>
      </aside>

      <main style={{ flex: 1, overflowY: 'auto', padding: 28, color: 'white' }}>
        {children}
      </main>
    </div>
  )
}

// ── Stat Card ──────────────────────────────────────────────────────────────────
function StatCard({ label, value, icon: Icon, accent, sub }) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.03)',
      border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: 8, padding: '18px 20px',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</span>
        {Icon && <Icon size={13} color="rgba(255,255,255,0.25)" />}
      </div>
      <p style={{
        fontFamily: '"DM Mono", monospace', fontSize: 24, margin: '0 0 4px',
        color: accent ? accent : 'white', fontWeight: 500,
      }}>{value}</p>
      {sub && <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', margin: 0 }}>{sub}</p>}
    </div>
  )
}

// ── Dashboard Page ─────────────────────────────────────────────────────────────
function DashboardPage() {
  const [stats, setStats]     = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState('')

  useEffect(() => {
    superAdminApi.stats()
      .then(r => setStats(r.data))
      .catch(() => setError('Failed to load stats. Check the backend is running and the admin router is registered.'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div style={{ color: 'rgba(255,255,255,0.4)', paddingTop: 60, textAlign: 'center' }}>Loading…</div>
  )

  if (error || !stats) return (
    <div style={{ padding: '16px 20px', borderRadius: 6, background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)', color: '#f87171', fontSize: 13 }}>
      {error || 'No data returned from server.'}
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <h1 style={{ fontFamily: '"Poppins", sans-serif', fontWeight: 800, fontSize: 22, margin: '0 0 4px' }}>Platform Dashboard</h1>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', margin: 0 }}>
          {new Date().toLocaleDateString('en-KE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>
        <StatCard label="Total Orgs"       value={stats.total_organizations}  icon={Building2}    />
        <StatCard label="Active Orgs"      value={stats.active_organizations} icon={CheckCircle2} accent="#6ee7b7" />
        <StatCard label="Total Users"      value={stats.total_users}          icon={Users}        />
        <StatCard label="Platform Revenue" value={fmt(stats.total_revenue)}   icon={TrendingUp}   accent="#60a5fa" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>
        <StatCard label="Total Sales"   value={stats.total_sales}  icon={ShoppingCart} />
        <StatCard label="Trial Orgs"    value={stats.trial_orgs}   sub="on free trial"  />
        <StatCard label="Basic Orgs"    value={stats.basic_orgs}   sub="KES 2,500/mo"   />
        <StatCard label="Pro Orgs"      value={stats.pro_orgs}     sub="KES 6,500/mo" accent="#fbbf24" />
      </div>

      {stats.suspended_organizations > 0 && (
        <div style={{
          padding: '12px 16px', borderRadius: 6,
          background: 'rgba(248,113,113,0.07)',
          border: '1px solid rgba(248,113,113,0.2)',
          display: 'flex', alignItems: 'center', gap: 10,
          fontSize: 13, color: '#f87171',
        }}>
          <AlertTriangle size={14} />
          {stats.suspended_organizations} organization{stats.suspended_organizations > 1 ? 's are' : ' is'} currently suspended
        </div>
      )}
    </div>
  )
}

// ── Organizations Page ─────────────────────────────────────────────────────────
function OrganizationsPage() {
  const [orgs, setOrgs]             = useState([])
  const [loading, setLoading]       = useState(true)
  const [search, setSearch]         = useState('')
  const [selected, setSelected]     = useState(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [msg, setMsg]               = useState('')
  const [impersonating, setImpersonating] = useState(null)

  const load = () => {
    setLoading(true)
    superAdminApi.listOrgs(search)
      .then(r => setOrgs(r.data))
      .finally(() => setLoading(false))
  }
  useEffect(() => { load() }, [search])

  const handleImpersonate = async (org) => {
    try {
      const { data } = await superAdminApi.impersonate(org.id)
      localStorage.setItem('impersonate_token', data.access_token)
      localStorage.setItem('impersonate_org', JSON.stringify({ id: org.id, name: org.name }))
      setImpersonating({ orgId: org.id, orgName: org.name, token: data.access_token })
      // Redirect to merchant app — full page reload so client.js picks up the new token
      window.location.href = '/dashboard'
    } catch (err) {
      setMsg('Failed to impersonate: ' + (err.response?.data?.detail ?? 'Unknown error'))
    }
  }

  const stopImpersonating = () => {
    localStorage.removeItem('impersonate_token')
    localStorage.removeItem('impersonate_org')
    window.location.href = '/admin/dashboard'
  }

  const handleActivate = async (orgId) => {
    setActionLoading(true)
    try {
      await superAdminApi.activateOrg(orgId)
      setMsg('Organization activated')
      load(); setSelected(null)
    } catch { setMsg('Failed') }
    finally { setActionLoading(false) }
  }

  const handleSuspend = async (orgId) => {
    if (!window.confirm('Suspend this organization? They will lose access immediately.')) return
    setActionLoading(true)
    try {
      await superAdminApi.suspendOrg(orgId)
      setMsg('Organization suspended')
      load(); setSelected(null)
    } catch { setMsg('Failed') }
    finally { setActionLoading(false) }
  }

  const row = { borderBottom: '1px solid rgba(255,255,255,0.05)' }
  const th  = { fontSize: 10, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.08em', padding: '10px 16px', textAlign: 'left', fontWeight: 400 }
  const td  = { fontSize: 13, color: 'rgba(255,255,255,0.75)', padding: '11px 16px' }

  const PlanBadge = ({ plan }) => {
    const map = { trial: '#fbbf24', basic: '#60a5fa', pro: '#6ee7b7' }
    return (
      <span style={{
        fontSize: 10, padding: '2px 8px', borderRadius: 3,
        background: `${map[plan]}18`, border: `1px solid ${map[plan]}44`,
        color: map[plan], fontFamily: '"DM Mono", monospace',
      }}>{plan}</span>
    )
  }

  const StatusBadge = ({ status, active }) => {
    if (!active) return (
      <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 3, background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)', color: '#f87171', fontFamily: '"DM Mono", monospace' }}>suspended</span>
    )
    const map = {
      active:    ['rgba(110,231,183,0.1)', 'rgba(110,231,183,0.3)', '#6ee7b7'],
      expired:   ['rgba(248,113,113,0.1)', 'rgba(248,113,113,0.3)', '#f87171'],
      suspended: ['rgba(248,113,113,0.1)', 'rgba(248,113,113,0.3)', '#f87171'],
    }
    const [bg, border, color] = map[status] ?? ['rgba(100,116,139,0.1)', 'rgba(100,116,139,0.3)', '#64748b']
    return <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 3, background: bg, border: `1px solid ${border}`, color, fontFamily: '"DM Mono", monospace' }}>{status}</span>
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {impersonating && (
        <div style={{
          padding: '12px 16px', borderRadius: 6,
          background: 'rgba(251,191,36,0.08)',
          border: '1px solid rgba(251,191,36,0.3)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Eye size={14} color="#fbbf24" />
            <span style={{ fontSize: 13, color: '#fbbf24', fontWeight: 500 }}>
              Viewing as: <strong>{impersonating.orgName}</strong> — Read Only Mode
            </span>
          </div>
          <button onClick={stopImpersonating} style={{
            background: 'rgba(251,191,36,0.15)', border: '1px solid rgba(251,191,36,0.3)',
            borderRadius: 4, padding: '4px 12px', color: '#fbbf24',
            fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
          }}>
            <X size={12} /> Exit View
          </button>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ fontFamily: '"Poppins", sans-serif', fontWeight: 800, fontSize: 22, margin: 0 }}>Organizations</h1>
        <button onClick={load} style={{
          display: 'flex', alignItems: 'center', gap: 6,
          background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 5, padding: '7px 14px', color: 'rgba(255,255,255,0.6)',
          fontSize: 13, cursor: 'pointer',
        }}>
          <RefreshCw size={13} /> Refresh
        </button>
      </div>

      {msg && (
        <div style={{ padding: '9px 12px', borderRadius: 4, background: 'rgba(110,231,183,0.08)', border: '1px solid rgba(110,231,183,0.2)', fontSize: 13, color: '#6ee7b7', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {msg} <X size={13} style={{ cursor: 'pointer' }} onClick={() => setMsg('')} />
        </div>
      )}

      <div style={{ position: 'relative', maxWidth: 320 }}>
        <Search size={13} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)', pointerEvents: 'none' }} />
        <input
          placeholder="Search name or email…"
          value={search} onChange={e => setSearch(e.target.value)}
          style={{
            width: '100%', background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 5, padding: '8px 12px 8px 32px',
            color: 'white', fontSize: 13, fontFamily: '"Inter", sans-serif',
            outline: 'none', boxSizing: 'border-box',
          }}
        />
      </div>

      <div style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 8 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={row}>
              <th style={th}>Organization</th>
              <th style={th}>Plan</th>
              <th style={th}>Status</th>
              <th style={th}>Users</th>
              <th style={th}>Sales</th>
              <th style={th}>Joined</th>
              <th style={th}></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} style={{ textAlign: 'center', padding: 40, color: 'rgba(255,255,255,0.3)', fontSize: 13 }}>Loading…</td></tr>
            ) : orgs.length === 0 ? (
              <tr><td colSpan={7} style={{ textAlign: 'center', padding: 40, color: 'rgba(255,255,255,0.3)', fontSize: 13 }}>No organizations found</td></tr>
            ) : orgs.map(org => (
              <tr key={org.id} style={row}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <td style={td}>
                  <p style={{ margin: '0 0 2px', fontWeight: 500 }}>{org.name}</p>
                  <p style={{ margin: 0, fontSize: 11, color: 'rgba(255,255,255,0.3)', fontFamily: '"DM Mono", monospace' }}>{org.email}</p>
                </td>
                <td style={td}><PlanBadge plan={org.plan ?? 'trial'} /></td>
                <td style={td}><StatusBadge status={org.subscription_status ?? 'active'} active={org.is_active} /></td>
                <td style={{ ...td, fontFamily: '"DM Mono", monospace' }}>{org.user_count}</td>
                <td style={{ ...td, fontFamily: '"DM Mono", monospace' }}>{org.total_sales}</td>
                <td style={{ ...td, fontSize: 12, color: 'rgba(255,255,255,0.35)', fontFamily: '"DM Mono", monospace' }}>{fmtDate(org.created_at)}</td>
                <td style={td}>
                  <button onClick={() => setSelected(org)} style={{
                    fontSize: 12, background: 'none', border: 'none',
                    cursor: 'pointer', color: 'rgba(255,255,255,0.4)',
                    display: 'flex', alignItems: 'center', gap: 4,
                  }}
                    onMouseEnter={e => e.currentTarget.style.color = 'white'}
                    onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.4)'}
                  >
                    Manage <ChevronRight size={12} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selected && (
        <OrgModal
          org={selected}
          onClose={() => setSelected(null)}
          onActivate={() => handleActivate(selected.id)}
          onSuspend={() => handleSuspend(selected.id)}
          onImpersonate={() => handleImpersonate(selected)}
          actionLoading={actionLoading}
        />
      )}
    </div>
  )
}

// ── Org Detail Modal ───────────────────────────────────────────────────────────
function OrgModal({ org, onClose, onActivate, onSuspend, onImpersonate, actionLoading }) {
  const [detail, setDetail]   = useState(null)
  const [subForm, setSubForm] = useState({ plan: '', status: '', extend_days: '' })
  const [subMsg, setSubMsg]   = useState('')

  useEffect(() => {
    superAdminApi.getOrg(org.id).then(r => {
      setDetail(r.data)
      setSubForm({ plan: r.data.plan ?? '', status: r.data.subscription_status ?? '', extend_days: '' })
    })
  }, [org.id])

  const updateSub = async () => {
    const payload = {}
    if (subForm.plan)        payload.plan = subForm.plan
    if (subForm.status)      payload.status = subForm.status
    if (subForm.extend_days) payload.extend_days = parseInt(subForm.extend_days)
    try {
      await superAdminApi.updateSub(org.id, payload)
      setSubMsg('Subscription updated ✓')
    } catch { setSubMsg('Failed to update') }
  }

  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, zIndex: 50,
      background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        width: '100%', maxWidth: 560,
        background: '#0f1117', border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 10, maxHeight: '90vh', overflowY: 'auto',
      }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <p style={{ fontFamily: '"Poppins", sans-serif', fontWeight: 700, fontSize: 15, margin: '0 0 2px' }}>{org.name}</p>
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', margin: 0, fontFamily: '"DM Mono", monospace' }}>{org.email}</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.4)' }}>
            <X size={16} />
          </button>
        </div>

        <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 20 }}>
          {detail && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
              {[
                { l: 'Users',   v: detail.user_count            },
                { l: 'Sales',   v: detail.total_sales            },
                { l: 'Revenue', v: fmt(detail.total_revenue)     },
              ].map(s => (
                <div key={s.l} style={{ padding: '12px 14px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 6 }}>
                  <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 5px' }}>{s.l}</p>
                  <p style={{ fontFamily: '"DM Mono", monospace', fontSize: 18, margin: 0 }}>{s.v}</p>
                </div>
              ))}
            </div>
          )}

          <div style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 7, padding: 16 }}>
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 14px' }}>Subscription Management</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
              <div>
                <label style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 5 }}>Plan</label>
                <select value={subForm.plan} onChange={e => setSubForm(f => ({ ...f, plan: e.target.value }))} style={{
                  width: '100%', background: '#0a0d14', border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 4, padding: '7px 10px', color: 'white', fontSize: 13,
                  fontFamily: '"Inter", sans-serif', outline: 'none',
                }}>
                  <option value="">No change</option>
                  <option value="trial">Trial</option>
                  <option value="basic">Basic</option>
                  <option value="pro">Pro</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 5 }}>Status</label>
                <select value={subForm.status} onChange={e => setSubForm(f => ({ ...f, status: e.target.value }))} style={{
                  width: '100%', background: '#0a0d14', border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 4, padding: '7px 10px', color: 'white', fontSize: 13,
                  fontFamily: '"Inter", sans-serif', outline: 'none',
                }}>
                  <option value="">No change</option>
                  <option value="active">Active</option>
                  <option value="suspended">Suspended</option>
                  <option value="expired">Expired</option>
                </select>
              </div>
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 5 }}>Extend by (days)</label>
              <input
                type="number" min="1" placeholder="e.g. 30"
                value={subForm.extend_days} onChange={e => setSubForm(f => ({ ...f, extend_days: e.target.value }))}
                style={{
                  width: '100%', background: '#0a0d14', border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 4, padding: '7px 10px', color: 'white', fontSize: 13,
                  fontFamily: '"Inter", sans-serif', outline: 'none', boxSizing: 'border-box',
                }}
              />
            </div>
            {subMsg && <p style={{ fontSize: 12, color: '#6ee7b7', marginBottom: 8 }}>{subMsg}</p>}
            <button onClick={updateSub} style={{
              padding: '8px 16px', borderRadius: 4, border: 'none',
              background: '#60a5fa', color: '#0a0d14', fontWeight: 600,
              fontSize: 13, cursor: 'pointer',
            }}>Update Subscription</button>
          </div>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button onClick={onImpersonate} style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '9px 16px', borderRadius: 5, border: '1px solid rgba(251,191,36,0.3)',
              background: 'rgba(251,191,36,0.07)', color: '#fbbf24',
              fontSize: 13, cursor: 'pointer', fontWeight: 500,
            }}>
              <Eye size={14} /> View as Org (Read Only)
            </button>

            {org.is_active ? (
              <button onClick={onSuspend} disabled={actionLoading} style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '9px 16px', borderRadius: 5, border: '1px solid rgba(248,113,113,0.3)',
                background: 'rgba(248,113,113,0.07)', color: '#f87171',
                fontSize: 13, cursor: 'pointer', fontWeight: 500,
              }}>
                <XCircle size={14} /> Suspend Org
              </button>
            ) : (
              <button onClick={onActivate} disabled={actionLoading} style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '9px 16px', borderRadius: 5, border: '1px solid rgba(110,231,183,0.3)',
                background: 'rgba(110,231,183,0.07)', color: '#6ee7b7',
                fontSize: 13, cursor: 'pointer', fontWeight: 500,
              }}>
                <CheckCircle2 size={14} /> Activate Org
              </button>
            )}
          </div>

          {detail?.users?.length > 0 && (
            <div>
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 10px' }}>Team Members</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {detail.users.map(u => (
                  <div key={u.id} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '9px 12px', background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.06)', borderRadius: 5,
                  }}>
                    <div>
                      <p style={{ fontSize: 13, margin: '0 0 2px', fontWeight: 500 }}>{u.full_name}</p>
                      <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', margin: 0, fontFamily: '"DM Mono", monospace' }}>{u.email}</p>
                    </div>
                    <span style={{
                      fontSize: 10, padding: '2px 8px', borderRadius: 3,
                      background: 'rgba(96,165,250,0.1)', border: '1px solid rgba(96,165,250,0.25)',
                      color: '#60a5fa', fontFamily: '"DM Mono", monospace',
                    }}>{u.role}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Subscriptions Page ─────────────────────────────────────────────────────────
function SubscriptionsPage() {
  const [orgs, setOrgs]       = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    superAdminApi.listOrgs('')
      .then(r => setOrgs(r.data))
      .finally(() => setLoading(false))
  }, [])

  const row = { borderBottom: '1px solid rgba(255,255,255,0.05)' }
  const th  = { fontSize: 10, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.08em', padding: '10px 16px', textAlign: 'left', fontWeight: 400 }
  const td  = { fontSize: 13, color: 'rgba(255,255,255,0.75)', padding: '11px 16px' }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <h1 style={{ fontFamily: '"Poppins", sans-serif', fontWeight: 800, fontSize: 22, margin: 0 }}>Subscriptions</h1>
      <div style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 8 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={row}>
              <th style={th}>Organization</th>
              <th style={th}>Plan</th>
              <th style={th}>Status</th>
              <th style={th}>Expires</th>
              <th style={th}>Users</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} style={{ textAlign: 'center', padding: 40, color: 'rgba(255,255,255,0.3)', fontSize: 13 }}>Loading…</td></tr>
            ) : orgs.map(org => {
              const planColor = { trial: '#fbbf24', basic: '#60a5fa', pro: '#6ee7b7' }[org.plan] ?? '#64748b'
              const statColor = org.subscription_status === 'active' ? '#6ee7b7' : '#f87171'
              return (
                <tr key={org.id} style={row}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <td style={td}>
                    <p style={{ margin: '0 0 2px', fontWeight: 500 }}>{org.name}</p>
                    <p style={{ margin: 0, fontSize: 11, color: 'rgba(255,255,255,0.3)', fontFamily: '"DM Mono", monospace' }}>{org.email}</p>
                  </td>
                  <td style={td}>
                    <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 3, background: `${planColor}18`, border: `1px solid ${planColor}44`, color: planColor, fontFamily: '"DM Mono", monospace' }}>
                      {org.plan ?? '—'}
                    </span>
                  </td>
                  <td style={td}>
                    <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 3, background: `${statColor}18`, border: `1px solid ${statColor}44`, color: statColor, fontFamily: '"DM Mono", monospace' }}>
                      {org.subscription_status ?? '—'}
                    </span>
                  </td>
                  <td style={{ ...td, fontFamily: '"DM Mono", monospace', fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>
                    {fmtDate(org.expires_at)}
                  </td>
                  <td style={{ ...td, fontFamily: '"DM Mono", monospace' }}>{org.user_count}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ── Settings Page ──────────────────────────────────────────────────────────────
function SettingsPage() {
  const [form, setForm]       = useState({ current_password: '', new_password: '', confirm_password: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const [success, setSuccess] = useState('')
  const adminUser = JSON.parse(localStorage.getItem('admin_user') || '{}')

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  const submit = async e => {
    e.preventDefault()
    setError(''); setSuccess('')
    if (form.new_password !== form.confirm_password) {
      setError('New passwords do not match'); return
    }
    if (form.new_password.length < 8) {
      setError('Password must be at least 8 characters'); return
    }
    setLoading(true)
    try {
      await superAdminApi.changePassword({
        current_password: form.current_password,
        new_password: form.new_password,
      })
      setSuccess('Password changed successfully')
      setForm({ current_password: '', new_password: '', confirm_password: '' })
    } catch (err) {
      setError(err.response?.data?.detail ?? 'Failed to change password')
    } finally { setLoading(false) }
  }

  const inputStyle = {
    width: '100%', background: '#0a0d14',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 4, padding: '9px 12px', color: 'white',
    fontSize: 13, fontFamily: '"Inter", sans-serif',
    outline: 'none', boxSizing: 'border-box',
  }

  const labelStyle = {
    fontSize: 10, color: 'rgba(255,255,255,0.4)',
    textTransform: 'uppercase', letterSpacing: '0.08em',
    display: 'block', marginBottom: 5,
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 480 }}>
      <div>
        <h1 style={{ fontFamily: '"Poppins", sans-serif', fontWeight: 800, fontSize: 22, margin: '0 0 4px' }}>Settings</h1>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', margin: 0 }}>Manage your admin account</p>
      </div>

      <div style={{ padding: '16px 20px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 8 }}>
        <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 12px' }}>Account</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>Name</span>
            <span style={{ fontSize: 13, color: 'white', fontWeight: 500 }}>{adminUser.full_name}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>Email</span>
            <span style={{ fontSize: 13, color: 'white', fontFamily: '"DM Mono", monospace' }}>{adminUser.email}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>Role</span>
            <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 3, background: 'rgba(96,165,250,0.1)', border: '1px solid rgba(96,165,250,0.25)', color: '#60a5fa', fontFamily: '"DM Mono", monospace' }}>
              super_admin
            </span>
          </div>
        </div>
      </div>

      <div style={{ padding: '20px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 8 }}>
        <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 16px' }}>Change Password</p>

        {error && (
          <div style={{ padding: '9px 12px', borderRadius: 4, marginBottom: 14, background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.25)', fontSize: 13, color: '#f87171' }}>
            {error}
          </div>
        )}
        {success && (
          <div style={{ padding: '9px 12px', borderRadius: 4, marginBottom: 14, background: 'rgba(110,231,183,0.08)', border: '1px solid rgba(110,231,183,0.25)', fontSize: 13, color: '#6ee7b7' }}>
            {success}
          </div>
        )}

        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={labelStyle}>Current Password</label>
            <input type="password" required value={form.current_password} onChange={set('current_password')} placeholder="••••••••" style={inputStyle}
              onFocus={e => e.target.style.borderColor = 'rgba(96,165,250,0.5)'}
              onBlur={e  => e.target.style.borderColor = 'rgba(255,255,255,0.1)'} />
          </div>
          <div>
            <label style={labelStyle}>New Password</label>
            <input type="password" required value={form.new_password} onChange={set('new_password')} placeholder="••••••••" style={inputStyle}
              onFocus={e => e.target.style.borderColor = 'rgba(96,165,250,0.5)'}
              onBlur={e  => e.target.style.borderColor = 'rgba(255,255,255,0.1)'} />
          </div>
          <div>
            <label style={labelStyle}>Confirm New Password</label>
            <input type="password" required value={form.confirm_password} onChange={set('confirm_password')} placeholder="••••••••" style={inputStyle}
              onFocus={e => e.target.style.borderColor = 'rgba(96,165,250,0.5)'}
              onBlur={e  => e.target.style.borderColor = 'rgba(255,255,255,0.1)'} />
          </div>
          <button type="submit" disabled={loading} style={{
            padding: '10px', borderRadius: 4, border: 'none',
            background: loading ? 'rgba(96,165,250,0.5)' : '#60a5fa',
            color: '#0a0d14', fontWeight: 700, fontSize: 14,
            fontFamily: '"Inter", sans-serif',
            cursor: loading ? 'not-allowed' : 'pointer',
            transition: 'background .2s',
          }}>
            {loading ? 'Updating…' : 'Update Password'}
          </button>
        </form>
      </div>
    </div>
  )
}

// ── Main export ────────────────────────────────────────────────────────────────
export default function AdminPortal() {
  const navigate = useNavigate()
  const [page, setPage] = useState('dashboard')

  useEffect(() => {
    const token = localStorage.getItem('admin_access_token')
    const user  = JSON.parse(localStorage.getItem('admin_user') || '{}')
    if (!token || user.role !== 'super_admin') {
      navigate('/admin/login')
    }
  }, [])

  const pages = {
    dashboard:     <DashboardPage />,
    organizations: <OrganizationsPage />,
    subscriptions: <SubscriptionsPage />,
    settings:      <SettingsPage />,
  }

  return (
    <AdminLayout page={page} setPage={setPage}>
      {pages[page]}
    </AdminLayout>
  )
}