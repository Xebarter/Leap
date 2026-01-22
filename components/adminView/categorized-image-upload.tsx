"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, X, Plus, Image as ImageIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

// Define property areas for categorization
const PROPERTY_AREAS = [
  "Exterior", "Interior", "Kitchen", "Bedroom", "Bathroom", 
  "Living Room", "Dining Room", "Garden", "Pool", "Other"
];

interface ImageData {
  id: string;
  url: string;
  area: string;
}

interface CategorizedImageUploadProps {
  propertyId: string | null;
  initialImages?: ImageData[];
  onImagesUploaded?: (images: ImageData[]) => void;
}

export function CategorizedImageUpload({ 
  propertyId, 
  initialImages = [], 
  onImagesUploaded 
}: CategorizedImageUploadProps) {
  const [images, setImages] = useState<ImageData[]>(initialImages);
  const [uploading, setUploading] = useState(false);
  const [previewUrls, setPreviewUrls] = useState<{url: string, area: string}[]>([]);

  // Group images by area for display
  const imagesByArea: Record<string, ImageData[]> = {};
  PROPERTY_AREAS.forEach(area => {
    imagesByArea[area] = images.filter(img => img.area === area);
  });

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, area: string) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    
    // Create preview URLs for the selected files
    const newPreviewUrls: {url: string, area: string}[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const previewUrl = URL.createObjectURL(file);
      newPreviewUrls.push({ url: previewUrl, area });
    }
    setPreviewUrls(prev => [...prev, ...newPreviewUrls]);

    // Upload via API route using service role
    const newImageUrls: ImageData[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
      const filePath = `property-images/${propertyId || 'temp'}/${area}/${fileName}`;

      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('filePath', filePath);

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        const result = await response.json();

        if (response.ok && !result.error) {
          newImageUrls.push({
            id: Math.random().toString(36).substring(2, 9),
            url: result.url,
            area
          });
        } else {
          console.error("Error uploading image:", result.error);
        }
      } catch (error) {
        console.error("Error uploading image:", error);
      }
    }

    // Clean up preview URLs
    newPreviewUrls.forEach(item => URL.revokeObjectURL(item.url));
    
    const updatedImages = [...images, ...newImageUrls];
    setImages(updatedImages);
    
    if (onImagesUploaded) {
      onImagesUploaded(updatedImages);
    }
    
    setUploading(false);
  };

  const removeImage = (imageId: string) => {
    const updatedImages = images.filter(img => img.id !== imageId);
    setImages(updatedImages);
    
    if (onImagesUploaded) {
      onImagesUploaded(updatedImages);
    }
  };

  const handleAddAreaFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const area = e.target.getAttribute("data-area");
    if (area) {
      handleFileChange(e, area);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Property Images by Area
          <Badge variant="secondary">{images.length} images</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Accordion type="multiple" className="w-full">
          {PROPERTY_AREAS.map((area) => {
            const areaImages = imagesByArea[area];
            const areaPreviews = previewUrls.filter(p => p.area === area);
            
            return (
              <AccordionItem value={area} key={area} className="border rounded-lg mb-3">
                <AccordionTrigger className="px-4 py-3 text-left">
                  <div className="flex items-center gap-2">
                    <ImageIcon className="h-4 w-4" />
                    {area} 
                    {areaImages.length > 0 && (
                      <Badge variant="secondary" className="ml-2">
                        {areaImages.length} {areaImages.length === 1 ? 'image' : 'images'}
                      </Badge>
                    )}
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Label htmlFor={`image-upload-${area}`} className="cursor-pointer">
                        <Button variant="outline" disabled={uploading} className="gap-2">
                          <Plus className="h-4 w-4" />
                          {uploading ? "Uploading..." : `Add ${area} Images`}
                        </Button>
                      </Label>
                      <Input
                        id={`image-upload-${area}`}
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={(e) => handleFileChange(e, area)}
                        className="hidden"
                      />
                      <p className="text-sm text-muted-foreground">
                        Upload images of the {area.toLowerCase()}
                      </p>
                    </div>

                    {areaImages.length > 0 && (
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                        {areaImages.map((img) => (
                          <div key={img.id} className="relative group aspect-square">
                            <img
                              src={img.url}
                              alt={`${area} image`}
                              className="object-cover w-full h-full rounded-md"
                            />
                            <Button
                              variant="destructive"
                              size="icon"
                              className="absolute top-2 right-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => removeImage(img.id)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}

                    {areaPreviews.length > 0 && (
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                        {areaPreviews.map((item, index) => (
                          <div key={`${item.area}-${index}`} className="relative aspect-square">
                            <img
                              src={item.url}
                              alt={`Preview ${index + 1}`}
                              className="object-cover w-full h-full rounded-md opacity-70"
                            />
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className="animate-pulse bg-muted rounded-full p-2">
                                <Upload className="h-6 w-6 text-muted-foreground" />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      </CardContent>
    </Card>
  );
}