import * as React from 'react'
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable
} from '@tanstack/react-table'
import { useVirtualizer } from '@tanstack/react-virtual'
import { Printer, MoreHorizontal, Edit, Trash } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import type { Exhaust } from '@/types/exhaust'
import { buildDesignation } from '@/lib/utils/designation'
import { EditExhaustDialog } from './edit-exhaust-dialog'
import { DeleteConfirmDialog } from './delete-confirm-dialog'

type Props = {
  data: Exhaust[]
  onRequestPrint: (exhaust: Exhaust) => void
  onRefresh: () => void
}

const GRID_TEMPLATE = 'minmax(170px, 230px) 1fr 140px 100px'

export function ExhaustTable({ data, onRequestPrint, onRefresh }: Props) {
  const [editOpen, setEditOpen] = React.useState(false)
  const [editItem, setEditItem] = React.useState<Exhaust | null>(null)

  const [deleteOpen, setDeleteOpen] = React.useState(false)
  const [deleteItem, setDeleteItem] = React.useState<Exhaust | null>(null)

  const columns = React.useMemo<ColumnDef<Exhaust>[]>(
    () => [
      {
        header: 'Code-barres',
        accessorKey: 'barcode',
        cell: ({ row }) => row.original.barcode ?? '—'
      },
      {
        header: 'Désignation',
        id: 'designation',
        cell: ({ row }) => buildDesignation(row.original)
      },
      {
        header: 'Date',
        id: 'date',
        cell: ({ row }) =>
          formatDate(row.original.createdAt ?? row.original.updatedAt ?? null)
      },
      {
        header: 'Actions',
        id: 'actions',
        cell: ({ row }) => {
          const exhaust = row.original
          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <span className="sr-only">Ouvrir le menu</span>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onRequestPrint(exhaust)}>
                  <Printer className="mr-2 h-4 w-4" />
                  Imprimer
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    setEditItem(exhaust)
                    setEditOpen(true)
                  }}
                >
                  <Edit className="mr-2 h-4 w-4" />
                  Modifier
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={() => {
                    setDeleteItem(exhaust)
                    setDeleteOpen(true)
                  }}
                >
                  <Trash className="mr-2 h-4 w-4" />
                  Supprimer
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )
        }
      }
    ],
    [onRequestPrint]
  )

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel()
  })

  const parentRef = React.useRef<HTMLDivElement | null>(null)
  const rows = table.getRowModel().rows

  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 54,
    overscan: 12
  })

  const virtualRows = rowVirtualizer.getVirtualItems()
  const totalSize = rowVirtualizer.getTotalSize()

  return (
    <div className="w-full">
      {/* Header */}
      <div className="rounded-t-xl border border-border bg-muted">
        <div
          className="grid items-center"
          style={{ gridTemplateColumns: GRID_TEMPLATE }}
        >
          {table.getHeaderGroups().map((hg) =>
            hg.headers.map((header) => (
              <div
                key={header.id}
                className="h-11 px-4 flex items-center text-left text-sm font-medium text-muted-foreground"
              >
                {header.isPlaceholder
                  ? null
                  : flexRender(
                      header.column.columnDef.header,
                      header.getContext()
                    )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Body */}
      <div
        ref={parentRef}
        className="mt-0.5 h-[73vh] overflow-auto rounded-b-xl border border-border"
      >
        <div style={{ height: totalSize, position: 'relative' }}>
          {rows.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              Aucun article.
            </div>
          ) : null}

          {virtualRows.map((virtualRow) => {
            const row = rows[virtualRow.index]!
            return (
              <div
                key={row.id}
                className="absolute left-0 top-0 w-full border-b border-border hover:bg-accent"
                style={{ transform: `translateY(${virtualRow.start}px)` }}
              >
                <div
                  className="grid items-center"
                  style={{ gridTemplateColumns: GRID_TEMPLATE }}
                >
                  {row.getVisibleCells().map((cell) => (
                    <div key={cell.id} className="px-4 py-3 text-sm">
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <EditExhaustDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        exhaust={editItem}
        onUpdated={onRefresh}
      />

      <DeleteConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        exhaust={deleteItem}
        onDeleted={onRefresh}
      />
    </div>
  )
}

function formatDate(dateIso: string | null) {
  if (!dateIso) return '—'
  const d = new Date(dateIso)
  if (Number.isNaN(d.getTime())) return '—'
  return new Intl.DateTimeFormat('fr-DZ', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(d)
}
