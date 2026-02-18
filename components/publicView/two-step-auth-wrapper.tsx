"use client"

import { useState, useEffect, ReactNode } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { 
  User, 
  Mail, 
  Lock, 
  ArrowRight, 
  CheckCircle2,
  Sparkles,
  Shield,
  Eye,
  EyeOff
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"

interface TwoStepAuthWrapperProps {
  /** The main content to show after authentication (Step 2) */
  children: ReactNode
  /** Whether the wrapper is currently open */
  open: boolean
  /** Callback when open state changes */
  onOpenChange?: (open: boolean) => void
  /** Title for the authentication step */
  authTitle?: string
  /** Description for the authentication step */
  authDescription?: string
  /** Title for the main content step */
  contentTitle: string
  /** Optional header badge for the auth step */
  authBadge?: ReactNode
  /** Optional callback when authentication succeeds */
  onAuthSuccess?: (user: any) => void
  /** Skip auth if user is already logged in */
  skipAuthIfLoggedIn?: boolean
}

export function TwoStepAuthWrapper({
  children,
  open,
  onOpenChange,
  authTitle = "Create Your Account",
  authDescription = "Quick and easy - takes less than 30 seconds",
  contentTitle,
  authBadge,
  onAuthSuccess,
  skipAuthIfLoggedIn = true,
}: TwoStepAuthWrapperProps) {
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)
  const [currentStep, setCurrentStep] = useState<1 | 2>(1)
  const [isAuthLoading, setIsAuthLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  
  // Form state
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  
  // Validation state
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})

  // Check authentication status
  useEffect(() => {
    const checkAuth = async () => {
      if (!open) return
      
      setIsCheckingAuth(true)
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      setCurrentUser(user)
      
      if (user && skipAuthIfLoggedIn) {
        // User is already logged in, skip to step 2
        setCurrentStep(2)
        // Call the success callback for already logged in users
        if (onAuthSuccess) {
          onAuthSuccess(user)
        }
      } else if (!user) {
        // User not logged in, show step 1
        setCurrentStep(1)
      }
      
      setIsCheckingAuth(false)
    }
    
    checkAuth()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, skipAuthIfLoggedIn])

  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      setCurrentStep(1)
      setFullName("")
      setEmail("")
      setPassword("")
      setConfirmPassword("")
      setValidationErrors({})
      setShowPassword(false)
      setShowConfirmPassword(false)
    }
  }, [open])

  // Validate form fields
  const validateField = (name: string, value: string): string | null => {
    switch (name) {
      case "fullName":
        if (!value.trim()) return "Full name is required"
        if (value.trim().length < 2) return "Name must be at least 2 characters"
        if (!/^[a-zA-Z\s]+$/.test(value)) return "Name can only contain letters and spaces"
        return null
        
      case "email":
        if (!value.trim()) return "Email is required"
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return "Please enter a valid email"
        return null
        
      case "password":
        if (!value) return "Password is required"
        if (value.length < 6) return "Password must be at least 6 characters"
        if (!/(?=.*[a-z])/.test(value)) return "Password must contain a lowercase letter"
        if (!/(?=.*[0-9])/.test(value)) return "Password must contain a number"
        return null
        
      case "confirmPassword":
        if (!value) return "Please confirm your password"
        if (value !== password) return "Passwords do not match"
        return null
        
      default:
        return null
    }
  }

  // Handle field blur validation
  const handleFieldBlur = (name: string, value: string) => {
    const error = validateField(name, value)
    setValidationErrors(prev => ({
      ...prev,
      [name]: error || ""
    }))
  }

  // Handle authentication
  const handleAuthentication = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate all fields
    const errors: Record<string, string> = {}
    const nameError = validateField("fullName", fullName)
    const emailError = validateField("email", email)
    const passwordError = validateField("password", password)
    const confirmError = validateField("confirmPassword", confirmPassword)
    
    if (nameError) errors.fullName = nameError
    if (emailError) errors.email = emailError
    if (passwordError) errors.password = passwordError
    if (confirmError) errors.confirmPassword = confirmError
    
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors)
      return
    }
    
    setIsAuthLoading(true)
    
    try {
      const supabase = createClient()
      
      // Sign up the user
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password: password,
        options: {
          data: {
            full_name: fullName.trim(),
            user_type: 'tenant',
          },
        },
      })
      
      if (error) throw error
      
      // Get the current user
      const { data: { user } } = await supabase.auth.getUser()
      setCurrentUser(user)
      
      toast.success("Account created successfully! ✨", {
        description: "Continue to complete your request"
      })
      
      // Call success callback if provided
      if (onAuthSuccess && user) {
        onAuthSuccess(user)
      }
      
      // Move to step 2
      setCurrentStep(2)
      
    } catch (error: any) {
      console.error("Auth error:", error)
      
      if (error.message?.includes("already registered")) {
        toast.error("Email already registered", {
          description: "Please use a different email or sign in instead"
        })
      } else {
        toast.error("Account creation failed", {
          description: error.message || "Please try again"
        })
      }
    } finally {
      setIsAuthLoading(false)
    }
  }

  // Calculate form completion
  const getFormCompletion = () => {
    let completed = 0
    if (fullName.trim()) completed += 25
    if (email.trim() && !validationErrors.email) completed += 25
    if (password && !validationErrors.password) completed += 25
    if (confirmPassword && !validationErrors.confirmPassword) completed += 25
    return completed
  }

  const formCompletion = getFormCompletion()
  const isFormValid = formCompletion === 100 && Object.values(validationErrors).every(e => !e)

  // Loading state
  if (isCheckingAuth) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      {currentStep === 1 ? (
        // Step 1: Authentication
        <div className="animate-in fade-in slide-in-from-right-4 duration-500">
          {/* Header */}
          <div className="relative bg-gradient-to-br from-primary/10 via-primary/5 to-background p-6 pb-8 border-b">
            {authBadge && (
              <div className="absolute top-4 right-4">
                {authBadge}
              </div>
            )}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="w-5 h-5 text-primary" />
                </div>
                <Badge variant="secondary" className="gap-1">
                  <Sparkles className="w-3 h-3" />
                  Step 1 of 2
                </Badge>
              </div>
              <div>
                <h2 className="text-2xl font-bold">{authTitle}</h2>
                <p className="text-sm text-muted-foreground mt-1">{authDescription}</p>
              </div>
            </div>
            
            {/* Progress bar */}
            <div className="mt-6 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Profile completion</span>
                <span className="font-medium text-primary">{formCompletion}%</span>
              </div>
              <Progress value={formCompletion} className="h-2" />
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleAuthentication} className="p-6 space-y-5">
            {/* Full Name */}
            <div className="space-y-2">
              <Label htmlFor="full_name" className="text-sm font-medium flex items-center gap-2">
                <User className="w-4 h-4 text-primary" />
                Full Name <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <Input
                  id="full_name"
                  type="text"
                  placeholder="John Doe"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  onBlur={(e) => handleFieldBlur("fullName", e.target.value)}
                  className={validationErrors.fullName ? "border-destructive focus-visible:ring-destructive" : ""}
                  required
                />
                {fullName && !validationErrors.fullName && (
                  <CheckCircle2 className="absolute right-3 top-3 h-4 w-4 text-green-500" />
                )}
              </div>
              {validationErrors.fullName && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <span className="w-1 h-1 rounded-full bg-destructive" />
                  {validationErrors.fullName}
                </p>
              )}
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium flex items-center gap-2">
                <Mail className="w-4 h-4 text-primary" />
                Email Address <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <Input
                  id="email"
                  type="email"
                  placeholder="john@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onBlur={(e) => handleFieldBlur("email", e.target.value)}
                  className={validationErrors.email ? "border-destructive focus-visible:ring-destructive" : ""}
                  required
                />
                {email && !validationErrors.email && (
                  <CheckCircle2 className="absolute right-3 top-3 h-4 w-4 text-green-500" />
                )}
              </div>
              {validationErrors.email && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <span className="w-1 h-1 rounded-full bg-destructive" />
                  {validationErrors.email}
                </p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium flex items-center gap-2">
                <Lock className="w-4 h-4 text-primary" />
                Password <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="At least 6 characters with a number"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onBlur={(e) => handleFieldBlur("password", e.target.value)}
                  className={validationErrors.password ? "border-destructive focus-visible:ring-destructive pr-10" : "pr-10"}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {validationErrors.password && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <span className="w-1 h-1 rounded-full bg-destructive" />
                  {validationErrors.password}
                </p>
              )}
            </div>

            {/* Confirm Password */}
            <div className="space-y-2">
              <Label htmlFor="confirm_password" className="text-sm font-medium flex items-center gap-2">
                <Shield className="w-4 h-4 text-primary" />
                Confirm Password <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <Input
                  id="confirm_password"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Re-enter your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  onBlur={(e) => handleFieldBlur("confirmPassword", e.target.value)}
                  className={validationErrors.confirmPassword ? "border-destructive focus-visible:ring-destructive pr-10" : "pr-10"}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-3 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
                {confirmPassword && password === confirmPassword && (
                  <CheckCircle2 className="absolute right-10 top-3 h-4 w-4 text-green-500" />
                )}
              </div>
              {validationErrors.confirmPassword && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <span className="w-1 h-1 rounded-full bg-destructive" />
                  {validationErrors.confirmPassword}
                </p>
              )}
            </div>

            <Separator className="my-6" />

            {/* Info box */}
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Shield className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <div className="text-sm space-y-1">
                  <p className="font-medium text-foreground">Your data is secure</p>
                  <p className="text-muted-foreground text-xs">
                    We use industry-standard encryption to protect your information. You can delete your account anytime.
                  </p>
                </div>
              </div>
            </div>

            {/* Submit button */}
            <Button
              type="submit"
              className="w-full gap-2 h-12 text-base font-semibold shadow-lg hover:shadow-xl transition-all group"
              disabled={isAuthLoading || !isFormValid}
            >
              {isAuthLoading ? (
                <>
                  <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  Creating Account...
                </>
              ) : (
                <>
                  <span>Create Account & Continue</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </Button>

            {/* Terms */}
            <p className="text-xs text-center text-muted-foreground">
              By creating an account, you agree to our{" "}
              <a href="/terms" target="_blank" className="underline text-primary hover:text-primary/80">
                Terms of Service
              </a>{" "}
              and{" "}
              <a href="/privacy" target="_blank" className="underline text-primary hover:text-primary/80">
                Privacy Policy
              </a>
            </p>
          </form>
        </div>
      ) : (
        // Step 2: Main Content
        <div className="animate-in fade-in slide-in-from-right-4 duration-500 flex flex-col h-full overflow-hidden">
          {children}
        </div>
      )}
    </>
  )
}
