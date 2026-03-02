import { readFileSync, writeFileSync } from 'fs'
const file = 'C:/Users/pgonzaleze/Downloads/osteriac_mantenimiento_supabase.sql'
let content = readFileSync(file, 'utf8')

// El header tiene 22 cols pero las filas tienen 23 valores.
// Falta updated_at al final del header.
content = content.replace(
  'INSERT INTO cotizaciones (id, orden_id, folio, subtotal, iva_pct, iva, total, comision_pct, comision, ingreso_real, vigencia_dias, condiciones, neodata_archivo, neodata_original, neodata_fecha, estatus, fecha_autorizacion, fecha_facturacion, numero_factura, fecha_cobro, created_at, updated_at)',
  null // already has updated_at? let's check
)

// Just check current header
const lines = content.split('\n')
const idx = lines.findIndex(l => l.includes('INSERT INTO cotizaciones'))
console.log('Header completo:')
console.log(lines[idx])
