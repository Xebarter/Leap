"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Plus } from "lucide-react"

interface ReferenceFormProps {
  onSubmit?: (data: any) => void
  editData?: any
}

export function ReferenceForm({ onSubmit, editData }: ReferenceFormProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    reference_type: editData?.reference_type || "Employer",
    reference_name: editData?.reference_name || "",
    reference_title: editData?.reference_title || "",
    reference_company: editData?.reference_company || "",
    reference_email: editData?.reference_email || "",
    reference_phone: editData?.reference_phone || "",
    reference_address: editData?.reference_address || "",
  })

  // Update form data when editData changes
  useState(() => {
    if (editData) {
      setFormData({
        reference_type: editData.reference_type || "Employer",
        reference_name: editData.reference_name || "",
        reference_title: editData.reference_title || "",
        reference_company: editData.reference_company || "",
        reference_email: editData.reference_email || "",
        reference_phone: editData.reference_phone || "",
        reference_address: editData.reference_address || "",
      })
    }
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const url = editData 
        ? "/api/tenant/references" 
        : "/api/tenant/references"
      
      const method = editData ? "PUT" : "POST"
      
      const payload = editData 
        ? { ...formData, id: editData.id }
        : formData

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to save reference")
      }

      // Show success message
      alert(editData 
        ? "Reference updated successfully!" 
        : "Reference added successfully!"
      )
      
      // Call parent callback if provided
      if (onSubmit) {
        onSubmit(data.reference)
      }

      // Reset form
      setFormData({
        reference_type: "Employer",
        reference_name: "",
        reference_title: "",
        reference_company: "",
        reference_email: "",
        reference_phone: "",
        reference_address: "",
      })
      setOpen(false)
      
      // Reload page to show updated references
      window.location.reload()
    } catch (error: any) {
      console.error("Error saving reference:", error)
      alert(`Error: ${error.message || "Failed to save reference"}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {editData ? (
          <Button variant="outline" size="sm" className="flex-1">
            <Plus className="w-3 h-3 mr-2" />
            Edit
          </Button>
        ) : (
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Add Reference
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{editData ? "Edit Reference" : "Add Reference"}</DialogTitle>
          <DialogDescription>
            {editData 
              ? "Update your reference contact information."
              : "Add a reference contact that can verify your information and background."
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Reference Type */}
          <div className="space-y-2">
            <Label htmlFor="type">Reference Type *</Label>
            <Select
              value={formData.reference_type}
              onValueChange={(value) => setFormData({ ...formData, reference_type: value })}
            >
              <SelectTrigger id="type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Employer">Employer</SelectItem>
                <SelectItem value="Previous Landlord">Previous Landlord</SelectItem>
                <SelectItem value="Personal">Personal</SelectItem>
                <SelectItem value="Professional">Professional</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Full Name *</Label>
            <Input
              id="name"
              placeholder="Reference person's full name"
              required
              value={formData.reference_name}
              onChange={(e) => setFormData({ ...formData, reference_name: e.target.value })}
            />
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Title/Position *</Label>
            <Input
              id="title"
              placeholder="e.g., HR Manager, Landlord"
              required
              value={formData.reference_title}
              onChange={(e) => setFormData({ ...formData, reference_title: e.target.value })}
            />
          </div>

          {/* Company */}
          <div className="space-y-2">
            <Label htmlFor="company">Company/Organization</Label>
            <Input
              id="company"
              placeholder="Company or organization name"
              value={formData.reference_company}
              onChange={(e) => setFormData({ ...formData, reference_company: e.target.value })}
            />
          </div>

          {/* Contact Information */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                placeholder="reference@example.com"
                required
                value={formData.reference_email}
                onChange={(e) => setFormData({ ...formData, reference_email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number *</Label>
              <Input
                id="phone"
                placeholder="+256 XXX XXX XXX"
                required
                value={formData.reference_phone}
                onChange={(e) => setFormData({ ...formData, reference_phone: e.target.value })}
              />
            </div>
          </div>

          {/* Address */}
          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Input
              id="address"
              placeholder="Reference person's address"
              value={formData.reference_address}
              onChange={(e) => setFormData({ ...formData, reference_address: e.target.value })}
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-3 justify-end">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading 
                ? (editData ? "Updating..." : "Adding...") 
                : (editData ? "Update Reference" : "Add Reference")
              }
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
