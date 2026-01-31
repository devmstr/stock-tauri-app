import type { Exhaust } from '@/types/exhaust'

export function buildDesignation(e: Exhaust) {
  // If we have a full description but no brand/model (e.g. seeded data), use description
  if (!e.carBrand && !e.carModel && e.description) {
    return e.description
  }

  const componentTypeCode = e.type?.substring(5) ?? ''
  const brand = (e.carBrand ?? '').trim()
  const model = (e.carModel ?? '').trim()
  const type = (e.carType ?? '').trim()
  const engine = (e.carEngine ?? '').trim()
  const dateRange = (e.carDateRange ?? '').trim()
  const painting = (e.painting ?? '').trim()

  const designation =
    `${componentTypeCode} ${brand.toUpperCase()} ${model} ${type} ${engine} ${dateRange} ${painting.toUpperCase()}`.trim()
  return designation.replace(/\s+/g, ' ')
}
