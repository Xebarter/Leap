'use client'

import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/checkbox'
import { PropertyFormData } from '../types'
import { Building2, Star, Info } from 'lucide-react'

interface SettingsSectionProps {
  formData: PropertyFormData
  blocks: Array<{ id: string; name: string; location: string }>
  onUpdate: <K extends keyof PropertyFormData>(field: K, value: PropertyFormData[K]) => void
}

export function SettingsSection({ formData, blocks, onUpdate }: SettingsSectionProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Settings</h2>
        <p className="text-muted-foreground text-sm mt-1">
          Configure additional property settings.
        </p>
      </div>

      <div className="grid gap-6">
        {/* Featured Property */}
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-amber-100 rounded-lg">
              <Star className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <Label className="text-sm font-medium">Featured Property</Label>
              <p className="text-xs text-muted-foreground mt-1">
                Featured properties appear prominently on the homepage
              </p>
            </div>
          </div>
          <input
            type="checkbox"
            checked={formData.is_featured || false}
            onChange={(e) => onUpdate('is_featured', e.target.checked)}
            className="h-5 w-5 rounded border-gray-300 text-primary focus:ring-primary"
          />
        </div>

        {/* Block Association */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-muted-foreground" />
            <Label className="text-sm font-medium">Block Association</Label>
          </div>
          
          <Select
            value={formData.block_id || 'none'}
            onValueChange={(value) => onUpdate('block_id', value === 'none' ? undefined : value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a block (optional)" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No block association</SelectItem>
              {blocks.map((block) => (
                <SelectItem key={block.id} value={block.id}>
                  {block.name} - {block.location}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <p className="text-xs text-muted-foreground">
            Associate this property with a building block for better organization.
          </p>
        </div>

        {/* Property Code (Read-only) */}
        {formData.property_code && (
          <div className="p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2">
              <Info className="h-4 w-4 text-muted-foreground" />
              <Label className="text-sm font-medium">Property Code</Label>
            </div>
            <p className="font-mono text-sm mt-2">{formData.property_code}</p>
            <p className="text-xs text-muted-foreground mt-1">
              This unique identifier is auto-generated and cannot be changed.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
