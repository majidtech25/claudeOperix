import { useState, useEffect } from 'react'
import { Plus, Search, Edit2, TrendingUp } from 'lucide-react'
import { categoriesApi, productsApi, inventoryApi } from '../../api/services'
import { Modal, Field, Input, Select, BtnPrimary, BtnGhost, Alert, Badge, Empty, PageLoader, fmt } from '../../components/ui'

const card = { background: 'var(--color-base-50)', border: '1px solid var(--color-border)', borderRadius: 6 }
const row  = { borderBottom: '1px solid var(--color-border)' }
const th   = { fontSize: 10, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', padding: '10px 16px', textAlign: 'left', fontWeight: 400 }
const td   = { fontSize: 13, color: 'rgba(255,255,255,.78)', padding: '10px 16px' }

export default function Inventory() {
  const [tab, setTab]               = useState('products')
  const [products, setProducts]     = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading]       = useState(true)
  const [search, setSearch]         = useState('')
  const [error, setError]           = useState('')
  const [productModal, setProductModal]   = useState(false)
  const [categoryModal, setCategoryModal] = useState(false)
  const [adjustModal, setAdjustModal]     = useState(null)
  const [editProduct, setEditProduct]     = useState(null)

  const load = async () => {
    try {
      const [p, c] = await Promise.all([productsApi.list(), categoriesApi.list()])
      setProducts(p.data); setCategories(c.data)
    } catch { setError('Failed to load inventory') }
    finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.sku?.toLowerCase() ?? '').includes(search.toLowerCase())
  )

  if (loading) return <PageLoader />

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 22, color: 'white', margin: 0 }}>Inventory</h1>
        <div style={{ display: 'flex', gap: 8 }}>
          <BtnGhost onClick={() => setCategoryModal(true)}>+ Category</BtnGhost>
          <BtnPrimary onClick={() => { setEditProduct(null); setProductModal(true) }}>
            <Plus size={14} /> Add Product
          </BtnPrimary>
        </div>
      </div>

      {error && <Alert type="error" message={error} onClose={() => setError('')} />}

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--color-border)' }}>
        {['products', 'categories'].map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: '8px 16px', background: 'none', border: 'none', cursor: 'pointer',
            fontFamily: 'var(--font-sans)', fontSize: 13, textTransform: 'capitalize',
            color: tab === t ? 'var(--color-accent)' : 'var(--color-muted)',
            borderBottom: tab === t ? '2px solid var(--color-accent)' : '2px solid transparent',
            marginBottom: -1
          }}>
            {t} ({t === 'products' ? products.length : categories.length})
          </button>
        ))}
      </div>

      {/* Products tab */}
      {tab === 'products' && (
        <>
          <div style={{ position: 'relative', maxWidth: 280 }}>
            <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-muted)', pointerEvents: 'none' }} />
            <Input style={{ paddingLeft: 30 }} placeholder="Search name or SKU…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div style={card}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={row}>
                  <th style={th}>Product</th>
                  <th style={th}>Category</th>
                  <th style={th}>Price</th>
                  <th style={th}>Stock</th>
                  <th style={th}>Status</th>
                  <th style={th}></th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={6}><Empty title="No products" description="Add your first product to start tracking" /></td></tr>
                ) : filtered.map(p => {
                  const isLow = p.track_inventory && p.stock_quantity <= p.low_stock_threshold
                  const cat   = categories.find(c => c.id === p.category_id)
                  return (
                    <tr key={p.id} style={row}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,.02)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <td style={td}>
                        <p style={{ margin: 0, fontWeight: 500 }}>{p.name}</p>
                        {p.sku && <p style={{ margin: 0, fontSize: 11, color: 'var(--color-muted)', fontFamily: 'var(--font-mono)', marginTop: 2 }}>{p.sku}</p>}
                      </td>
                      <td style={{ ...td, color: 'var(--color-muted)', fontSize: 12 }}>{cat?.name ?? '—'}</td>
                      <td style={{ ...td, fontFamily: 'var(--font-mono)', color: 'var(--color-accent)' }}>{fmt(p.selling_price)}</td>
                      <td style={td}>
                        <span style={{ fontFamily: 'var(--font-mono)', color: isLow ? 'var(--color-danger)' : 'white' }}>
                          {p.track_inventory ? p.stock_quantity : '∞'}
                        </span>
                        {isLow && <span style={{ fontSize: 10, color: 'var(--color-danger)', marginLeft: 5 }}>low</span>}
                      </td>
                      <td style={td}><Badge status={p.is_active ? 'active' : 'inactive'} /></td>
                      <td style={td}>
                        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                          <button title="Adjust stock" onClick={() => setAdjustModal(p)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-muted)', display: 'flex' }}
                            onMouseEnter={e => e.currentTarget.style.color = 'white'}
                            onMouseLeave={e => e.currentTarget.style.color = 'var(--color-muted)'}>
                            <TrendingUp size={14} />
                          </button>
                          <button title="Edit" onClick={() => { setEditProduct(p); setProductModal(true) }}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-muted)', display: 'flex' }}
                            onMouseEnter={e => e.currentTarget.style.color = 'white'}
                            onMouseLeave={e => e.currentTarget.style.color = 'var(--color-muted)'}>
                            <Edit2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Categories tab */}
      {tab === 'categories' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
          {categories.length === 0
            ? <div style={{ gridColumn: '1/-1' }}><Empty title="No categories" description="Create categories to organise your products" /></div>
            : categories.map(c => (
              <div key={c.id} style={{ ...card, padding: '16px 18px' }}>
                <p style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14, color: 'white', margin: 0 }}>{c.name}</p>
                {c.description && <p style={{ fontSize: 12, color: 'var(--color-muted)', marginTop: 4 }}>{c.description}</p>}
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--color-muted)', marginTop: 10 }}>
                  {products.filter(p => p.category_id === c.id).length} products
                </p>
              </div>
            ))}
        </div>
      )}

      <ProductModal
        open={productModal} categories={categories} product={editProduct}
        onClose={() => { setProductModal(false); setEditProduct(null) }}
        onSaved={() => { load(); setProductModal(false); setEditProduct(null) }}
      />
      <CategoryModal
        open={categoryModal}
        onClose={() => setCategoryModal(false)}
        onSaved={() => { load(); setCategoryModal(false) }}
      />
      {adjustModal && (
        <AdjustModal
          product={adjustModal}
          onClose={() => setAdjustModal(null)}
          onSaved={() => { load(); setAdjustModal(null) }}
        />
      )}
    </div>
  )
}

function ProductModal({ open, onClose, categories, product, onSaved }) {
  const isEdit = !!product
  const blank  = { name: '', sku: '', category_id: '', selling_price: '', cost_price: '', stock_quantity: '0', low_stock_threshold: '5', track_inventory: true }
  const [form, setForm]       = useState(blank)
  const [error, setError]     = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setError('')
    setForm(product ? {
      name: product.name ?? '', sku: product.sku ?? '',
      category_id: product.category_id ?? '',
      selling_price: product.selling_price ?? '',
      cost_price: product.cost_price ?? '',
      stock_quantity: product.stock_quantity ?? 0,
      low_stock_threshold: product.low_stock_threshold ?? 5,
      track_inventory: product.track_inventory ?? true,
    } : blank)
  }, [product, open])

  const set = k => e => setForm(f => ({
    ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value
  }))

  const submit = async e => {
    e.preventDefault(); setLoading(true); setError('')
    try {
      const p = {
        ...form,
        selling_price:       parseFloat(form.selling_price),
        cost_price:          form.cost_price ? parseFloat(form.cost_price) : null,
        stock_quantity:      parseInt(form.stock_quantity),
        low_stock_threshold: parseInt(form.low_stock_threshold),
        category_id:         form.category_id || null,
      }
      isEdit ? await productsApi.update(product.id, p) : await productsApi.create(p)
      onSaved()
    } catch (err) { setError(err.response?.data?.detail ?? 'Failed') }
    finally { setLoading(false) }
  }

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? 'Edit Product' : 'Add Product'} width={520}>
      <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <Alert type="error" message={error} onClose={() => setError('')} />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Field label="Name *"><Input value={form.name} onChange={set('name')} required placeholder="Product name" /></Field>
          <Field label="SKU"><Input value={form.sku} onChange={set('sku')} placeholder="Optional" /></Field>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Field label="Selling Price *"><Input type="number" step="0.01" min="0" value={form.selling_price} onChange={set('selling_price')} required placeholder="0.00" /></Field>
          <Field label="Cost Price"><Input type="number" step="0.01" min="0" value={form.cost_price} onChange={set('cost_price')} placeholder="0.00" /></Field>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Field label="Category">
            <Select value={form.category_id} onChange={set('category_id')}>
              <option value="">No category</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </Select>
          </Field>
          <Field label="Low Stock Alert"><Input type="number" min="0" value={form.low_stock_threshold} onChange={set('low_stock_threshold')} /></Field>
        </div>
        {!isEdit && (
          <Field label="Opening Stock"><Input type="number" min="0" value={form.stock_quantity} onChange={set('stock_quantity')} /></Field>
        )}
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, color: 'var(--color-muted)' }}>
          <input type="checkbox" checked={form.track_inventory} onChange={set('track_inventory')}
            style={{ accentColor: 'var(--color-accent)', width: 14, height: 14 }} />
          Track inventory for this product
        </label>
        <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
          <BtnGhost type="button" style={{ flex: 1 }} onClick={onClose}>Cancel</BtnGhost>
          <BtnPrimary type="submit" style={{ flex: 1 }} disabled={loading}>
            {loading ? 'Saving…' : isEdit ? 'Update Product' : 'Add Product'}
          </BtnPrimary>
        </div>
      </form>
    </Modal>
  )
}

function CategoryModal({ open, onClose, onSaved }) {
  const [form, setForm]       = useState({ name: '', description: '' })
  const [error, setError]     = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async e => {
    e.preventDefault(); setLoading(true); setError('')
    try { await categoriesApi.create(form); setForm({ name: '', description: '' }); onSaved() }
    catch (err) { setError(err.response?.data?.detail ?? 'Failed') }
    finally { setLoading(false) }
  }

  return (
    <Modal open={open} onClose={onClose} title="New Category">
      <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <Alert type="error" message={error} onClose={() => setError('')} />
        <Field label="Name *">
          <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required autoFocus />
        </Field>
        <Field label="Description">
          <Input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Optional" />
        </Field>
        <div style={{ display: 'flex', gap: 8 }}>
          <BtnGhost type="button" style={{ flex: 1 }} onClick={onClose}>Cancel</BtnGhost>
          <BtnPrimary type="submit" style={{ flex: 1 }} disabled={loading}>{loading ? 'Saving…' : 'Create'}</BtnPrimary>
        </div>
      </form>
    </Modal>
  )
}

function AdjustModal({ product, onClose, onSaved }) {
  const ACTIONS = [
    { value: 'restock',    label: 'Restock (+)',           sign:  1 },
    { value: 'adjustment', label: 'Manual Adjustment',     sign:  1 },
    { value: 'damage',     label: 'Damage / Write-off (−)', sign: -1 },
    { value: 'return',     label: 'Customer Return (+)',   sign:  1 },
  ]
  const [form, setForm]       = useState({ action: 'restock', qty: '', note: '' })
  const [error, setError]     = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async e => {
    e.preventDefault(); setLoading(true); setError('')
    try {
      const a = ACTIONS.find(x => x.value === form.action)
      await inventoryApi.adjust({
        product_id:      product.id,
        action:          form.action,
        quantity_change: a.sign * Math.abs(parseInt(form.qty)),
        note:            form.note || null,
      })
      onSaved()
    } catch (err) { setError(err.response?.data?.detail ?? 'Failed') }
    finally { setLoading(false) }
  }

  return (
    <Modal open={!!product} onClose={onClose} title={`Adjust Stock — ${product?.name}`}>
      <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <Alert type="error" message={error} onClose={() => setError('')} />
        <div style={{ background: 'var(--color-base)', border: '1px solid var(--color-border)', borderRadius: 4, padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 12, color: 'var(--color-muted)' }}>Current Stock</span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 22, color: 'white' }}>{product?.stock_quantity}</span>
        </div>
        <Field label="Action">
          <Select value={form.action} onChange={e => setForm(f => ({ ...f, action: e.target.value }))}>
            {ACTIONS.map(a => <option key={a.value} value={a.value}>{a.label}</option>)}
          </Select>
        </Field>
        <Field label="Quantity *">
          <Input type="number" min="1" value={form.qty} onChange={e => setForm(f => ({ ...f, qty: e.target.value }))} required placeholder="0" />
        </Field>
        <Field label="Note (optional)">
          <Input value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))} placeholder="Reason for adjustment" />
        </Field>
        <div style={{ display: 'flex', gap: 8 }}>
          <BtnGhost type="button" style={{ flex: 1 }} onClick={onClose}>Cancel</BtnGhost>
          <BtnPrimary type="submit" style={{ flex: 1 }} disabled={loading}>{loading ? 'Applying…' : 'Apply'}</BtnPrimary>
        </div>
      </form>
    </Modal>
  )
}