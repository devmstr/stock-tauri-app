import * as React from 'react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog'
import { deleteExhaust } from '@/lib/database/exhaust-repo'
import type { Exhaust } from '@/types/exhaust'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  exhaust: Exhaust | null
  onDeleted: () => void
}

export function DeleteConfirmDialog({
  open,
  onOpenChange,
  exhaust,
  onDeleted
}: Props) {
  const [isDeleting, setIsDeleting] = React.useState(false)

  const onConfirm = async () => {
    if (!exhaust) return
    setIsDeleting(true)
    try {
      await deleteExhaust(exhaust.id)
      onDeleted()
      onOpenChange(false)
    } catch (err) {
      console.error('Failed to delete:', err)
      // Potentially show a toast here
    } finally {
      setIsDeleting(false)
    }
  }

  if (!exhaust) return null

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle>
          <AlertDialogDescription>
            Cette action est irréversible. Cela supprimera définitivement
            l'article{' '}
            <span className="font-semibold text-foreground">
              {exhaust.description || exhaust.hash}
            </span>{' '}
            de la base de données.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Annuler</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault()
              void onConfirm()
            }}
            disabled={isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting ? 'Suppression...' : 'Supprimer'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
