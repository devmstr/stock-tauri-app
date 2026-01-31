import * as React from "react"
import { AddExhaustDialog } from "@/features/exhaust/add-exhaust-dialog"
import { ExhaustTable } from "@/features/exhaust/exhaust-table"
import { listExhaust } from "@/lib/exhaust-repo"
import type { Exhaust } from "@/types/exhaust"

export default function App() {
  const [data, setData] = React.useState<Exhaust[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  const refresh = React.useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const rows = await listExhaust()
      setData(rows)
    } catch (err: any) {
      console.error(err)
      setError(err?.message ?? "Impossible de charger la base SQLite.")
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    void refresh()
  }, [refresh])

  return (
    <div className="min-h-screen p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Exhaust Manager</h1>
            <p className="text-sm text-[hsl(var(--muted-foreground))]">
              Table (TanStack) + Dialog (shadcn) + SQLite (Tauri).
            </p>
          </div>
          <AddExhaustDialog onCreated={refresh} />
        </header>

        {error ? (
          <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))] p-4 text-sm">
            <span className="font-medium text-[hsl(var(--destructive))]">Erreur :</span> {error}
          </div>
        ) : null}

        {loading ? (
          <div className="rounded-xl border border-[hsl(var(--border))] p-8 text-sm text-[hsl(var(--muted-foreground))]">
            Chargement...
          </div>
        ) : (
          <ExhaustTable data={data} />
        )}
      </div>
    </div>
  )
}
