"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Card, CardContent } from "@/components/ui/card"
import { Upload, AlertCircle, CheckCircle2 } from "lucide-react"

export function DocumentUploadForm({ onSubmit }: { onSubmit?: (data: any) => void }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [formData, setFormData] = useState({
    document_type: "National ID",
    document_name: "",
    expiry_date: "",
  })

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setUploadedFile(e.dataTransfer.files[0])
      setFormData({ ...formData, document_name: e.dataTransfer.files[0].name })
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setUploadedFile(e.target.files[0])
      setFormData({ ...formData, document_name: e.target.files[0].name })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (!uploadedFile) {
        alert("Please select a file to upload")
        return
      }

      // Create form data for upload
      const uploadFormData = new FormData()
      uploadFormData.append("file", uploadedFile)
      uploadFormData.append("document_type", formData.document_type)
      uploadFormData.append("document_name", formData.document_name)
      if (formData.expiry_date) {
        uploadFormData.append("expiry_date", formData.expiry_date)
      }

      // Upload document
      const response = await fetch("/api/tenant/documents", {
        method: "POST",
        body: uploadFormData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to upload document")
      }

      // Show success message
      alert("Document uploaded successfully! It will be reviewed by an administrator.")
      
      // Call parent callback if provided
      if (onSubmit) {
        onSubmit(data.document)
      }

      // Reset form
      setUploadedFile(null)
      setFormData({
        document_type: "National ID",
        document_name: "",
        expiry_date: "",
      })
      setOpen(false)
      
      // Reload page to show new document
      window.location.reload()
    } catch (error: any) {
      console.error("Error uploading document:", error)
      alert(`Error: ${error.message || "Failed to upload document"}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Upload Documents</Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Upload Document</DialogTitle>
          <DialogDescription>
            Upload verification documents to complete your profile. All documents are securely stored.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Document Type */}
          <div className="space-y-2">
            <Label htmlFor="type">Document Type *</Label>
            <Select
              value={formData.document_type}
              onValueChange={(value) => setFormData({ ...formData, document_type: value })}
            >
              <SelectTrigger id="type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="National ID">National ID</SelectItem>
                <SelectItem value="Passport">Passport</SelectItem>
                <SelectItem value="Driving License">Driving License</SelectItem>
                <SelectItem value="Employment Letter">Employment Letter</SelectItem>
                <SelectItem value="Pay Slip">Pay Slip</SelectItem>
                <SelectItem value="Bank Statement">Bank Statement</SelectItem>
                <SelectItem value="Tenant Reference">Tenant Reference</SelectItem>
                <SelectItem value="Employer Reference">Employer Reference</SelectItem>
                <SelectItem value="Police Clearance">Police Clearance</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* File Upload */}
          <div className="space-y-2">
            <Label htmlFor="file">Document File *</Label>
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                dragActive ? "border-primary bg-primary/5" : "border-muted-foreground/30 hover:border-muted-foreground/50"
              }`}
            >
              <input
                id="file"
                type="file"
                onChange={handleFileChange}
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                className="hidden"
              />

              {uploadedFile ? (
                <div className="space-y-2">
                  <CheckCircle2 className="w-12 h-12 text-green-600 mx-auto" />
                  <p className="font-medium">{uploadedFile.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setUploadedFile(null)}
                  >
                    Change File
                  </Button>
                </div>
              ) : (
                <label htmlFor="file" className="cursor-pointer">
                  <Upload className="w-12 h-12 text-muted-foreground/40 mx-auto mb-2" />
                  <p className="font-medium">Click to upload or drag and drop</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    PDF, DOC, DOCX, JPG, PNG up to 10MB
                  </p>
                </label>
              )}
            </div>
          </div>

          {/* Expiry Date */}
          <div className="space-y-2">
            <Label htmlFor="expiry">Expiry Date (if applicable)</Label>
            <Input
              id="expiry"
              type="date"
              value={formData.expiry_date}
              onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
            />
          </div>

          {/* Info Box */}
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="pt-4">
              <div className="flex gap-3">
                <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium">Privacy & Security</p>
                  <p className="mt-1">
                    Your documents are encrypted and securely stored. Only authorized personnel will access them for verification purposes.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Buttons */}
          <div className="flex gap-3 justify-end">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !uploadedFile}>
              {loading ? "Uploading..." : "Upload Document"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
