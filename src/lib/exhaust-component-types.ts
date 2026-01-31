export type ExhaustComponentType = {
  code: string
  label: string
  full: string
}

export const EXHAUST_COMPONENT_TYPES: ExhaustComponentType[] = [
  "(SAR) Silencieux Arrière",
  "(SAV) Silencieux Avant",
  "(SCE) Silencieux Centrale",
  "(SDE) Silencieux Détente",
  "(SIN) Silencieux Inter",
  "(SPR) Silencieux Primaire",
  "(SRC) Silencieux Remplace Catalyseur",
  "(SST) Silencieux Standard",
  "(TAR) Tube Arrière",
  "(TCE) Tube Centrale",
  "(TDC) Tube Double Collecteur",
  "(TEB) Tube Embout",
  "(TEC) Tube Ensemble De Collecteur",
  "(TEQ) Tube Ensemble De Collecteur",
  "(TFL) Tube Forme L",
  "(TFS) Tube Forme S",
  "(TSC) Tube Sortie De Collecteur",
  "(TST) Tube Standard",
].map((full) => {
  const match = full.match(/^\(([^)]+)\)\s*(.+)$/)
  const code = match?.[1]?.trim() ?? "UNK"
  const label = match?.[2]?.trim() ?? full
  return { code, label, full }
})
