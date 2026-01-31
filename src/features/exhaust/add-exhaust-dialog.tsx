import * as React from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
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
import { insertExhaust } from '@/lib/database/exhaust-repo'
import {
  generateId,
  parsePrefixFromType,
  type PREFIX
} from '@/lib/utils/generate-id'
import type { ExhaustInsertInput } from '@/types/exhaust'

type Props = {
  onCreated: () => void
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

const initialForm: FormState = {
  barcode: '',
  type: EXHAUST_COMPONENT_TYPES[0]?.full ?? '(SAR) Silencieux Arrière',
  painting: 'LAF',
  carBrand: '',
  carModel: '',
  carType: '',
  carEngine: '',
  carDateRange: ''
}

export function AddExhaustDialog({ onCreated }: Props) {
  const [open, setOpen] = React.useState(false)
  const [isSaving, setIsSaving] = React.useState(false)
  const [form, setForm] = React.useState<FormState>(initialForm)
  const [error, setError] = React.useState<string | null>(null)

  const designationPreview = React.useMemo(() => {
    return buildDesignation({
      id: 0,
      hash: 'preview',
      description: '—',
      type: form.type,
      painting: form.painting,
      carBrand: form.carBrand,
      carModel: form.carModel,
      carType: form.carType,
      carEngine: form.carEngine,
      carDateRange: form.carDateRange
    })
  }, [form])

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!form.type.trim()) return setError('Le type est obligatoire.')
    if (!form.carBrand.trim()) return setError('La marque est obligatoire.')
    if (!form.carModel.trim()) return setError('Le modèle est obligatoire.')
    if (!form.carDateRange.trim())
      return setError('La plage de dates est obligatoire.')
    if (!form.painting.trim()) return setError('La peinture est obligatoire.')

    setIsSaving(true)
    try {
      const prefix = (parsePrefixFromType(form.type) ?? 'SAR') as PREFIX
      const hash = await generateUniqueHash(prefix)

      const payload: ExhaustInsertInput = {
        barcode: form.barcode.trim() ? form.barcode.trim() : null,
        label: null,

        // Prisma requires description; we store the generated designation.
        description: designationPreview,

        type: form.type,
        painting: form.painting,

        // Removed from UI (auto)
        qrcode: null,

        isValidated: false,
        hash,

        carBrand: form.carBrand.trim(),
        carModel: form.carModel.trim(),
        carType: form.carType.trim() || null,
        carEngine: form.carEngine.trim() || null,
        carDateRange: form.carDateRange.trim()
      }

      await insertExhaust(payload)
      setOpen(false)
      setForm(initialForm)
      onCreated()
    } catch (err: any) {
      const msg = String(err?.message ?? '').toLowerCase()
      if (msg.includes('unique') || msg.includes('constraint')) {
        // very rare collision -> retry once
        try {
          const prefix = (parsePrefixFromType(form.type) ?? 'SAR') as PREFIX
          const hash = await generateUniqueHash(prefix)
          await insertExhaust({
            ...payloadBase(form, designationPreview),
            hash
          })
          setOpen(false)
          setForm(initialForm)
          onCreated()
          return
        } catch (err2: any) {
          console.error(err2)
        }
      }

      console.error(err)
      setError(err?.message ?? "Erreur lors de l'enregistrement.")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>+ Ajouter</Button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Ajouter un échappement</DialogTitle>
          <DialogDescription>
            La désignation est générée automatiquement à partir des champs
            techniques.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="grid gap-4">
          {error ? (
            <div className="rounded-lg border border-border bg-muted px-3 py-2 text-sm">
              <span className="font-medium text-destructive">Erreur :</span>{' '}
              {error}
            </div>
          ) : null}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label>Type (composant)</Label>
              <Select
                value={form.type}
                onValueChange={(v) => setForm((s) => ({ ...s, type: v }))}
              >
                <SelectTrigger>
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
              <Label>Peinture</Label>
              <Select
                value={form.painting}
                onValueChange={(v) =>
                  setForm((s) => ({
                    ...s,
                    painting: v as FormState['painting']
                  }))
                }
              >
                <SelectTrigger>
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
              <Label>Marque</Label>
              <Input
                value={form.carBrand}
                onChange={(e) =>
                  setForm((s) => ({ ...s, carBrand: e.target.value }))
                }
                placeholder="Ex: Renault"
              />
            </div>
            <div className="grid gap-2">
              <Label>Modèle</Label>
              <Input
                value={form.carModel}
                onChange={(e) =>
                  setForm((s) => ({ ...s, carModel: e.target.value }))
                }
                placeholder="Ex: Clio 4"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label>Type véhicule</Label>
              <Input
                value={form.carType}
                onChange={(e) =>
                  setForm((s) => ({ ...s, carType: e.target.value }))
                }
                placeholder="Ex: Berlin / Utilitaire"
              />
            </div>
            <div className="grid gap-2">
              <Label>Moteur</Label>
              <Input
                value={form.carEngine}
                onChange={(e) =>
                  setForm((s) => ({ ...s, carEngine: e.target.value }))
                }
                placeholder="Ex: 1.5 dCi"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label>Plage de dates</Label>
              <Input
                value={form.carDateRange}
                onChange={(e) =>
                  setForm((s) => ({ ...s, carDateRange: e.target.value }))
                }
                placeholder="Ex: 2012-2018"
              />
            </div>
            <div className="grid gap-2">
              <Label>Code-barres (optionnel)</Label>
              <Input
                value={form.barcode}
                onChange={(e) =>
                  setForm((s) => ({ ...s, barcode: e.target.value }))
                }
                placeholder="Ex: 6134000123456"
              />
            </div>
          </div>

          <div className="rounded-xl border border-border bg-muted p-3 text-sm">
            <div className="font-medium">Désignation (preview)</div>
            <div className="mt-1 wrap-break-word text-muted-foreground">
              {designationPreview}
            </div>
          </div>

          <DialogFooter>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? 'Enregistrement...' : 'Enregistrer'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function payloadBase(
  form: FormState,
  designation: string
): Omit<ExhaustInsertInput, 'hash'> {
  return {
    barcode: form.barcode.trim() ? form.barcode.trim() : null,
    label: null,
    description: designation,
    type: form.type,
    painting: form.painting,
    qrcode: null,
    isValidated: false,
    carBrand: form.carBrand.trim(),
    carModel: form.carModel.trim(),
    carType: form.carType.trim() || null,
    carEngine: form.carEngine.trim() || null,
    carDateRange: form.carDateRange.trim()
  }
}

async function generateUniqueHash(prefix: PREFIX) {
  // quick collision-avoid: try a few times (very unlikely)
  for (let i = 0; i < 5; i++) {
    const candidate = generateId(prefix)
    return candidate
  }
  return generateId(prefix)
}
