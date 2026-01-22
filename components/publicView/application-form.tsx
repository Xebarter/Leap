"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
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
  AlertCircle
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

  const [step, setStep] = useState(1)
  const totalSteps = 3

  const handleFileChange = (file: File | null, type: 'nationalId' | 'incomeProof') => {
    // Validate file size (10MB max)
    if (file && file.size > 10 * 1024 * 1024) {
      toast.error("File too large", {
        description: "Please upload a file smaller than 10MB"
      })
      return
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf']
    if (file && !allowedTypes.includes(file.type)) {
      toast.error("Invalid file type", {
        description: "Please upload a JPG, PNG, or PDF file"
      })
      return
    }

    if (type === 'nationalId') {
      setNationalIdFile(file)
    } else {
      setIncomeProofFile(file)
    }
  }

  const uploadFile = async (file: File, path: string, type: 'nationalId' | 'incomeProof') => {
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
      const error = await response.json()
      console.error(`Error uploading ${type}:`, error)
      throw new Error(error.error || 'Upload failed')
    }

    const result = await response.json()

    return {
      url: result.url,
      filename: file.name
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    
    if (!currentUser) {
      toast.error("Please sign in to submit application")
      return
    }

    if (!nationalIdFile || !incomeProofFile) {
      toast.error("Required documents missing", {
        description: "Please upload both National ID/Passport and Proof of Income"
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
      toast.info("Uploading documents...")
      
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

      toast.success("Application submitted successfully!")

      // Redirect after 3 seconds
      setTimeout(() => {
        router.push("/tenant")
        router.refresh()
      }, 3000)

    } catch (error: any) {
      console.error("Error submitting application:", error)
      toast.error("Failed to submit application", {
        description: error.message
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      {/* Header */}
      <div className="bg-gradient-to-r from-primary/10 to-primary/5 p-6 border-b">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-2xl font-bold flex items-center gap-2">
              <FileText className="w-6 h-6 text-primary" />
              Apply for Rental
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              Complete your application to rent this property
            </p>
          </div>
          <div className="text-sm text-muted-foreground">
            Step {step} of {totalSteps}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-muted rounded-full h-2">
          <div 
            className="bg-primary h-2 rounded-full transition-all duration-300"
            style={{ width: `${(step / totalSteps) * 100}%` }}
          />
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        {/* Property Info */}
        <div className="bg-muted/50 rounded-lg p-4">
          <h4 className="font-semibold text-sm flex items-center gap-2 mb-2">
            <Home className="w-4 h-4 text-primary" />
            Property Details
          </h4>
          <div className="space-y-1">
            <div className="font-medium">{propertyTitle}</div>
            <div className="text-sm text-muted-foreground flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {propertyLocation}
            </div>
          </div>
        </div>

        {/* Step 1: Personal Information */}
        {step === 1 && (
          <div className="space-y-4">
            <h4 className="font-semibold flex items-center gap-2">
              <User className="w-4 h-4 text-primary" />
              Personal Information
            </h4>

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
        )}

        {/* Step 2: Employment & Move-in Details */}
        {step === 2 && (
          <div className="space-y-4">
            <h4 className="font-semibold flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-primary" />
              Employment & Move-in Details
            </h4>

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
                <Input
                  id="number_of_occupants"
                  name="number_of_occupants"
                  type="number"
                  min="1"
                  defaultValue="1"
                  required
                />
              </div>

              <div className="space-y-2 sm:col-span-2">
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
                  Reason for Moving
                </Label>
                <Textarea
                  id="reason_for_moving"
                  name="reason_for_moving"
                  placeholder="Tell us why you're looking for a new place..."
                  rows={3}
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Document Upload */}
        {step === 3 && (
          <div className="space-y-4">
            <h4 className="font-semibold flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-primary" />
              Required Documents
            </h4>

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

            {/* National ID/Passport Upload */}
            <div className="space-y-2">
              <Label>
                National ID or Passport <span className="text-destructive">*</span>
              </Label>
              <div className="border-2 border-dashed rounded-lg p-6 text-center hover:border-primary/50 transition-colors">
                {nationalIdFile ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-center gap-2 text-green-600 dark:text-green-400">
                      <FileCheck className="w-6 h-6" />
                      <span className="font-medium">{nationalIdFile.name}</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {(nationalIdFile.size / 1024 / 1024).toFixed(2)} MB
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setNationalIdFile(null)}
                    >
                      <X className="w-4 h-4 mr-1" />
                      Remove
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <Upload className="w-8 h-8 mx-auto text-muted-foreground" />
                    <div>
                      <label htmlFor="national_id" className="cursor-pointer">
                        <span className="text-primary hover:underline">Click to upload</span>
                        <span className="text-muted-foreground"> or drag and drop</span>
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
              <div className="border-2 border-dashed rounded-lg p-6 text-center hover:border-primary/50 transition-colors">
                {incomeProofFile ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-center gap-2 text-green-600 dark:text-green-400">
                      <FileCheck className="w-6 h-6" />
                      <span className="font-medium">{incomeProofFile.name}</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {(incomeProofFile.size / 1024 / 1024).toFixed(2)} MB
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setIncomeProofFile(null)}
                    >
                      <X className="w-4 h-4 mr-1" />
                      Remove
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <Upload className="w-8 h-8 mx-auto text-muted-foreground" />
                    <div>
                      <label htmlFor="income_proof" className="cursor-pointer">
                        <span className="text-primary hover:underline">Click to upload</span>
                        <span className="text-muted-foreground"> or drag and drop</span>
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
          </div>
        )}

        <Separator />

        {/* Navigation Buttons */}
        <div className="flex gap-3">
          {step > 1 && (
            <Button
              type="button"
              variant="outline"
              onClick={() => setStep(step - 1)}
              disabled={isLoading}
            >
              Previous
            </Button>
          )}
          
          {step < totalSteps ? (
            <Button
              type="button"
              onClick={() => setStep(step + 1)}
              className="ml-auto"
            >
              Next
            </Button>
          ) : (
            <Button
              type="submit"
              className="ml-auto gap-2"
              disabled={isLoading || !nationalIdFile || !incomeProofFile}
            >
              {isLoading ? (
                <>Processing...</>
              ) : (
                <>
                  <FileText className="w-4 h-4" />
                  Submit Application
                </>
              )}
            </Button>
          )}
        </div>
      </form>
    </>
  )
}
