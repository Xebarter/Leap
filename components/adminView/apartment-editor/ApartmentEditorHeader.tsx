'use client'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  ArrowLeft, Save, Loader2, Eye, Trash2, Building2, CheckCircle, Clock
} from 'lucide-react'
import { ApartmentSaveStatus } from './types'

interface ApartmentEditorHeaderProps {
  buildingName: string
  blockId?: string
  isNew: boolean
  isDirty: boolean
  saveStatus: ApartmentSaveStatus
  completionPercentage: number
  onSave: () => void
  onBack: () => void
  onDelete?: () => void
  onPreview?: () => void
  isSaving: boolean
  buildingType?: string // 'apartment', 'hostel', or 'office'
}

// Helper function for display labels
function getBuildingTypeLabel(type: string): string {
  switch (type) {
    case 'hostel': return 'Hostel'
    case 'office': return 'Office'
    case 'apartment':
    default: return 'Apartment'
  }
}

export function ApartmentEditorHeader({
  buildingName,
  blockId,
  isNew,
  isDirty,
  saveStatus,
  completionPercentage,
  onSave,
  onBack,
  onDelete,
  onPreview,
  isSaving,
  buildingType = 'apartment',
}: ApartmentEditorHeaderProps) {
  const getSaveStatusDisplay = () => {
    switch (saveStatus.status) {
      case 'saving':
        return (
          <span className="flex items-center gap-1 text-muted-foreground text-sm">
            <Loader2 className="h-3 w-3 animate-spin" />
            Saving...
          </span>
        )
      case 'saved':
        return (
          <span className="flex items-center gap-1 text-green-600 text-sm">
            <CheckCircle className="h-3 w-3" />
            Saved {saveStatus.lastSaved && `at ${saveStatus.lastSaved.toLocaleTimeString()}`}
          </span>
        )
      case 'error':
        return (
          <span className="flex items-center gap-1 text-destructive text-sm">
            Error saving
          </span>
        )
      default:
        if (isDirty) {
          return (
            <span className="flex items-center gap-1 text-amber-600 text-sm">
              <Clock className="h-3 w-3" />
              Unsaved changes
            </span>
          )
        }
        return null
    }
  }

  return (
    <header className="sticky top-0 z-50 bg-background border-b">
      <div className="flex items-center justify-between px-4 py-3">
        {/* Left: Back button and title */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Building2 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="font-semibold text-lg">
                {isNew ? `New ${getBuildingTypeLabel(buildingType)} Building` : buildingName || 'Edit Building'}
              </h1>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                {blockId && (
                  <Badge variant="outline" className="text-xs">
                    Block: {blockId.slice(0, 8)}...
                  </Badge>
                )}
                {getSaveStatusDisplay()}
              </div>
            </div>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-3">
          {/* Completion Badge */}
          <div className="hidden sm:flex items-center gap-2">
            <Progress value={completionPercentage} className="w-24 h-2" />
            <span className="text-sm text-muted-foreground">{completionPercentage}%</span>
          </div>

          {/* Preview Button */}
          {!isNew && onPreview && (
            <Button variant="outline" size="sm" onClick={onPreview}>
              <Eye className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Preview</span>
            </Button>
          )}

          {/* Delete Button */}
          {!isNew && onDelete && (
            <Button variant="outline" size="sm" onClick={onDelete} className="text-destructive hover:text-destructive">
              <Trash2 className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Delete</span>
            </Button>
          )}

          {/* Save Button */}
          <Button onClick={onSave} disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                {isNew ? 'Create Building' : 'Save Changes'}
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Mobile completion bar */}
      <div className="sm:hidden px-4 pb-2">
        <div className="flex items-center gap-2">
          <Progress value={completionPercentage} className="flex-1 h-1.5" />
          <span className="text-xs text-muted-foreground">{completionPercentage}%</span>
        </div>
      </div>
    </header>
  )
}
