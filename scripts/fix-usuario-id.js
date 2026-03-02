import { readFileSync, writeFileSync } from 'fs'
const file = 'C:/Users/pgonzaleze/Downloads/historial_estatus_supabase.sql'
let content = readFileSync(file, 'utf8')

// Reemplazar todos los "NULL" en posición de usuario_id
// Patrón: ), NULL, 'comentario'  o  ), NULL, NULL,
content = content.replaceAll(', NULL, \'Orden', ", 1, 'Orden")
content = content.replaceAll(', NULL, \'Cotizaci', ", 1, 'Cotizaci")
content = content.replaceAll(', NULL, NULL,', ', 1, NULL,')

writeFileSync(file, content, 'utf8')

// Verificar
const lines = content.split('\n').slice(0,6)
lines.forEach(l => console.log(l.substring(0, 100)))
