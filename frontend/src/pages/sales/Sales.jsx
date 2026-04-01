import { useState, useEffect } from 'react'
import { Plus, Lock, Calendar, X as XIcon } from 'lucide-react'
import { salesDaysApi, salesApi, productsApi } from '../../api/services'
import { Modal, Field, Input, Select, BtnPrimary, BtnGhost, BtnDanger, Alert, Badge, Empty, PageLoader, fmt } from '../../components/ui'

const card = { background: 'var(--color-base-50)', border: '1px solid var(--color-border)', borderRadius: 6 }
const row  = { borderBottom: '1px solid var(--color-border)' }
const th   = { fontSize: 10, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', padding: '10px 12px', textAlign: 'left', fontWeight: 400 }
const td   = { fontSize: 13, color: 'var(--color-text)', padding: '10px 12px' }
const todayISO = () => new Date().toISOString().slice(0, 10)

export default function Sales() {
  const [openDay, setOpenDay]   = useState(undefined)
  const [sales, setSales]       = useState([])
  const [products, setProducts] = useState([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState('')
  const [openModal,  setOpenModal]  = useState(false)
  const [closeModal, setCloseModal] = useState(false)
  const [posModal,   setPosModal]   = useState(false)

  const load = async () => {
    try {
      const [dayRes, prodRes] = await Promise.all([salesDaysApi.current(), productsApi.list()])
      setOpenDay(dayRes.data)
      setProducts(prodRes.data.filter(p => p.is_active))
      if (dayRes.data) {
        const r = await salesApi.list(dayRes.data.id)
        setSales(r.data)
      } else setSales([])
    } catch { setError('Failed to load') }
    finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])

  if (loading) return <PageLoader />

  const totalToday = sales.reduce((s, t) => s + Number(t.total_amount), 0)
  const isMobile = window.innerWidth < 640

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 20, color: 'var(--color-text)', margin: 0 }}>Sales</h1>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {openDay ? (
            <>
              <BtnDanger onClick={() => setCloseModal(true)}><Lock size={13} /> Close Day</BtnDanger>
              <BtnPrimary onClick={() => setPosModal(true)}><Plus size={14} /> New Sale</BtnPrimary>
            </>
          ) : (
            <BtnPrimary onClick={() => setOpenModal(true)}><Calendar size={14} /> Open Sales Day</BtnPrimary>
          )}
        </div>
      </div>

      {error && <Alert type="error" message={error} onClose={() => setError('')} />}

      {/* Day status */}
      {openDay ? (
        <div style={{
          ...card,
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(3,1fr)',
          borderColor: 'rgba(110,231,183,.15)'
        }}>
          {[
            { label: 'Business Date',   value: openDay.business_date },
            { label: 'Transactions',    value: sales.length          },
            { label: 'Total Collected', value: fmt(totalToday), accent: true },
          ].map((item, i) => (
            <div key={i} style={{
              padding: '14px 16px',
              borderRight: isMobile
                ? (i === 0 ? '1px solid var(--color-border)' : 'none')
                : (i < 2 ? '1px solid var(--color-border)' : 'none'),
              borderBottom: isMobile && i < 2 ? '1px solid var(--color-border)' : 'none',
              gridColumn: isMobile && i === 2 ? '1 / -1' : 'auto',
            }}>
              <p style={{ fontSize: 10, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 6px' }}>
                {item.label}
              </p>
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: isMobile ? 16 : 20, margin: 0, color: item.accent ? 'var(--color-accent)' : 'var(--color-text)' }}>
                {item.value}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ ...card, padding: 40, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, borderStyle: 'dashed' }}>
          <Calendar size={30} style={{ color: 'var(--color-muted)' }} />
          <p style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15, color: 'var(--color-text-muted)', textAlign: 'center' }}>
            No Sales Day Open
          </p>
          <p style={{ fontSize: 13, color: 'var(--color-muted)', textAlign: 'center', maxWidth: 300 }}>
            Open a sales day first to start recording transactions.
          </p>
          <BtnPrimary style={{ marginTop: 4 }} onClick={() => setOpenModal(true)}>
            Open Today's Sales Day
          </BtnPrimary>
        </div>
      )}

      {/* Sales table */}
      {openDay && (
        <div style={card}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--color-border)' }}>
            <p style={{ fontSize: 10, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Today's Transactions
            </p>
          </div>

          {/* Mobile: card list */}
          {isMobile ? (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {sales.length === 0 ? (
                <Empty title="No sales yet" description="Record your first sale for today" />
              ) : sales.map(s => (
                <div key={s.id} style={{ padding: '12px 16px', borderBottom: '1px solid var(--color-border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--color-accent)' }}>{s.receipt_number}</span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 15, fontWeight: 600, color: 'var(--color-text)' }}>{fmt(s.total_amount)}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 12, color: 'var(--color-muted)' }}>{s.items?.length ?? 0} items</span>
                    <Badge status={s.payment_method} label={s.payment_method.replace('_', ' ')} />
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--color-muted)', marginLeft: 'auto' }}>
                      {new Date(s.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* Desktop: table */
            <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 420 }}>
                <thead>
                  <tr style={row}>
                    <th style={th}>Receipt #</th>
                    <th style={th}>Items</th>
                    <th style={th}>Payment</th>
                    <th style={th}>Total</th>
                    <th style={th}>Time</th>
                  </tr>
                </thead>
                <tbody>
                  {sales.length === 0 ? (
                    <tr><td colSpan={5}><Empty title="No sales yet" description="Record your first sale for today" /></td></tr>
                  ) : sales.map(s => (
                    <tr key={s.id} style={row}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--color-base-100)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <td style={{ ...td, fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--color-accent)' }}>{s.receipt_number}</td>
                      <td style={{ ...td, fontSize: 12 }}>{s.items?.length ?? 0} items</td>
                      <td style={td}><Badge status={s.payment_method} label={s.payment_method.replace('_', ' ')} /></td>
                      <td style={{ ...td, fontFamily: 'var(--font-mono)' }}>{fmt(s.total_amount)}</td>
                      <td style={{ ...td, fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--color-muted)' }}>
                        {new Date(s.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      <OpenDayModal  open={openModal}  onClose={() => setOpenModal(false)}  onSaved={() => { load(); setOpenModal(false) }} />
      <CloseDayModal open={closeModal} onClose={() => setCloseModal(false)} onSaved={() => { load(); setCloseModal(false) }} sales={sales} total={totalToday} />
      <POSModal      open={posModal}   onClose={() => setPosModal(false)}   onSaved={() => { load(); setPosModal(false) }} products={products} />
    </div>
  )
}

function OpenDayModal({ open, onClose, onSaved }) {
  const [date, setDate]       = useState(todayISO())
  const [error, setError]     = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async e => {
    e.preventDefault(); setLoading(true); setError('')
    try { await salesDaysApi.open(date); onSaved() }
    catch (err) { setError(err.response?.data?.detail ?? 'Failed') }
    finally { setLoading(false) }
  }

  return (
    <Modal open={open} onClose={onClose} title="Open Sales Day">
      <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <Alert type="error" message={error} onClose={() => setError('')} />
        <Field label="Business Date">
          <Input type="date" value={date} onChange={e => setDate(e.target.value)} required />
        </Field>
        <p style={{ fontSize: 12, color: 'var(--color-muted)' }}>Only one sales day can be open at a time.</p>
        <div style={{ display: 'flex', gap: 8 }}>
          <BtnGhost type="button" style={{ flex: 1 }} onClick={onClose}>Cancel</BtnGhost>
          <BtnPrimary type="submit" style={{ flex: 1 }} disabled={loading}>{loading ? 'Opening…' : 'Open Day'}</BtnPrimary>
        </div>
      </form>
    </Modal>
  )
}

function CloseDayModal({ open, onClose, onSaved, sales, total }) {
  const [note, setNote]       = useState('')
  const [error, setError]     = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async e => {
    e.preventDefault(); setLoading(true); setError('')
    try { await salesDaysApi.close(note || null); onSaved() }
    catch (err) { setError(err.response?.data?.detail ?? 'Failed') }
    finally { setLoading(false) }
  }

  return (
    <Modal open={open} onClose={onClose} title="Close Sales Day">
      <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <Alert type="error" message={error} onClose={() => setError('')} />
        <div style={{ background: 'var(--color-base)', border: '1px solid var(--color-border)', borderRadius: 4, padding: '12px 16px' }}>
          {[['Transactions', sales.length], ['Total Revenue', fmt(total)]].map(([k, v]) => (
            <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--color-border)' }}>
              <span style={{ fontSize: 13, color: 'var(--color-muted)' }}>{k}</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--color-text)' }}>{v}</span>
            </div>
          ))}
        </div>
        <div style={{ background: 'rgba(248,113,113,.06)', border: '1px solid rgba(248,113,113,.2)', borderRadius: 4, padding: '10px 12px' }}>
          <p style={{ fontSize: 12, color: 'var(--color-danger)' }}>⚠ Irreversible — once closed no more sales can be added.</p>
        </div>
        <Field label="Closing Note (optional)">
          <Input value={note} onChange={e => setNote(e.target.value)} placeholder="Any notes…" />
        </Field>
        <div style={{ display: 'flex', gap: 8 }}>
          <BtnGhost type="button" style={{ flex: 1 }} onClick={onClose}>Cancel</BtnGhost>
          <BtnDanger type="submit" style={{ flex: 1 }} disabled={loading}>{loading ? 'Closing…' : 'Close Day'}</BtnDanger>
        </div>
      </form>
    </Modal>
  )
}

function POSModal({ open, onClose, products, onSaved }) {
  const [cart, setCart]       = useState([])
  const [payment, setPayment] = useState('cash')
  const [search, setSearch]   = useState('')
  const [error, setError]     = useState('')
  const [loading, setLoading] = useState(false)
  const [showCart, setShowCart] = useState(false)

  const isMobile = window.innerWidth < 640

  useEffect(() => { if (!open) { setCart([]); setSearch(''); setError(''); setShowCart(false) } }, [open])

  const addToCart = p => setCart(c => {
    const ex = c.find(i => i.product.id === p.id)
    return ex
      ? c.map(i => i.product.id === p.id ? { ...i, qty: i.qty + 1 } : i)
      : [...c, { product: p, qty: 1 }]
  })
  const setQty = (id, qty) => qty <= 0
    ? setCart(c => c.filter(i => i.product.id !== id))
    : setCart(c => c.map(i => i.product.id === id ? { ...i, qty } : i))

  const total    = cart.reduce((s, i) => s + Number(i.product.selling_price) * i.qty, 0)
  const filtered = products.filter(p => p.name.toLowerCase().includes(search.toLowerCase())).slice(0, 20)

  const submit = async () => {
    if (!cart.length) { setError('Add at least one item'); return }
    setLoading(true); setError('')
    try {
      await salesApi.create({
        payment_method: payment,
        items: cart.map(i => ({ product_id: i.product.id, quantity: i.qty }))
      })
      onSaved()
    } catch (err) { setError(err.response?.data?.detail ?? 'Sale failed') }
    finally { setLoading(false) }
  }

  const CartPanel = () => (
    <div style={{ width: isMobile ? '100%' : 200, display: 'flex', flexDirection: 'column', gap: 8 }}>
      <p style={{ fontSize: 10, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0 }}>
        Cart ({cart.length})
      </p>
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6, maxHeight: isMobile ? 240 : 'none' }}>
        {cart.length === 0 ? (
          <p style={{ fontSize: 12, color: 'var(--color-muted)', textAlign: 'center', marginTop: 24 }}>Tap a product to add</p>
        ) : cart.map(({ product: p, qty }) => (
          <div key={p.id} style={{ background: 'var(--color-base)', border: '1px solid var(--color-border)', borderRadius: 4, padding: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 7 }}>
              <span style={{ fontSize: 12, color: 'var(--color-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{p.name}</span>
              <button onClick={() => setQty(p.id, 0)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-muted)', display: 'flex', padding: 1, flexShrink: 0 }}
                onMouseEnter={e => e.currentTarget.style.color = 'var(--color-danger)'}
                onMouseLeave={e => e.currentTarget.style.color = 'var(--color-muted)'}
              >
                <XIcon size={12} />
              </button>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                {[['−', () => setQty(p.id, qty - 1)], ['＋', () => setQty(p.id, qty + 1)]].map(([label, fn]) => (
                  <button key={label} onClick={fn} style={{
                    width: 24, height: 24, borderRadius: 3,
                    background: 'var(--color-base-200)',
                    border: '1px solid var(--color-border)',
                    cursor: 'pointer', color: 'var(--color-text)', fontSize: 13,
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>{label}</button>
                ))}
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, minWidth: 18, textAlign: 'center', color: 'var(--color-text)' }}>{qty}</span>
              </div>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--color-accent)' }}>
                {fmt(Number(p.selling_price) * qty)}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Checkout */}
      <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {error && <Alert type="error" message={error} onClose={() => setError('')} />}
        <Select value={payment} onChange={e => setPayment(e.target.value)}>
          <option value="cash">Cash</option>
          <option value="mobile_money">Mobile Money</option>
          <option value="card">Card</option>
        </Select>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 12, color: 'var(--color-muted)' }}>Total</span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 18, color: 'var(--color-accent)', fontWeight: 500 }}>{fmt(total)}</span>
        </div>
        <BtnPrimary style={{ width: '100%' }} onClick={submit} disabled={loading || !cart.length}>
          {loading ? 'Processing…' : 'Confirm Sale'}
        </BtnPrimary>
        {isMobile && (
          <BtnGhost style={{ width: '100%' }} onClick={() => setShowCart(false)}>
            ← Back to Products
          </BtnGhost>
        )}
      </div>
    </div>
  )

  return (
    <Modal open={open} onClose={onClose} title="New Sale" width={isMobile ? '100%' : 660}>

      {isMobile ? (
        /* Mobile: toggle between products and cart */
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, height: 520 }}>
          {/* Toggle bar */}
          <div style={{ display: 'flex', borderBottom: '1px solid var(--color-border)' }}>
            {[['Products', false], [`Cart (${cart.length})`, true]].map(([label, isCart]) => (
              <button key={label} onClick={() => setShowCart(isCart)} style={{
                flex: 1, padding: '8px', background: 'none', border: 'none', cursor: 'pointer',
                fontSize: 13, color: showCart === isCart ? 'var(--color-accent)' : 'var(--color-muted)',
                borderBottom: showCart === isCart ? '2px solid var(--color-accent)' : '2px solid transparent',
                marginBottom: -1,
              }}>{label}</button>
            ))}
          </div>

          {!showCart ? (
            /* Product grid */
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, flex: 1, minHeight: 0 }}>
              <Input placeholder="Search products…" value={search} onChange={e => setSearch(e.target.value)} />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, overflowY: 'auto', flex: 1, alignContent: 'start' }}>
                {filtered.map(p => (
                  <button key={p.id} onClick={() => addToCart(p)}
                    disabled={p.track_inventory && p.stock_quantity <= 0}
                    style={{
                      background: 'var(--color-base)', border: '1px solid var(--color-border)',
                      borderRadius: 4, padding: '10px 12px', textAlign: 'left', cursor: 'pointer',
                      opacity: p.track_inventory && p.stock_quantity <= 0 ? 0.4 : 1,
                    }}
                  >
                    <p style={{ fontSize: 12, fontWeight: 500, color: 'var(--color-text)', margin: '0 0 5px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {p.name}
                    </p>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--color-accent)' }}>{fmt(p.selling_price)}</span>
                      {p.track_inventory && (
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: p.stock_quantity <= p.low_stock_threshold ? 'var(--color-danger)' : 'var(--color-muted)' }}>
                          {p.stock_quantity}
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
              {cart.length > 0 && (
                <BtnPrimary style={{ width: '100%' }} onClick={() => setShowCart(true)}>
                  View Cart ({cart.length}) — {fmt(total)}
                </BtnPrimary>
              )}
            </div>
          ) : (
            <CartPanel />
          )}
        </div>
      ) : (
        /* Desktop: side by side */
        <div style={{ display: 'flex', gap: 16, height: 490 }}>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10, minWidth: 0 }}>
            <Input placeholder="Search products…" value={search} onChange={e => setSearch(e.target.value)} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, overflowY: 'auto', flex: 1, alignContent: 'start' }}>
              {filtered.map(p => (
                <button key={p.id} onClick={() => addToCart(p)}
                  disabled={p.track_inventory && p.stock_quantity <= 0}
                  style={{
                    background: 'var(--color-base)', border: '1px solid var(--color-border)',
                    borderRadius: 4, padding: '10px 12px', textAlign: 'left', cursor: 'pointer',
                    opacity: p.track_inventory && p.stock_quantity <= 0 ? 0.4 : 1,
                    transition: 'border-color .1s'
                  }}
                  onMouseEnter={e => !e.currentTarget.disabled && (e.currentTarget.style.borderColor = 'var(--color-accent)')}
                  onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--color-border)'}
                >
                  <p style={{ fontSize: 12, fontWeight: 500, color: 'var(--color-text)', margin: '0 0 5px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {p.name}
                  </p>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--color-accent)' }}>{fmt(p.selling_price)}</span>
                    {p.track_inventory && (
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: p.stock_quantity <= p.low_stock_threshold ? 'var(--color-danger)' : 'var(--color-muted)' }}>
                        {p.stock_quantity}
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
          <CartPanel />
        </div>
      )}
    </Modal>
  )
}