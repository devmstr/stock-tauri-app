import type { Exhaust, ExhaustInsertInput } from "@/types/exhaust"
import { getDb } from "./db"

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
    ORDER BY id DESC`,
  )
  // SQLite booleans may come back as 0/1
  return rows.map((r: any) => ({
    ...r,
    isValidated: r.isValidated == null ? null : Boolean(r.isValidated),
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
      input.carDateRange,
    ],
  )
}
