import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Layout    from './components/Layout'
import Landing   from './pages/landing/Landing'
import Login     from './pages/auth/Login'
import Register  from './pages/auth/Register'
import Dashboard from './pages/dashboard/Dashboard'
import Inventory from './pages/inventory/Inventory'
import Sales     from './pages/sales/Sales'
import Reports   from './pages/reports/Reports'
import Team      from './pages/team/Team'
import { Spinner } from './components/ui'

function Guard({ children }) {
  const { user, loading } = useAuth()
  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Spinner size={28} />
    </div>
  )
  return user ? children : <Navigate to="/login" replace />
}

function Public({ children }) {
  const { user, loading } = useAuth()
  if (loading) return null
  return user ? <Navigate to="/dashboard" replace /> : children
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/"         element={<Landing />} />
          <Route path="/login"    element={<Public><Login /></Public>} />
          <Route path="/register" element={<Public><Register /></Public>} />
          <Route element={<Guard><Layout /></Guard>}>
            <Route path="/dashboard"      element={<Dashboard />} />
            <Route path="/inventory"      element={<Inventory />} />
            <Route path="/sales"          element={<Sales />} />
            <Route path="/reports"        element={<Reports />} />
            <Route path="/reports/:dayId" element={<Reports />} />
            <Route path="/team"           element={<Team />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}