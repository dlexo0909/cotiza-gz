import { Link } from 'react-router-dom'
import { BarChart3, DollarSign, ClipboardList, Users, CreditCard } from 'lucide-react'

const reports = [
  { name: 'Ingresos', description: 'Reporte de ingresos mensuales, facturación y cobros', href: '/reportes/ingresos', icon: DollarSign, color: 'text-green-600 bg-green-100' },
  { name: 'Por Cliente', description: 'Resumen de órdenes, cotizaciones e ingresos por cliente', href: '/reportes/por-cliente', icon: Users, color: 'text-blue-600 bg-blue-100' },
  { name: 'Estado de Órdenes', description: 'Pipeline de órdenes por estatus con días de antigüedad', href: '/reportes/ordenes', icon: ClipboardList, color: 'text-purple-600 bg-purple-100' },
  { name: 'Cuentas por Cobrar', description: 'Cotizaciones autorizadas pendientes de cobro', href: '/reportes/por-cobrar', icon: CreditCard, color: 'text-orange-600 bg-orange-100' },
]

export default function ReportesIndexPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
        <BarChart3 className="w-6 h-6" /> Reportes
      </h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {reports.map(r => (
          <Link key={r.href} to={r.href} className="card hover:shadow-md transition-shadow flex items-start gap-4">
            <div className={`p-3 rounded-xl ${r.color}`}>
              <r.icon className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">{r.name}</h3>
              <p className="text-sm text-gray-500 mt-1">{r.description}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
