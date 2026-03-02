import { readFileSync, writeFileSync } from 'fs'

const file = 'C:/Users/pgonzaleze/Downloads/osteriac_mantenimiento_supabase.sql'
let content = readFileSync(file, 'utf8')

const INSERT_START = content.indexOf('INSERT INTO cotizaciones')
const INSERT_END = content.indexOf('\nINSERT INTO cotizacion_partidas')
let section = content.substring(INSERT_START, INSERT_END)

// 1. Quitar notas_internas (''): aparece como ", '', NULL, NULL, NULL, 'estatus'"
//    -> ", NULL, NULL, NULL, 'estatus'"
section = section.replaceAll(", '', NULL, NULL, NULL, '", ", NULL, NULL, NULL, '")

// 2. Quitar fecha_envio: aparece entre estatus y fecha_autorizacion
//    Con fecha:  'enviada', '2026-02-03', NULL,   -> 'enviada', NULL,
//    Sin fecha:  'borrador', NULL, NULL,           -> 'borrador', NULL,
section = section.replace(/'(borrador|enviada|autorizada|rechazada|vencida)', '[0-9]{4}-[0-9]{2}-[0-9]{2}', /g, "'$1', ")
// El caso "borrador NULL NULL" no necesita cambio porque el segundo NULL es fecha_autorizacion

content = content.substring(0, INSERT_START) + section + content.substring(INSERT_END)
writeFileSync(file, content, 'utf8')

// Verificar
const lines = content.split('\n')
const idx = lines.findIndex(l => l.includes('INSERT INTO cotizaciones'))
console.log('✅ Header:', lines[idx].substring(0, 160))
console.log('Fila 1:', lines[idx + 3])
console.log('Fila 2 (borrador):', lines[idx + 26])
