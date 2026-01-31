import ShortUniqueId from "short-unique-id"

export enum SKU_PREFIX {
  SAR = "SAR",
  SAV = "SAV",
  SCE = "SCE",
  SDE = "SDE",
  SIN = "SIN",
  SPR = "SPR",
  SRC = "SRC",
  SST = "SST",
  TAR = "TAR",
  TCE = "TCE",
  TDC = "TDC",
  TEB = "TEB",
  TEC = "TEC",
  TEQ = "TEQ",
  TFL = "TFL",
  TFS = "TFS",
  TSC = "TSC",
  TST = "TST",
}

export type PREFIX = keyof typeof SKU_PREFIX

const uid = new ShortUniqueId({
  length: 4,
  shuffle: true,
  dictionary: "ABCDEFGHJKLMNPQRSTUVWYZ123456789".split(""),
})

export function generateId(prefix: PREFIX): string {
  // Example: SARX4K9P (3 letters + X + 4 chars)
  return `${SKU_PREFIX[prefix]}X${uid.rnd()}`
}

export function parsePrefixFromType(typeFull: string): PREFIX | null {
  const match = typeFull.match(/^\(([^)]+)\)/)
  const code = match?.[1]?.trim()?.toUpperCase()
  if (!code) return null
  return Object.prototype.hasOwnProperty.call(SKU_PREFIX, code) ? (code as PREFIX) : null
}
