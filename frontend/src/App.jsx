import { Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { useAuthStore } from './store/authStore'

// Layouts
import MainLayout from './components/layout/MainLayout'

// Pages
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Clients from './pages/Clients'
import ClientDetail from './pages/ClientDetail'
import NewClient from './pages/NewClient'
import Interventions from './pages/Interventions'
import InterventionDetail from './pages/InterventionDetail'
import NewIntervention from './pages/NewIntervention'
import Sopralluoghi from './pages/Sopralluoghi'
import NewSopralluogo from './pages/NewSopralluogo'
import Calendar from './pages/Calendar'
import Preventivi from './pages/Preventivi'
import NewPreventivo from './pages/NewPreventivo'
import PreventivoDetail from './pages/PreventivoDetail'
import Fatture from './pages/Fatture'
import NewFattura from './pages/NewFattura'
import FatturaDetail from './pages/FatturaDetail'
import Products from './pages/Products'
import NewProduct from './pages/NewProduct'
import Technicians from './pages/Technicians'
import NewTechnician from './pages/NewTechnician'
import Settings from './pages/Settings'

// Protected Route component
const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { isAuthenticated, user } = useAuthStore()
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }
  
  if (allowedRoles.length > 0 && !allowedRoles.includes(user?.ruolo)) {
    return <Navigate to="/" replace />
  }
  
  return children
}

// Tecnico vede solo Interventi/Calendario: dalla home va agli interventi
const DashboardOrRedirect = () => {
  const { user } = useAuthStore()
  if (user?.ruolo === 'tecnico') {
    return <Navigate to="/interventions" replace />
  }
  return <Dashboard />
}

function App() {
  return (
    <>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        <Route path="/" element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }>
          <Route index element={<DashboardOrRedirect />} />
          <Route path="clients" element={
            <ProtectedRoute allowedRoles={['admin', 'operatore']}>
              <Clients />
            </ProtectedRoute>
          } />
          <Route path="clients/new" element={
            <ProtectedRoute allowedRoles={['admin', 'operatore']}>
              <NewClient />
            </ProtectedRoute>
          } />
          <Route path="clients/:id" element={
            <ProtectedRoute allowedRoles={['admin', 'operatore']}>
              <ClientDetail />
            </ProtectedRoute>
          } />
          <Route path="interventions" element={<Interventions />} />
          <Route path="interventions/:id" element={<InterventionDetail />} />
          <Route path="interventions/new" element={
            <ProtectedRoute allowedRoles={['admin', 'operatore']}>
              <NewIntervention />
            </ProtectedRoute>
          } />
          <Route path="sopralluoghi" element={<Sopralluoghi />} />
          <Route path="sopralluoghi/new" element={
            <ProtectedRoute allowedRoles={['admin', 'operatore']}>
              <NewSopralluogo />
            </ProtectedRoute>
          } />
          <Route path="sopralluoghi/:id" element={<InterventionDetail />} />
          <Route path="calendar" element={<Calendar />} />
          <Route path="preventivi" element={
            <ProtectedRoute allowedRoles={['admin', 'operatore']}>
              <Preventivi />
            </ProtectedRoute>
          } />
          <Route path="preventivi/new" element={
            <ProtectedRoute allowedRoles={['admin', 'operatore']}>
              <NewPreventivo />
            </ProtectedRoute>
          } />
          <Route path="preventivi/:id" element={
            <ProtectedRoute allowedRoles={['admin', 'operatore']}>
              <PreventivoDetail />
            </ProtectedRoute>
          } />
          <Route path="fatture" element={
            <ProtectedRoute allowedRoles={['admin', 'operatore']}>
              <Fatture />
            </ProtectedRoute>
          } />
          <Route path="fatture/new" element={
            <ProtectedRoute allowedRoles={['admin', 'operatore']}>
              <NewFattura />
            </ProtectedRoute>
          } />
          <Route path="fatture/:id" element={
            <ProtectedRoute allowedRoles={['admin', 'operatore']}>
              <FatturaDetail />
            </ProtectedRoute>
          } />
          <Route path="products" element={
            <ProtectedRoute allowedRoles={['admin', 'operatore']}>
              <Products />
            </ProtectedRoute>
          } />
          <Route path="products/new" element={
            <ProtectedRoute allowedRoles={['admin', 'operatore']}>
              <NewProduct />
            </ProtectedRoute>
          } />
          <Route path="technicians" element={
            <ProtectedRoute allowedRoles={['admin', 'operatore']}>
              <Technicians />
            </ProtectedRoute>
          } />
          <Route path="technicians/new" element={
            <ProtectedRoute allowedRoles={['admin', 'operatore']}>
              <NewTechnician />
            </ProtectedRoute>
          } />
          <Route path="settings" element={
            <ProtectedRoute allowedRoles={['admin', 'operatore']}>
              <Settings />
            </ProtectedRoute>
          } />
        </Route>
      </Routes>
      <Toaster position="top-right" />
    </>
  )
}

export default App
