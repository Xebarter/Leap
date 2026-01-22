"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Card, CardContent } from "@/components/ui/card"
import { Edit2, AlertCircle } from "lucide-react"

export function ProfileEditForm({ profile, onSubmit }: { profile: any; onSubmit?: (data: any) => void }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    phone_number: profile?.phone_number || "",
    date_of_birth: profile?.date_of_birth || "",
    national_id_type: profile?.national_id_type || "National ID",
    national_id: profile?.national_id || "",
    home_address: profile?.home_address || "",
    home_city: profile?.home_city || "",
    home_district: profile?.home_district || "",
    home_postal_code: profile?.home_postal_code || "",
    employment_status: profile?.employment_status || "Employed",
    employment_type: profile?.employment_type || "Full-Time",
    employer_name: profile?.employer_name || "",
    employer_contact: profile?.employer_contact || "",
    employment_start_date: profile?.employment_start_date || "",
    monthly_income_ugx: profile?.monthly_income_ugx || "",
    preferred_communication: profile?.preferred_communication || "email",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // TODO: Submit to API endpoint
      console.log("Profile Update:", formData)

      if (onSubmit) {
        onSubmit(formData)
      }

      setOpen(false)
    } catch (error) {
      console.error("Error updating profile:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Edit2 className="w-4 h-4" />
          Edit Profile
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
          <DialogDescription>Update your personal information and account details.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Personal Information Section */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Personal Information</h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  placeholder="+256 XXX XXX XXX"
                  value={formData.phone_number}
                  onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dob">Date of Birth</Label>
                <Input
                  id="dob"
                  type="date"
                  value={formData.date_of_birth}
                  onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="id_type">National ID Type</Label>
                <Select
                  value={formData.national_id_type}
                  onValueChange={(value) => setFormData({ ...formData, national_id_type: value })}
                >
                  <SelectTrigger id="id_type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Passport">Passport</SelectItem>
                    <SelectItem value="National ID">National ID</SelectItem>
                    <SelectItem value="Driving License">Driving License</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="national_id">National ID Number</Label>
                <Input
                  id="national_id"
                  placeholder="Your national ID number"
                  value={formData.national_id}
                  onChange={(e) => setFormData({ ...formData, national_id: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* Home Address Section */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Home Address</h3>

            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                placeholder="Your home address"
                value={formData.home_address}
                onChange={(e) => setFormData({ ...formData, home_address: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  placeholder="City"
                  value={formData.home_city}
                  onChange={(e) => setFormData({ ...formData, home_city: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="district">District</Label>
                <Input
                  id="district"
                  placeholder="District"
                  value={formData.home_district}
                  onChange={(e) => setFormData({ ...formData, home_district: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="postal">Postal Code</Label>
                <Input
                  id="postal"
                  placeholder="Postal code"
                  value={formData.home_postal_code}
                  onChange={(e) => setFormData({ ...formData, home_postal_code: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* Employment Information Section */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Employment Information</h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="emp_status">Employment Status</Label>
                <Select
                  value={formData.employment_status}
                  onValueChange={(value) => setFormData({ ...formData, employment_status: value })}
                >
                  <SelectTrigger id="emp_status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Employed">Employed</SelectItem>
                    <SelectItem value="Self-Employed">Self-Employed</SelectItem>
                    <SelectItem value="Student">Student</SelectItem>
                    <SelectItem value="Unemployed">Unemployed</SelectItem>
                    <SelectItem value="Retired">Retired</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="emp_type">Employment Type</Label>
                <Select
                  value={formData.employment_type}
                  onValueChange={(value) => setFormData({ ...formData, employment_type: value })}
                >
                  <SelectTrigger id="emp_type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Full-Time">Full-Time</SelectItem>
                    <SelectItem value="Part-Time">Part-Time</SelectItem>
                    <SelectItem value="Contract">Contract</SelectItem>
                    <SelectItem value="Freelance">Freelance</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="employer">Employer Name</Label>
                <Input
                  id="employer"
                  placeholder="Your employer's name"
                  value={formData.employer_name}
                  onChange={(e) => setFormData({ ...formData, employer_name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="emp_contact">Employer Contact</Label>
                <Input
                  id="emp_contact"
                  placeholder="Contact number or email"
                  value={formData.employer_contact}
                  onChange={(e) => setFormData({ ...formData, employer_contact: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="emp_start">Employment Start Date</Label>
                <Input
                  id="emp_start"
                  type="date"
                  value={formData.employment_start_date}
                  onChange={(e) => setFormData({ ...formData, employment_start_date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="income">Monthly Income (UGX)</Label>
                <Input
                  id="income"
                  type="number"
                  placeholder="Monthly income in UGX"
                  value={formData.monthly_income_ugx}
                  onChange={(e) => setFormData({ ...formData, monthly_income_ugx: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* Communication Preferences Section */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Communication Preferences</h3>

            <div className="space-y-2">
              <Label htmlFor="comm">Preferred Communication Method</Label>
              <Select
                value={formData.preferred_communication}
                onValueChange={(value) => setFormData({ ...formData, preferred_communication: value })}
              >
                <SelectTrigger id="comm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="sms">SMS</SelectItem>
                  <SelectItem value="whatsapp">WhatsApp</SelectItem>
                  <SelectItem value="phone">Phone</SelectItem>
                  <SelectItem value="all">All Methods</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Info Box */}
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="pt-4">
              <div className="flex gap-3">
                <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium">Verification Impact</p>
                  <p className="mt-1">
                    Updating your profile information may require re-verification. Please ensure all details are accurate.
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
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
