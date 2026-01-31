export type Exhaust = {
  id: number
  barcode?: string | null
  label?: string | null
  description: string
  type: string | null
  painting: string | null
  qrcode?: string | null
  isValidated?: boolean | null
  createdAt?: string | null
  updatedAt?: string | null
  hash: string
  carBrand?: string | null
  carModel?: string | null
  carType?: string | null
  carEngine?: string | null
  carDateRange: string | null
}

export type ExhaustInsertInput = Omit<Exhaust, 'id' | 'createdAt' | 'updatedAt'>
