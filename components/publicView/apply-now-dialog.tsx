"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"
import { 
  FileText, 
  CheckCircle2, 
  User, 
  Home,
  MapPin,
  Info,
  LogIn,
  UserPlus,
  ArrowRight,
  Sparkles
} from "lucide-react"
import { ApplicationForm } from "./application-form"
import { TwoStepAuthWrapper } from "./two-step-auth-wrapper"

interface ApplyNowDialogProps {
  propertyId: string
  propertyTitle: string
  propertyLocation: string
  triggerButton?: React.ReactNode
}

export function ApplyNowDialog({
  propertyId,
  propertyTitle,
  propertyLocation,
  triggerButton,
}: ApplyNowDialogProps) {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [applicationNumber, setApplicationNumber] = useState("")
  
  // File states
  const [nationalIdFile, setNationalIdFile] = useState<File | null>(null)
  const [incomeProofFile, setIncomeProofFile] = useState<File | null>(null)
  const [uploadProgress, setUploadProgress] = useState({ nationalId: 0, incomeProof: 0 })
  
  const router = useRouter()
  const { toast } = useToast()

  // Handle successful authentication
  const handleAuthSuccess = async (user: any) => {
    setCurrentUser(user)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {triggerButton || (
          <Button size="lg" variant="outline" className="gap-2">
            <FileText className="w-4 h-4" />
            Apply Now
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="sm:max-w-[700px] p-0 gap-0 overflow-hidden max-h-[90vh] overflow-y-auto">
        {/* Hidden title for accessibility - always present */}
        <DialogHeader className="sr-only">
          <DialogTitle>
            {isSuccess ? "Application Submitted" : "Submit Your Application"}
          </DialogTitle>
          <DialogDescription>
            {isSuccess 
              ? "Your rental application has been successfully submitted" 
              : "Apply for this property by completing the application form"}
          </DialogDescription>
        </DialogHeader>
        
        {isSuccess ? (
          <SuccessState 
            applicationNumber={applicationNumber}
            propertyTitle={propertyTitle}
          />
        ) : (
          <TwoStepAuthWrapper
            open={open}
            onOpenChange={setOpen}
            authTitle="Create Your Account to Apply"
            authDescription="Join thousands of tenants finding their perfect home"
            contentTitle="Submit Your Application"
            authBadge={
              <Badge variant="secondary" className="gap-1">
                <Sparkles className="w-3 h-3" />
                Secure Application
              </Badge>
            }
            onAuthSuccess={handleAuthSuccess}
          >
            <ApplicationForm
              propertyId={propertyId}
              propertyTitle={propertyTitle}
              propertyLocation={propertyLocation}
              currentUser={currentUser}
              isLoading={isLoading}
              setIsLoading={setIsLoading}
              setIsSuccess={setIsSuccess}
              setApplicationNumber={setApplicationNumber}
              nationalIdFile={nationalIdFile}
              setNationalIdFile={setNationalIdFile}
              incomeProofFile={incomeProofFile}
              setIncomeProofFile={setIncomeProofFile}
              uploadProgress={uploadProgress}
              setUploadProgress={setUploadProgress}
              onClose={() => setOpen(false)}
              toast={toast}
              router={router}
            />
          </TwoStepAuthWrapper>
        )}
      </DialogContent>
    </Dialog>
  )
}

function SuccessState({ applicationNumber, propertyTitle }: any) {
  return (
    <>
      <div className="p-8 text-center space-y-6">
        <div className="mx-auto w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center">
          <CheckCircle2 className="w-8 h-8 text-green-500" />
        </div>
        
        <div className="space-y-2">
          <h3 className="text-2xl font-bold">Application Submitted!</h3>
          <p className="text-muted-foreground">
            Your rental application has been successfully submitted
          </p>
        </div>

      <div className="bg-muted/50 rounded-lg p-4 space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Application Number</span>
          <Badge variant="outline" className="font-mono text-base">
            {applicationNumber}
          </Badge>
        </div>
        <Separator />
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Property</span>
          <span className="font-medium text-right">{propertyTitle}</span>
        </div>
      </div>

      <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="flex items-start gap-2">
          <Info className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-left">
            <p className="font-medium text-blue-900 dark:text-blue-100 mb-1">What happens next?</p>
            <ul className="space-y-1 text-blue-700 dark:text-blue-300 text-xs">
              <li>• Our team will review your application within 24-48 hours</li>
              <li>• You'll receive an email with updates on your application status</li>
              <li>• Track your application in your tenant dashboard</li>
            </ul>
          </div>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        Redirecting to your dashboard...
      </p>
      </div>
    </>
  )
}
