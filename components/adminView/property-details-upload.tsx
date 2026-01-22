"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, X, Plus, Image as ImageIcon, Trash2, GripVertical } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";

// Predefined property detail types
const DETAIL_TYPES = [
  "Bedroom", "Bathroom", "Kitchen", "Living Room", "Dining Room",
  "Balcony", "Garden", "Pool", "Garage", "Office", "Gym",
  "Laundry Room", "Storage", "Terrace", "Other"
];

interface PropertyDetailImage {
  id: string;
  image_url: string;
  display_order: number;
}

interface PropertyDetail {
  id: string;
  detail_name: string;
  detail_type: string;
  description?: string;
  images: PropertyDetailImage[];
}

interface PropertyDetailsUploadProps {
  propertyId: string | null;
  initialDetails?: PropertyDetail[];
  onDetailsUpdated?: (details: PropertyDetail[]) => void;
}

export function PropertyDetailsUpload({
  propertyId,
  initialDetails = [],
  onDetailsUpdated
}: PropertyDetailsUploadProps) {
  const [details, setDetails] = useState<PropertyDetail[]>(initialDetails);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null); // Track which detail is uploading
  const [newDetailName, setNewDetailName] = useState("");
  const [newDetailType, setNewDetailType] = useState("");
  const [newDetailDescription, setNewDetailDescription] = useState("");

  // Load existing details when propertyId changes
  useEffect(() => {
    if (propertyId) {
      loadPropertyDetails();
    }
  }, [propertyId]);

  const loadPropertyDetails = async () => {
    if (!propertyId) return;

    const supabase = createClient();
    
    // Fetch property details
    const { data: detailsData, error: detailsError } = await supabase
      .from('property_details')
      .select('*')
      .eq('property_id', propertyId);

    if (detailsError) {
      console.error("Error loading property details:", detailsError);
      return;
    }

    // Fetch images for each detail
    const detailsWithImages: PropertyDetail[] = [];
    
    for (const detail of detailsData || []) {
      const { data: imagesData, error: imagesError } = await supabase
        .from('property_detail_images')
        .select('*')
        .eq('property_detail_id', detail.id)
        .order('display_order', { ascending: true });

      if (!imagesError) {
        detailsWithImages.push({
          ...detail,
          images: imagesData || []
        });
      }
    }

    setDetails(detailsWithImages);
  };

  const handleAddDetail = async () => {
    if (!newDetailName || !newDetailType) return;

    const newDetail: PropertyDetail = {
      id: `temp-${Math.floor(Math.random() * 1000000)}`, // Temporary ID until saved to DB
      detail_name: newDetailName,
      detail_type: newDetailType,
      description: newDetailDescription,
      images: []
    };

    // If propertyId exists, save to database immediately
    if (propertyId) {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('property_details')
        .insert({
          property_id: propertyId,
          detail_name: newDetailName,
          detail_type: newDetailType,
          description: newDetailDescription
        })
        .select()
        .single();

      if (error) {
        console.error("Error creating property detail:", error);
        return;
      }

      newDetail.id = data.id;
    }

    const updatedDetails = [...details, newDetail];
    setDetails(updatedDetails);
    
    if (onDetailsUpdated) {
      onDetailsUpdated(updatedDetails);
    }

    // Reset form
    setNewDetailName("");
    setNewDetailType("");
    setNewDetailDescription("");
    setIsAddDialogOpen(false);
  };

  const handleImageUpload = async (detailId: string, files: FileList) => {
    if (!files || files.length === 0) return;

    setUploading(detailId);
    const supabase = createClient();
    const newImages: PropertyDetailImage[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
      const filePath = `property-details/${propertyId || 'temp'}/${detailId}/${fileName}`;

      try {
        // Upload via API route using service role
        const formData = new FormData();
        formData.append('file', file);
        formData.append('filePath', filePath);

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        const result = await response.json();

        if (!response.ok || result.error) {
          console.error("Error uploading image:", result.error);
          continue;
        }

        const imageData: PropertyDetailImage = {
          id: `temp-${Math.floor(Math.random() * 1000000)}-${i}`,
          image_url: result.url,
          display_order: 0
        };

        // If propertyId exists and detail is saved, save image to DB
        if (propertyId && !detailId.startsWith('temp-')) {
          const detail = details.find(d => d.id === detailId);
          const nextOrder = detail ? detail.images.length : 0;

          const { data: savedImage, error: imageError } = await supabase
            .from('property_detail_images')
            .insert({
              property_detail_id: detailId,
              image_url: result.url,
              display_order: nextOrder
            })
            .select()
            .single();

          if (!imageError && savedImage) {
            imageData.id = savedImage.id;
            imageData.display_order = savedImage.display_order;
          }
        }

        newImages.push(imageData);
      } catch (error) {
        console.error("Error uploading image:", error);
        continue;
      }
    }

    // Update state with new images
    const updatedDetails = details.map(detail => {
      if (detail.id === detailId) {
        return {
          ...detail,
          images: [...detail.images, ...newImages]
        };
      }
      return detail;
    });

    setDetails(updatedDetails);
    
    if (onDetailsUpdated) {
      onDetailsUpdated(updatedDetails);
    }

    setUploading(null);
  };

  const handleRemoveImage = async (detailId: string, imageId: string) => {
    // If image is saved in DB, delete it
    if (propertyId && !imageId.startsWith('temp-')) {
      const supabase = createClient();
      const { error } = await supabase
        .from('property_detail_images')
        .delete()
        .eq('id', imageId);

      if (error) {
        console.error("Error deleting image:", error);
        return;
      }
    }

    // Update state
    const updatedDetails = details.map(detail => {
      if (detail.id === detailId) {
        return {
          ...detail,
          images: detail.images.filter(img => img.id !== imageId)
        };
      }
      return detail;
    });

    setDetails(updatedDetails);
    
    if (onDetailsUpdated) {
      onDetailsUpdated(updatedDetails);
    }
  };

  const handleRemoveDetail = async (detailId: string) => {
    // If detail is saved in DB, delete it
    if (propertyId && !detailId.startsWith('temp-')) {
      const supabase = createClient();
      const { error } = await supabase
        .from('property_details')
        .delete()
        .eq('id', detailId);

      if (error) {
        console.error("Error deleting detail:", error);
        return;
      }
    }

    // Update state
    const updatedDetails = details.filter(d => d.id !== detailId);
    setDetails(updatedDetails);
    
    if (onDetailsUpdated) {
      onDetailsUpdated(updatedDetails);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Property Details
          <div className="flex items-center gap-2">
            <Badge variant="secondary">{details.length} details</Badge>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <Plus className="h-4 w-4" />
                  Add Detail
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Property Detail</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="detail-type">Detail Type *</Label>
                    <Select value={newDetailType} onValueChange={setNewDetailType}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select detail type" />
                      </SelectTrigger>
                      <SelectContent>
                        {DETAIL_TYPES.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="detail-name">Detail Name *</Label>
                    <Input
                      id="detail-name"
                      placeholder="e.g., Master Bedroom, Guest Bathroom"
                      value={newDetailName}
                      onChange={(e) => setNewDetailName(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      Give this detail a specific name to identify it
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="detail-description">Description (Optional)</Label>
                    <Textarea
                      id="detail-description"
                      placeholder="Add any additional details..."
                      value={newDetailDescription}
                      onChange={(e) => setNewDetailDescription(e.target.value)}
                      rows={3}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleAddDetail} disabled={!newDetailName || !newDetailType}>
                    Add Detail
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {details.length === 0 ? (
          <div className="flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-8 text-center">
            <ImageIcon className="h-10 w-10 text-muted-foreground mb-2" />
            <p className="text-muted-foreground mb-4">
              No property details added yet. Add details like bedrooms, bathrooms, etc.
            </p>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add First Detail
            </Button>
          </div>
        ) : (
          <Accordion type="multiple" className="w-full">
            {details.map((detail) => (
              <AccordionItem
                value={detail.id}
                key={detail.id}
                className="border rounded-lg mb-3"
              >
                <AccordionTrigger className="px-4 py-3 text-left hover:no-underline">
                  <div className="flex items-center justify-between w-full pr-4">
                    <div className="flex items-center gap-3">
                      <ImageIcon className="h-4 w-4" />
                      <div>
                        <div className="font-medium">{detail.detail_name}</div>
                        <div className="text-xs text-muted-foreground">{detail.detail_type}</div>
                      </div>
                    </div>
                    <div 
                      className="flex items-center gap-2"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {detail.images.length > 0 && (
                        <Badge variant="secondary">
                          {detail.images.length} {detail.images.length === 1 ? 'image' : 'images'}
                        </Badge>
                      )}
                      <button
                        className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50 h-8 w-8"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveDetail(detail.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </button>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4">
                  <div className="space-y-4">
                    {detail.description && (
                      <p className="text-sm text-muted-foreground">{detail.description}</p>
                    )}
                    
                    <div className="flex items-center gap-2">
                      <Label htmlFor={`image-upload-${detail.id}`} className="cursor-pointer">
                        <Button
                          type="button"
                          variant="outline"
                          disabled={uploading === detail.id}
                          className="gap-2"
                          asChild
                        >
                          <span>
                            <Plus className="h-4 w-4" />
                            {uploading === detail.id ? "Uploading..." : "Add Images"}
                          </span>
                        </Button>
                      </Label>
                      <Input
                        id={`image-upload-${detail.id}`}
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={(e) => {
                          if (e.target.files) {
                            handleImageUpload(detail.id, e.target.files);
                          }
                        }}
                        className="hidden"
                      />
                      <p className="text-sm text-muted-foreground">
                        Upload multiple images for this {detail.detail_type.toLowerCase()}
                      </p>
                    </div>

                    {detail.images.length > 0 && (
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                        {detail.images.map((img) => (
                          <div key={img.id} className="relative group aspect-square">
                            <img
                              src={img.image_url}
                              alt={`${detail.detail_name}`}
                              className="object-cover w-full h-full rounded-md border"
                            />
                            <Button
                              variant="destructive"
                              size="icon"
                              className="absolute top-2 right-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => handleRemoveImage(detail.id, img.id)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}

                    {detail.images.length === 0 && (
                      <div className="flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-6 text-center">
                        <ImageIcon className="h-8 w-8 text-muted-foreground mb-2" />
                        <p className="text-sm text-muted-foreground">
                          No images uploaded for this detail yet
                        </p>
                      </div>
                    )}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}
      </CardContent>
    </Card>
  );
}
