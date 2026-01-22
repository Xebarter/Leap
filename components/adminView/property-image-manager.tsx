"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trash2, Image as ImageIcon, AlertCircle } from "lucide-react";
import { toast } from "sonner";

interface PropertyImage {
  id: string;
  image_url: string;
  type: "main" | "detail";
  detailName?: string;
  detailType?: string;
  detailId?: string;
}

interface PropertyImageManagerProps {
  propertyId: string | null;
  mainImageUrl?: string | null;
}

export function PropertyImageManager({
  propertyId,
  mainImageUrl
}: PropertyImageManagerProps) {
  const [images, setImages] = useState<PropertyImage[]>([]);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Load all images when propertyId changes
  useEffect(() => {
    if (propertyId) {
      loadAllImages();
    }
  }, [propertyId, mainImageUrl]);

  const loadAllImages = async () => {
    if (!propertyId) return;

    setLoading(true);
    try {
      const supabase = createClient();
      const allImages: PropertyImage[] = [];

      // Add main image if it exists
      if (mainImageUrl) {
        allImages.push({
          id: `main-${propertyId}`,
          image_url: mainImageUrl,
          type: "main"
        });
      }

      // Fetch property details with images
      const { data: detailsData, error: detailsError } = await supabase
        .from('property_details')
        .select('*')
        .eq('property_id', propertyId);

      if (!detailsError && detailsData) {
        for (const detail of detailsData) {
          const { data: imagesData, error: imagesError } = await supabase
            .from('property_detail_images')
            .select('*')
            .eq('property_detail_id', detail.id)
            .order('display_order', { ascending: true });

          if (!imagesError && imagesData) {
            for (const img of imagesData) {
              allImages.push({
                id: img.id,
                image_url: img.image_url,
                type: "detail",
                detailName: detail.detail_name,
                detailType: detail.detail_type,
                detailId: detail.id
              });
            }
          }
        }
      }

      setImages(allImages);
    } catch (error) {
      console.error("Error loading images:", error);
      toast.error("Failed to load images");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteImage = async (imageId: string, imageType: "main" | "detail") => {
    setDeletingId(imageId);

    try {
      const supabase = createClient();

      if (imageType === "main") {
        // For main images, we don't delete from storage directly via this component
        // The deletion is handled by the PropertyImageUpload component
        toast.info("Please use the main image upload section to delete the main image");
      } else if (imageType === "detail") {
        // Delete detail image from database
        const { error } = await supabase
          .from('property_detail_images')
          .delete()
          .eq('id', imageId);

        if (error) {
          console.error("Error deleting image:", error);
          toast.error("Failed to delete image");
          return;
        }

        // Remove from local state
        setImages(images.filter(img => img.id !== imageId));
        toast.success("Image deleted successfully");
      }
    } catch (error) {
      console.error("Error deleting image:", error);
      toast.error("Failed to delete image");
    } finally {
      setDeletingId(null);
    }
  };

  if (!propertyId) {
    return null;
  }

  // Group images by type
  const mainImages = images.filter(img => img.type === "main");
  const detailImages = images.filter(img => img.type === "detail");

  // Group detail images by detail
  const groupedDetailImages = detailImages.reduce((acc, img) => {
    const key = img.detailId || "unknown";
    if (!acc[key]) {
      acc[key] = {
        detailName: img.detailName || "Unknown",
        detailType: img.detailType || "Other",
        images: []
      };
    }
    acc[key].images.push(img);
    return acc;
  }, {} as Record<string, { detailName: string; detailType: string; images: PropertyImage[] }>);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5" />
            Image Management
          </div>
          <Badge variant="outline">{images.length} images</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {images.length === 0 ? (
            <div className="flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-8 text-center">
              <ImageIcon className="h-10 w-10 text-muted-foreground mb-2" />
              <p className="text-muted-foreground">
                No images uploaded yet for this property
              </p>
            </div>
          ) : (
            <>
              {/* Main Image */}
              {mainImages.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-sm">Main Image</h3>
                    <Badge variant="default" className="text-xs">Main</Badge>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {mainImages.map((img) => (
                      <div key={img.id} className="relative group aspect-square">
                        <img
                          src={img.image_url}
                          alt="Main property image"
                          className="object-cover w-full h-full rounded-md border"
                        />
                        <Button
                          variant="destructive"
                          size="icon"
                          className="absolute top-2 right-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                          disabled={deletingId === img.id}
                          onClick={() => handleDeleteImage(img.id, img.type)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                        <div className="absolute bottom-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
                          Main
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Detail Images Grouped */}
              {Object.keys(groupedDetailImages).length > 0 && (
                <div className="space-y-4">
                  <h3 className="font-semibold text-sm">Detail Images</h3>
                  {Object.entries(groupedDetailImages).map(([detailId, group]) => (
                    <div key={detailId} className="space-y-2 pl-4 border-l-2 border-muted">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-sm">{group.detailName}</h4>
                        <Badge variant="secondary" className="text-xs">
                          {group.detailType}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {group.images.length} {group.images.length === 1 ? "image" : "images"}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                        {group.images.map((img) => (
                          <div key={img.id} className="relative group aspect-square">
                            <img
                              src={img.image_url}
                              alt={group.detailName}
                              className="object-cover w-full h-full rounded-md border"
                            />
                            <Button
                              variant="destructive"
                              size="icon"
                              className="absolute top-2 right-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                              disabled={deletingId === img.id}
                              onClick={() => handleDeleteImage(img.id, img.type)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {detailImages.length === 0 && mainImages.length > 0 && (
                <div className="flex items-start gap-2 p-3 rounded-md bg-muted/50">
                  <AlertCircle className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-muted-foreground">
                    Only the main image is uploaded. Add property details to upload additional images.
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
