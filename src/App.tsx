import * as React from 'react'
import { AddExhaustDialog } from '@/features/exhaust/add-exhaust-dialog'
import { ExhaustTable } from '@/features/exhaust/exhaust-table'
import { PrintLabelDialog } from '@/features/exhaust/print-label-dialog'
import { Input } from '@/components/ui/input'
import type { Exhaust } from '@/types/exhaust'
import { useExhausts } from '@/hooks/use-exhausts'
import { LoadingState } from '@/components/ui/feedback/loading-state'
import { ErrorBanner } from '@/components/ui/feedback/error-banner'

export default function App() {
  const {
    exhausts,
    totalCount,
    loading,
    seeding,
    error,
    refresh,
    search,
    setSearch
  } = useExhausts()

  console.log({ exhausts })

  const [printOpen, setPrintOpen] = React.useState(false)
  const [printItem, setPrintItem] = React.useState<Exhaust | null>(null)

  const onRequestPrint = React.useCallback((exhaust: Exhaust) => {
    setPrintItem(exhaust)
    setPrintOpen(true)
  }, [])

  return (
    <div className="min-h-screen p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">OKI Stock</h1>
            <p className="text-sm text-muted-foreground">
              Gestion des stocks de produits.
            </p>
          </div>

          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center sm:justify-end">
            <div className="w-full sm:w-90">
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher (désignation)..."
              />
            </div>
            <AddExhaustDialog onCreated={refresh} />
          </div>
        </header>

        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div>
            {exhausts.length} / {totalCount} articles
          </div>
          {search.trim() ? <div>Filtre: “{search.trim()}”</div> : <div />}
        </div>

        {error && <ErrorBanner message={error} />}

        {loading ? (
          <LoadingState
            message={
              seeding
                ? 'Initialisation de la base de données (seeding)...'
                : 'Chargement...'
            }
          />
        ) : (
          <ExhaustTable
            data={exhausts}
            onRequestPrint={onRequestPrint}
            onRefresh={refresh}
          />
        )}

        <PrintLabelDialog
          open={printOpen}
          onOpenChange={setPrintOpen}
          exhaust={printItem}
        />
      </div>
    </div>
  )
}
