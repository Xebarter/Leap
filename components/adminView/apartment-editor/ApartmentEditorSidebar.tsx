'use client'

import { cn } from '@/lib/utils'
import { Check, AlertCircle } from 'lucide-react'
import { ApartmentEditorSection, ApartmentFormData, ApartmentValidationErrors } from './types'

interface ApartmentEditorSidebarProps {
  sections: ApartmentEditorSection[]
  activeSection: string
  formData: ApartmentFormData
  errors: ApartmentValidationErrors
  onSectionChange: (sectionId: string) => void
}

export function ApartmentEditorSidebar({
  sections,
  activeSection,
  formData,
  errors,
  onSectionChange,
}: ApartmentEditorSidebarProps) {
  return (
    <aside className="hidden lg:block w-64 shrink-0 border-r bg-muted/30">
      <nav className="sticky top-16 p-4 space-y-1">
        <h2 className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Apartment Setup
        </h2>
        
        {sections.map((section, index) => {
          const isActive = activeSection === section.id
          const isComplete = section.isComplete(formData)
          const hasErrors = section.hasErrors(errors)
          const Icon = section.icon
          
          return (
            <button
              key={section.id}
              onClick={() => onSectionChange(section.id)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors",
                isActive 
                  ? "bg-primary text-primary-foreground" 
                  : "hover:bg-muted text-foreground"
              )}
            >
              {/* Step Number / Status Icon */}
              <div className={cn(
                "flex items-center justify-center w-8 h-8 rounded-full shrink-0 text-sm font-medium",
                isActive 
                  ? "bg-primary-foreground/20 text-primary-foreground" 
                  : hasErrors
                    ? "bg-destructive/10 text-destructive"
                    : isComplete 
                      ? "bg-green-100 text-green-600" 
                      : "bg-muted text-muted-foreground"
              )}>
                {hasErrors ? (
                  <AlertCircle className="h-4 w-4" />
                ) : isComplete ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <span>{index + 1}</span>
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className={cn(
                  "text-sm font-medium truncate",
                  isActive ? "text-primary-foreground" : ""
                )}>
                  {section.title}
                </div>
                <div className={cn(
                  "text-xs truncate",
                  isActive 
                    ? "text-primary-foreground/70" 
                    : "text-muted-foreground"
                )}>
                  {section.description}
                </div>
              </div>
            </button>
          )
        })}
      </nav>
    </aside>
  )
}

// Mobile section tabs
export function ApartmentEditorMobileTabs({
  sections,
  activeSection,
  formData,
  errors,
  onSectionChange,
}: ApartmentEditorSidebarProps) {
  return (
    <div className="lg:hidden sticky top-[65px] z-40 bg-background border-b overflow-x-auto">
      <div className="flex p-2 gap-1 min-w-max">
        {sections.map((section, index) => {
          const isActive = activeSection === section.id
          const isComplete = section.isComplete(formData)
          const hasErrors = section.hasErrors(errors)
          const Icon = section.icon
          
          return (
            <button
              key={section.id}
              onClick={() => onSectionChange(section.id)}
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap",
                isActive 
                  ? "bg-primary text-primary-foreground" 
                  : "hover:bg-muted text-muted-foreground"
              )}
            >
              {hasErrors ? (
                <AlertCircle className="h-4 w-4 text-destructive" />
              ) : isComplete ? (
                <Check className="h-4 w-4 text-green-600" />
              ) : (
                <span className="w-5 h-5 rounded-full bg-muted flex items-center justify-center text-xs">
                  {index + 1}
                </span>
              )}
              {section.title}
            </button>
          )
        })}
      </div>
    </div>
  )
}
