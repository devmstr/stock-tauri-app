import fs from 'fs'
import path from 'path'
import os from 'os'
import { execSync } from 'child_process'
import exhausts from '../src/data/exhausts.json'

// Mapping types
const EXHAUST_COMPONENT_TYPES = [
  {
    code: 'SAR',
    label: 'Silencieux Arrière',
    full: '(SAR) Silencieux Arrière'
  },
  { code: 'SAV', label: 'Silencieux Avant', full: '(SAV) Silencieux Avant' },
  {
    code: 'SCE',
    label: 'Silencieux Centrale',
    full: '(SCE) Silencieux Centrale'
  },
  {
    code: 'SDE',
    label: 'Silencieux Détente',
    full: '(SDE) Silencieux Détente'
  },
  { code: 'SIN', label: 'Silencieux Inter', full: '(SIN) Silencieux Inter' },
  {
    code: 'SPR',
    label: 'Silencieux Primaire',
    full: '(SPR) Silencieux Primaire'
  },
  {
    code: 'SRC',
    label: 'Silencieux Remplace Catalyseur',
    full: '(SRC) Silencieux Remplace Catalyseur'
  },
  {
    code: 'SST',
    label: 'Silencieux Standard',
    full: '(SST) Silencieux Standard'
  },
  { code: 'TAR', label: 'Tube Arrière', full: '(TAR) Tube Arrière' },
  { code: 'TCE', label: 'Tube Centrale', full: '(TCE) Tube Centrale' },
  {
    code: 'TDC',
    label: 'Tube Double Collecteur',
    full: '(TDC) Tube Double Collecteur'
  },
  { code: 'TEB', label: 'Tube Embout', full: '(TEB) Tube Embout' },
  {
    code: 'TEC',
    label: 'Tube Ensemble De Collecteur',
    full: '(TEC) Tube Ensemble De Collecteur'
  },
  {
    code: 'TEQ',
    label: 'Tube Ensemble De Collecteur',
    full: '(TEQ) Tube Ensemble De Collecteur'
  },
  { code: 'TFL', label: 'Tube Forme L', full: '(TFL) Tube Forme L' },
  { code: 'TFS', label: 'Tube Forme S', full: '(TFS) Tube Forme S' },
  {
    code: 'TSC',
    label: 'Tube Sortie De Collecteur',
    full: '(TSC) Tube Sortie De Collecteur'
  },
  { code: 'TST', label: 'Tube Standard', full: '(TST) Tube Standard' }
]

function guessType(desc: string) {
  const d = desc.toUpperCase()
  if (d.includes('CENTRAL'))
    return (
      EXHAUST_COMPONENT_TYPES.find((t) => t.code === 'SCE') ||
      EXHAUST_COMPONENT_TYPES[0]
    )
  if (d.includes('DET'))
    return (
      EXHAUST_COMPONENT_TYPES.find((t) => t.code === 'SDE') ||
      EXHAUST_COMPONENT_TYPES[0]
    )
  if (d.includes('INTER'))
    return (
      EXHAUST_COMPONENT_TYPES.find((t) => t.code === 'SIN') ||
      EXHAUST_COMPONENT_TYPES[0]
    )
  if (d.includes('COLL') || d.includes('COLLECTEUR'))
    return (
      EXHAUST_COMPONENT_TYPES.find((t) => t.code === 'TSC') ||
      EXHAUST_COMPONENT_TYPES[0]
    )
  if (d.includes('TUBE'))
    return (
      EXHAUST_COMPONENT_TYPES.find((t) => t.code === 'TST') ||
      EXHAUST_COMPONENT_TYPES[0]
    )
  return (
    EXHAUST_COMPONENT_TYPES.find((t) => t.code === 'SAR') ||
    EXHAUST_COMPONENT_TYPES[0]
  )
}

function guessBrand(desc: string) {
  const brands = [
    'PEUGEOT',
    'RENAULT',
    'DACIA',
    'FIAT',
    'HYUNDAI',
    'KIA',
    'MAZDA',
    'CHEVROLET',
    'NISSAN',
    'MITSUBICHI',
    'CHERY',
    'DAEWOO'
  ]
  const d = desc.toUpperCase()
  for (const b of brands) {
    if (d.includes(b)) return b
  }
  return 'AUTRE'
}

function guessModel(desc: string, brand: string) {
  const d = desc.toUpperCase()
  let m = d
    .replace('SILENCIEUX', '')
    .replace('POT', '')
    .replace('CENTRALE', '')
    .replace('CENTRAL', '')
    .replace('INTER', '')
    .replace('DET', '')
    .replace(brand, '')
    .trim()
  return m.split(',')[0].split('/')[0].trim() || 'Inconnu'
}

function guessDateRange(desc: string) {
  const match = desc.match(/à partir de (.*)/i)
  if (match) return match[1].trim()
  return 'N/A'
}

const SKU_PREFIX: Record<string, string> = {
  SAR: 'SAR',
  SAV: 'SAV',
  SCE: 'SCE',
  SDE: 'SDE',
  SIN: 'SIN',
  SPR: 'SPR',
  SRC: 'SRC',
  SST: 'SST',
  TAR: 'TAR',
  TCE: 'TCE',
  TDC: 'TDC',
  TEB: 'TEB',
  TEC: 'TEC',
  TEQ: 'TEQ',
  TFL: 'TFL',
  TFS: 'TFS',
  TSC: 'TSC',
  TST: 'TST'
}

function generateHash(prefix: string) {
  const dictionary = 'ABCDEFGHJKLMNPQRSTUVWYZ123456789'
  let rnd = ''
  for (let i = 0; i < 4; i++) {
    rnd += dictionary.charAt(Math.floor(Math.random() * dictionary.length))
  }
  return `${SKU_PREFIX[prefix] || 'SAR'}X${rnd}`
}

async function run() {
  const homedir = os.homedir()
  let dbPath = ''
  if (process.platform === 'linux') {
    dbPath = path.join(
      homedir,
      '.local/share/com.totalpaie.exhaust.manager/exhaust.db'
    )
  } else if (process.platform === 'darwin') {
    dbPath = path.join(
      homedir,
      'Library/Application Support/com.totalpaie.exhaust.manager/exhaust.db'
    )
  } else {
    dbPath = path.join(
      process.env.APPDATA || '',
      'com.totalpaie.exhaust.manager/exhaust.db'
    )
  }

  console.log(`Target database: ${dbPath}`)

  if (!fs.existsSync(path.dirname(dbPath))) {
    fs.mkdirSync(path.dirname(dbPath), { recursive: true })
  }

  // Create table if not exists
  const createTableSql = `
    CREATE TABLE IF NOT EXISTS exhaust (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      barcode TEXT NULL,
      label TEXT NULL,
      description TEXT NOT NULL,
      type TEXT NOT NULL,
      painting TEXT NOT NULL,
      qrcode TEXT NULL,
      isValidated INTEGER NOT NULL DEFAULT 0,
      createdAt TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
      updatedAt TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
      hash TEXT NOT NULL UNIQUE,
      carBrand TEXT NULL,
      carModel TEXT NULL,
      carType TEXT NULL,
      carEngine TEXT NULL,
      carDateRange TEXT NOT NULL
    );
  `

  const sqlFile = path.join(os.tmpdir(), `seed-${Date.now()}.sql`)
  let sqlContent = 'BEGIN TRANSACTION;\n'
  sqlContent += createTableSql + '\n'

  // Check count
  try {
    const existingCount = parseInt(
      execSync(`sqlite3 "${dbPath}" "SELECT count(*) FROM exhaust;"`)
        .toString()
        .trim()
    )
    if (existingCount > 0) {
      console.log(`Database already has ${existingCount} items. Skipping seed.`)
      return
    }
  } catch (e) {
    // Table might not exist yet
  }

  console.log(`Preparing ${exhausts.length} items...`)

  const seenHashes = new Set<string>()

  for (const item of exhausts) {
    const typeInfo = guessType(item.description)
    const brand = guessBrand(item.description)
    const model = guessModel(item.description, brand)
    const dateRange = guessDateRange(item.description)
    const painting = item.description.toLowerCase().includes('alumine')
      ? 'ALU'
      : 'LAF'

    let hash = generateHash(typeInfo.code)
    while (seenHashes.has(hash)) {
      hash = generateHash(typeInfo.code)
    }
    seenHashes.add(hash)

    const escape = (s: string | null) => (s ? s.replace(/'/g, "''") : 'NULL')

    sqlContent += `INSERT INTO exhaust (barcode, description, type, painting, hash, carBrand, carModel, carDateRange) VALUES (${item.barcode ? "'" + item.barcode + "'" : 'NULL'}, '${escape(item.description)}', '${escape(typeInfo.full)}', '${painting}', '${hash}', '${escape(brand)}', '${escape(model)}', '${escape(dateRange)}');\n`
  }

  sqlContent += 'COMMIT;'
  fs.writeFileSync(sqlFile, sqlContent)

  console.log('Executing SQL using system sqlite3...')
  try {
    execSync(`sqlite3 "${dbPath}" < "${sqlFile}"`)
    console.log('Seeding successful!')
  } catch (err: any) {
    console.error('Failed to execute sqlite3 command:', err.message)
  } finally {
    fs.unlinkSync(sqlFile)
  }
}

run().catch(console.error)
