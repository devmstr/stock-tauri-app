import * as React from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { EXHAUST_COMPONENT_TYPES } from '@/lib/database/exhaust-component-types'
import { buildDesignation } from '@/lib/utils/designation'
import { updateExhaust } from '@/lib/database/exhaust-repo'
import type { Exhaust, ExhaustInsertInput } from '@/types/exhaust'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  exhaust: Exhaust | null
  onUpdated: () => void
}

const PAINTING_OPTIONS = ['LAF', 'ALU'] as const

type FormState = {
  barcode: string
  type: string
  painting: (typeof PAINTING_OPTIONS)[number]
  carBrand: string
  carModel: string
  carType: string
  carEngine: string
  carDateRange: string
}

export function EditExhaustDialog({
  open,
  onOpenChange,
  exhaust,
  onUpdated
}: Props) {
  const [isSaving, setIsSaving] = React.useState(false)
  const [form, setForm] = React.useState<FormState | null>(null)
  const [error, setError] = React.useState<string | null>(null)

  // Initialize form when exhaust changes
  React.useEffect(() => {
    if (exhaust) {
      setForm({
        barcode: exhaust.barcode || '',
        type: exhaust.type,
        painting: (exhaust.painting as any) || 'LAF',
        carBrand: exhaust.carBrand || '',
        carModel: exhaust.carModel || '',
        carType: exhaust.carType || '',
        carEngine: exhaust.carEngine || '',
        carDateRange: exhaust.carDateRange || ''
      })
    } else {
      setForm(null)
    }
    setError(null)
  }, [exhaust])

  const designationPreview = React.useMemo(() => {
    if (!form) return ''
    return buildDesignation({
      ...exhaust,
      ...form,
      id: exhaust?.id ?? 0,
      hash: exhaust?.hash ?? 'preview'
    } as any)
  }, [form, exhaust])

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form || !exhaust) return
    setError(null)

    if (!form.type.trim()) return setError('Le type est obligatoire.')
    if (!form.carBrand.trim()) return setError('La marque est obligatoire.')
    if (!form.carModel.trim()) return setError('Le modèle est obligatoire.')
    if (!form.carDateRange.trim())
      return setError('La plage de dates est obligatoire.')

    setIsSaving(true)
    try {
      const payload: Partial<ExhaustInsertInput> = {
        barcode: form.barcode.trim() || null,
        description: designationPreview,
        type: form.type,
        painting: form.painting,
        carBrand: form.carBrand.trim(),
        carModel: form.carModel.trim(),
        carType: form.carType.trim() || null,
        carEngine: form.carEngine.trim() || null,
        carDateRange: form.carDateRange.trim()
      }

      await updateExhaust(exhaust.id, payload)
      onUpdated()
      onOpenChange(false)
    } catch (err: any) {
      console.error(err)
      setError(err?.message ?? "Erreur lors de l'enregistrement.")
    } finally {
      setIsSaving(false)
    }
  }

  if (!form) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-137.5">
        <DialogHeader>
          <DialogTitle>Modifier l'article</DialogTitle>
          <DialogDescription>
            Modifiez les informations techniques de l'échappement.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="grid gap-4 mt-2">
          {error ? (
            <div className="rounded-lg border border-border bg-muted px-3 py-2 text-sm">
              <span className="font-medium text-destructive">Erreur :</span>{' '}
              {error}
            </div>
          ) : null}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="edit-type">Type (composant)</Label>
              <Select
                value={form.type}
                onValueChange={(v) =>
                  setForm((s) => (s ? { ...s, type: v } : null))
                }
              >
                <SelectTrigger id="edit-type">
                  <SelectValue placeholder="Choisir..." />
                </SelectTrigger>
                <SelectContent>
                  {EXHAUST_COMPONENT_TYPES.map((t) => (
                    <SelectItem key={t.code + t.label} value={t.full}>
                      ({t.code}) {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="edit-painting">Peinture</Label>
              <Select
                value={form.painting}
                onValueChange={(v) =>
                  setForm((s) =>
                    s ? { ...s, painting: v as FormState['painting'] } : null
                  )
                }
              >
                <SelectTrigger id="edit-painting">
                  <SelectValue placeholder="Choisir..." />
                </SelectTrigger>
                <SelectContent>
                  {PAINTING_OPTIONS.map((p) => (
                    <SelectItem key={p} value={p}>
                      {p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="edit-brand">Marque</Label>
              <Input
                id="edit-brand"
                value={form.carBrand}
                onChange={(e) =>
                  setForm((s) =>
                    s ? { ...s, carBrand: e.target.value } : null
                  )
                }
                placeholder="Ex: Renault"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-model">Modèle</Label>
              <Input
                id="edit-model"
                value={form.carModel}
                onChange={(e) =>
                  setForm((s) =>
                    s ? { ...s, carModel: e.target.value } : null
                  )
                }
                placeholder="Ex: Clio 4"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="edit-car-type">Type véhicule</Label>
              <Input
                id="edit-car-type"
                value={form.carType}
                onChange={(e) =>
                  setForm((s) => (s ? { ...s, carType: e.target.value } : null))
                }
                placeholder="Ex: Berlin / Utilitaire"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-engine">Moteur</Label>
              <Input
                id="edit-engine"
                value={form.carEngine}
                onChange={(e) =>
                  setForm((s) =>
                    s ? { ...s, carEngine: e.target.value } : null
                  )
                }
                placeholder="Ex: 1.5 dCi"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="edit-date-range">Plage de dates</Label>
              <Input
                id="edit-date-range"
                value={form.carDateRange}
                onChange={(e) =>
                  setForm((s) =>
                    s ? { ...s, carDateRange: e.target.value } : null
                  )
                }
                placeholder="Ex: 2012-2018"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-barcode">Code-barres (optionnel)</Label>
              <Input
                id="edit-barcode"
                value={form.barcode}
                onChange={(e) =>
                  setForm((s) => (s ? { ...s, barcode: e.target.value } : null))
                }
                placeholder="Ex: 6134000123456"
              />
            </div>
          </div>

          <div className="rounded-xl border border-border bg-muted p-3 text-sm">
            <div className="font-medium">Désignation (preview)</div>
            <div className="mt-1 wrap-break-word text-muted-foreground line-clamp-2">
              {designationPreview}
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSaving}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? 'Enregistrement...' : 'Enregistrer les modifications'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
