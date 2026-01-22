'use client'

import { useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'

interface UseUnsavedChangesOptions {
  hasChanges: boolean
  message?: string
}

export function useUnsavedChanges({ 
  hasChanges, 
  message = 'You have unsaved changes. Are you sure you want to leave?' 
}: UseUnsavedChangesOptions) {
  const router = useRouter()

  // Handle browser back/forward and tab close
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasChanges) {
        e.preventDefault()
        e.returnValue = message
        return message
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [hasChanges, message])

  // Safe navigation function that checks for unsaved changes
  const safeNavigate = useCallback((path: string) => {
    if (hasChanges) {
      const confirmed = window.confirm(message)
      if (confirmed) {
        router.push(path)
      }
      return confirmed
    }
    router.push(path)
    return true
  }, [hasChanges, message, router])

  // Force navigation without confirmation (use after successful save)
  const forceNavigate = useCallback((path: string) => {
    router.push(path)
  }, [router])

  return {
    safeNavigate,
    forceNavigate,
  }
}
