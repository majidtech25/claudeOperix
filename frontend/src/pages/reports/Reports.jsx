import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Users, Package } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { salesDaysApi, salesApi } from '../../api/services'
import { Badge, StatCard, Alert, PageLoader, Empty, fmt } from '../../components/ui'

export default function Reports() {
  const { dayId } = useParams()
  return dayId ? <DayReport dayId={dayId} /> : <ReportsList />
}

function ReportsList() {
  const navigate = useNavigate()
  const [days, setDays]       = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState('')

  useEffect(() => {
    salesDaysApi.list()
      .then(r => setDays(r.data.filter(d => d.status === 'closed')))
      .catch(() => setError('Failed to load'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <PageLoader />

  const totalRevenue = days.reduce((s, d) => s + Number(d.total_sales_amount), 0)
  const totalTx      = days.reduce((s, d) => s + d.total_transactions, 0)
  const chartData    = [...days].reverse().slice(-14).map(d => ({
    date: d.business_date.slice(5), amount: Number(d.total_sales_amount)
  }))

  const card = { background: 'var(--color-base-50)', border: '1px solid var(--color-border)', borderRadius: 6 }
  const row  = { borderBottom: '1px solid var(--color-border)' }
  const th   = { fontSize: 10, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', padding: '10px 16px', textAlign: 'left', fontWeight: 400 }
  const td   = { fontSize: 13, color: 'rgba(255,255,255,.78)', padding: '10px 16px' }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 22, color: 'white', margin: 0 }}>Reports</h1>

      {error && <Alert type="error" message={error} />}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
        <StatCard label="Total Revenue"       value={fmt(totalRevenue)} accent sub={`${days.length} closed days`} />
        <StatCard label="Total Transactions"  value={totalTx} />
        <StatCard label="Avg Revenue / Day"   value={fmt(days.length ? totalRevenue / days.length : 0)} />
      </div>

      {chartData.length > 0 && (
        <div style={{ ...card, padding: 20 }}>
          <p style={{ fontSize: 10, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 18 }}>
            Revenue — Last 14 Days
          </p>
          <ResponsiveContainer width="100%" height={175}>
            <BarChart data={chartData} margin={{ top: 0, right: 0, left: -22, bottom: 0 }}>
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'var(--color-muted)', fontFamily: 'DM Mono' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: 'var(--color-muted)', fontFamily: 'DM Mono' }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: 'var(--color-base-100)', border: '1px solid var(--color-border)', borderRadius: 4, fontSize: 12 }}
                formatter={v => [fmt(v), 'Revenue']}
                labelStyle={{ color: 'var(--color-muted)' }}
              />
              <Bar dataKey="amount" radius={[3, 3, 0, 0]}>
                {chartData.map((_, i) => (
                  <Cell key={i} fill={i === chartData.length - 1 ? 'var(--color-accent)' : 'var(--color-base-200)'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <div style={card}>
        <div style={{ padding: '12px 20px', borderBottom: '1px solid var(--color-border)' }}>
          <p style={{ fontSize: 10, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>All Closed Days</p>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={row}>
              <th style={th}>Date</th>
              <th style={th}>Transactions</th>
              <th style={th}>Revenue</th>
              <th style={th}>Avg Sale</th>
              <th style={th}></th>
            </tr>
          </thead>
          <tbody>
            {days.length === 0 ? (
              <tr><td colSpan={5}><Empty title="No closed days yet" description="Close a sales day to see reports here" /></td></tr>
            ) : days.map(d => (
              <tr key={d.id} style={{ ...row, cursor: 'pointer' }}
                onClick={() => navigate(`/reports/${d.id}`)}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,.02)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <td style={{ ...td, fontFamily: 'var(--font-mono)', fontSize: 12 }}>{d.business_date}</td>
                <td style={{ ...td, fontFamily: 'var(--font-mono)' }}>{d.total_transactions}</td>
                <td style={{ ...td, fontFamily: 'var(--font-mono)', color: 'var(--color-accent)' }}>{fmt(d.total_sales_amount)}</td>
                <td style={{ ...td, fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--color-muted)' }}>
                  {d.total_transactions ? fmt(d.total_sales_amount / d.total_transactions) : '—'}
                </td>
                <td style={{ ...td, textAlign: 'right', color: 'var(--color-muted)', fontSize: 12 }}>View →</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function DayReport({ dayId }) {
  const navigate = useNavigate()
  const [report, setReport]   = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState('')

  useEffect(() => {
    salesApi.dailyReport(dayId)
      .then(r => setReport(r.data))
      .catch(() => setError('Failed to load report'))
      .finally(() => setLoading(false))
  }, [dayId])

  if (loading) return <PageLoader />
  if (error)   return <Alert type="error" message={error} />
  if (!report) return null

  const card = { background: 'var(--color-base-50)', border: '1px solid var(--color-border)', borderRadius: 6 }
  const row  = { borderBottom: '1px solid var(--color-border)' }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={() => navigate('/reports')} style={{
          background: 'none', border: 'none', cursor: 'pointer',
          color: 'var(--color-muted)', display: 'flex', padding: 4
        }}
          onMouseEnter={e => e.currentTarget.style.color = 'white'}
          onMouseLeave={e => e.currentTarget.style.color = 'var(--color-muted)'}
        >
          <ArrowLeft size={16} />
        </button>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 22, color: 'white', margin: 0 }}>Daily Report</h1>
          <p style={{ fontSize: 12, color: 'var(--color-muted)', fontFamily: 'var(--font-mono)', marginTop: 3 }}>{report.business_date}</p>
        </div>
        <Badge status={report.status} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
        <StatCard label="Total Revenue"  value={fmt(report.total_amount)} accent />
        <StatCard label="Transactions"   value={report.total_transactions} />
        <StatCard label="Avg Sale"       value={report.total_transactions ? fmt(report.total_amount / report.total_transactions) : '—'} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div style={{ ...card, padding: 20 }}>
          <p style={{ fontSize: 10, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Users size={11} /> By Employee
          </p>
          {report.sales_by_employee?.length === 0 ? (
            <p style={{ fontSize: 13, color: 'var(--color-muted)' }}>No data</p>
          ) : report.sales_by_employee?.map(e => (
            <div key={e.employee_id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--color-border)' }}>
              <div>
                <p style={{ fontSize: 13, fontWeight: 500, color: 'white', margin: 0 }}>{e.employee_name}</p>
                <p style={{ fontSize: 11, color: 'var(--color-muted)', fontFamily: 'var(--font-mono)', marginTop: 2 }}>{e.transaction_count} sales</p>
              </div>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--color-accent)' }}>{fmt(e.total_sales)}</span>
            </div>
          ))}
        </div>

        <div style={{ ...card, padding: 20 }}>
          <p style={{ fontSize: 10, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Package size={11} /> Top Products
          </p>
          {report.top_products?.length === 0 ? (
            <p style={{ fontSize: 13, color: 'var(--color-muted)' }}>No data</p>
          ) : report.top_products?.slice(0, 6).map((p, i) => (
            <div key={p.product_id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid var(--color-border)' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--color-muted)', width: 16 }}>{i + 1}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 12, color: 'white', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.product_name}</p>
                <p style={{ fontSize: 10, color: 'var(--color-muted)', fontFamily: 'var(--font-mono)', margin: '2px 0 0' }}>{p.total_quantity} units</p>
              </div>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--color-accent)', flexShrink: 0 }}>{fmt(p.total_revenue)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}