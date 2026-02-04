'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Building2, MapPin, Map } from 'lucide-react'
import { ApartmentFormData, ApartmentValidationErrors } from '../types'

interface BuildingInfoSectionProps {
  formData: ApartmentFormData
  errors: ApartmentValidationErrors
  onUpdate: <K extends keyof ApartmentFormData>(name: K, value: ApartmentFormData[K]) => void
  onBlur: (name: keyof ApartmentFormData) => void
}

export function BuildingInfoSection({ formData, errors, onUpdate, onBlur }: BuildingInfoSectionProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Building Information</h2>
        <p className="text-muted-foreground mt-1">
          Enter the basic details about your apartment building
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Building Details
          </CardTitle>
          <CardDescription>
            This information will be used as the basis for all unit type listings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Building Name */}
          <div className="space-y-2">
            <Label htmlFor="buildingName" className="text-sm font-medium">
              Building Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="buildingName"
              value={formData.buildingName}
              onChange={(e) => onUpdate('buildingName', e.target.value)}
              onBlur={() => onBlur('buildingName')}
              placeholder="e.g., Sunset Apartments, Palm Heights"
              className={errors.buildingName ? 'border-destructive' : ''}
            />
            {errors.buildingName ? (
              <p className="text-sm text-destructive">{errors.buildingName}</p>
            ) : (
              <p className="text-sm text-muted-foreground">
                Used as prefix for unit type listings (e.g., "Palm Heights - 2 Bedroom")
              </p>
            )}
          </div>

          {/* Number of Floors */}
          <div className="space-y-2">
            <Label htmlFor="totalFloors" className="text-sm font-medium">
              Number of Floors <span className="text-destructive">*</span>
            </Label>
            <Input
              id="totalFloors"
              type="number"
              min={1}
              max={100}
              value={formData.totalFloors}
              onChange={(e) => onUpdate('totalFloors', parseInt(e.target.value) || 1)}
              onBlur={() => onBlur('totalFloors')}
              className={`max-w-[200px] ${errors.totalFloors ? 'border-destructive' : ''}`}
            />
            {errors.totalFloors ? (
              <p className="text-sm text-destructive">{errors.totalFloors}</p>
            ) : (
              <p className="text-sm text-muted-foreground">
                Total number of floors in the building (excluding basement/parking)
              </p>
            )}
          </div>

          {/* Minimum Initial Months */}
          <div className="space-y-2">
            <Label htmlFor="minimumInitialMonths" className="text-sm font-medium">
              {formData.buildingType === 'hostel' ? 'Minimum Initial Deposit' : 'Minimum Deposit (Months)'} <span className="text-destructive">*</span>
            </Label>
            {formData.buildingType === 'hostel' ? (
              <select
                id="minimumInitialMonths"
                value={formData.minimumInitialMonths}
                onChange={(e) => onUpdate('minimumInitialMonths', parseInt(e.target.value))}
                onBlur={() => onBlur('minimumInitialMonths')}
                className={`flex h-10 w-full max-w-[200px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${errors.minimumInitialMonths ? 'border-destructive' : ''}`}
              >
                <option value="1">Half Semester</option>
                <option value="2">Full Semester</option>
              </select>
            ) : (
              <Input
                id="minimumInitialMonths"
                type="number"
                min={1}
                max={24}
                value={formData.minimumInitialMonths}
                onChange={(e) => onUpdate('minimumInitialMonths', parseInt(e.target.value) || 1)}
                onBlur={() => onBlur('minimumInitialMonths')}
                className={`max-w-[200px] ${errors.minimumInitialMonths ? 'border-destructive' : ''}`}
              />
            )}
            {errors.minimumInitialMonths ? (
              <p className="text-sm text-destructive">{errors.minimumInitialMonths}</p>
            ) : (
              <p className="text-sm text-muted-foreground">
                {formData.buildingType === 'hostel' 
                  ? 'Choose whether students pay for half or full semester upfront'
                  : 'Number of months rent required as initial deposit (applies to all units)'}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Location
          </CardTitle>
          <CardDescription>
            Where is this building located?
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Location */}
          <div className="space-y-2">
            <Label htmlFor="location" className="text-sm font-medium">
              Address / Location <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="location"
              value={formData.location}
              onChange={(e) => onUpdate('location', e.target.value)}
              onBlur={() => onBlur('location')}
              placeholder="e.g., Kololo, Kampala, Uganda"
              rows={2}
              className={errors.location ? 'border-destructive' : ''}
            />
            {errors.location && (
              <p className="text-sm text-destructive">{errors.location}</p>
            )}
          </div>

          {/* Google Maps */}
          <div className="space-y-2">
            <Label htmlFor="googleMapsEmbedUrl" className="text-sm font-medium flex items-center gap-2">
              <Map className="h-4 w-4" />
              Google Maps Link
            </Label>
            <Input
              id="googleMapsEmbedUrl"
              value={formData.googleMapsEmbedUrl || ''}
              onChange={(e) => onUpdate('googleMapsEmbedUrl', e.target.value)}
              placeholder="https://maps.google.com/..."
              type="url"
            />
            <p className="text-sm text-muted-foreground">
              Paste the URL from Google Maps. Visitors will see an interactive map on the property details page.
            </p>
            
            {/* Map Preview */}
            {formData.googleMapsEmbedUrl && (
              <div className="mt-4 rounded-lg overflow-hidden border">
                <div className="aspect-video bg-muted flex items-center justify-center">
                  <iframe
                    src={formData.googleMapsEmbedUrl.replace('/maps/', '/maps/embed/')}
                    width="100%"
                    height="100%"
                    style={{ border: 0, minHeight: '300px' }}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
