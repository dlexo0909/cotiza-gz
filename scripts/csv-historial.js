import { readFileSync, writeFileSync } from 'fs'

const csv = readFileSync('C:/Users/pgonzaleze/Downloads/historial_estatus_pu.csv', 'utf8')
const lines = csv.trim().split('\n').slice(1) // skip header

const rows = lines.map(line => {
  const [entidad_tipo, entidad_id, estatus_anterior, estatus_nuevo, usuario_id, comentario, created_at] = line.split(',')

  // Mapear nombres del CSV al schema de Supabase
  const tipo = entidad_tipo === 'ordenes_trabajo' ? 'orden' : 'cotizacion'
  const ant = estatus_anterior ? `'${estatus_anterior}'` : 'NULL'
  const com = comentario ? `'${comentario.replace(/'/g, "''")}'` : 'NULL'

  return `(${entidad_id}, '${tipo}', ${ant}, '${estatus_nuevo}', 1, ${com}, '${created_at}')`
})

const sql = `INSERT INTO historial_estatus (entidad_id, entidad_tipo, estatus_anterior, estatus_nuevo, usuario_id, comentario, created_at)
VALUES
${rows.join(',\n')};

SELECT setval('historial_estatus_id_seq', COALESCE((SELECT MAX(id) FROM historial_estatus), 1));
`

writeFileSync('C:/Users/pgonzaleze/Downloads/historial_estatus_supabase.sql', sql, 'utf8')
console.log(`✅ Generado: historial_estatus_supabase.sql (${rows.length} filas)`)
