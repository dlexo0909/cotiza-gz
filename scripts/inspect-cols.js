import { readFileSync, writeFileSync } from 'fs'
const lines = readFileSync('C:/Users/pgonzaleze/Downloads/osteriac_mantenimiento_supabase.sql','utf8').split('\n')
const idx = lines.findIndex(l => l.includes('INSERT INTO cotizaciones'))
const cols = lines[idx].match(/\(([^)]+)\)/)[1].split(',').map(c=>c.trim())
console.log('COLUMNAS (' + cols.length + '):')
cols.forEach((c,i) => console.log(i+1, c))

const row = lines[idx+3]
let vals = [], cur = '', inStr = false
for (const c of row) {
  if (c === "'") inStr = !inStr
  else if (c === ',' && !inStr) { vals.push(cur.trim()); cur = ''; continue }
  cur += c
}
vals.push(cur.trim())
console.log('\nVALORES (' + vals.length + '), últimos 12:')
vals.slice(-12).forEach((v,i) => console.log((cols[cols.length-12+i] || '???') + ' = ' + v))
