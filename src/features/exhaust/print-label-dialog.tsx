import * as React from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Printer, Loader2 } from 'lucide-react'
import type { Exhaust } from '@/types/exhaust'
import { buildDesignation } from '@/lib/utils/designation'
import { PrintProductLabel } from './print-product-label'
import { printLabelNode100x60mm } from '@/lib/printing/print-label-100x60mm'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  exhaust: Exhaust | null
}

export function PrintLabelDialog({ open, onOpenChange, exhaust }: Props) {
  const labelRef = React.useRef<HTMLDivElement>(null)
  const [isPrinting, setIsPrinting] = React.useState(false)

  const designation = React.useMemo(() => {
    if (!exhaust) return ''
    return buildDesignation(exhaust)
  }, [exhaust])

  const handleNativePrint = async () => {
    if (!labelRef.current) return

    try {
      setIsPrinting(true)
      await printLabelNode100x60mm(labelRef.current)
    } catch (error) {
      console.error('Failed to print:', error)
      // You could add a toast notification here
    } finally {
      setIsPrinting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-180 w-full p-0 overflow-hidden bg-slate-50">
        <DialogHeader className="p-4 bg-white border-b">
          <DialogTitle>Imprimer l'étiquette</DialogTitle>
        </DialogHeader>

        <div className="p-6 flex justify-center ">
          {exhaust ? (
            <div className="shadow-xl rounded-sm border bg-white overflow-hidden">
              <PrintProductLabel
                ref={labelRef}
                companyData={{
                  company: 'OULAD KOUIDER INDUSTRIE',
                  address: 'Z.I. Garat taam B. P.N 46 Bounoura - 47014',
                  phone1: '029 27 23 49',
                  phone2: '029 27 22 06',
                  email: 'info@okindustrie.com',
                  logoSrc: '/oki-logo.svg'
                }}
                designation={designation}
                qrCode={exhaust.hash ?? ''}
                barcode={exhaust.barcode ?? ''}
              />
            </div>
          ) : (
            <div className="text-sm text-muted-foreground py-10">
              Aucun élément sélectionné.
            </div>
          )}
        </div>

        <DialogFooter className="p-4 bg-white border-t sm:justify-center">
          <Button
            onClick={handleNativePrint}
            disabled={isPrinting || !exhaust}
            className="w-full sm:w-auto h-12 px-8 text-lg font-bold gap-2"
          >
            {isPrinting ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Impression...
              </>
            ) : (
              <>
                <Printer className="h-5 w-5" />
                Imprimer 100x60mm
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
