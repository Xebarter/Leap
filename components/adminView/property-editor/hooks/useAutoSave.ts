'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { PropertyFormData, SaveStatus } from '../types'

interface UseAutoSaveOptions {
  data: PropertyFormData
  onSave: (data: PropertyFormData) => Promise<void>
  interval?: number // in milliseconds
  enabled?: boolean
}

export function useAutoSave({ 
  data, 
  onSave, 
  interval = 30000, // 30 seconds default
  enabled = true 
}: UseAutoSaveOptions) {
  const [saveStatus, setSaveStatus] = useState<SaveStatus>({ status: 'idle' })
  const lastSavedDataRef = useRef<string>('')
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Serialize data for comparison
  const serializeData = useCallback((d: PropertyFormData): string => {
    return JSON.stringify(d)
  }, [])

  // Check if data has changed since last save
  const hasChanges = useCallback((): boolean => {
    return serializeData(data) !== lastSavedDataRef.current
  }, [data, serializeData])

  // Perform save
  const performSave = useCallback(async (isManual: boolean = false) => {
    if (!hasChanges() && !isManual) {
      return
    }

    setSaveStatus({ status: 'saving' })
    
    try {
      await onSave(data)
      lastSavedDataRef.current = serializeData(data)
      setSaveStatus({ 
        status: 'saved', 
        lastSaved: new Date() 
      })
      
      // Reset to idle after 3 seconds
      setTimeout(() => {
        setSaveStatus(prev => 
          prev.status === 'saved' ? { ...prev, status: 'idle' } : prev
        )
      }, 3000)
    } catch (error) {
      setSaveStatus({ 
        status: 'error', 
        error: error instanceof Error ? error.message : 'Failed to save'
      })
    }
  }, [data, hasChanges, onSave, serializeData])

  // Manual save trigger
  const save = useCallback(() => {
    return performSave(true)
  }, [performSave])

  // Set up auto-save interval
  useEffect(() => {
    if (!enabled) return

    const scheduleNextSave = () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      
      timeoutRef.current = setTimeout(() => {
        if (hasChanges()) {
          performSave(false)
        }
        scheduleNextSave()
      }, interval)
    }

    scheduleNextSave()

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [enabled, interval, hasChanges, performSave])

  // Update last saved data when data prop changes externally (e.g., initial load)
  useEffect(() => {
    if (saveStatus.status === 'idle' && !lastSavedDataRef.current) {
      lastSavedDataRef.current = serializeData(data)
    }
  }, [data, saveStatus.status, serializeData])

  return {
    saveStatus,
    save,
    hasChanges: hasChanges(),
  }
}
