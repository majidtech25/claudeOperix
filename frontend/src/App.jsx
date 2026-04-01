import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Layout         from './components/Layout'
import Landing        from './pages/landing/Landing'
import Login          from './pages/auth/Login'
import Register       from './pages/auth/Register'
import Dashboard      from './pages/dashboard/Dashboard'
import Inventory      from './pages/inventory/Inventory'
import Sales          from './pages/sales/Sales'
import Reports        from './pages/reports/Reports'
import Team           from './pages/team/Team'
import Billing        from './pages/billing/Billing'
import BillingSuccess from './pages/billing/BillingSuccess'
import BillingCancel  from './pages/billing/BillingCancel'
import { Spinner }    from './components/ui'
import AdminLogin     from './pages/admin/AdminLogin'
import AdminPortal    from './pages/admin/AdminPortal'
import Settings       from './pages/settings/Settings'

// ── Loading spinner ───────────────────────────────────────────
function LoadingScreen() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Spinner size={28} />
    </div>
  )
}

// ── Merchant guard — logged in + NOT superadmin ───────────────
function Guard({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <LoadingScreen />
  if (!user) return <Navigate to="/login" replace />
  if (user.role === 'super_admin') return <Navigate to="/admin/dashboard" replace />
  return children
}

// ── Admin guard — logged in + IS superadmin ───────────────────
function AdminGuard({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <LoadingScreen />
  if (!user) return <Navigate to="/login" replace />
  if (user.role !== 'super_admin') return <Navigate to="/dashboard" replace />
  return children
}

// ── Public route — redirect logged-in users by role ──────────
function Public({ children }) {
  const { user, loading } = useAuth()
  if (loading) return null
  if (!user) return children
  if (user.role === 'super_admin') return <Navigate to="/admin/dashboard" replace />
  return <Navigate to="/dashboard" replace />
}

export default function App() {
  return (
    <HashRouter>
      <AuthProvider>
        <Routes>
          {/* Public */}
          <Route path="/"         element={<Landing />} />
          <Route path="/login"    element={<Public><Login /></Public>} />
          <Route path="/register" element={<Public><Register /></Public>} />

          {/* Billing standalone pages */}
          <Route path="/billing/success" element={<BillingSuccess />} />
          <Route path="/billing/cancel"  element={<BillingCancel />} />

          {/* Admin routes */}
          <Route path="/admin/login"     element={<Public><AdminLogin /></Public>} />
          <Route path="/admin/dashboard" element={<AdminGuard><AdminPortal /></AdminGuard>} />

          {/* Protected merchant app */}
          <Route element={<Guard><Layout /></Guard>}>
            <Route path="/dashboard"      element={<Dashboard />} />
            <Route path="/inventory"      element={<Inventory />} />
            <Route path="/sales"          element={<Sales />} />
            <Route path="/reports"        element={<Reports />} />
            <Route path="/reports/:dayId" element={<Reports />} />
            <Route path="/team"           element={<Team />} />
            <Route path="/billing"        element={<Billing />} />
            <Route path="/settings"       element={<Settings />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </HashRouter>
  )
}