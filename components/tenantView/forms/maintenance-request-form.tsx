"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Card, CardContent } from "@/components/ui/card"
import { Plus, AlertCircle } from "lucide-react"

export function MaintenanceRequestForm({ onSubmit }: { onSubmit?: (data: any) => void }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    severity: "Medium",
    location_in_property: "",
    attachments: [] as string[],
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // TODO: Submit to API endpoint
      console.log("Maintenance Request:", formData)
      
      if (onSubmit) {
        onSubmit(formData)
      }

      // Reset form and close dialog
      setFormData({
        title: "",
        description: "",
        severity: "Medium",
        location_in_property: "",
        attachments: [],
      })
      setOpen(false)
    } catch (error) {
      console.error("Error creating maintenance request:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="w-4 h-4" />
          New Request
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create Maintenance Request</DialogTitle>
          <DialogDescription>
            Report a maintenance issue that needs attention. Our team will review and respond promptly.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Issue Title *</Label>
            <Input
              id="title"
              placeholder="e.g., Leaky faucet in bathroom"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              placeholder="Please describe the issue in detail..."
              required
              rows={4}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          {/* Severity */}
          <div className="space-y-2">
            <Label htmlFor="severity">Severity Level *</Label>
            <Select value={formData.severity} onValueChange={(value) => setFormData({ ...formData, severity: value })}>
              <SelectTrigger id="severity">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Low">Low - Non-urgent</SelectItem>
                <SelectItem value="Medium">Medium - Regular maintenance</SelectItem>
                <SelectItem value="High">High - Needs quick attention</SelectItem>
                <SelectItem value="Emergency">Emergency - Immediate action needed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Location */}
          <div className="space-y-2">
            <Label htmlFor="location">Location in Property</Label>
            <Input
              id="location"
              placeholder="e.g., Master Bedroom, Kitchen, Bathroom"
              value={formData.location_in_property}
              onChange={(e) => setFormData({ ...formData, location_in_property: e.target.value })}
            />
          </div>

          {/* Info Box */}
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="pt-4">
              <div className="flex gap-3">
                <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium">Emergency Support Available</p>
                  <p className="mt-1">
                    For true emergencies affecting your safety or property, please call our emergency hotline immediately.
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
            <Button type="submit" disabled={loading}>
              {loading ? "Submitting..." : "Submit Request"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
