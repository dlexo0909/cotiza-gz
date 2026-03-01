export default function StatusBadge({ status, config }) {
  const statusConfig = config[status]
  if (!statusConfig) return <span>{status}</span>

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusConfig.color}`}>
      {statusConfig.dot && (
        <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${statusConfig.dot}`} />
      )}
      {statusConfig.label}
    </span>
  )
}
