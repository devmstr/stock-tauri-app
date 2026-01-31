import type { Exhaust } from "@/types/exhaust"

export function getComponentTypeCode(exhaustType: string) {
  const match = exhaustType.match(/^\(([^)]+)\)/)
  return match?.[1]?.trim() ?? exhaustType.slice(0, 3).toUpperCase()
}

export function buildDesignation(e: Exhaust) {
  const componentTypeCode = getComponentTypeCode(e.type)
  const brand = (e.carBrand ?? "").trim()
  const model = (e.carModel ?? "").trim()
  const type = (e.carType ?? "").trim()
  const engine = (e.carEngine ?? "").trim()
  const dateRange = (e.carDateRange ?? "").trim()
  const painting = (e.painting ?? "").trim()

  const designation = `${componentTypeCode} ${brand} ${model} ${type} ${engine} ${dateRange} ${painting.toUpperCase()}`.trim()
  return designation.replace(/\s+/g, " ")
}
