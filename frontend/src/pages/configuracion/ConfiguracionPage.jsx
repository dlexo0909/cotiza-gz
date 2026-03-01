import { useState, useEffect } from 'react'
import { api } from '../../services/api'
import toast from 'react-hot-toast'
import { Save, Settings } from 'lucide-react'
import LoadingSpinner from '../../components/ui/LoadingSpinner'

export default function ConfiguracionPage() {
  const [config, setConfig] = useState({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    api.get('/configuracion').then(data => {
      setConfig(data)
    }).catch(() => toast.error('Error al cargar configuración'))
      .finally(() => setLoading(false))
  }, [])

  function handleChange(key, value) {
    setConfig(prev => ({ ...prev, [key]: value }))
  }

  async function handleSave() {
    setSaving(true)
    try {
      await api.put('/configuracion', config)
      toast.success('Configuración guardada')
    } catch (err) { toast.error(err.message) }
    finally { setSaving(false) }
  }

  if (loading) return <LoadingSpinner />

  const sections = [
    {
      title: 'Empresa',
      fields: [
        { key: 'empresa_nombre', label: 'Nombre', type: 'text' },
        { key: 'empresa_rfc', label: 'RFC', type: 'text' },
        { key: 'empresa_direccion', label: 'Dirección', type: 'text' },
        { key: 'empresa_telefono', label: 'Teléfono', type: 'text' },
        { key: 'empresa_email', label: 'Email', type: 'email' },
      ],
    },
    {
      title: 'Cotizaciones',
      fields: [
        { key: 'iva_default', label: 'IVA por defecto (%)', type: 'number' },
        { key: 'vigencia_default', label: 'Vigencia por defecto (días)', type: 'number' },
        { key: 'condiciones_default', label: 'Condiciones por defecto', type: 'textarea' },
        { key: 'neodata_monto_minimo', label: 'Monto mínimo para Neodata', type: 'number' },
      ],
    },
    {
      title: 'Folios',
      fields: [
        { key: 'prefijo_ordenes', label: 'Prefijo de órdenes', type: 'text' },
        { key: 'prefijo_cotizaciones', label: 'Prefijo de cotizaciones', type: 'text' },
      ],
    },
  ]

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
        <Settings className="w-6 h-6" /> Configuración
      </h1>

      <div className="space-y-6 max-w-2xl">
        {sections.map(section => (
          <div key={section.title} className="card">
            <h2 className="text-lg font-semibold mb-4">{section.title}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {section.fields.map(field => (
                <div key={field.key} className={field.type === 'textarea' ? 'sm:col-span-2' : ''}>
                  <label className="label-field">{field.label}</label>
                  {field.type === 'textarea' ? (
                    <textarea value={config[field.key] || ''} onChange={e => handleChange(field.key, e.target.value)}
                      rows={3} className="input-field" />
                  ) : (
                    <input type={field.type} value={config[field.key] || ''} onChange={e => handleChange(field.key, e.target.value)}
                      className="input-field" />
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}

        <div className="flex justify-end">
          <button onClick={handleSave} disabled={saving} className="btn-primary flex items-center gap-2">
            <Save className="w-4 h-4" />{saving ? 'Guardando...' : 'Guardar configuración'}
          </button>
        </div>
      </div>
    </div>
  )
}
