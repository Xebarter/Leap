"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, X, Plus, Image as ImageIcon, Trash2, Check, Loader2, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

// Predefined property detail types with quick templates
const DETAIL_TEMPLATES = [
  { type: "Bedroom", name: "Master Bedroom", icon: "🛏️" },
  { type: "Bedroom", name: "Guest Bedroom", icon: "🛏️" },
  { type: "Bathroom", name: "Master Bathroom", icon: "🚿" },
  { type: "Bathroom", name: "Guest Bathroom", icon: "🚿" },
  { type: "Kitchen", name: "Modern Kitchen", icon: "🍳" },
  { type: "Living Room", name: "Spacious Living Room", icon: "🛋️" },
  { type: "Dining Room", name: "Dining Area", icon: "🍽️" },
  { type: "Balcony", name: "Balcony", icon: "🌆" },
  { type: "Garden", name: "Garden", icon: "🌳" },
  { type: "Pool", name: "Swimming Pool", icon: "🏊" },
  { type: "Garage", name: "Parking Garage", icon: "🚗" },
  { type: "Gym", name: "Fitness Center", icon: "💪" },
];

const DETAIL_TYPES = [
  "Bedroom", "Bathroom", "Kitchen", "Living Room", "Dining Room",
  "Balcony", "Garden", "Pool", "Garage", "Office", "Gym",
  "Laundry Room", "Storage", "Terrace", "Other"
];

interface PropertyDetailImage {
  id: string;
  image_url: string;
  display_order: number;
  file?: File; // For pending uploads
}

interface PropertyDetail {
  id: string;
  detail_name: string;
  detail_type: string;
  description?: string;
  images: PropertyDetailImage[];
  isNew?: boolean; // Track if this is a new unsaved detail
}

interface PropertyDetailsUploadProps {
  propertyId: string | null;
  initialDetails?: PropertyDetail[];
  onDetailsUpdated?: (details: PropertyDetail[]) => void;
}

export function PropertyDetailsUploadImproved({
  propertyId,
  initialDetails = [],
  onDetailsUpdated
}: PropertyDetailsUploadProps) {
  const [details, setDetails] = useState<PropertyDetail[]>(initialDetails);
  const [newDetailInline, setNewDetailInline] = useState<PropertyDetail | null>(null);
  const [uploading, setUploading] = useState<Set<string>>(new Set());
  const [dragActive, setDragActive] = useState(false);
  const [showTemplates, setShowTemplates] = useState(true);

  // Load existing details when propertyId changes or initialDetails change
  useEffect(() => {
    console.log('🎨 PropertyDetailsUploadImproved - useEffect triggered');
    console.log('   propertyId:', propertyId);
    console.log('   initialDetails.length:', initialDetails.length);
    console.log('   initialDetails:', initialDetails);
    
    if (propertyId && initialDetails.length === 0) {
      console.log('   → Loading details from API');
      loadPropertyDetails();
    } else if (initialDetails.length > 0) {
      console.log('   → Using initialDetails:', initialDetails.length, 'details');
      setDetails(initialDetails);
      setShowTemplates(false);
    } else {
      console.log('   → No propertyId or initialDetails');
    }
  }, [propertyId, initialDetails]);

  const loadPropertyDetails = async () => {
    if (!propertyId) return;

    const supabase = createClient();
    
    const { data: detailsData, error: detailsError } = await supabase
      .from('property_details')
      .select('*')
      .eq('property_id', propertyId);

    if (detailsError) {
      console.error("Error loading property details:", detailsError);
      return;
    }

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
    setShowTemplates(detailsWithImages.length === 0);
  };

  // Quick add from template
  const handleQuickAdd = (template: typeof DETAIL_TEMPLATES[0]) => {
    const newDetail: PropertyDetail = {
      id: `temp-${Date.now()}`,
      detail_name: template.name,
      detail_type: template.type,
      description: "",
      images: [],
      isNew: true
    };

    setNewDetailInline(newDetail);
    setShowTemplates(false);
  };

  // Add custom detail
  const handleAddCustom = () => {
    const newDetail: PropertyDetail = {
      id: `temp-${Date.now()}`,
      detail_name: "",
      detail_type: "",
      description: "",
      images: [],
      isNew: true
    };

    setNewDetailInline(newDetail);
    setShowTemplates(false);
  };

  // Save the inline detail
  const handleSaveInlineDetail = async () => {
    if (!newDetailInline || !newDetailInline.detail_name || !newDetailInline.detail_type) {
      toast.error("Please fill in detail name and type");
      return;
    }

    let savedDetail = { ...newDetailInline };

    // If propertyId exists, save to database
    if (propertyId) {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('property_details')
        .insert({
          property_id: propertyId,
          detail_name: newDetailInline.detail_name,
          detail_type: newDetailInline.detail_type,
          description: newDetailInline.description || ""
        })
        .select()
        .single();

      if (error) {
        console.error("Error creating property detail:", error);
        toast.error("Failed to save detail");
        return;
      }

      savedDetail.id = data.id;
      savedDetail.isNew = false;

      // Upload any pending images
      if (newDetailInline.images.length > 0) {
        await uploadPendingImages(data.id, newDetailInline.images);
      }
    }

    const updatedDetails = [...details, savedDetail];
    setDetails(updatedDetails);
    
    if (onDetailsUpdated) {
      onDetailsUpdated(updatedDetails);
    }

    setNewDetailInline(null);
    toast.success("Detail added successfully");
  };

  // Cancel inline editing
  const handleCancelInline = () => {
    setNewDetailInline(null);
  };

  // Upload pending images for a detail
  const uploadPendingImages = async (detailId: string, images: PropertyDetailImage[]) => {
    const supabase = createClient();
    
    for (let i = 0; i < images.length; i++) {
      const img = images[i];
      if (img.file) {
        try {
          const formData = new FormData();
          formData.append('file', img.file);
          formData.append('filePath', `property-details/${propertyId}/${detailId}/${img.file.name}`);

          const response = await fetch('/api/upload', {
            method: 'POST',
            body: formData,
          });

          const result = await response.json();

          if (response.ok && result.url) {
            await supabase
              .from('property_detail_images')
              .insert({
                property_detail_id: detailId,
                image_url: result.url,
                display_order: i
              });
          }
        } catch (error) {
          console.error("Error uploading image:", error);
        }
      }
    }
  };

  // Handle image selection for inline detail
  const handleInlineImageSelect = (files: FileList) => {
    if (!newDetailInline) return;

    const newImages: PropertyDetailImage[] = Array.from(files).map((file, idx) => ({
      id: `temp-img-${Date.now()}-${idx}`,
      image_url: URL.createObjectURL(file),
      display_order: newDetailInline.images.length + idx,
      file
    }));

    setNewDetailInline({
      ...newDetailInline,
      images: [...newDetailInline.images, ...newImages]
    });
  };

  // Handle image uploads for existing detail
  const handleImageUpload = async (detailId: string, files: FileList) => {
    if (!files || files.length === 0) return;

    setUploading(prev => new Set(prev).add(detailId));
    const supabase = createClient();
    const detail = details.find(d => d.id === detailId);
    const newImages: PropertyDetailImage[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const timestamp = Date.now();
      const fileName = `${timestamp}-${file.name.replace(/\s+/g, '-')}`;
      const filePath = `property-details/${propertyId || 'temp'}/${detailId}/${fileName}`;

      try {
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
          id: `temp-${timestamp}-${i}`,
          image_url: result.url,
          display_order: detail ? detail.images.length + i : i
        };

        if (propertyId && !detailId.startsWith('temp-')) {
          const { data: savedImage, error: imageError } = await supabase
            .from('property_detail_images')
            .insert({
              property_detail_id: detailId,
              image_url: result.url,
              display_order: imageData.display_order
            })
            .select()
            .single();

          if (!imageError && savedImage) {
            imageData.id = savedImage.id;
          }
        }

        newImages.push(imageData);
      } catch (error) {
        console.error("Error uploading image:", error);
      }
    }

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

    setUploading(prev => {
      const newSet = new Set(prev);
      newSet.delete(detailId);
      return newSet;
    });

    if (newImages.length > 0) {
      toast.success(`${newImages.length} image(s) uploaded`);
    }
  };

  const handleRemoveInlineImage = (imageId: string) => {
    if (!newDetailInline) return;

    const img = newDetailInline.images.find(i => i.id === imageId);
    if (img?.image_url.startsWith('blob:')) {
      URL.revokeObjectURL(img.image_url);
    }

    setNewDetailInline({
      ...newDetailInline,
      images: newDetailInline.images.filter(img => img.id !== imageId)
    });
  };

  const handleRemoveImage = async (detailId: string, imageId: string) => {
    if (propertyId && !imageId.startsWith('temp-')) {
      const supabase = createClient();
      const { error } = await supabase
        .from('property_detail_images')
        .delete()
        .eq('id', imageId);

      if (error) {
        console.error("Error deleting image:", error);
        toast.error("Failed to delete image");
        return;
      }
    }

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

    toast.success("Image removed");
  };

  const handleRemoveDetail = async (detailId: string) => {
    if (propertyId && !detailId.startsWith('temp-')) {
      const supabase = createClient();
      const { error } = await supabase
        .from('property_details')
        .delete()
        .eq('id', detailId);

      if (error) {
        console.error("Error deleting detail:", error);
        toast.error("Failed to delete detail");
        return;
      }
    }

    const updatedDetails = details.filter(d => d.id !== detailId);
    setDetails(updatedDetails);
    
    if (onDetailsUpdated) {
      onDetailsUpdated(updatedDetails);
    }

    if (updatedDetails.length === 0) {
      setShowTemplates(true);
    }

    toast.success("Detail removed");
  };

  // Drag and drop handlers
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, detailId?: string) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      if (detailId) {
        handleImageUpload(detailId, e.dataTransfer.files);
      } else if (newDetailInline) {
        handleInlineImageSelect(e.dataTransfer.files);
      }
    }
  }, [newDetailInline]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Property Details</span>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">{details.length} details</Badge>
            {details.length > 0 && !newDetailInline && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowTemplates(!showTemplates)}
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                Add More
              </Button>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Quick Templates */}
        {showTemplates && !newDetailInline && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <Label className="text-sm font-medium">Quick Add Common Details</Label>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
              {DETAIL_TEMPLATES.map((template, idx) => (
                <Button
                  key={idx}
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickAdd(template)}
                  className="justify-start gap-2 h-auto py-2"
                >
                  <span className="text-lg">{template.icon}</span>
                  <span className="text-xs">{template.name}</span>
                </Button>
              ))}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleAddCustom}
              className="w-full gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Custom Detail
            </Button>
          </div>
        )}

        {/* Inline Detail Editor */}
        {newDetailInline && (
          <Card className="border-2 border-primary/50 bg-primary/5">
            <CardContent className="pt-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="inline-detail-type">Type *</Label>
                  <Select
                    value={newDetailInline.detail_type}
                    onValueChange={(val) =>
                      setNewDetailInline({ ...newDetailInline, detail_type: val })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
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
                  <Label htmlFor="inline-detail-name">Name *</Label>
                  <Input
                    id="inline-detail-name"
                    placeholder="e.g., Master Bedroom"
                    value={newDetailInline.detail_name}
                    onChange={(e) =>
                      setNewDetailInline({ ...newDetailInline, detail_name: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="inline-detail-description">Description (Optional)</Label>
                <Textarea
                  id="inline-detail-description"
                  placeholder="Add details..."
                  value={newDetailInline.description ?? ''}
                  onChange={(e) =>
                    setNewDetailInline({ ...newDetailInline, description: e.target.value })
                  }
                  rows={2}
                />
              </div>

              {/* Drag and Drop Image Area */}
              <div
                className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                  dragActive
                    ? "border-primary bg-primary/10"
                    : "border-muted-foreground/25 hover:border-muted-foreground/50"
                }`}
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={(e) => handleDrop(e)}
              >
                <input
                  type="file"
                  id="inline-image-upload"
                  className="hidden"
                  multiple
                  accept="image/*"
                  onChange={(e) => e.target.files && handleInlineImageSelect(e.target.files)}
                />
                <label htmlFor="inline-image-upload" className="cursor-pointer">
                  <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm font-medium mb-1">
                    Drop images here or click to upload
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Upload multiple images at once
                  </p>
                </label>
              </div>

              {/* Preview Images */}
              {newDetailInline.images.length > 0 && (
                <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
                  {newDetailInline.images.map((img) => (
                    <div key={img.id} className="relative group aspect-square">
                      <img
                        src={img.image_url}
                        alt="Preview"
                        className="object-cover w-full h-full rounded-md border"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => handleRemoveInlineImage(img.id)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancelInline}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={handleSaveInlineDetail}
                  disabled={!newDetailInline.detail_name || !newDetailInline.detail_type}
                  className="flex-1 gap-2"
                >
                  <Check className="h-4 w-4" />
                  Save Detail
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Existing Details - Compact Grid View */}
        {details.length > 0 && (
          <div className="space-y-3">
            <Label className="text-sm font-medium">Added Details</Label>
            <div className="grid gap-3">
              {details.map((detail) => (
                <Card key={detail.id} className="overflow-hidden">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold">{detail.detail_name}</h4>
                          <Badge variant="secondary" className="text-xs">
                            {detail.detail_type}
                          </Badge>
                        </div>
                        {detail.description && (
                          <p className="text-sm text-muted-foreground">{detail.description}</p>
                        )}
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => handleRemoveDetail(detail.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    {/* Images Grid */}
                    <div className="space-y-2">
                      {detail.images.length > 0 && (
                        <div className="grid grid-cols-4 md:grid-cols-6 gap-2">
                          {detail.images.map((img) => (
                            <div key={img.id} className="relative group aspect-square">
                              <img
                                src={img.image_url}
                                alt={detail.detail_name}
                                className="object-cover w-full h-full rounded-md border"
                              />
                              <Button
                                type="button"
                                variant="destructive"
                                size="icon"
                                className="absolute top-0.5 right-0.5 h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={() => handleRemoveImage(detail.id, img.id)}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Add More Images */}
                      <div
                        className={`relative border border-dashed rounded-md p-3 text-center transition-colors hover:border-primary/50 hover:bg-primary/5 ${
                          uploading.has(detail.id) ? "opacity-50" : ""
                        }`}
                        onDragEnter={handleDrag}
                        onDragOver={handleDrag}
                        onDragLeave={handleDrag}
                        onDrop={(e) => handleDrop(e, detail.id)}
                      >
                        <input
                          type="file"
                          id={`image-upload-${detail.id}`}
                          className="hidden"
                          multiple
                          accept="image/*"
                          onChange={(e) =>
                            e.target.files && handleImageUpload(detail.id, e.target.files)
                          }
                        />
                        <label htmlFor={`image-upload-${detail.id}`} className="cursor-pointer">
                          {uploading.has(detail.id) ? (
                            <div className="flex items-center justify-center gap-2">
                              <Loader2 className="h-4 w-4 animate-spin" />
                              <span className="text-xs">Uploading...</span>
                            </div>
                          ) : (
                            <div className="flex items-center justify-center gap-2">
                              <Plus className="h-4 w-4" />
                              <span className="text-xs">
                                {detail.images.length === 0
                                  ? "Add images"
                                  : "Add more images"}
                              </span>
                            </div>
                          )}
                        </label>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {details.length === 0 && !newDetailInline && !showTemplates && (
          <div className="flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-12 text-center">
            <ImageIcon className="h-12 w-12 text-muted-foreground mb-3" />
            <p className="text-muted-foreground mb-4">
              No property details added yet
            </p>
            <Button onClick={() => setShowTemplates(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Add First Detail
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
