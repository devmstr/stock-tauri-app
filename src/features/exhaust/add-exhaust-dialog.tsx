import * as React from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { EXHAUST_COMPONENT_TYPES } from "@/lib/exhaust-component-types"
import { buildDesignation } from "@/lib/designation"
import { insertExhaust } from "@/lib/exhaust-repo"
import type { ExhaustInsertInput } from "@/types/exhaust"

type Props = {
  onCreated: () => void
}

const initialForm: Omit<ExhaustInsertInput, "hash"> = {
  barcode: null,
  label: null,
  description: "",
  type: EXHAUST_COMPONENT_TYPES[0]?.full ?? "(SAR) Silencieux Arrière",
  painting: "NOIR",
  qrcode: null,
  isValidated: false,
  carBrand: "",
  carModel: "",
  carType: "",
  carEngine: "",
  carDateRange: "",
}

export function AddExhaustDialog({ onCreated }: Props) {
  const [open, setOpen] = React.useState(false)
  const [isSaving, setIsSaving] = React.useState(false)
  const [form, setForm] = React.useState(initialForm)
  const [error, setError] = React.useState<string | null>(null)

  const designationPreview = React.useMemo(() => {
    return buildDesignation({
      id: 0,
      hash: "preview",
      description: form.description || "-",
      type: form.type,
      painting: form.painting,
      carBrand: form.carBrand,
      carModel: form.carModel,
      carType: form.carType,
      carEngine: form.carEngine,
      carDateRange: form.carDateRange,
    })
  }, [form])

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    // Very small validation (keep it simple; you can swap to RHF+Zod later)
    if (!form.description.trim()) return setError("La description est obligatoire.")
    if (!form.type.trim()) return setError("Le type est obligatoire.")
    if (!form.painting.trim()) return setError("La peinture est obligatoire.")
    if (!form.carDateRange.trim()) return setError("La plage de dates est obligatoire.")
    if (!form.carBrand?.trim()) return setError("La marque est obligatoire.")
    if (!form.carModel?.trim()) return setError("Le modèle est obligatoire.")

    setIsSaving(true)
    try {
      const hash = await generateHash(form)
      await insertExhaust({ ...form, hash })
      setOpen(false)
      setForm(initialForm)
      onCreated()
    } catch (err: any) {
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
            Les champs techniques servent à générer la désignation affichée dans le tableau.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="grid gap-4">
          {error ? (
            <div className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--muted))] px-3 py-2 text-sm">
              <span className="font-medium text-[hsl(var(--destructive))]">Erreur :</span> {error}
            </div>
          ) : null}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label>Type (composant)</Label>
              <Select value={form.type} onValueChange={(v) => setForm((s) => ({ ...s, type: v }))}>
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
              <Input
                value={form.painting ?? ""}
                onChange={(e) => setForm((s) => ({ ...s, painting: e.target.value }))}
                placeholder="Ex: NOIR / ALU / INOX"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label>Marque</Label>
              <Input
                value={form.carBrand ?? ""}
                onChange={(e) => setForm((s) => ({ ...s, carBrand: e.target.value }))}
                placeholder="Ex: Renault"
              />
            </div>
            <div className="grid gap-2">
              <Label>Modèle</Label>
              <Input
                value={form.carModel ?? ""}
                onChange={(e) => setForm((s) => ({ ...s, carModel: e.target.value }))}
                placeholder="Ex: Clio 4"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label>Type véhicule</Label>
              <Input
                value={form.carType ?? ""}
                onChange={(e) => setForm((s) => ({ ...s, carType: e.target.value }))}
                placeholder="Ex: Berline / Utilitaire"
              />
            </div>
            <div className="grid gap-2">
              <Label>Moteur</Label>
              <Input
                value={form.carEngine ?? ""}
                onChange={(e) => setForm((s) => ({ ...s, carEngine: e.target.value }))}
                placeholder="Ex: 1.5 dCi"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label>Plage de dates</Label>
              <Input
                value={form.carDateRange ?? ""}
                onChange={(e) => setForm((s) => ({ ...s, carDateRange: e.target.value }))}
                placeholder="Ex: 2012-2018"
              />
            </div>
            <div className="grid gap-2">
              <Label>Description</Label>
              <Input
                value={form.description}
                onChange={(e) => setForm((s) => ({ ...s, description: e.target.value }))}
                placeholder="Ex: Échappement compatible..."
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label>Code-barres (optionnel)</Label>
              <Input
                value={form.barcode ?? ""}
                onChange={(e) => setForm((s) => ({ ...s, barcode: e.target.value || null }))}
                placeholder="Ex: 6134000123456"
              />
            </div>
            <div className="grid gap-2">
              <Label>QR code (optionnel)</Label>
              <Input
                value={form.qrcode ?? ""}
                onChange={(e) => setForm((s) => ({ ...s, qrcode: e.target.value || null }))}
                placeholder="Sinon: hash / barcode sera utilisé"
              />
            </div>
          </div>

          <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))] p-3 text-sm">
            <div className="font-medium">Désignation (preview)</div>
            <div className="mt-1 break-words text-[hsl(var(--muted-foreground))]">{designationPreview}</div>
          </div>

          <DialogFooter>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? "Enregistrement..." : "Enregistrer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

async function generateHash(form: any) {
  // stable-ish hash based on key fields + random salt, to avoid unique collisions
  const base = [
    form.type ?? "",
    form.painting ?? "",
    form.carBrand ?? "",
    form.carModel ?? "",
    form.carType ?? "",
    form.carEngine ?? "",
    form.carDateRange ?? "",
    form.barcode ?? "",
    form.qrcode ?? "",
    Date.now().toString(),
    crypto.randomUUID(),
  ].join("|")

  const bytes = new TextEncoder().encode(base)
  const digest = await crypto.subtle.digest("SHA-256", bytes)
  const arr = Array.from(new Uint8Array(digest))
  return arr.map((b) => b.toString(16).padStart(2, "0")).join("")
}
