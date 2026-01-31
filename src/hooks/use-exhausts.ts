import * as React from 'react'
import type { Exhaust } from '@/types/exhaust'
import { listExhaust, ensureTable } from '@/lib/database/exhaust-repo'
import { buildDesignation } from '@/lib/utils/designation'
import { seedDatabase } from '@/lib/database/seeder'

export function useExhausts() {
  const [data, setData] = React.useState<Exhaust[]>([])
  const [loading, setLoading] = React.useState(true)
  const [seeding, setSeeding] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [search, setSearch] = React.useState('')

  const refresh = React.useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const rows = await listExhaust()
      setData(rows)
    } catch (err: any) {
      console.error(err)
      setError(err?.message ?? 'Impossible de charger la base SQLite.')
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    async function init() {
      try {
        setSeeding(true)
        await ensureTable()
        await seedDatabase()
      } catch (err) {
        console.error('Seeding failed:', err)
      } finally {
        setSeeding(false)
        void refresh()
      }
    }
    void init()
  }, [refresh])

  const filtered = React.useMemo(() => {
    const q = normalize(search)
    if (!q) return data

    const words = q.split(/\s+/g).filter(Boolean)
    if (words.length === 0) return data

    return data.filter((e) => {
      const designation = normalize(buildDesignation(e))
      return words.every((w) => designation.includes(w))
    })
  }, [data, search])

  return {
    exhausts: filtered,
    totalCount: data.length,
    loading,
    seeding,
    error,
    refresh,
    search,
    setSearch
  }
}

function normalize(s: string) {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .trim()
}
