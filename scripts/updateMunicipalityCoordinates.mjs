import fs from 'node:fs'

const [municipalitiesPath, codeMapPath, dictionaryPath] = process.argv.slice(2)
if (!municipalitiesPath || !codeMapPath || !dictionaryPath) {
  throw new Error('Usage: node scripts/updateMunicipalityCoordinates.mjs <municipalities.json> <code_gci.csv> <geoshape-city-geolod.csv>')
}

function parseCsv(text) {
  const rows = []
  let row = [], field = '', quoted = false
  for (let index = 0; index < text.length; index += 1) {
    const character = text[index]
    if (character === '"') {
      if (quoted && text[index + 1] === '"') field += text[++index]
      else quoted = !quoted
    } else if (character === ',' && !quoted) {
      row.push(field); field = ''
    } else if ((character === '\n' || character === '\r') && !quoted) {
      if (character === '\r' && text[index + 1] === '\n') index += 1
      row.push(field); field = ''
      if (row.some(value => value.length)) rows.push(row)
      row = []
    } else field += character
  }
  if (field.length || row.length) { row.push(field); rows.push(row) }
  return rows
}

const codeRows = parseCsv(fs.readFileSync(codeMapPath, 'utf8'))
const idByCode = new Map(codeRows.map(([code, id]) => [code.replace(/^\uFEFF/u, ''), id]))
const dictionaryRows = parseCsv(fs.readFileSync(dictionaryPath, 'utf8'))
const headers = dictionaryRows.shift().map(header => header.replace(/^\uFEFF/u, ''))
const column = Object.fromEntries(headers.map((header, index) => [header, index]))
const coordinatesById = new Map(dictionaryRows.map(row => [row[column.entry_id], {
  latitude: Number(row[column.latitude]),
  longitude: Number(row[column.longitude]),
}]))

// The published dictionary predates Hamamatsu's 2024 ward reorganization.
// All three current ward offices continue at the corresponding former ward offices.
const predecessorCode = new Map([
  ['22138', '22131'], // Chuo-ku <- Naka-ku
  ['22139', '22136'], // Hamana-ku <- Hamakita-ku
  ['22140', '22137'], // Tenryu-ku (code changed)
])

const municipalities = JSON.parse(fs.readFileSync(municipalitiesPath, 'utf8'))
const missing = []
for (const municipality of municipalities) {
  const id = idByCode.get(municipality.code) ?? idByCode.get(predecessorCode.get(municipality.code))
  const coordinates = id && coordinatesById.get(id)
  if (!coordinates || !Number.isFinite(coordinates.latitude) || !Number.isFinite(coordinates.longitude)) {
    missing.push(`${municipality.code} ${municipality.prefecture}${municipality.municipality}`)
    continue
  }
  Object.assign(municipality, coordinates)
}

if (missing.length) throw new Error(`代表座標がない自治体 (${missing.length}):\n${missing.join('\n')}`)
fs.writeFileSync(municipalitiesPath, `${JSON.stringify(municipalities)}\n`, 'utf8')
console.log(`${municipalities.length}自治体に代表座標を設定しました。`)
