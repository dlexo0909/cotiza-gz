import { AlertCircle, CheckCircle2, Info, AlertTriangle } from 'lucide-react'

const variants = {
  success: {
    bg: 'bg-green-50 border-green-200',
    text: 'text-green-800',
    icon: CheckCircle2,
    iconColor: 'text-green-500',
  },
  error: {
    bg: 'bg-red-50 border-red-200',
    text: 'text-red-800',
    icon: AlertCircle,
    iconColor: 'text-red-500',
  },
  warning: {
    bg: 'bg-yellow-50 border-yellow-200',
    text: 'text-yellow-800',
    icon: AlertTriangle,
    iconColor: 'text-yellow-500',
  },
  info: {
    bg: 'bg-blue-50 border-blue-200',
    text: 'text-blue-800',
    icon: Info,
    iconColor: 'text-blue-500',
  },
}

export default function Alert({ variant = 'info', children, className = '' }) {
  const config = variants[variant]
  const Icon = config.icon

  return (
    <div className={`flex items-start gap-3 px-4 py-3 rounded-lg border ${config.bg} ${className}`}>
      <Icon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${config.iconColor}`} />
      <div className={`text-sm ${config.text}`}>{children}</div>
    </div>
  )
}
