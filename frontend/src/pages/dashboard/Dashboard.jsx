import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { TrendingUp, Package, ShoppingCart, AlertTriangle, Calendar } from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { salesDaysApi, salesApi, inventoryApi, orgApi } from '../../api/services'
import { useAuth } from '../../context/AuthContext'
import { StatCard, Badge, Alert, PageLoader, fmt } from '../../components/ui'

export default function Dashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [s, setS] = useState({
    loading: true, error: '',
    openDay: null, subscription: null,
    lowStock: [], todaySales: [], days: []
  })

  useEffect(() => {
    ;(async () => {
      try {
        const [dayRes, subRes, lowRes, daysRes] = await Promise.all([
          salesDaysApi.current(), orgApi.getSubscription(),
          inventoryApi.lowStock(), salesDaysApi.list(),
        ])
        const openDay = dayRes.data
        let todaySales = []
        if (openDay) {
          const r = await salesApi.list(openDay.id)
          todaySales = r.data
        }
        setS({
          loading: false, error: '',
          openDay, subscription: subRes.data,
          lowStock: lowRes.data, todaySales,
          days: daysRes.data.slice(0, 14)
        })
      } catch {
        setS(x => ({ ...x, loading: false, error: 'Failed to load dashboard.' }))
      }
    })()
  }, [])

  if (s.loading) return <PageLoader />

  const todayTotal = s.todaySales.reduce((a, t) => a + Number(t.total_amount), 0)
  const allTotal   = s.days.reduce((a, d) => a + Number(d.total_sales_amount), 0)
  const chartData  = [...s.days].reverse().map(d => ({
    date: d.business_date.slice(5),
    amount: Number(d.total_sales_amount)
  }))

  const isMobile = window.innerWidth < 640

  const row  = { borderBottom: '1px solid var(--color-border)' }
  const th   = { fontSize: 10, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', padding: '10px 12px', textAlign: 'left', fontWeight: 400 }
  const td   = { fontSize: 13, color: 'var(--color-text)', padding: '10px 12px' }
  const card = { background: 'var(--color-base-50)', border: '1px solid var(--color-border)', borderRadius: 6 }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 20, color: 'var(--color-text)', margin: 0 }}>
            Dashboard
          </h1>
          <p style={{ fontSize: 12, color: 'var(--color-muted)', marginTop: 4 }}>
            {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        {s.subscription && (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <Badge status={s.subscription.plan} />
            <Badge status={s.subscription.status} />
          </div>
        )}
      </div>

      {s.error && <Alert type="error" message={s.error} />}

      {/* Sales day banner */}
      {s.openDay ? (
        <div style={{
          ...card, padding: '13px 16px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexWrap: 'wrap', gap: 8,
          borderColor: 'rgba(110,231,183,.2)',
          background: 'linear-gradient(90deg,rgba(110,231,183,.05) 0%,transparent 100%)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{
              width: 8, height: 8, borderRadius: '50%',
              background: 'var(--color-accent)',
              boxShadow: '0 0 8px var(--color-accent)',
              display: 'block', flexShrink: 0
            }} />
            <div>
              <p style={{ fontSize: 13, fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--color-text)' }}>
                Sales Day Open — {s.openDay.business_date}
              </p>
              <p style={{ fontSize: 12, color: 'var(--color-muted)', marginTop: 2 }}>
                {s.todaySales.length} transactions · {fmt(todayTotal)} collected
              </p>
            </div>
          </div>
          <button onClick={() => navigate('/sales')} style={{
            fontSize: 12, color: 'var(--color-accent)',
            background: 'none', border: 'none', cursor: 'pointer', flexShrink: 0
          }}>
            View Sales →
          </button>
        </div>
      ) : (
        <div style={{
          ...card, padding: '13px 16px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexWrap: 'wrap', gap: 8,
          borderColor: 'rgba(251,191,36,.2)', background: 'rgba(251,191,36,.04)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Calendar size={15} style={{ color: 'var(--color-warning)', flexShrink: 0 }} />
            <div>
              <p style={{ fontSize: 13, fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--color-warning)' }}>
                No Sales Day Open
              </p>
              <p style={{ fontSize: 12, color: 'var(--color-muted)', marginTop: 2 }}>
                Open a day to start recording transactions
              </p>
            </div>
          </div>
          <button onClick={() => navigate('/sales')} style={{
            fontSize: 12, color: 'var(--color-warning)',
            background: 'none', border: 'none', cursor: 'pointer', flexShrink: 0
          }}>
            Open Day →
          </button>
        </div>
      )}

      {/* Stats — 2 cols on mobile, 4 on desktop */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? 'repeat(2,1fr)' : 'repeat(4,1fr)',
        gap: 10
      }}>
        <StatCard label="Today's Sales"  value={fmt(todayTotal)} accent icon={TrendingUp} sub={`${s.todaySales.length} transactions`} />
        <StatCard label="All Time Total" value={fmt(allTotal)}         icon={TrendingUp} sub={`${s.days.length} days recorded`} />
        <StatCard label="Low Stock"      value={s.lowStock.length}     icon={Package}    sub="items need restocking" />
        <StatCard label="Sales Days"     value={s.days.length}         icon={ShoppingCart} sub="total recorded" />
      </div>

      {/* Chart + Low Stock — stack on mobile */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : '2fr 1fr',
        gap: 16
      }}>
        <div style={{ ...card, padding: 16 }}>
          <p style={{ fontSize: 10, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 18 }}>
            Sales History
          </p>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={175}>
              <AreaChart data={chartData} margin={{ top: 0, right: 0, left: -22, bottom: 0 }}>
                <defs>
                  <linearGradient id="ag" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%"   stopColor="var(--color-accent)" stopOpacity={0.2} />
                    <stop offset="100%" stopColor="var(--color-accent)" stopOpacity={0}   />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date"
                  tick={{ fontSize: 10, fill: 'var(--color-muted)', fontFamily: 'DM Mono' }}
                  axisLine={false} tickLine={false} />
                <YAxis
                  tick={{ fontSize: 10, fill: 'var(--color-muted)', fontFamily: 'DM Mono' }}
                  axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: 'var(--color-base-100)', border: '1px solid var(--color-border)', borderRadius: 4, fontSize: 12 }}
                  labelStyle={{ color: 'var(--color-muted)' }}
                  itemStyle={{ color: 'var(--color-accent)' }}
                  formatter={v => [fmt(v), 'Sales']}
                />
                <Area type="monotone" dataKey="amount"
                  stroke="var(--color-accent)" strokeWidth={1.5}
                  fill="url(#ag)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ height: 175, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-muted)', fontSize: 13 }}>
              No closed sales days yet
            </div>
          )}
        </div>

        <div style={{ ...card, padding: 16 }}>
          <p style={{ fontSize: 10, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6 }}>
            <AlertTriangle size={11} style={{ color: 'var(--color-warning)' }} /> Low Stock
          </p>
          {s.lowStock.length === 0 ? (
            <p style={{ fontSize: 13, color: 'var(--color-muted)', textAlign: 'center', paddingTop: 32 }}>
              All stock levels OK ✓
            </p>
          ) : s.lowStock.slice(0, 8).map(p => (
            <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 0', borderBottom: '1px solid var(--color-border)' }}>
              <span style={{ fontSize: 12, color: 'var(--color-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '75%' }}>
                {p.name}
              </span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--color-danger)', flexShrink: 0 }}>
                {p.stock_quantity}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Recent days table — scrollable on mobile */}
      <div style={card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '13px 16px', borderBottom: '1px solid var(--color-border)' }}>
          <p style={{ fontSize: 10, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Recent Sales Days
          </p>
          <button onClick={() => navigate('/reports')} style={{ fontSize: 12, color: 'var(--color-accent)', background: 'none', border: 'none', cursor: 'pointer' }}>
            All Reports →
          </button>
        </div>
        {/* Wrap table in scrollable div for mobile */}
        <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 420 }}>
            <thead>
              <tr style={row}>
                <th style={th}>Date</th>
                <th style={th}>Transactions</th>
                <th style={th}>Revenue</th>
                <th style={th}>Status</th>
                <th style={th}></th>
              </tr>
            </thead>
            <tbody>
              {s.days.length === 0 ? (
                <tr><td colSpan={5} style={{ textAlign: 'center', color: 'var(--color-muted)', padding: 32, fontSize: 13 }}>No sales days yet</td></tr>
              ) : s.days.map(d => (
                <tr key={d.id} style={row}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--color-base-100)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <td style={{ ...td, fontFamily: 'var(--font-mono)', fontSize: 12 }}>{d.business_date}</td>
                  <td style={{ ...td, fontFamily: 'var(--font-mono)' }}>{d.total_transactions}</td>
                  <td style={{ ...td, fontFamily: 'var(--font-mono)', color: 'var(--color-accent)' }}>{fmt(d.total_sales_amount)}</td>
                  <td style={td}><Badge status={d.status} /></td>
                  <td style={{ ...td, textAlign: 'right' }}>
                    {d.status === 'closed' && (
                      <button onClick={() => navigate(`/reports/${d.id}`)} style={{ fontSize: 12, color: 'var(--color-muted)', background: 'none', border: 'none', cursor: 'pointer' }}
                        onMouseEnter={e => e.currentTarget.style.color = 'var(--color-accent)'}
                        onMouseLeave={e => e.currentTarget.style.color = 'var(--color-muted)'}
                      >
                        Report →
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  )
}