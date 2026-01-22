'use client'

import { useState, useCallback, useEffect } from 'react'
import { PropertyFormData, ValidationErrors, DEFAULT_FORM_DATA } from '../types'

interface UsePropertyFormOptions {
  initialData?: Partial<PropertyFormData>
  onValidationChange?: (isValid: boolean) => void
}

export function usePropertyForm({ initialData, onValidationChange }: UsePropertyFormOptions = {}) {
  const [formData, setFormData] = useState<PropertyFormData>({
    ...DEFAULT_FORM_DATA,
    ...initialData,
  })
  const [errors, setErrors] = useState<ValidationErrors>({})
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [isDirty, setIsDirty] = useState(false)

  // Validate a single field
  const validateField = useCallback((name: keyof PropertyFormData, value: any): string | undefined => {
    switch (name) {
      case 'title':
        if (!value || value.trim().length === 0) return 'Title is required'
        if (value.trim().length < 3) return 'Title must be at least 3 characters'
        if (value.trim().length > 100) return 'Title must be less than 100 characters'
        return undefined
      
      case 'location':
        if (!value || value.trim().length === 0) return 'Location is required'
        if (value.trim().length < 3) return 'Location must be at least 3 characters'
        return undefined
      
      case 'description':
        if (!value || value.trim().length === 0) return 'Description is required'
        if (value.trim().length < 10) return 'Description must be at least 10 characters'
        return undefined
      
      case 'category':
        if (!value) return 'Category is required'
        return undefined
      
      case 'price_ugx':
        if (value === undefined || value === null) return 'Price is required'
        if (value < 0) return 'Price cannot be negative'
        return undefined
      
      case 'bedrooms':
        if (value === undefined || value === null) return 'Bedrooms is required'
        if (value < 0) return 'Bedrooms cannot be negative'
        if (value > 20) return 'Maximum 20 bedrooms allowed'
        return undefined
      
      case 'bathrooms':
        if (value === undefined || value === null) return 'Bathrooms is required'
        if (value < 0) return 'Bathrooms cannot be negative'
        if (value > 20) return 'Maximum 20 bathrooms allowed'
        return undefined
      
      case 'minimum_initial_months':
        if (value === undefined || value === null) return 'Minimum deposit months is required'
        if (value < 1) return 'Minimum 1 month required'
        if (value > 24) return 'Maximum 24 months allowed'
        return undefined
      
      default:
        return undefined
    }
  }, [])

  // Validate all fields
  const validateAll = useCallback((): ValidationErrors => {
    const newErrors: ValidationErrors = {}
    const requiredFields: (keyof PropertyFormData)[] = [
      'title', 'location', 'description', 'category', 
      'price_ugx', 'bedrooms', 'bathrooms', 'minimum_initial_months'
    ]
    
    requiredFields.forEach(field => {
      const error = validateField(field, formData[field])
      if (error) newErrors[field] = error
    })
    
    return newErrors
  }, [formData, validateField])

  // Check if form is valid
  const isValid = useCallback((): boolean => {
    const validationErrors = validateAll()
    return Object.keys(validationErrors).length === 0
  }, [validateAll])

  // Update a single field
  const updateField = useCallback(<K extends keyof PropertyFormData>(
    name: K, 
    value: PropertyFormData[K]
  ) => {
    setFormData(prev => ({ ...prev, [name]: value }))
    setIsDirty(true)
    
    // Validate on change if field was touched
    if (touched[name]) {
      const error = validateField(name, value)
      setErrors(prev => ({ ...prev, [name]: error }))
    }
  }, [touched, validateField])

  // Mark field as touched (for showing validation on blur)
  const touchField = useCallback((name: keyof PropertyFormData) => {
    setTouched(prev => ({ ...prev, [name]: true }))
    const error = validateField(name, formData[name])
    setErrors(prev => ({ ...prev, [name]: error }))
  }, [formData, validateField])

  // Reset form to initial state
  const resetForm = useCallback((data?: Partial<PropertyFormData>) => {
    setFormData({ ...DEFAULT_FORM_DATA, ...data })
    setErrors({})
    setTouched({})
    setIsDirty(false)
  }, [])

  // Update form data (for loading from server)
  const setData = useCallback((data: Partial<PropertyFormData>) => {
    setFormData(prev => ({ ...prev, ...data }))
  }, [])

  // Notify parent of validation changes
  useEffect(() => {
    onValidationChange?.(isValid())
  }, [isValid, onValidationChange])

  // Get completion percentage
  const getCompletionPercentage = useCallback((): number => {
    const requiredFields: (keyof PropertyFormData)[] = [
      'title', 'location', 'description', 'category', 
      'price_ugx', 'bedrooms', 'bathrooms'
    ]
    
    const optionalFields: (keyof PropertyFormData)[] = [
      'image_url', 'video_url', 'google_maps_embed_url'
    ]
    
    let completed = 0
    let total = requiredFields.length + optionalFields.length
    
    requiredFields.forEach(field => {
      const value = formData[field]
      if (value !== undefined && value !== null && value !== '' && value !== 0) {
        completed++
      }
    })
    
    optionalFields.forEach(field => {
      const value = formData[field]
      if (value !== undefined && value !== null && value !== '') {
        completed++
      }
    })
    
    return Math.round((completed / total) * 100)
  }, [formData])

  return {
    formData,
    errors,
    touched,
    isDirty,
    isValid,
    updateField,
    touchField,
    validateAll,
    validateField,
    resetForm,
    setData,
    getCompletionPercentage,
  }
}
