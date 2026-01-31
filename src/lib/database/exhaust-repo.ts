import type { Exhaust, ExhaustInsertInput } from '@/types/exhaust'
import exhaustsJson from '@/data/exhausts.json'
import { getDb } from './db'

/**
 * Ensures the exhaust table exists.
 */
export async function ensureTable(): Promise<void> {
  const db = await getDb()
  await db.execute(`
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
  `)
}

export async function listExhaust(): Promise<Exhaust[]> {
  const db = await getDb()
  const rows = await db.select<Exhaust[]>(
    `SELECT
      id,
      barcode,
      label,
      description,
      type,
      painting,
      qrcode,
      isValidated,
      createdAt,
      updatedAt,
      hash,
      carBrand,
      carModel,
      carType,
      carEngine,
      carDateRange
    FROM exhaust
    ORDER BY id DESC`
  )
  // SQLite booleans may come back as 0/1
  return rows.map((r: any) => ({
    ...r,
    isValidated: r.isValidated == null ? null : Boolean(r.isValidated)
  }))
}

export async function insertExhaust(input: ExhaustInsertInput): Promise<void> {
  const db = await getDb()
  await db.execute(
    `INSERT INTO exhaust
      (barcode, label, description, type, painting, qrcode, isValidated, hash, carBrand, carModel, carType, carEngine, carDateRange)
     VALUES
      (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      input.barcode ?? null,
      input.label ?? null,
      input.description,
      input.type,
      input.painting,
      input.qrcode ?? null,
      input.isValidated == null ? 0 : input.isValidated ? 1 : 0,
      input.hash,
      input.carBrand ?? null,
      input.carModel ?? null,
      input.carType ?? null,
      input.carEngine ?? null,
      input.carDateRange
    ]
  )
}
export async function updateExhaust(
  id: number,
  input: Partial<ExhaustInsertInput>
): Promise<void> {
  const db = await getDb()
  const fields: string[] = []
  const params: any[] = []

  // Collect modified fields
  const map: Record<string, any> = {
    barcode: input.barcode,
    label: input.label,
    description: input.description,
    type: input.type,
    painting: input.painting,
    qrcode: input.qrcode,
    isValidated:
      input.isValidated === undefined ? undefined : input.isValidated ? 1 : 0,
    hash: input.hash,
    carBrand: input.carBrand,
    carModel: input.carModel,
    carType: input.carType,
    carEngine: input.carEngine,
    carDateRange: input.carDateRange
  }

  for (const [key, value] of Object.entries(map)) {
    if (value !== undefined) {
      fields.push(`${key} = ?`)
      params.push(value)
    }
  }

  if (fields.length === 0) return

  // Always update updatedAt
  fields.push(`updatedAt = strftime('%Y-%m-%dT%H:%M:%fZ','now')`)

  params.push(id)
  await db.execute(
    `UPDATE exhaust SET ${fields.join(', ')} WHERE id = ?`,
    params
  )
}

export async function deleteExhaust(id: number): Promise<void> {
  const db = await getDb()
  await db.execute(`DELETE FROM exhaust WHERE id = ?`, [id])
}

export async function deleteAllExhaust(): Promise<void> {
  const db = await getDb()
  await db.execute(`DELETE FROM exhaust`)
}

export async function seedExhausts(): Promise<void> {
  const db = await getDb()

  console.log('Starting seed process...')
  await db.execute(`DELETE FROM exhaust`)
  try {
    await db.execute(`DELETE FROM sqlite_sequence WHERE name='exhaust'`)
  } catch (e) {
    // Sequence might not exist yet, ignore
  }

  const seen = new Set<string>()
  const items = Array.isArray(exhaustsJson) ? exhaustsJson : (exhaustsJson as any).default
  
  if (!Array.isArray(items)) {
    console.error('exhaustsJson is not an array')
    return
  }

  const BATCH_SIZE = 100
  let count = 0

  for (let i = 0; i < items.length; i += BATCH_SIZE) {
    const batch = items.slice(i, i + BATCH_SIZE)
    await db.execute('BEGIN TRANSACTION')
    try {
      for (const item of batch) {
        const description = (item.description ?? '').trim()
        if (!description) continue

        const barcode = item.barcode ? String(item.barcode).trim() : null
        const hash = `${barcode ?? ''}|${description}`

        if (seen.has(hash)) continue
        seen.add(hash)

        await db.execute(
          `INSERT INTO exhaust (barcode, description, hash, type, painting, carDateRange, isValidated)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [barcode, description, hash, '(SST) Silencieux Standard', 'LAF', 'N/A', 0]
        )
        count++
      }
      await db.execute('COMMIT')
    } catch (err) {
      await db.execute('ROLLBACK')
      console.error('Batch error:', err)
      // Continue to next batch
    }
  }
  
  console.log(`Seeding finished. total items: ${count}`)
}
