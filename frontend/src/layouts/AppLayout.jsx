import { Outlet } from 'react-router-dom'
import Navbar from '../components/layout/Navbar'

export default function AppLayout() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Outlet />
      </main>
      <footer className="no-print border-t border-gray-200 mt-8 py-4 text-center text-xs text-gray-400">
        Cotiza GZ &copy; {new Date().getFullYear()} — by Web Artisan
      </footer>
    </div>
  )
}
