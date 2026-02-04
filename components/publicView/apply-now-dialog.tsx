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
  ArrowRight
} from "lucide-react"
import { ApplicationForm } from "./application-form"

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
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)
  const [showAuthPrompt, setShowAuthPrompt] = useState(false)
  const [applicationNumber, setApplicationNumber] = useState("")
  
  // File states
  const [nationalIdFile, setNationalIdFile] = useState<File | null>(null)
  const [incomeProofFile, setIncomeProofFile] = useState<File | null>(null)
  const [uploadProgress, setUploadProgress] = useState({ nationalId: 0, incomeProof: 0 })
  
  const router = useRouter()
  const { toast } = useToast()

  // Check authentication
  useEffect(() => {
    const checkUser = async () => {
      setIsCheckingAuth(true)
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      setCurrentUser(user)
      setIsCheckingAuth(false)
      
      if (!user && open) {
        setShowAuthPrompt(true)
      }
    }
    checkUser()
  }, [open])

  // Save context for auth
  const saveApplicationContext = () => {
    const context = {
      propertyId,
      propertyTitle,
      propertyLocation,
      timestamp: Date.now(),
    }
    localStorage.setItem('pendingApplication', JSON.stringify(context))
  }

  const handleAuthRedirect = (type: 'login' | 'signup') => {
    saveApplicationContext()
    const returnUrl = encodeURIComponent(window.location.pathname)
    router.push(`/auth/${type === 'login' ? 'login' : 'sign-up'}?redirect=${returnUrl}&action=apply-tenant`)
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
        {showAuthPrompt ? (
          <AuthPrompt 
            propertyTitle={propertyTitle}
            propertyLocation={propertyLocation}
            onSignup={() => handleAuthRedirect('signup')}
            onLogin={() => handleAuthRedirect('login')}
            onClose={() => { setShowAuthPrompt(false); setOpen(false); }}
          />
        ) : isSuccess ? (
          <SuccessState 
            applicationNumber={applicationNumber}
            propertyTitle={propertyTitle}
          />
        ) : (
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
        )}
      </DialogContent>
    </Dialog>
  )
}

// Separate components for better organization
function AuthPrompt({ propertyTitle, propertyLocation, onSignup, onLogin, onClose }: any) {
  return (
    <>
      <DialogHeader className="sr-only">
        <DialogTitle>Sign in to Apply</DialogTitle>
        <DialogDescription>
          Create a free tenant account or sign in to submit your rental application
        </DialogDescription>
      </DialogHeader>
      <div className="p-8 space-y-6">
        <div className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
            <FileText className="w-8 h-8 text-primary" />
          </div>
          <div className="space-y-2">
            <h3 className="text-2xl font-bold">Sign in to Apply</h3>
            <p className="text-muted-foreground">
              Create a free tenant account or sign in to submit your rental application
            </p>
          </div>
        </div>

      <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg p-4 space-y-3 border border-primary/20">
        <div className="flex items-start gap-3">
          <div className="h-12 w-12 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
            <Home className="w-6 h-6 text-primary" />
          </div>
          <div className="flex-1">
            <div className="font-semibold text-lg">{propertyTitle}</div>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <MapPin className="w-3 h-3" />
              {propertyLocation}
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <p className="text-sm font-medium">Apply as a tenant to:</p>
        <ul className="space-y-2">
          <li className="flex items-center gap-2 text-sm text-muted-foreground">
            <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
            Submit your rental application
          </li>
          <li className="flex items-center gap-2 text-sm text-muted-foreground">
            <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
            Upload required documents securely
          </li>
          <li className="flex items-center gap-2 text-sm text-muted-foreground">
            <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
            Track your application status
          </li>
          <li className="flex items-center gap-2 text-sm text-muted-foreground">
            <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
            Get instant notifications
          </li>
        </ul>
      </div>

      <div className="space-y-3">
        <Button onClick={onSignup} className="w-full gap-2" size="lg">
          <UserPlus className="w-4 h-4" />
          Create Tenant Account
          <ArrowRight className="w-4 h-4 ml-auto" />
        </Button>
        <Button onClick={onLogin} variant="outline" className="w-full gap-2" size="lg">
          <LogIn className="w-4 h-4" />
          Sign In to Existing Account
        </Button>
      </div>

      <div className="text-center">
        <Button variant="ghost" onClick={onClose} className="text-sm text-muted-foreground">
          Maybe later
        </Button>
      </div>
      </div>
    </>
  )
}

function SuccessState({ applicationNumber, propertyTitle }: any) {
  return (
    <>
      <DialogHeader className="sr-only">
        <DialogTitle>Application Submitted</DialogTitle>
        <DialogDescription>
          Your rental application has been successfully submitted
        </DialogDescription>
      </DialogHeader>
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
