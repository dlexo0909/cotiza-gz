/**
 * Convierte un dump MySQL a SQL compatible con Supabase (PostgreSQL)
 * Uso: node scripts/convert-mysql-to-supabase.js <archivo.sql>
 */

import { readFileSync, writeFileSync } from 'fs'
import { resolve, basename, dirname } from 'path'

const inputFile = process.argv[2]
if (!inputFile) {
  console.error('Uso: node scripts/convert-mysql-to-supabase.js <archivo.sql>')
  process.exit(1)
}

const inputPath = resolve(inputFile)
let sql = readFileSync(inputPath, 'utf8')

// Tablas con GENERATED ALWAYS AS IDENTITY en Supabase
const identityTables = [
  'usuarios',
  'clientes',
  'clientes_finales',
  'ordenes_trabajo',
  'cotizaciones',
  'cotizacion_partidas',
  'cotizacion_analisis_costos',
  'historial_estatus',
]

// 1. Eliminar cabecera y comentarios MySQL
sql = sql.replace(/^--.*$/gm, '')
sql = sql.replace(/\/\*!.*?\*\/;?/gs, '')
sql = sql.replace(/SET SQL_MODE.*?;\n/g, '')
sql = sql.replace(/START TRANSACTION.*?;\n/g, '')
sql = sql.replace(/SET time_zone.*?;\n/g, '')
sql = sql.replace(/SET @OLD.*?;\n/g, '')
sql = sql.replace(/SET NAMES.*?;\n/g, '')

// 2. Eliminar CREATE TABLE (Supabase ya tiene el schema)
sql = sql.replace(/CREATE TABLE[\s\S]*?ENGINE=[\s\S]*?;\n/g, '')
sql = sql.replace(/ALTER TABLE[\s\S]*?;\n/g, '')
sql = sql.replace(/CREATE INDEX[\s\S]*?;\n/g, '')

// 3. Quitar backticks de MySQL
sql = sql.replace(/`/g, '')

// 4. Convertir INSERT INTO con id → INSERT INTO ... OVERRIDING SYSTEM VALUE
for (const table of identityTables) {
  // Patrón: INSERT INTO table (...) VALUES → INSERT INTO table (...) OVERRIDING SYSTEM VALUE\nVALUES
  const regex = new RegExp(
    `(INSERT INTO (?:public\\.)?${table}\\s*\\([^)]+\\))\\s*(VALUES)`,
    'gi'
  )
  sql = sql.replace(regex, '$1\nOVERRIDING SYSTEM VALUE\n$2')
}

// 5. Convertir booleanos MySQL (,1, y ,0,) en columna activo
// Solo para valores literales en INSERT (no dentro de strings)
// Los valores 1/0 funcionan en PostgreSQL también, pero TRUE/FALSE es más limpio
// Dejamos como están ya que PostgreSQL acepta 1 y 0 para boolean

// 6. Limpiar líneas vacías múltiples
sql = sql.replace(/\n{3,}/g, '\n\n')

// 7. Agregar reset de secuencias al final
const sequenceResets = identityTables
  .map(t => `SELECT setval('${t}_id_seq', COALESCE((SELECT MAX(id) FROM ${t}), 1));`)
  .join('\n')

sql += `\n\n-- Reset sequences\n${sequenceResets}\n`

// 8. Guardar archivo de salida
const outName = basename(inputPath, '.sql') + '_supabase.sql'
const outPath = resolve(dirname(inputPath), outName)
writeFileSync(outPath, sql, 'utf8')

console.log(`✅ Archivo convertido: ${outPath}`)
console.log('📋 Pasos siguientes:')
console.log('   1. Abre el archivo generado en Supabase → SQL Editor')
console.log('   2. Pega el contenido y ejecuta')
console.log('   3. Verifica que no haya errores')
