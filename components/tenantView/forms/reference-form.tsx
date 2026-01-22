"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Plus } from "lucide-react"

export function ReferenceForm({ onSubmit }: { onSubmit?: (data: any) => void }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    reference_type: "Employer",
    reference_name: "",
    reference_title: "",
    reference_company: "",
    reference_email: "",
    reference_phone: "",
    reference_address: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // TODO: Submit to API endpoint
      console.log("Reference:", formData)
      
      if (onSubmit) {
        onSubmit(formData)
      }

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
    } catch (error) {
      console.error("Error adding reference:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Add Reference</Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add Reference</DialogTitle>
          <DialogDescription>
            Add a reference contact that can verify your information and background.
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
              {loading ? "Adding..." : "Add Reference"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
