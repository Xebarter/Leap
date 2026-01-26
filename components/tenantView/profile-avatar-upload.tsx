"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Camera, Loader2, Trash2, User } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

interface ProfileAvatarUploadProps {
  avatarUrl: string | null
  fullName: string | null
  onAvatarUpdate: (newAvatarUrl: string | null) => void
}

export function ProfileAvatarUpload({ avatarUrl, fullName, onAvatarUpdate }: ProfileAvatarUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"]
    if (!allowedTypes.includes(file.type)) {
      console.error("Invalid file type:", file.type)
      if (typeof window !== 'undefined') {
        alert("Invalid file type. Only JPEG, PNG, and WebP images are allowed.")
      }
      return
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024
    if (file.size > maxSize) {
      console.error("File size too large:", file.size)
      if (typeof window !== 'undefined') {
        alert("File size too large. Maximum size is 5MB.")
      }
      return
    }

    setIsUploading(true)

    try {
      const formData = new FormData()
      formData.append("file", file)

      const response = await fetch("/api/profile/avatar", {
        method: "POST",
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to upload avatar")
      }

      onAvatarUpdate(data.avatar_url)
      if (typeof window !== 'undefined') {
        alert("Avatar uploaded successfully!")
      }
    } catch (error) {
      console.error("Error uploading avatar:", error)
      if (typeof window !== 'undefined') {
        alert(error instanceof Error ? error.message : "Failed to upload avatar. Please try again.")
      }
    } finally {
      setIsUploading(false)
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  const handleDeleteAvatar = async () => {
    if (typeof window !== 'undefined' && !confirm("Are you sure you want to remove your profile picture?")) {
      return
    }

    setIsDeleting(true)

    try {
      const response = await fetch("/api/profile/avatar", {
        method: "DELETE",
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to delete avatar")
      }

      onAvatarUpdate(null)
      if (typeof window !== 'undefined') {
        alert("Avatar removed successfully!")
      }
    } catch (error) {
      console.error("Error deleting avatar:", error)
      if (typeof window !== 'undefined') {
        alert(error instanceof Error ? error.message : "Failed to delete avatar. Please try again.")
      }
    } finally {
      setIsDeleting(false)
    }
  }

  const getInitials = (name: string | null) => {
    if (!name) return "U"
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <Card className="border-none shadow-lg bg-gradient-to-br from-primary/5 to-background overflow-hidden">
      <CardContent className="pt-8 pb-8 text-center">
        <div className="relative inline-block">
          <Avatar className="w-32 h-32 border-4 border-background shadow-xl">
            <AvatarImage src={avatarUrl || undefined} alt={fullName || "User"} />
            <AvatarFallback className="bg-gradient-to-br from-primary to-primary/70 text-white text-3xl font-bold">
              {getInitials(fullName)}
            </AvatarFallback>
          </Avatar>
          
          {/* Upload button overlay */}
          <Button
            size="icon"
            className="absolute bottom-0 right-0 rounded-full h-10 w-10 shadow-lg"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading || isDeleting}
          >
            {isUploading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Camera className="h-4 w-4" />
            )}
          </Button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/webp"
          onChange={handleFileSelect}
          className="hidden"
        />

        <h2 className="text-2xl font-bold mt-4 mb-1">{fullName || "User"}</h2>
        <p className="text-sm text-muted-foreground mb-4">Tenant Profile</p>

        <div className="flex gap-2 justify-center mt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading || isDeleting}
            className="gap-2"
          >
            {isUploading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Camera className="h-4 w-4" />
                Change Photo
              </>
            )}
          </Button>

          {avatarUrl && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleDeleteAvatar}
              disabled={isUploading || isDeleting}
              className="gap-2 text-destructive hover:text-destructive"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Removing...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4" />
                  Remove
                </>
              )}
            </Button>
          )}
        </div>

        <p className="text-xs text-muted-foreground mt-4">
          Supported formats: JPEG, PNG, WebP (Max 5MB)
        </p>
      </CardContent>
    </Card>
  )
}
