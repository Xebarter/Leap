'use client'

import { AlertCircle } from 'lucide-react'

interface FieldErrorProps {
  error?: string
}

export function FieldError({ error }: FieldErrorProps) {
  if (!error) return null

  return (
    <div className="flex items-center gap-1.5 text-sm text-destructive">
      <AlertCircle className="h-3.5 w-3.5 shrink-0" />
      <span>{error}</span>
    </div>
  )
}
