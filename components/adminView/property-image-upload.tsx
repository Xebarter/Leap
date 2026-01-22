"use client";

import { useState, useRef, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, X, Image as ImageIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface PropertyImageUploadProps {
  propertyId: string | null;
  initialImageUrl?: string | null;
  onImageUploaded?: (url: string | null) => void;
}

export function PropertyImageUpload({ 
  propertyId, 
  initialImageUrl = null, 
  onImageUploaded 
}: PropertyImageUploadProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(initialImageUrl);
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Update preview when initialImageUrl changes
  useEffect(() => {
    setImageUrl(initialImageUrl);
  }, [initialImageUrl]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0]; // Only accept one file for main image
    const previewUrl = URL.createObjectURL(file);
    setPreviewUrl(previewUrl);

    setUploading(true);

    try {
      // Upload via API route using service role
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
      const filePath = `property-main-images/${propertyId || 'temp'}/${fileName}`;

      const formData = new FormData();
      formData.append('file', file);
      formData.append('filePath', filePath);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok || result.error) {
        console.error("Error uploading main image:", result.error);
        setPreviewUrl(null);
      } else {
        const uploadedUrl = result.url;
        setImageUrl(uploadedUrl);
        if (onImageUploaded) {
          onImageUploaded(uploadedUrl);
        }
      }
    } catch (error) {
      console.error("Error uploading main image:", error);
      setPreviewUrl(null);
    }

    setUploading(false);
  };

  const removeImage = () => {
    setImageUrl(null);
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    if (onImageUploaded) {
      onImageUploaded(null);
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Main Property Image
          {imageUrl && (
            <Badge variant="secondary">Uploaded</Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Label>Upload Main Property Image</Label>
              <p className="text-sm text-muted-foreground mb-3">
                This image will be displayed on the property card on the public facing page
              </p>
              
              <div className="flex items-center gap-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={handleButtonClick}
                  disabled={uploading}
                  className="gap-2"
                >
                  <Upload className="h-4 w-4" />
                  {uploading ? "Uploading..." : imageUrl ? "Replace Image" : "Upload Image"}
                </Button>
                
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  ref={fileInputRef}
                  className="hidden"
                />
                
                {imageUrl && (
                  <Button 
                    variant="destructive" 
                    size="icon"
                    onClick={removeImage}
                    disabled={uploading}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
            
            {(imageUrl || previewUrl) && (
              <div className="relative aspect-video w-full sm:w-48 h-32 rounded-md overflow-hidden border">
                <img
                  src={previewUrl || imageUrl || ''}
                  alt="Main property preview"
                  className="object-cover w-full h-full"
                />
                {uploading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                    <Upload className="h-8 w-8 text-white animate-pulse" />
                  </div>
                )}
              </div>
            )}
          </div>
          
          {!imageUrl && !previewUrl && (
            <div className="flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-8 text-center">
              <ImageIcon className="h-10 w-10 text-muted-foreground mb-2" />
              <p className="text-muted-foreground">
                No main image uploaded yet. This image will be displayed on the property card.
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
