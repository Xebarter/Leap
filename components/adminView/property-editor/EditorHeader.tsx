'use client'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  ArrowLeft, Save, Loader2, Check, AlertCircle, Clock,
  MoreHorizontal, Trash2, Eye, Star
} from 'lucide-react'
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator,
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu'
import { SaveStatus } from './types'
import { formatDistanceToNow } from 'date-fns'

interface EditorHeaderProps {
  title: string
  propertyCode?: string
  isNew: boolean
  isDirty: boolean
  saveStatus: SaveStatus
  completionPercentage: number
  onSave: () => void
  onBack: () => void
  onDelete?: () => void
  onPreview?: () => void
  onToggleFeatured?: () => void
  isFeatured?: boolean
}

export function EditorHeader({
  title,
  propertyCode,
  isNew,
  isDirty,
  saveStatus,
  completionPercentage,
  onSave,
  onBack,
  onDelete,
  onPreview,
  onToggleFeatured,
  isFeatured,
}: EditorHeaderProps) {
  const getSaveStatusDisplay = () => {
    switch (saveStatus.status) {
      case 'saving':
        return (
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Saving...</span>
          </div>
        )
      case 'saved':
        return (
          <div className="flex items-center gap-2 text-green-600 text-sm">
            <Check className="h-4 w-4" />
            <span>Saved {saveStatus.lastSaved && formatDistanceToNow(saveStatus.lastSaved, { addSuffix: true })}</span>
          </div>
        )
      case 'error':
        return (
          <div className="flex items-center gap-2 text-destructive text-sm">
            <AlertCircle className="h-4 w-4" />
            <span>Save failed</span>
          </div>
        )
      default:
        if (isDirty) {
          return (
            <div className="flex items-center gap-2 text-amber-600 text-sm">
              <Clock className="h-4 w-4" />
              <span>Unsaved changes</span>
            </div>
          )
        }
        return null
    }
  }

  return (
    <header className="sticky top-0 z-50 bg-background border-b">
      <div className="flex items-center justify-between h-16 px-4 md:px-6">
        {/* Left: Back button and title */}
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onBack}
            className="shrink-0"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-semibold truncate">
                {isNew ? 'New Property' : title || 'Untitled Property'}
              </h1>
              {isFeatured && (
                <Badge variant="secondary" className="bg-amber-100 text-amber-700 shrink-0">
                  <Star className="h-3 w-3 mr-1 fill-amber-500" />
                  Featured
                </Badge>
              )}
            </div>
            {propertyCode && (
              <span className="text-xs text-muted-foreground font-mono">
                ID: {propertyCode}
              </span>
            )}
          </div>
        </div>

        {/* Center: Save status */}
        <div className="hidden md:flex items-center gap-4">
          {getSaveStatusDisplay()}
          
          {/* Completion indicator */}
          <div className="flex items-center gap-2">
            <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${completionPercentage}%` }}
              />
            </div>
            <span className="text-xs text-muted-foreground w-8">
              {completionPercentage}%
            </span>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          <Button
            onClick={onSave}
            disabled={saveStatus.status === 'saving'}
            className="gap-2"
          >
            {saveStatus.status === 'saving' ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            <span className="hidden sm:inline">
              {isNew ? 'Create' : 'Save'}
            </span>
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {onPreview && (
                <DropdownMenuItem onClick={onPreview}>
                  <Eye className="h-4 w-4 mr-2" />
                  Preview
                </DropdownMenuItem>
              )}
              {onToggleFeatured && (
                <DropdownMenuItem onClick={onToggleFeatured}>
                  <Star className={`h-4 w-4 mr-2 ${isFeatured ? 'fill-amber-500 text-amber-500' : ''}`} />
                  {isFeatured ? 'Remove from Featured' : 'Mark as Featured'}
                </DropdownMenuItem>
              )}
              {(onPreview || onToggleFeatured) && onDelete && <DropdownMenuSeparator />}
              {onDelete && (
                <DropdownMenuItem 
                  onClick={onDelete}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Property
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Mobile: Save status bar */}
      <div className="md:hidden px-4 pb-3 flex items-center justify-between">
        {getSaveStatusDisplay()}
        <div className="flex items-center gap-2">
          <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
          <span className="text-xs text-muted-foreground">
            {completionPercentage}%
          </span>
        </div>
      </div>
    </header>
  )
}
