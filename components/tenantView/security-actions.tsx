"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Shield, Key, Mail } from "lucide-react"

export function ChangePasswordButton() {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (formData.newPassword !== formData.confirmPassword) {
        alert("New passwords do not match!")
        return
      }

      if (formData.newPassword.length < 8) {
        alert("Password must be at least 8 characters long")
        return
      }

      const response = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: formData.currentPassword,
          newPassword: formData.newPassword
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to change password")
      }

      alert("Password changed successfully!")
      setFormData({ currentPassword: "", newPassword: "", confirmPassword: "" })
      setOpen(false)
    } catch (error: any) {
      alert(`Error: ${error.message || "Failed to change password"}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="text-xs">
          <Key className="w-3 h-3 mr-2" />
          Change Password
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Change Password</DialogTitle>
          <DialogDescription>
            Enter your current password and choose a new one
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="current">Current Password</Label>
            <Input
              id="current"
              type="password"
              required
              value={formData.currentPassword}
              onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="new">New Password</Label>
            <Input
              id="new"
              type="password"
              required
              minLength={8}
              value={formData.newPassword}
              onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
            />
            <p className="text-xs text-muted-foreground">At least 8 characters</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm">Confirm New Password</Label>
            <Input
              id="confirm"
              type="password"
              required
              minLength={8}
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
            />
          </div>

          <div className="flex gap-3 justify-end pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Changing..." : "Change Password"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export function ResendVerificationButton() {
  const [loading, setLoading] = useState(false)

  const handleResend = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/auth/resend-verification", {
        method: "POST"
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to resend verification email")
      }

      alert("Verification email sent! Please check your inbox.")
    } catch (error: any) {
      alert(`Error: ${error.message || "Failed to resend verification email"}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button 
      variant="outline" 
      size="sm" 
      className="text-xs"
      onClick={handleResend}
      disabled={loading}
    >
      <Mail className="w-3 h-3 mr-2" />
      {loading ? "Sending..." : "Resend Verification Email"}
    </Button>
  )
}

export function SecurityStrength({ user }: { user: any }) {
  const calculateStrength = () => {
    let strength = 0
    let total = 0
    
    // Email verified (40%)
    total += 40
    if (user.email_confirmed_at) strength += 40
    
    // Password set (30%)
    total += 30
    if (user.encrypted_password) strength += 30
    
    // Recent activity (30%)
    total += 30
    const lastSignIn = new Date(user.last_sign_in_at || user.created_at)
    const daysSinceLogin = Math.floor((Date.now() - lastSignIn.getTime()) / (1000 * 60 * 60 * 24))
    if (daysSinceLogin < 7) strength += 30
    else if (daysSinceLogin < 30) strength += 20
    else if (daysSinceLogin < 90) strength += 10
    
    const percentage = Math.round((strength / total) * 100)
    
    let label = "Weak"
    let color = "from-red-500 to-rose-500"
    
    if (percentage >= 90) {
      label = "Excellent"
      color = "from-green-500 to-emerald-500"
    } else if (percentage >= 70) {
      label = "Strong"
      color = "from-blue-500 to-cyan-500"
    } else if (percentage >= 50) {
      label = "Good"
      color = "from-yellow-500 to-orange-500"
    }
    
    return { percentage, label, color }
  }
  
  const strength = calculateStrength()
  
  return (
    <div className="p-4 bg-gradient-to-r from-primary/5 to-primary/10 rounded-lg border border-border/50">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium">Security Strength</span>
        </div>
        <span className="text-xs font-bold text-primary">{strength.percentage}%</span>
      </div>
      <div className="w-full h-2 bg-muted rounded-full overflow-hidden mb-2">
        <div 
          className={`h-full bg-gradient-to-r ${strength.color} transition-all duration-500`}
          style={{ width: `${strength.percentage}%` }}
        />
      </div>
      <p className="text-xs text-muted-foreground">
        {strength.label} - 
        {!user.email_confirmed_at && " Verify your email to improve security."}
        {user.email_confirmed_at && strength.percentage < 100 && " Keep your account active to maintain security."}
        {strength.percentage === 100 && " Your account is well secured!"}
      </p>
    </div>
  )
}
