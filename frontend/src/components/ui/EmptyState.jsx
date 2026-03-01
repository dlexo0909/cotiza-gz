import { PackageOpen } from 'lucide-react'

export default function EmptyState({ icon: Icon = PackageOpen, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <Icon className="w-16 h-16 text-gray-300 mb-4" />
      <h3 className="text-lg font-medium text-gray-600 mb-1">{title}</h3>
      {description && <p className="text-sm text-gray-400 mb-4 max-w-md">{description}</p>}
      {action}
    </div>
  )
}
