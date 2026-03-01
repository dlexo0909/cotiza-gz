import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import AppLayout from './layouts/AppLayout'
import LoadingSpinner from './components/ui/LoadingSpinner'

// Pages
import LoginPage from './pages/auth/LoginPage'
import DashboardPage from './pages/dashboard/DashboardPage'
import ClientesListPage from './pages/clientes/ClientesListPage'
import ClienteFormPage from './pages/clientes/ClienteFormPage'
import ClientesFinalListPage from './pages/clientes-finales/ClientesFinalListPage'
import ClienteFinalFormPage from './pages/clientes-finales/ClienteFinalFormPage'
import OrdenesListPage from './pages/ordenes/OrdenesListPage'
import OrdenFormPage from './pages/ordenes/OrdenFormPage'
import OrdenDetailPage from './pages/ordenes/OrdenDetailPage'
import CotizacionesListPage from './pages/cotizaciones/CotizacionesListPage'
import CotizacionFormPage from './pages/cotizaciones/CotizacionFormPage'
import CotizacionDetailPage from './pages/cotizaciones/CotizacionDetailPage'
import AnalisisCostosPage from './pages/cotizaciones/AnalisisCostosPage'
import CotizacionPdfPage from './pages/cotizaciones/CotizacionPdfPage'
import ReportesIndexPage from './pages/reportes/ReportesIndexPage'
import ReporteIngresosPage from './pages/reportes/ReporteIngresosPage'
import ReportePorClientePage from './pages/reportes/ReportePorClientePage'
import ReporteOrdenesPage from './pages/reportes/ReporteOrdenesPage'
import ReportePorCobrarPage from './pages/reportes/ReportePorCobrarPage'
import UsuariosListPage from './pages/usuarios/UsuariosListPage'
import UsuarioFormPage from './pages/usuarios/UsuarioFormPage'
import ConfiguracionPage from './pages/configuracion/ConfiguracionPage'

function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth()
  if (loading) return <LoadingSpinner text="Verificando sesión..." />
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return children
}

function AdminRoute({ children }) {
  const { isAdmin, loading } = useAuth()
  if (loading) return <LoadingSpinner text="Verificando permisos..." />
  if (!isAdmin) return <Navigate to="/" replace />
  return children
}

function GuestRoute({ children }) {
  const { isAuthenticated, loading } = useAuth()
  if (loading) return <LoadingSpinner text="" />
  if (isAuthenticated) return <Navigate to="/" replace />
  return children
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/login" element={<GuestRoute><LoginPage /></GuestRoute>} />

        {/* Protected */}
        <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
          <Route path="/" element={<DashboardPage />} />

          {/* Clientes */}
          <Route path="/clientes" element={<ClientesListPage />} />
          <Route path="/clientes/nuevo" element={<ClienteFormPage />} />
          <Route path="/clientes/:id" element={<ClienteFormPage />} />

          {/* Clientes Finales / Sucursales */}
          <Route path="/clientes-finales" element={<ClientesFinalListPage />} />
          <Route path="/clientes-finales/nuevo" element={<ClienteFinalFormPage />} />
          <Route path="/clientes-finales/:id" element={<ClienteFinalFormPage />} />

          {/* Órdenes */}
          <Route path="/ordenes" element={<OrdenesListPage />} />
          <Route path="/ordenes/nueva" element={<OrdenFormPage />} />
          <Route path="/ordenes/:id" element={<OrdenDetailPage />} />
          <Route path="/ordenes/:id/editar" element={<OrdenFormPage />} />

          {/* Cotizaciones */}
          <Route path="/cotizaciones" element={<CotizacionesListPage />} />
          <Route path="/cotizaciones/nueva" element={<CotizacionFormPage />} />
          <Route path="/cotizaciones/:id" element={<CotizacionDetailPage />} />
          <Route path="/cotizaciones/:id/editar" element={<CotizacionFormPage />} />
          <Route path="/cotizaciones/:id/analisis-costos" element={<AnalisisCostosPage />} />

          {/* Reportes */}
          <Route path="/reportes" element={<ReportesIndexPage />} />
          <Route path="/reportes/ingresos" element={<ReporteIngresosPage />} />
          <Route path="/reportes/por-cliente" element={<ReportePorClientePage />} />
          <Route path="/reportes/ordenes" element={<ReporteOrdenesPage />} />
          <Route path="/reportes/por-cobrar" element={<ReportePorCobrarPage />} />

          {/* Admin only */}
          <Route path="/usuarios" element={<AdminRoute><UsuariosListPage /></AdminRoute>} />
          <Route path="/usuarios/nuevo" element={<AdminRoute><UsuarioFormPage /></AdminRoute>} />
          <Route path="/usuarios/:id" element={<AdminRoute><UsuarioFormPage /></AdminRoute>} />
          <Route path="/configuracion" element={<AdminRoute><ConfiguracionPage /></AdminRoute>} />
        </Route>

        {/* PDF — protected, no AppLayout */}
        <Route path="/cotizaciones/:id/pdf" element={<ProtectedRoute><CotizacionPdfPage /></ProtectedRoute>} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
