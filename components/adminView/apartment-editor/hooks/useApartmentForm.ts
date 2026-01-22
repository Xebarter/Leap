'use client'

import { useState, useCallback, useEffect } from 'react'
import { 
  ApartmentFormData, 
  ApartmentValidationErrors, 
  DEFAULT_APARTMENT_FORM_DATA,
  createInitialFloorConfig,
  getUniqueUnitTypes,
  calculateBuildingSummary
} from '../types'
import { FloorConfig, UnitTypeDetails } from '../../floor-unit-type-configurator'

interface UseApartmentFormOptions {
  initialData?: Partial<ApartmentFormData>
  onValidationChange?: (isValid: boolean) => void
}

export function useApartmentForm({ initialData, onValidationChange }: UseApartmentFormOptions = {}) {
  const [formData, setFormData] = useState<ApartmentFormData>(() => {
    const base = { ...DEFAULT_APARTMENT_FORM_DATA, ...initialData }
    // Initialize floor config if not provided
    if (base.floorConfig.length === 0 && base.totalFloors > 0) {
      base.floorConfig = createInitialFloorConfig(base.totalFloors)
    }
    return base
  })
  
  const [errors, setErrors] = useState<ApartmentValidationErrors>({})
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [isDirty, setIsDirty] = useState(false)

  // Validate a single field
  const validateField = useCallback((name: keyof ApartmentFormData, value: any): string | undefined => {
    switch (name) {
      case 'buildingName':
        if (!value || value.trim().length === 0) return 'Building name is required'
        if (value.trim().length < 3) return 'Building name must be at least 3 characters'
        if (value.trim().length > 100) return 'Building name must be less than 100 characters'
        return undefined
      
      case 'location':
        if (!value || value.trim().length === 0) return 'Location is required'
        if (value.trim().length < 3) return 'Location must be at least 3 characters'
        return undefined
      
      case 'totalFloors':
        if (value === undefined || value === null) return 'Number of floors is required'
        if (value < 1) return 'Building must have at least 1 floor'
        if (value > 100) return 'Maximum 100 floors allowed'
        return undefined
      
      case 'minimumInitialMonths':
        if (value === undefined || value === null) return 'Minimum deposit months is required'
        if (value < 1) return 'Minimum 1 month required'
        if (value > 24) return 'Maximum 24 months allowed'
        return undefined
      
      case 'floorConfig':
        if (!Array.isArray(value) || value.length === 0) return 'Floor configuration is required'
        // Check that at least some floors have unit types
        const hasUnits = value.some((f: FloorConfig) => f.unitTypes.length > 0)
        if (!hasUnits) return 'At least one floor must have unit types configured'
        return undefined
      
      default:
        return undefined
    }
  }, [])

  // Validate all fields
  const validateAll = useCallback((): ApartmentValidationErrors => {
    const newErrors: ApartmentValidationErrors = {}
    const requiredFields: (keyof ApartmentFormData)[] = [
      'buildingName', 'location', 'totalFloors', 'minimumInitialMonths', 'floorConfig'
    ]
    
    requiredFields.forEach(field => {
      const error = validateField(field, formData[field])
      if (error) {
        newErrors[field] = error
        console.log(`Validation error for ${field}:`, error, '| Value:', formData[field])
      }
    })
    
    if (Object.keys(newErrors).length > 0) {
      console.log('All validation errors:', newErrors)
      console.log('Current form data:', formData)
    }
    
    return newErrors
  }, [formData, validateField])

  // Check if form is valid
  const isValid = useCallback((): boolean => {
    const validationErrors = validateAll()
    return Object.keys(validationErrors).length === 0
  }, [validateAll])

  // Update a single field
  const updateField = useCallback(<K extends keyof ApartmentFormData>(
    name: K, 
    value: ApartmentFormData[K]
  ) => {
    setFormData(prev => {
      const updated = { ...prev, [name]: value }
      
      // If totalFloors changes, adjust floorConfig
      if (name === 'totalFloors' && typeof value === 'number') {
        const currentFloors = prev.floorConfig.length
        if (value > currentFloors) {
          // Add more floors
          const newFloors = Array.from(
            { length: value - currentFloors }, 
            (_, i) => ({
              floorNumber: currentFloors + i + 1,
              unitTypes: prev.floorConfig[0]?.unitTypes.map(ut => ({ ...ut })) || 
                [{ type: '1BR', count: 1, monthlyFee: 1000000 }]
            })
          )
          updated.floorConfig = [...prev.floorConfig, ...newFloors]
        } else if (value < currentFloors) {
          // Remove floors from the top
          updated.floorConfig = prev.floorConfig.slice(0, value)
        }
      }
      
      return updated
    })
    setIsDirty(true)
    
    // Validate on change if field was touched
    if (touched[name as string]) {
      const error = validateField(name, value)
      setErrors(prev => ({ ...prev, [name]: error }))
    }
  }, [touched, validateField])

  // Update floor configuration and sync pricing to unit type details
  const updateFloorConfig = useCallback((floorConfig: FloorConfig[]) => {
    setFormData(prev => {
      // Build a map of unit type to price from the new floor config
      const priceMap = new Map<string, number>()
      floorConfig.forEach(floor => {
        floor.unitTypes.forEach(ut => {
          // Use the first non-zero price found for each type
          if (ut.monthlyFee > 0 && !priceMap.has(ut.type)) {
            priceMap.set(ut.type, ut.monthlyFee)
          }
        })
      })
      
      // Update unit type details with synced prices
      const updatedUnitTypeDetails = prev.unitTypeDetails.map(detail => {
        const floorPrice = priceMap.get(detail.type)
        if (floorPrice && floorPrice !== detail.priceUgx) {
          return { ...detail, priceUgx: floorPrice }
        }
        return detail
      })
      
      return { ...prev, floorConfig, unitTypeDetails: updatedUnitTypeDetails }
    })
    setIsDirty(true)
    
    if (touched.floorConfig) {
      const error = validateField('floorConfig', floorConfig)
      setErrors(prev => ({ ...prev, floorConfig: error }))
    }
  }, [touched, validateField])

  // Update unit type details
  const updateUnitTypeDetails = useCallback((unitTypeDetails: UnitTypeDetails[]) => {
    setFormData(prev => ({ ...prev, unitTypeDetails }))
    setIsDirty(true)
  }, [])

  // Update a single unit type's details and sync price to floor config
  const updateSingleUnitTypeDetails = useCallback((type: string, details: Partial<UnitTypeDetails>) => {
    setFormData(prev => {
      const existingIndex = prev.unitTypeDetails.findIndex(d => d.type === type)
      let newDetails: UnitTypeDetails[]
      
      if (existingIndex >= 0) {
        newDetails = [...prev.unitTypeDetails]
        newDetails[existingIndex] = { ...newDetails[existingIndex], ...details }
      } else {
        newDetails = [...prev.unitTypeDetails, { type, description: '', ...details }]
      }
      
      // If price was updated, sync it back to floor config
      let newFloorConfig = prev.floorConfig
      if (details.priceUgx !== undefined) {
        newFloorConfig = prev.floorConfig.map(floor => ({
          ...floor,
          unitTypes: floor.unitTypes.map(ut => 
            ut.type === type 
              ? { ...ut, monthlyFee: details.priceUgx! }
              : ut
          )
        }))
      }
      
      return { ...prev, unitTypeDetails: newDetails, floorConfig: newFloorConfig }
    })
    setIsDirty(true)
  }, [])

  // Mark field as touched (for showing validation on blur)
  const touchField = useCallback((name: keyof ApartmentFormData) => {
    setTouched(prev => ({ ...prev, [name]: true }))
    const error = validateField(name, formData[name])
    setErrors(prev => ({ ...prev, [name]: error }))
  }, [formData, validateField])

  // Reset form to initial state
  const resetForm = useCallback((data?: Partial<ApartmentFormData>) => {
    const base = { ...DEFAULT_APARTMENT_FORM_DATA, ...data }
    if (base.floorConfig.length === 0 && base.totalFloors > 0) {
      base.floorConfig = createInitialFloorConfig(base.totalFloors)
    }
    setFormData(base)
    setErrors({})
    setTouched({})
    setIsDirty(false)
  }, [])

  // Update form data (for loading from server)
  const setData = useCallback((data: Partial<ApartmentFormData>) => {
    setFormData(prev => {
      const merged = { ...prev, ...data }
      
      // Ensure required fields have valid defaults after merge
      if (!merged.buildingName) merged.buildingName = ''
      if (!merged.location) merged.location = ''
      if (merged.totalFloors === undefined || merged.totalFloors === null || merged.totalFloors < 1) {
        merged.totalFloors = 5
      }
      if (merged.minimumInitialMonths === undefined || merged.minimumInitialMonths === null || merged.minimumInitialMonths < 1) {
        merged.minimumInitialMonths = 1
      }
      if (!Array.isArray(merged.floorConfig)) {
        merged.floorConfig = []
      }
      if (!Array.isArray(merged.unitTypeDetails)) {
        merged.unitTypeDetails = []
      }
      
      // If floor config is empty but we have floors, create initial config
      if (merged.floorConfig.length === 0 && merged.totalFloors > 0) {
        merged.floorConfig = createInitialFloorConfig(merged.totalFloors)
      }
      
      return merged
    })
    // Clear validation errors when loading new data
    setErrors({})
    setTouched({})
  }, [])

  // Get unique unit types from current config
  const uniqueUnitTypes = getUniqueUnitTypes(formData.floorConfig)

  // Get building summary
  const buildingSummary = calculateBuildingSummary(formData)

  // Notify parent of validation changes
  useEffect(() => {
    onValidationChange?.(isValid())
  }, [isValid, onValidationChange])

  // Get completion percentage
  const getCompletionPercentage = useCallback((): number => {
    let completed = 0
    let total = 5 // Base required fields
    
    // Building name
    if (formData.buildingName && formData.buildingName.trim().length >= 3) completed++
    
    // Location
    if (formData.location && formData.location.trim().length >= 3) completed++
    
    // Floor config
    if (formData.floorConfig.length > 0 && 
        formData.floorConfig.some(f => f.unitTypes.length > 0)) completed++
    
    // Has unit types configured
    if (uniqueUnitTypes.length > 0) completed++
    
    // Minimum months
    if (formData.minimumInitialMonths >= 1) completed++
    
    // Optional fields
    total += 3
    if (formData.googleMapsEmbedUrl) completed++
    if (formData.buildingImageUrl || (formData.buildingImageUrls && formData.buildingImageUrls.length > 0)) completed++
    if (formData.unitTypeDetails.length > 0 && 
        formData.unitTypeDetails.some(d => d.description && d.description.length > 0)) completed++
    
    return Math.round((completed / total) * 100)
  }, [formData, uniqueUnitTypes])

  return {
    formData,
    errors,
    touched,
    isDirty,
    isValid,
    updateField,
    updateFloorConfig,
    updateUnitTypeDetails,
    updateSingleUnitTypeDetails,
    touchField,
    validateAll,
    validateField,
    resetForm,
    setData,
    getCompletionPercentage,
    uniqueUnitTypes,
    buildingSummary,
  }
}
