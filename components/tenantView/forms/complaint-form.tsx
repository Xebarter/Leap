"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { Plus } from "lucide-react"

export function ComplaintForm({ onSubmit }: { onSubmit?: (data: any) => void }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    complaint_type: "Management Issue",
    priority: "Normal",
    attachments: [] as string[],
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // TODO: Submit to API endpoint
      console.log("Complaint:", formData)
      
      if (onSubmit) {
        onSubmit(formData)
      }

      setFormData({
        title: "",
        description: "",
        complaint_type: "Management Issue",
        priority: "Normal",
        attachments: [],
      })
      setOpen(false)
    } catch (error) {
      console.error("Error creating complaint:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="w-4 h-4" />
          File Complaint
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>File a Complaint</DialogTitle>
          <DialogDescription>
            Let us know about any issues or concerns. Your complaint will be reviewed by our management team.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Complaint Title *</Label>
            <Input
              id="title"
              placeholder="Brief summary of your complaint"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Details *</Label>
            <Textarea
              id="description"
              placeholder="Please provide detailed information about your complaint..."
              required
              rows={4}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          {/* Complaint Type */}
          <div className="space-y-2">
            <Label htmlFor="type">Type of Complaint *</Label>
            <Select
              value={formData.complaint_type}
              onValueChange={(value) => setFormData({ ...formData, complaint_type: value })}
            >
              <SelectTrigger id="type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Maintenance Issue">Maintenance Issue</SelectItem>
                <SelectItem value="Neighbor Complaint">Neighbor Complaint</SelectItem>
                <SelectItem value="Noise">Noise Complaint</SelectItem>
                <SelectItem value="Cleanliness">Cleanliness Issue</SelectItem>
                <SelectItem value="Safety Issue">Safety Issue</SelectItem>
                <SelectItem value="Billing Dispute">Billing Dispute</SelectItem>
                <SelectItem value="Management Issue">Management Issue</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Priority */}
          <div className="space-y-2">
            <Label htmlFor="priority">Priority Level</Label>
            <Select value={formData.priority} onValueChange={(value) => setFormData({ ...formData, priority: value })}>
              <SelectTrigger id="priority">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Low">Low</SelectItem>
                <SelectItem value="Normal">Normal</SelectItem>
                <SelectItem value="High">High</SelectItem>
                <SelectItem value="Emergency">Emergency</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 justify-end">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Submitting..." : "File Complaint"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
