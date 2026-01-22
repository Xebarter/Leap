'use client'

import { cn } from '@/lib/utils'
import { Check, AlertCircle } from 'lucide-react'
import { EditorSection, PropertyFormData, ValidationErrors } from './types'

interface EditorSidebarProps {
  sections: EditorSection[]
  activeSection: string
  formData: PropertyFormData
  errors: ValidationErrors
  onSectionChange: (sectionId: string) => void
}

export function EditorSidebar({
  sections,
  activeSection,
  formData,
  errors,
  onSectionChange,
}: EditorSidebarProps) {
  return (
    <aside className="hidden lg:block w-64 shrink-0 border-r bg-muted/30">
      <nav className="sticky top-16 p-4 space-y-1">
        <h2 className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Sections
        </h2>
        
        {sections.map((section) => {
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
              <div className={cn(
                "flex items-center justify-center w-8 h-8 rounded-full shrink-0",
                isActive 
                  ? "bg-primary-foreground/20" 
                  : hasErrors
                    ? "bg-destructive/10 text-destructive"
                    : isComplete 
                      ? "bg-green-100 text-green-600" 
                      : "bg-muted"
              )}>
                {hasErrors ? (
                  <AlertCircle className="h-4 w-4" />
                ) : isComplete ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Icon className="h-4 w-4" />
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
export function EditorMobileTabs({
  sections,
  activeSection,
  formData,
  errors,
  onSectionChange,
}: EditorSidebarProps) {
  return (
    <div className="lg:hidden sticky top-16 z-40 bg-background border-b overflow-x-auto">
      <div className="flex p-2 gap-1 min-w-max">
        {sections.map((section) => {
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
                <Icon className="h-4 w-4" />
              )}
              {section.title}
            </button>
          )
        })}
      </div>
    </div>
  )
}
