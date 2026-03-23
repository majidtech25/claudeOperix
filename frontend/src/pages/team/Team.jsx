import { useState, useEffect } from 'react'
import { Plus, Users } from 'lucide-react'
import { usersApi } from '../../api/services'
import { useAuth } from '../../context/AuthContext'
import { Modal, Field, Input, Select, BtnPrimary, BtnGhost, Alert, Badge, Empty, PageLoader } from '../../components/ui'

const card = { background: 'var(--color-base-50)', border: '1px solid var(--color-border)', borderRadius: 6 }
const row  = { borderBottom: '1px solid var(--color-border)' }
const th   = { fontSize: 10, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', padding: '10px 16px', textAlign: 'left', fontWeight: 400 }
const td   = { fontSize: 13, color: 'var(--color-text)', padding: '10px 16px' }

export default function Team() {
  const { user: me }          = useAuth()
  const [users, setUsers]     = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState('')
  const [modal, setModal]     = useState(false)

  const load = () => {
    usersApi.list()
      .then(r => setUsers(r.data))
      .catch(() => setError('Failed to load team'))
      .finally(() => setLoading(false))
  }
  useEffect(() => { load() }, [])

  const toggle = async u => {
    try { await usersApi.update(u.id, { is_active: !u.is_active }); load() }
    catch { setError('Failed to update user') }
  }

  if (loading) return <PageLoader />

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 22, color: 'var(--color-text)', margin: 0 }}>Team</h1>
          <p style={{ fontSize: 13, color: 'var(--color-muted)', marginTop: 4 }}>{users.length} members</p>
        </div>
        {me?.role === 'owner' && (
          <BtnPrimary onClick={() => setModal(true)}><Plus size={14} /> Add Employee</BtnPrimary>
        )}
      </div>

      {error && <Alert type="error" message={error} onClose={() => setError('')} />}

      <div style={card}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={row}>
              <th style={th}>Name</th>
              <th style={th}>Email</th>
              <th style={th}>Role</th>
              <th style={th}>Status</th>
              {me?.role === 'owner' && <th style={th}></th>}
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr><td colSpan={5}><Empty icon={Users} title="No team members" description="Add employees to your organisation" /></td></tr>
            ) : users.map(u => (
              <tr key={u.id} style={row}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--color-base-100)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <td style={td}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                      width: 30, height: 30, borderRadius: 6,
                      background: 'var(--color-base-200)',
                      border: '1px solid var(--color-border)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 13, fontFamily: 'var(--font-mono)',
                      color: 'var(--color-accent)', flexShrink: 0
                    }}>
                      {u.full_name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text)', margin: 0 }}>{u.full_name}</p>
                      {u.id === me?.id && (
                        <span style={{ fontSize: 10, color: 'var(--color-muted)', fontFamily: 'var(--font-mono)' }}>you</span>
                      )}
                    </div>
                  </div>
                </td>
                <td style={{ ...td, fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--color-muted)' }}>{u.email}</td>
                <td style={td}><Badge status={u.role} /></td>
                <td style={td}><Badge status={u.is_active ? 'active' : 'inactive'} /></td>
                {me?.role === 'owner' && (
                  <td style={{ ...td, textAlign: 'right' }}>
                    {u.id !== me?.id && (
                      <button onClick={() => toggle(u)} style={{
                        fontSize: 12, background: 'none', border: 'none', cursor: 'pointer',
                        color: u.is_active ? 'var(--color-danger)' : 'var(--color-accent)',
                        transition: 'opacity .15s'
                      }}
                        onMouseEnter={e => e.currentTarget.style.opacity = '0.75'}
                        onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                      >
                        {u.is_active ? 'Deactivate' : 'Activate'}
                      </button>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <AddUserModal open={modal} onClose={() => setModal(false)} onSaved={() => { load(); setModal(false) }} />
    </div>
  )
}

function AddUserModal({ open, onClose, onSaved }) {
  const [form, setForm]       = useState({ full_name: '', email: '', password: '', role: 'employee' })
  const [error, setError]     = useState('')
  const [loading, setLoading] = useState(false)
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  useEffect(() => { if (!open) { setForm({ full_name: '', email: '', password: '', role: 'employee' }); setError('') } }, [open])

  const submit = async e => {
    e.preventDefault(); setLoading(true); setError('')
    try { await usersApi.create(form); onSaved() }
    catch (err) { setError(err.response?.data?.detail ?? 'Failed') }
    finally { setLoading(false) }
  }

  return (
    <Modal open={open} onClose={onClose} title="Add Employee">
      <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <Alert type="error" message={error} onClose={() => setError('')} />
        <Field label="Full Name *">
          <Input value={form.full_name} onChange={set('full_name')} required autoFocus placeholder="Employee name" />
        </Field>
        <Field label="Email *">
          <Input type="email" value={form.email} onChange={set('email')} required placeholder="employee@email.com" />
        </Field>
        <Field label="Password *">
          <Input type="password" value={form.password} onChange={set('password')} required minLength={8} placeholder="Min 8 characters" />
        </Field>
        <Field label="Role">
          <Select value={form.role} onChange={set('role')}>
            <option value="employee">Employee</option>
          </Select>
        </Field>
        <div style={{ display: 'flex', gap: 8 }}>
          <BtnGhost type="button" style={{ flex: 1 }} onClick={onClose}>Cancel</BtnGhost>
          <BtnPrimary type="submit" style={{ flex: 1 }} disabled={loading}>
            {loading ? 'Adding…' : 'Add Employee'}
          </BtnPrimary>
        </div>
      </form>
    </Modal>
  )
}