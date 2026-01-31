import * as React from 'react'
import { AlertCircle } from 'lucide-react'

type Props = {
  message: string
}

export function ErrorBanner({ message }: Props) {
  return (
    <div className="rounded-xl border border-destructive bg-destructive/10 p-4 text-sm flex items-start gap-3">
      <AlertCircle className="h-5 w-5 text-destructive shrink-0" />
      <div>
        <span className="font-semibold text-destructive">Erreur :</span>{' '}
        <span className="text-foreground">{message}</span>
      </div>
    </div>
  )
}
