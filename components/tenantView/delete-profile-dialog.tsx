"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AlertTriangle, Loader2, Trash2 } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

export function DeleteProfileDialog() {
  const [open, setOpen] = useState(false)
  const [confirmText, setConfirmText] = useState("")
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    if (confirmText !== "DELETE MY PROFILE") {
      if (typeof window !== 'undefined') {
        alert("Please type 'DELETE MY PROFILE' to confirm")
      }
      return
    }

    setIsDeleting(true)

    try {
      const response = await fetch("/api/profile", {
        method: "DELETE",
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to delete profile")
      }

      if (typeof window !== 'undefined') {
        alert("Profile deleted successfully! Your account will remain active but your extended profile data has been removed.")
        window.location.reload()
      }
      setOpen(false)
    } catch (error) {
      console.error("Error deleting profile:", error)
      if (typeof window !== 'undefined') {
        alert(error instanceof Error ? error.message : "Failed to delete profile. Please try again.")
      }
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="text-destructive hover:text-destructive gap-2">
          <Trash2 className="w-4 h-4" />
          Delete Profile Data
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="w-5 h-5" />
            Delete Profile Data
          </DialogTitle>
          <DialogDescription>
            This action cannot be undone. This will permanently delete your extended profile data.
          </DialogDescription>
        </DialogHeader>

        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="pt-4">
            <div className="space-y-2 text-sm">
              <p className="font-medium text-destructive">The following data will be deleted:</p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>Personal information (address, ID, etc.)</li>
                <li>Employment information</li>
                <li>Documents and references</li>
                <li>Verification status</li>
              </ul>
              <p className="text-xs text-muted-foreground mt-3">
                <strong>Note:</strong> Your base account (email and name) will remain active. You can recreate your profile anytime.
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-2">
          <Label htmlFor="confirm">
            Type <span className="font-mono font-bold">DELETE MY PROFILE</span> to confirm
          </Label>
          <Input
            id="confirm"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder="DELETE MY PROFILE"
            className="font-mono"
          />
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting || confirmText !== "DELETE MY PROFILE"}
          >
            {isDeleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Profile Data
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
