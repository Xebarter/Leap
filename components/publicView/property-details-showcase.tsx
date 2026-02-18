"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogTitle, DialogHeader } from "@/components/ui/dialog";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { PropertyDetail } from "@/lib/properties";
import { Button } from "@/components/ui/button";

interface PropertyDetailsShowcaseProps {
  details: PropertyDetail[];
}

export function PropertyDetailsShowcase({ details }: PropertyDetailsShowcaseProps) {
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
  const [currentDetailId, setCurrentDetailId] = useState<string | null>(null);

  if (!details || details.length === 0) {
    return null;
  }

  // Get all images for the current detail
  const getCurrentDetailImages = () => {
    if (!currentDetailId) return [];
    const detail = details.find(d => d.id === currentDetailId);
    return detail?.images || [];
  };

  const currentImages = getCurrentDetailImages();

  const handleImageClick = (detailId: string, imageIndex: number) => {
    setCurrentDetailId(detailId);
    setSelectedImageIndex(imageIndex);
  };

  const handlePrevImage = () => {
    if (selectedImageIndex !== null && selectedImageIndex > 0) {
      setSelectedImageIndex(selectedImageIndex - 1);
    }
  };

  const handleNextImage = () => {
    if (selectedImageIndex !== null && selectedImageIndex < currentImages.length - 1) {
      setSelectedImageIndex(selectedImageIndex + 1);
    }
  };

  const handleCloseDialog = () => {
    setSelectedImageIndex(null);
    setCurrentDetailId(null);
  };

  // Group details by type
  const groupedDetails = details.reduce((acc, detail) => {
    if (!acc[detail.detail_type]) {
      acc[detail.detail_type] = [];
    }
    acc[detail.detail_type].push(detail);
    return acc;
  }, {} as Record<string, PropertyDetail[]>);

  return (
    <>
      <Card className="border-none shadow-none bg-muted/50">
        <CardHeader>
          <CardTitle>Property Details & Images</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {Object.entries(groupedDetails).map(([type, typeDetails]) => (
            <div key={type} className="space-y-3">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-sm font-semibold">
                  {type}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {typeDetails.length} {typeDetails.length === 1 ? 'item' : 'items'}
                </span>
              </div>

              <div className="grid gap-4">
                {typeDetails.map((detail) => (
                  <div key={detail.id} className="space-y-2">
                    <div>
                      <h4 className="font-medium text-base">{detail.detail_name}</h4>
                      {detail.description && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {detail.description}
                        </p>
                      )}
                    </div>

                    {/* Images Grid */}
                    {detail.images && detail.images.length > 0 && (
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                        {detail.images.map((image, idx) => (
                          <div
                            key={image.id}
                            className="relative aspect-square rounded-lg overflow-hidden cursor-pointer group border border-border hover:border-primary transition-colors"
                            onClick={() => handleImageClick(detail.id, idx)}
                          >
                            <Image
                              src={image.image_url}
                              alt={`${detail.detail_name} - Image ${idx + 1}`}
                              fill
                              className="object-cover group-hover:scale-105 transition-transform duration-200"
                              sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
                            />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                              <span className="text-white opacity-0 group-hover:opacity-100 transition-opacity text-sm font-medium">
                                View
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Image Lightbox Dialog */}
      <Dialog open={selectedImageIndex !== null} onOpenChange={handleCloseDialog}>
        <DialogContent className="max-w-5xl w-full p-0 bg-black/95 border-none">
          <DialogHeader className="sr-only">
            <DialogTitle>Property Image Gallery</DialogTitle>
          </DialogHeader>
          <div className="relative w-full h-[80vh]">
            {/* Close Button */}
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 z-50 text-white hover:bg-white/20"
              onClick={handleCloseDialog}
            >
              <X className="h-6 w-6" />
            </Button>

            {/* Navigation Buttons */}
            {selectedImageIndex !== null && currentImages.length > 1 && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute left-4 top-1/2 -translate-y-1/2 z-50 text-white hover:bg-white/20 disabled:opacity-30"
                  onClick={handlePrevImage}
                  disabled={selectedImageIndex === 0}
                >
                  <ChevronLeft className="h-8 w-8" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-4 top-1/2 -translate-y-1/2 z-50 text-white hover:bg-white/20 disabled:opacity-30"
                  onClick={handleNextImage}
                  disabled={selectedImageIndex === currentImages.length - 1}
                >
                  <ChevronRight className="h-8 w-8" />
                </Button>
              </>
            )}

            {/* Image */}
            {selectedImageIndex !== null && currentImages[selectedImageIndex] && (
              <div className="relative w-full h-full">
                <Image
                  src={currentImages[selectedImageIndex].image_url}
                  alt={`Detail image ${selectedImageIndex + 1}`}
                  fill
                  className="object-contain"
                  sizes="100vw"
                  priority
                />
              </div>
            )}

            {/* Image Counter */}
            {selectedImageIndex !== null && currentImages.length > 0 && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-50 bg-black/70 text-white px-4 py-2 rounded-full text-sm">
                {selectedImageIndex + 1} / {currentImages.length}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
