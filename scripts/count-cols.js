import { readFileSync } from 'fs'
const lines = readFileSync('C:/Users/pgonzaleze/Downloads/osteriac_mantenimiento_supabase.sql','utf8').split('\n')
const idx = lines.findIndex(l => l.includes('INSERT INTO cotizaciones'))
const header = lines[idx].match(/\(([^)]+)\)/)[1].split(',').length
const row = lines[idx+3]
let inStr = false, commas = 0
for (const c of row) {
  if (c === "'") inStr = !inStr
  else if (c === ',' && !inStr) commas++
}
console.log('Columnas header:', header, '| Valores fila 1:', commas+1)
