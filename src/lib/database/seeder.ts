import exhausts from '../../data/exhausts.json'
import { insertExhaust, listExhaust } from './exhaust-repo'
import {
  parsePrefixFromType,
  generateId,
  type PREFIX
} from '../utils/generate-id'
import { EXHAUST_COMPONENT_TYPES } from './exhaust-component-types'

export async function seedDatabase() {
  const existing = await listExhaust()
  if (existing.length > 0) {
    console.log('Database already has data, skipping seed.')
    return { skipped: true, count: existing.length }
  }

  console.log(`Starting seed with ${exhausts.length} items...`)
  let count = 0

  for (const item of exhausts) {
    try {
      const typeInfo = guessType(item.description)
      const brand = guessBrand(item.description)
      const model = guessModel(item.description, brand)
      const dateRange = guessDateRange(item.description)

      const prefix = (parsePrefixFromType(typeInfo.full) ?? 'SAR') as PREFIX
      const hash = generateId(prefix)

      await insertExhaust({
        barcode: item.barcode || null,
        label: null,
        description: item.description, // Use original description
        type: typeInfo.full,
        painting: item.description.toLowerCase().includes('alumine')
          ? 'ALU'
          : 'LAF',
        qrcode: null,
        isValidated: false,
        hash,
        carBrand: brand,
        carModel: model,
        carType: null,
        carEngine: null,
        carDateRange: dateRange
      })
      count++
      if (count % 100 === 0) console.log(`Seeded ${count} items...`)
    } catch (err) {
      console.error(`Failed to seed item ${item.barcode}:`, err)
    }
  }

  console.log(`Seed completed. Imported ${count} items.`)
  return { skipped: false, count }
}

// Allow direct execution from CLI
if (
  typeof process !== 'undefined' &&
  process.argv &&
  (process.argv[1]?.includes('seeder.ts') ||
    process.argv[1]?.includes('vite-node'))
) {
  seedDatabase().catch((err) => {
    console.error('Manual seed failed:', err)
    process.exit(1)
  })
}

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
  // Remove brand and type keywords to find model
  let m = d
    .replace('SILENCIEUX', '')
    .replace('POT', '')
    .replace('CENTRALE', '')
    .replace('CENTRAL', '')
    .replace('INTER', '')
    .replace('DET', '')
    .replace(brand, '')
    .trim()
  // Take first few words
  return m.split(',')[0].split('/')[0].trim() || 'Inconnu'
}

function guessDateRange(desc: string) {
  const match = desc.match(/à partir de (.*)/i)
  if (match) return match[1].trim()
  return 'N/A'
}
