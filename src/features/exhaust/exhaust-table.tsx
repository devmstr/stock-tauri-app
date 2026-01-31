import * as React from "react"
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table"
import { useVirtualizer } from "@tanstack/react-virtual"
import { Printer } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import type { Exhaust } from "@/types/exhaust"
import { buildDesignation } from "@/lib/designation"
import { printProductLabel } from "@/lib/print-product-label"

type Props = {
  data: Exhaust[]
}

export function ExhaustTable({ data }: Props) {
  const columns = React.useMemo<ColumnDef<Exhaust>[]>(
    () => [
      {
        header: "Code-barres",
        accessorKey: "barcode",
        cell: ({ row }) => row.original.barcode ?? "—",
      },
      {
        header: "Désignation",
        id: "designation",
        cell: ({ row }) => buildDesignation(row.original),
      },
      {
        header: "Date",
        id: "date",
        cell: ({ row }) => formatDate(row.original.createdAt ?? row.original.updatedAt ?? null),
      },
      {
        header: "Imprimer",
        id: "print",
        cell: ({ row }) => (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => void printProductLabel(row.original)}
          >
            <Printer className="h-4 w-4" />
            Imprimer
          </Button>
        ),
      },
    ],
    [],
  )

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  const parentRef = React.useRef<HTMLDivElement | null>(null)
  const rows = table.getRowModel().rows

  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 56,
    overscan: 12,
  })

  const virtualRows = rowVirtualizer.getVirtualItems()
  const totalSize = rowVirtualizer.getTotalSize()

  return (
    <div className="w-full">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id}>
                  {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
      </Table>

      {/* virtualized body */}
      <div ref={parentRef} className="h-[65vh] overflow-auto rounded-2xl border border-[hsl(var(--border))]">
        <div style={{ height: totalSize, position: "relative" }}>
          <table className="w-full text-sm">
            <TableBody>
              {virtualRows.map((virtualRow) => {
                const row = rows[virtualRow.index]!
                return (
                  <TableRow
                    key={row.id}
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      width: "100%",
                      transform: `translateY(${virtualRow.start}px)`,
                    }}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                )
              })}

              {rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="p-8 text-center text-[hsl(var(--muted-foreground))]">
                    Aucun article.
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </table>
        </div>
      </div>
    </div>
  )
}

function formatDate(dateIso: string | null) {
  if (!dateIso) return "—"
  const d = new Date(dateIso)
  if (Number.isNaN(d.getTime())) return "—"
  return new Intl.DateTimeFormat("fr-DZ", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d)
}
