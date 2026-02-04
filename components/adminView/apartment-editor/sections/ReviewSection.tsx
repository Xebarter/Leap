'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Building2, MapPin, Layers, Home, DollarSign, 
  Check, AlertCircle, Image as ImageIcon, Calendar
} from 'lucide-react'
import { ApartmentFormData, calculateBuildingSummary, getUnitTypeLabel, UNIT_TYPE_COLORS } from '../types'
import { formatPrice } from '@/lib/utils'

interface ReviewSectionProps {
  formData: ApartmentFormData
  uniqueUnitTypes: string[]
  buildingType?: string
}

export function ReviewSection({ formData, uniqueUnitTypes, buildingType = 'apartment' }: ReviewSectionProps) {
  const summary = calculateBuildingSummary(formData)

  // Check completion status
  const checks = {
    buildingInfo: !!(formData.buildingName && formData.location),
    floorsConfig: formData.floorConfig.length > 0 && formData.floorConfig.some(f => f.unitTypes.length > 0),
    unitTypes: uniqueUnitTypes.length > 0,
    unitDetails: formData.unitTypeDetails.length > 0 && 
      formData.unitTypeDetails.some(d => d.description && d.priceUgx),
    media: !!(formData.buildingImageUrl || (formData.buildingImageUrls && formData.buildingImageUrls.length > 0)),
  }

  const allComplete = Object.values(checks).every(Boolean)
  const completedCount = Object.values(checks).filter(Boolean).length
  const totalChecks = Object.keys(checks).length

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Review & Create</h2>
        <p className="text-muted-foreground mt-1">
          Review your apartment building configuration before creating
        </p>
      </div>

      {/* Completion Status */}
      <Card className={allComplete ? 'border-green-500 bg-green-50' : 'border-amber-500 bg-amber-50'}>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            {allComplete ? (
              <div className="p-3 rounded-full bg-green-100">
                <Check className="h-6 w-6 text-green-600" />
              </div>
            ) : (
              <div className="p-3 rounded-full bg-amber-100">
                <AlertCircle className="h-6 w-6 text-amber-600" />
              </div>
            )}
            <div>
              <h3 className={`font-semibold ${allComplete ? 'text-green-700' : 'text-amber-700'}`}>
                {allComplete ? 'Ready to Create!' : 'Almost There'}
              </h3>
              <p className={`text-sm ${allComplete ? 'text-green-600' : 'text-amber-600'}`}>
                {completedCount} of {totalChecks} sections complete
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Checklist */}
      <Card>
        <CardHeader>
          <CardTitle>Completion Checklist</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <ChecklistItem 
            label="Building Information" 
            description={formData.buildingName || 'Not set'}
            complete={checks.buildingInfo} 
          />
          <ChecklistItem 
            label="Floor Configuration" 
            description={`${summary.totalFloors} floors configured`}
            complete={checks.floorsConfig} 
          />
          <ChecklistItem 
            label="Unit Types" 
            description={`${uniqueUnitTypes.length} unit type${uniqueUnitTypes.length !== 1 ? 's' : ''}`}
            complete={checks.unitTypes} 
          />
          <ChecklistItem 
            label="Unit Details" 
            description={`${formData.unitTypeDetails.filter(d => d.description && d.priceUgx).length} configured`}
            complete={checks.unitDetails} 
          />
          <ChecklistItem 
            label="Building Media" 
            description={`${(formData.buildingImageUrls || []).length} image${(formData.buildingImageUrls || []).length !== 1 ? 's' : ''}`}
            complete={checks.media} 
          />
        </CardContent>
      </Card>

      {/* Building Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Building Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex items-center gap-3">
              <Building2 className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Building Name</p>
                <p className="font-medium">{formData.buildingName || 'Not set'}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <MapPin className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Location</p>
                <p className="font-medium">{formData.location || 'Not set'}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Layers className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Total Floors</p>
                <p className="font-medium">{summary.totalFloors}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Home className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Total Units</p>
                <p className="font-medium">{summary.totalUnits}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Minimum Deposit</p>
                <p className="font-medium">
                  {buildingType === 'hostel' 
                    ? (formData.minimumInitialMonths === 1 ? 'Half Semester' : 'Full Semester')
                    : `${formData.minimumInitialMonths} month${formData.minimumInitialMonths !== 1 ? 's' : ''}`
                  }
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <ImageIcon className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Building Images</p>
                <p className="font-medium">{(formData.buildingImageUrls || []).length} uploaded</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Unit Types to be Created */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Home className="h-5 w-5" />
            Property Listings to be Created
          </CardTitle>
          <CardDescription>
            Each unit type will become a separate property listing
          </CardDescription>
        </CardHeader>
        <CardContent>
          {summary.unitTypeBreakdown.length > 0 ? (
            <div className="space-y-3">
              {summary.unitTypeBreakdown.map((item) => {
                const colors = UNIT_TYPE_COLORS[item.type] || UNIT_TYPE_COLORS['1BR']
                const details = formData.unitTypeDetails.find(d => d.type === item.type)
                
                return (
                  <div 
                    key={item.type}
                    className={`p-4 rounded-lg border ${colors.border} ${colors.bg}`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className={`font-medium ${colors.text}`}>
                          {formData.buildingName || 'Building'} - {item.label}
                        </h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          {item.count} unit{item.count !== 1 ? 's' : ''} available
                          {details?.priceUgx && ` • ${formatPrice(details.priceUgx)}${buildingType === 'hostel' ? '/semester' : '/month'}`}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {details?.description ? (
                          <Badge variant="outline" className="bg-white text-green-600 border-green-300">
                            <Check className="h-3 w-3 mr-1" /> Configured
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-white text-amber-600 border-amber-300">
                            <AlertCircle className="h-3 w-3 mr-1" /> Needs Details
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8">
              No unit types configured. Go back to "Floors & Units" to add unit types.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Preview of Main Image */}
      {formData.buildingImageUrl && (
        <Card>
          <CardHeader>
            <CardTitle>Main Building Image</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="aspect-video rounded-lg overflow-hidden">
              <img
                src={formData.buildingImageUrl}
                alt={formData.buildingName || 'Building'}
                className="w-full h-full object-cover"
              />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// Checklist Item Component
function ChecklistItem({ 
  label, 
  description, 
  complete 
}: { 
  label: string
  description: string
  complete: boolean 
}) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
      <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
        complete ? 'bg-green-100 text-green-600' : 'bg-muted text-muted-foreground'
      }`}>
        {complete ? <Check className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
      </div>
      <div className="flex-1">
        <p className="font-medium text-sm">{label}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
    </div>
  )
}
