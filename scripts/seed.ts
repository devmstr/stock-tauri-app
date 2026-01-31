import fs from 'fs'
import path from 'path'
import os from 'os'
import { execSync } from 'child_process'
import exhausts from '../src/data/exhausts.json'

type ExhaustJsonItem = {
  barcode?: string | null
  description?: string | null
  date?: string | null // optional in your json
}

function getDbPath() {
  const homedir = os.homedir()

  if (process.platform === 'linux') {
    return path.join(
      homedir,
      '.config/com.totalpaie.exhaust.manager/exhaust.db'
    )
  }

  if (process.platform === 'darwin') {
    return path.join(
      homedir,
      'Library/Application Support/com.totalpaie.exhaust.manager/exhaust.db'
    )
  }

  // windows
  return path.join(
    process.env.APPDATA || homedir,
    'com.totalpaie.exhaust.manager/exhaust.db'
  )
}

// SQL literal helper: returns NULL or 'escaped string'
function sqlLit(v: string | null | undefined) {
  if (v == null) return 'NULL'
  return `'${String(v).replace(/'/g, "''")}'`
}

// Your requested hash: barcode + description only (deterministic)
function buildHash(barcode: string | null | undefined, description: string) {
  const b = (barcode ?? '').trim()
  const d = description.trim()
  return `${b}|${d}`
}

// Date stored as ISO string; if missing, use now in UTC
function normalizeCreatedAt(v: string | null | undefined) {
  if (!v) return new Date().toISOString()
  const dt = new Date(v)
  return Number.isNaN(dt.getTime())
    ? new Date().toISOString()
    : dt.toISOString()
}

async function run() {
  const dbPath = getDbPath()
  console.log(`Target database: ${dbPath}`)

  // Ensure folder exists
  const dir = path.dirname(dbPath)
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })

  // Drop and recreate for a clean slate
  const dropTableSql = `DROP TABLE IF EXISTS exhaust;`
  const createTableSql = `
CREATE TABLE exhaust (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  barcode TEXT NULL,
  label TEXT NULL,
  description TEXT NOT NULL,
  type TEXT NULL,
  painting TEXT NULL,
  qrcode TEXT NULL,
  isValidated INTEGER NOT NULL DEFAULT 0,
  createdAt TEXT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updatedAt TEXT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  hash TEXT NOT NULL UNIQUE,
  carBrand TEXT NULL,
  carModel TEXT NULL,
  carType TEXT NULL,
  carEngine TEXT NULL,
  carDateRange TEXT NULL
);
`.trim()

  // Build a temporary SQL file
  const sqlFile = path.join(os.tmpdir(), `seed-exhaust-${Date.now()}.sql`)
  let sql = 'BEGIN;\n'
  sql += dropTableSql + '\n'
  sql += createTableSql + '\n\n'

  const items = exhausts as ExhaustJsonItem[]
  console.log(`Preparing ${items.length} items...`)

  const seen = new Set<string>()
  let skipped = 0
  let inserted = 0

  for (const item of items) {
    const description = (item.description ?? '').trim()
    if (!description) {
      skipped++
      continue
    }

    const barcode = item.barcode ? String(item.barcode).trim() : null
    const createdAt = normalizeCreatedAt(item.date)

    // Use a unique combination for hash to avoid collisions if description is identical
    // We add an index or the date if needed, but let's try to keep it deterministic.
    // If the user wants duplicates, we should append a counter.
    let hash = buildHash(barcode, description)
    
    if (seen.has(hash)) {
      // If collision, try making it unique by appending a counter
      let i = 1
      while (seen.has(`${hash}_${i}`)) {
        i++
      }
      hash = `${hash}_${i}`
    }
    seen.add(hash)

    sql +=
      `
INSERT INTO exhaust (barcode, description, createdAt, updatedAt, hash, type, painting, carDateRange, isValidated)
VALUES (
  ${sqlLit(barcode)},
  ${sqlLit(description)},
  ${sqlLit(createdAt)},
  ${sqlLit(createdAt)},
  ${sqlLit(hash)},
  ${sqlLit('SAR')},
  ${sqlLit('RAW')},
  ${sqlLit('N/A')},
  0
);
`.trim() + '\n'
    inserted++
  }

  sql += '\nCOMMIT;\n'
  console.log(`Summary: ${inserted} items inserted, ${skipped} items skipped.`)
  fs.writeFileSync(sqlFile, sql)

  console.log('Executing SQL using system sqlite3...')
  try {
    execSync(`sqlite3 "${dbPath}" < "${sqlFile}"`, { stdio: 'inherit' })
    console.log('✅ Seeding successful!')
  } catch (err: any) {
    console.error('❌ Seeding failed:', err?.message ?? err)
    console.error(`SQL file kept at: ${sqlFile}`)
    return
  }

  // Clean up temp file if success
  fs.unlinkSync(sqlFile)
}

run().catch(console.error)
