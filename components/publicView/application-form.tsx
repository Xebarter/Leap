"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { 
  FileText, 
  Upload, 
  User, 
  Phone, 
  Mail, 
  Home,
  MapPin,
  DollarSign,
  Calendar,
  Info,
  X,
  FileCheck,
  AlertCircle,
  Briefcase,
  Users2,
  CheckCircle2
} from "lucide-react"

export function ApplicationForm({
  propertyId,
  propertyTitle,
  propertyLocation,
  currentUser,
  isLoading,
  setIsLoading,
  setIsSuccess,
  setApplicationNumber,
  nationalIdFile,
  setNationalIdFile,
  incomeProofFile,
  setIncomeProofFile,
  uploadProgress,
  setUploadProgress,
  onClose,
  toast,
  router
}: any) {

  const [formValidation, setFormValidation] = useState({
    personalInfo: false,
    employmentInfo: false,
    documents: false
  })

  // Track form completion for better UX - only required fields count
  const updateValidation = () => {
    const form = document.querySelector('form') as HTMLFormElement
    if (!form) return

    const formData = new FormData(form)
    
    setFormValidation({
      personalInfo: !!(
        formData.get('full_name')?.toString().trim() && 
        formData.get('phone_number')?.toString().trim() && 
        formData.get('email')?.toString().trim() &&
        formData.get('current_address')?.toString().trim()
      ),
      employmentInfo: !!(
        formData.get('employment_status') &&
        formData.get('monthly_income')?.toString().trim() &&
        formData.get('preferred_move_in_date')
      ),
      documents: !!(nationalIdFile && incomeProofFile)
    })
  }

  const handleFileChange = (file: File | null, type: 'nationalId' | 'incomeProof') => {
    // Validate file size (10MB max)
    if (file && file.size > 10 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload a file smaller than 10MB",
        variant: "destructive"
      })
      return
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf']
    if (file && !allowedTypes.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Please upload a JPG, PNG, or PDF file",
        variant: "destructive"
      })
      return
    }

    if (type === 'nationalId') {
      setNationalIdFile(file)
    } else {
      setIncomeProofFile(file)
    }
    
    // Update validation after file change
    setTimeout(updateValidation, 100)
  }

  const uploadFile = async (file: File, path: string, type: 'nationalId' | 'incomeProof') => {
    try {
      // Upload via API route (uses service role to bypass RLS)
      const formData = new FormData()
      formData.append('file', file)
      formData.append('filePath', path)
      formData.append('bucket', 'tenant-applications')

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        let errorMessage = 'Upload failed'
        try {
          const error = await response.json()
          console.error(`Error uploading ${type}:`, error)
          errorMessage = error.error || error.details || `Upload failed with status ${response.status}`
        } catch (parseError) {
          console.error(`Failed to parse error response for ${type}:`, parseError)
          errorMessage = `Upload failed with status ${response.status}`
        }
        throw new Error(errorMessage)
      }

      const result = await response.json()

      if (!result.url) {
        throw new Error('Upload succeeded but no URL was returned')
      }

      return {
        url: result.url,
        filename: file.name
      }
    } catch (error: any) {
      console.error(`Error in uploadFile for ${type}:`, error)
      throw new Error(error.message || `Failed to upload ${type === 'nationalId' ? 'National ID' : 'Proof of Income'}`)
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    
    if (!currentUser) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to submit application",
        variant: "destructive"
      })
      return
    }

    if (!nationalIdFile || !incomeProofFile) {
      toast({
        title: "Required documents missing",
        description: "Please upload both National ID/Passport and Proof of Income",
        variant: "destructive"
      })
      return
    }
    
    setIsLoading(true)

    try {
      const formData = new FormData(e.currentTarget)
      const supabase = createClient()

      // Generate unique filenames
      const timestamp = Date.now()
      const nationalIdPath = `${currentUser.id}/${timestamp}_national_id_${nationalIdFile.name}`
      const incomeProofPath = `${currentUser.id}/${timestamp}_income_proof_${incomeProofFile.name}`

      // Upload files
      toast({
        title: "Uploading documents...",
        description: "Please wait while we upload your files"
      })
      
      const [nationalIdUpload, incomeProofUpload] = await Promise.all([
        uploadFile(nationalIdFile, nationalIdPath, 'nationalId'),
        uploadFile(incomeProofFile, incomeProofPath, 'incomeProof')
      ])

      // Prepare application data
      const applicationData = {
        property_id: propertyId,
        applicant_id: currentUser.id,
        full_name: formData.get("full_name") as string,
        phone_number: formData.get("phone_number") as string,
        email: formData.get("email") as string,
        current_address: formData.get("current_address") as string || null,
        employment_status: formData.get("employment_status") as string || null,
        monthly_income: formData.get("monthly_income") ? parseInt(formData.get("monthly_income") as string) * 100 : null,
        reason_for_moving: formData.get("reason_for_moving") as string || null,
        preferred_move_in_date: formData.get("preferred_move_in_date") as string || null,
        number_of_occupants: formData.get("number_of_occupants") ? parseInt(formData.get("number_of_occupants") as string) : 1,
        has_pets: formData.get("has_pets") === "yes",
        emergency_contact_name: formData.get("emergency_contact_name") as string || null,
        emergency_contact_phone: formData.get("emergency_contact_phone") as string || null,
        applicant_notes: formData.get("applicant_notes") as string || null,
        national_id_url: nationalIdUpload.url,
        national_id_filename: nationalIdUpload.filename,
        proof_of_income_url: incomeProofUpload.url,
        proof_of_income_filename: incomeProofUpload.filename,
        status: "pending"
      }

      // Insert application
      const { data, error } = await supabase
        .from("tenant_applications")
        .insert(applicationData)
        .select()
        .single()

      if (error) {
        throw error
      }

      // Success!
      setApplicationNumber(data.application_number)
      setIsSuccess(true)

      toast({
        title: "Application submitted successfully!",
        description: "We'll review your application and get back to you soon"
      })

      // Redirect after 3 seconds
      setTimeout(() => {
        router.push("/tenant")
        router.refresh()
      }, 3000)

    } catch (error: any) {
      console.error("Error submitting application:", error)
      
      // Provide a meaningful error message
      let errorMessage = "An unexpected error occurred. Please try again."
      
      if (error?.message) {
        errorMessage = error.message
      } else if (typeof error === 'string') {
        errorMessage = error
      } else if (error?.error) {
        errorMessage = error.error
      }
      
      toast({
        title: "Failed to submit application",
        description: errorMessage,
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const completedSections = Object.values(formValidation).filter(Boolean).length
  const totalSections = 3
  const progressPercentage = (completedSections / totalSections) * 100

  return (
    <>
      <DialogHeader className="sr-only">
        <DialogTitle>Apply for Rental</DialogTitle>
        <DialogDescription>
          Complete your application to rent this property
        </DialogDescription>
      </DialogHeader>
      
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background border-b">
        <div className="bg-gradient-to-r from-primary/10 to-primary/5 p-4 sm:p-6">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h3 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
                <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                Apply for Rental
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                Fill out all sections below to submit your application
              </p>
            </div>
            <Badge variant="outline" className="text-xs">
              {completedSections}/{totalSections} Complete
            </Badge>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="w-full bg-muted rounded-full h-2">
              <div 
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
            <div className="flex gap-2 text-xs">
              <span className={`flex items-center gap-1 ${formValidation.personalInfo ? 'text-green-600' : 'text-muted-foreground'}`}>
                {formValidation.personalInfo ? <CheckCircle2 className="w-3 h-3" /> : <span className="w-3 h-3 rounded-full border-2 border-current" />}
                Personal
              </span>
              <span className={`flex items-center gap-1 ${formValidation.employmentInfo ? 'text-green-600' : 'text-muted-foreground'}`}>
                {formValidation.employmentInfo ? <CheckCircle2 className="w-3 h-3" /> : <span className="w-3 h-3 rounded-full border-2 border-current" />}
                Employment
              </span>
              <span className={`flex items-center gap-1 ${formValidation.documents ? 'text-green-600' : 'text-muted-foreground'}`}>
                {formValidation.documents ? <CheckCircle2 className="w-3 h-3" /> : <span className="w-3 h-3 rounded-full border-2 border-current" />}
                Documents
              </span>
            </div>
          </div>
        </div>
      </div>

      <form id="application-form" onSubmit={handleSubmit} onChange={updateValidation} className="p-4 sm:p-6 space-y-6 max-h-[70vh] overflow-y-auto">
        {/* Property Info */}
        <div className="bg-gradient-to-br from-primary/5 to-primary/10 rounded-lg p-4 border border-primary/20">
          <h4 className="font-semibold text-sm flex items-center gap-2 mb-2">
            <Home className="w-4 h-4 text-primary" />
            Property You're Applying For
          </h4>
          <div className="space-y-1">
            <div className="font-medium">{propertyTitle}</div>
            <div className="text-sm text-muted-foreground flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {propertyLocation}
            </div>
          </div>
        </div>

        {/* Section 1: Personal Information */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold flex items-center gap-2 text-lg">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="w-4 h-4 text-primary" />
              </div>
              Personal Information
            </h4>
            {formValidation.personalInfo && (
              <Badge variant="default" className="bg-green-600">
                <CheckCircle2 className="w-3 h-3 mr-1" />
                Complete
              </Badge>
            )}
          </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="full_name">
                  Full Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="full_name"
                  name="full_name"
                  defaultValue={currentUser?.user_metadata?.full_name}
                  placeholder="John Doe"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone_number">
                  Phone Number <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="phone_number"
                    name="phone_number"
                    type="tel"
                    placeholder="+256 700 000 000"
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">
                  Email Address <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    defaultValue={currentUser?.email}
                    placeholder="john@example.com"
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="current_address">
                  Current Address <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="current_address"
                  name="current_address"
                  placeholder="123 Main St, Kampala, Uganda"
                  required
                />
              </div>
            </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="emergency_contact_name">
                Emergency Contact Name
              </Label>
              <Input
                id="emergency_contact_name"
                name="emergency_contact_name"
                placeholder="Jane Doe"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="emergency_contact_phone">
                Emergency Contact Phone
              </Label>
              <Input
                id="emergency_contact_phone"
                name="emergency_contact_phone"
                type="tel"
                placeholder="+256 700 000 000"
              />
            </div>
          </div>
        </div>

        <Separator className="my-6" />

        {/* Section 2: Employment & Move-in Details */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold flex items-center gap-2 text-lg">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <Briefcase className="w-4 h-4 text-primary" />
              </div>
              Employment & Move-in Details
            </h4>
            {formValidation.employmentInfo && (
              <Badge variant="default" className="bg-green-600">
                <CheckCircle2 className="w-3 h-3 mr-1" />
                Complete
              </Badge>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="employment_status">
                Employment Status <span className="text-destructive">*</span>
              </Label>
              <select
                id="employment_status"
                name="employment_status"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                required
              >
                <option value="">Select status</option>
                <option value="employed">Employed</option>
                <option value="self_employed">Self Employed</option>
                <option value="student">Student</option>
                <option value="retired">Retired</option>
                <option value="unemployed">Unemployed</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="monthly_income">
                Monthly Income (UGX) <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="monthly_income"
                  name="monthly_income"
                  type="number"
                  placeholder="1000000"
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="preferred_move_in_date">
                Preferred Move-in Date <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="preferred_move_in_date"
                  name="preferred_move_in_date"
                  type="date"
                  className="pl-10"
                  min={new Date().toISOString().split('T')[0]}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="number_of_occupants">
                Number of Occupants <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <Users2 className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="number_of_occupants"
                  name="number_of_occupants"
                  type="number"
                  min="1"
                  defaultValue="1"
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="has_pets">Will you have pets?</Label>
              <select
                id="has_pets"
                name="has_pets"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="no">No</option>
                <option value="yes">Yes</option>
              </select>
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="reason_for_moving">
                Reason for Moving (Optional)
              </Label>
              <Textarea
                id="reason_for_moving"
                name="reason_for_moving"
                placeholder="Tell us why you're looking for a new place..."
                rows={2}
              />
            </div>
          </div>
        </div>

        <Separator className="my-6" />

        {/* Section 3: Document Upload */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold flex items-center gap-2 text-lg">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <FileCheck className="w-4 h-4 text-primary" />
              </div>
              Required Documents
            </h4>
            {formValidation.documents && (
              <Badge variant="default" className="bg-green-600">
                <CheckCircle2 className="w-3 h-3 mr-1" />
                Complete
              </Badge>
            )}
          </div>

          <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 mb-4">
            <div className="flex items-start gap-2">
              <Info className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
              <div className="text-xs text-blue-700 dark:text-blue-300">
                <p className="font-medium mb-1">Document Requirements:</p>
                <ul className="space-y-1">
                  <li>• Accepted formats: JPG, PNG, PDF</li>
                  <li>• Maximum file size: 10MB per document</li>
                  <li>• Documents must be clear and readable</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {/* National ID/Passport Upload */}
            <div className="space-y-2">
              <Label>
                National ID or Passport <span className="text-destructive">*</span>
              </Label>
              <div className={`border-2 border-dashed rounded-lg p-4 text-center transition-colors ${
                nationalIdFile ? 'border-green-500 bg-green-50 dark:bg-green-950/20' : 'hover:border-primary/50'
              }`}>
                {nationalIdFile ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-center gap-2 text-green-600 dark:text-green-400">
                      <FileCheck className="w-5 h-5" />
                      <span className="font-medium text-sm truncate">{nationalIdFile.name}</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {(nationalIdFile.size / 1024 / 1024).toFixed(2)} MB
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setNationalIdFile(null)}
                      className="mt-2"
                    >
                      <X className="w-3 h-3 mr-1" />
                      Remove
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Upload className="w-6 h-6 mx-auto text-muted-foreground" />
                    <div>
                      <label htmlFor="national_id" className="cursor-pointer">
                        <span className="text-primary hover:underline text-sm">Click to upload</span>
                      </label>
                      <input
                        id="national_id"
                        type="file"
                        accept=".jpg,.jpeg,.png,.pdf"
                        className="hidden"
                        onChange={(e) => handleFileChange(e.target.files?.[0] || null, 'nationalId')}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      JPG, PNG or PDF (max 10MB)
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Proof of Income Upload */}
            <div className="space-y-2">
              <Label>
                Proof of Income <span className="text-destructive">*</span>
              </Label>
              <div className={`border-2 border-dashed rounded-lg p-4 text-center transition-colors ${
                incomeProofFile ? 'border-green-500 bg-green-50 dark:bg-green-950/20' : 'hover:border-primary/50'
              }`}>
                {incomeProofFile ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-center gap-2 text-green-600 dark:text-green-400">
                      <FileCheck className="w-5 h-5" />
                      <span className="font-medium text-sm truncate">{incomeProofFile.name}</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {(incomeProofFile.size / 1024 / 1024).toFixed(2)} MB
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setIncomeProofFile(null)}
                      className="mt-2"
                    >
                      <X className="w-3 h-3 mr-1" />
                      Remove
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Upload className="w-6 h-6 mx-auto text-muted-foreground" />
                    <div>
                      <label htmlFor="income_proof" className="cursor-pointer">
                        <span className="text-primary hover:underline text-sm">Click to upload</span>
                      </label>
                      <input
                        id="income_proof"
                        type="file"
                        accept=".jpg,.jpeg,.png,.pdf"
                        className="hidden"
                        onChange={(e) => handleFileChange(e.target.files?.[0] || null, 'incomeProof')}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Payslip, bank statement, or employment letter (max 10MB)
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Additional Notes */}
          <div className="space-y-2">
            <Label htmlFor="applicant_notes">
              Additional Information (Optional)
            </Label>
            <Textarea
              id="applicant_notes"
              name="applicant_notes"
              placeholder="Any additional information you'd like to share..."
              rows={3}
            />
          </div>

          {/* Helpful Tips */}
          <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3 mt-4">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
              <div className="text-xs text-amber-700 dark:text-amber-300">
                <p className="font-medium mb-1">Review Before Submitting:</p>
                <ul className="space-y-1">
                  <li>• Double-check all information for accuracy</li>
                  <li>• Ensure uploaded documents are clear and complete</li>
                  <li>• You'll receive a confirmation email after submission</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Sticky Footer with Submit Button - Inside Form */}
        <div className="sticky bottom-0 bg-background border-t p-4 sm:p-6 -mx-4 sm:-mx-6 -mb-6">
          <div className="flex items-center justify-between gap-4">
            <div className="text-sm text-muted-foreground hidden sm:block">
              {completedSections === totalSections ? (
                <span className="text-green-600 font-medium flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" />
                  All sections complete!
                </span>
              ) : (
                <span>
                  Complete all sections to submit
                </span>
              )}
            </div>
            
            <Button
              type="submit"
              className="gap-2 w-full sm:w-auto"
              disabled={isLoading || !nationalIdFile || !incomeProofFile}
              size="lg"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <FileText className="w-4 h-4" />
                  Submit Application
                </>
              )}
            </Button>
          </div>
        </div>
      </form>
    </>
  )
}
