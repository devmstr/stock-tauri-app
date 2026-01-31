import * as React from 'react'

type Props = {
  message?: string
}

export function LoadingState({ message = 'Chargement...' }: Props) {
  return (
    <div className="rounded-xl border border-border bg-muted p-12 text-center flex flex-col items-center justify-center gap-4">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      <span className="text-sm font-medium text-muted-foreground">
        {message}
      </span>
    </div>
  )
}
