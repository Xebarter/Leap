'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PropertyFormData, ValidationErrors } from '../types'
import { FieldError } from './FieldError'
import { formatPrice } from '@/lib/utils'

interface PricingSectionProps {
  formData: PropertyFormData
  errors: ValidationErrors
  onUpdate: <K extends keyof PropertyFormData>(field: K, value: PropertyFormData[K]) => void
  onBlur: (field: keyof PropertyFormData) => void
}

export function PricingSection({ formData, errors, onUpdate, onBlur }: PricingSectionProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Pricing & Details</h2>
        <p className="text-muted-foreground text-sm mt-1">
          Set the rental price and property specifications.
        </p>
      </div>

      <div className="grid gap-6">
        {/* Monthly Fee */}
        <div className="space-y-2">
          <Label htmlFor="price" className="text-sm font-medium">
            Monthly Rent (UGX) <span className="text-destructive">*</span>
          </Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
              UGX
            </span>
            <Input
              id="price"
              type="number"
              min="0"
              step="10000"
              value={formData.price_ugx || ''}
              onChange={(e) => onUpdate('price_ugx', parseFloat(e.target.value) || 0)}
              onBlur={() => onBlur('price_ugx')}
              placeholder="0"
              className={`pl-12 ${errors.price_ugx ? 'border-destructive' : ''}`}
            />
          </div>
          <FieldError error={errors.price_ugx} />
          {formData.price_ugx > 0 && (
            <p className="text-sm text-muted-foreground">
              Displayed as: <span className="font-medium">{formatPrice(formData.price_ugx)}</span>
            </p>
          )}
        </div>

        {/* Minimum Deposit */}
        <div className="space-y-2">
          <Label htmlFor="deposit" className="text-sm font-medium">
            Minimum Initial Deposit (Months) <span className="text-destructive">*</span>
          </Label>
          <Input
            id="deposit"
            type="number"
            min="1"
            max="24"
            value={formData.minimum_initial_months || ''}
            onChange={(e) => onUpdate('minimum_initial_months', parseInt(e.target.value) || 1)}
            onBlur={() => onBlur('minimum_initial_months')}
            className={errors.minimum_initial_months ? 'border-destructive' : ''}
          />
          <FieldError error={errors.minimum_initial_months} />
          {formData.price_ugx > 0 && formData.minimum_initial_months > 0 && (
            <p className="text-sm text-muted-foreground">
              Initial payment: <span className="font-medium">
                {formatPrice(formData.price_ugx * formData.minimum_initial_months)}
              </span> ({formData.minimum_initial_months} month{formData.minimum_initial_months > 1 ? 's' : ''})
            </p>
          )}
        </div>

        {/* Bedrooms & Bathrooms */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="bedrooms" className="text-sm font-medium">
              Bedrooms <span className="text-destructive">*</span>
            </Label>
            <Input
              id="bedrooms"
              type="number"
              min="0"
              max="20"
              value={formData.bedrooms ?? ''}
              onChange={(e) => onUpdate('bedrooms', parseInt(e.target.value) || 0)}
              onBlur={() => onBlur('bedrooms')}
              className={errors.bedrooms ? 'border-destructive' : ''}
            />
            <FieldError error={errors.bedrooms} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="bathrooms" className="text-sm font-medium">
              Bathrooms <span className="text-destructive">*</span>
            </Label>
            <Input
              id="bathrooms"
              type="number"
              min="0"
              max="20"
              value={formData.bathrooms ?? ''}
              onChange={(e) => onUpdate('bathrooms', parseInt(e.target.value) || 0)}
              onBlur={() => onBlur('bathrooms')}
              className={errors.bathrooms ? 'border-destructive' : ''}
            />
            <FieldError error={errors.bathrooms} />
          </div>
        </div>

        {/* Total Floors (for apartments) */}
        {formData.category === 'Apartment' && (
          <div className="space-y-2">
            <Label htmlFor="floors" className="text-sm font-medium">
              Total Floors
            </Label>
            <Input
              id="floors"
              type="number"
              min="1"
              max="100"
              value={formData.total_floors || ''}
              onChange={(e) => onUpdate('total_floors', parseInt(e.target.value) || 1)}
            />
            <p className="text-xs text-muted-foreground">
              Number of floors in the building
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
