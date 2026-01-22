'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { PropertyFormData, ValidationErrors, PROPERTY_CATEGORIES } from '../types'
import { FieldError } from './FieldError'

interface BasicInfoSectionProps {
  formData: PropertyFormData
  errors: ValidationErrors
  onUpdate: <K extends keyof PropertyFormData>(field: K, value: PropertyFormData[K]) => void
  onBlur: (field: keyof PropertyFormData) => void
}

export function BasicInfoSection({ formData, errors, onUpdate, onBlur }: BasicInfoSectionProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Basic Information</h2>
        <p className="text-muted-foreground text-sm mt-1">
          Enter the essential details about your property.
        </p>
      </div>

      <div className="grid gap-6">
        {/* Title */}
        <div className="space-y-2">
          <Label htmlFor="title" className="text-sm font-medium">
            Property Title <span className="text-destructive">*</span>
          </Label>
          <Input
            id="title"
            value={formData.title}
            onChange={(e) => onUpdate('title', e.target.value)}
            onBlur={() => onBlur('title')}
            placeholder="e.g., Modern 2-Bedroom Apartment in Kololo"
            className={errors.title ? 'border-destructive' : ''}
          />
          <FieldError error={errors.title} />
          <p className="text-xs text-muted-foreground">
            A descriptive title helps tenants find your property.
          </p>
        </div>

        {/* Category */}
        <div className="space-y-2">
          <Label htmlFor="category" className="text-sm font-medium">
            Category <span className="text-destructive">*</span>
          </Label>
          <Select
            value={formData.category}
            onValueChange={(value) => onUpdate('category', value)}
          >
            <SelectTrigger className={errors.category ? 'border-destructive' : ''}>
              <SelectValue placeholder="Select property type" />
            </SelectTrigger>
            <SelectContent>
              {PROPERTY_CATEGORIES.map((cat) => (
                <SelectItem key={cat.value} value={cat.value}>
                  {cat.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FieldError error={errors.category} />
        </div>

        {/* Location */}
        <div className="space-y-2">
          <Label htmlFor="location" className="text-sm font-medium">
            Location <span className="text-destructive">*</span>
          </Label>
          <Input
            id="location"
            value={formData.location}
            onChange={(e) => onUpdate('location', e.target.value)}
            onBlur={() => onBlur('location')}
            placeholder="e.g., Kololo, Kampala"
            className={errors.location ? 'border-destructive' : ''}
          />
          <FieldError error={errors.location} />
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Label htmlFor="description" className="text-sm font-medium">
            Description <span className="text-destructive">*</span>
          </Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => onUpdate('description', e.target.value)}
            onBlur={() => onBlur('description')}
            placeholder="Describe your property in detail. Include amenities, nearby attractions, and what makes it special..."
            rows={5}
            className={errors.description ? 'border-destructive' : ''}
          />
          <FieldError error={errors.description} />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Minimum 10 characters</span>
            <span>{formData.description.length} characters</span>
          </div>
        </div>
      </div>
    </div>
  )
}
