import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import {
  LayoutDashboard, Users, Building2, ClipboardList,
  FileText, BarChart3, Settings, LogOut, Menu, X, UserCog
} from 'lucide-react'

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Clientes', href: '/clientes', icon: Building2 },
  { name: 'Sucursales', href: '/clientes-finales', icon: Users },
  { name: 'Órdenes', href: '/ordenes', icon: ClipboardList },
  { name: 'Cotizaciones', href: '/cotizaciones', icon: FileText },
  { name: 'Reportes', href: '/reportes', icon: BarChart3 },
]

const adminNavigation = [
  { name: 'Usuarios', href: '/usuarios', icon: UserCog },
  { name: 'Configuración', href: '/configuracion', icon: Settings },
]

export default function Navbar() {
  const { profile, logout, isAdmin } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const allNav = [...navigation, ...(isAdmin ? adminNavigation : [])]

  return (
    <nav className="bg-white border-b border-gray-200 no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo + Desktop Nav */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center gap-2 text-primary-700 font-bold text-lg">
              <ClipboardList className="w-6 h-6" />
              <span className="hidden sm:inline">Cotiza GZ</span>
            </Link>
            <div className="hidden md:flex ml-8 gap-1">
              {allNav.map((item) => {
                const isActive = item.href === '/'
                  ? location.pathname === '/'
                  : location.pathname.startsWith(item.href)
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-primary-50 text-primary-700'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    }`}
                  >
                    <item.icon className="w-4 h-4" />
                    {item.name}
                  </Link>
                )
              })}
            </div>
          </div>

          {/* User menu */}
          <div className="flex items-center gap-3">
            <span className="hidden sm:block text-sm text-gray-600">
              {profile?.nombre}
              {isAdmin && (
                <span className="ml-1 text-xs bg-primary-100 text-primary-700 px-2 py-0.5 rounded-full">
                  admin
                </span>
              )}
            </span>
            <button onClick={handleLogout} className="text-gray-500 hover:text-red-600 transition-colors" title="Cerrar sesión">
              <LogOut className="w-5 h-5" />
            </button>

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden text-gray-500 hover:text-gray-700"
            >
              {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile nav */}
      {mobileOpen && (
        <div className="md:hidden border-t border-gray-200 bg-white">
          <div className="px-2 py-3 space-y-1">
            {allNav.map((item) => {
              const isActive = item.href === '/'
                ? location.pathname === '/'
                : location.pathname.startsWith(item.href)
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium ${
                    isActive
                      ? 'bg-primary-50 text-primary-700'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <item.icon className="w-4 h-4" />
                  {item.name}
                </Link>
              )
            })}
          </div>
        </div>
      )}
    </nav>
  )
}
