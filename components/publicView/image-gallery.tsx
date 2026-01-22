"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ImageGalleryProps {
  images: string[];
  title: string;
}

export function ImageGallery({ images, title }: ImageGalleryProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState<number | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const openLightbox = (index: number) => {
    setCurrentImageIndex(index);
    setIsFullscreen(true);
  };

  const closeLightbox = () => {
    setCurrentImageIndex(null);
    setIsFullscreen(false);
  };

  const nextImage = () => {
    if (currentImageIndex !== null && images.length > 0) {
      setCurrentImageIndex((currentImageIndex + 1) % images.length);
    }
  };

  const prevImage = () => {
    if (currentImageIndex !== null && images.length > 0) {
      setCurrentImageIndex(
        (currentImageIndex - 1 + images.length) % images.length
      );
    }
  };

  // Handle keyboard events
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isFullscreen) {
        if (e.key === "Escape") {
          closeLightbox();
        } else if (e.key === "ArrowRight") {
          nextImage();
        } else if (e.key === "ArrowLeft") {
          prevImage();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isFullscreen, currentImageIndex, images.length]);

  if (images.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Property Images</h2>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {images.map((img, index) => (
          <div 
            key={index} 
            className="relative aspect-video cursor-pointer overflow-hidden rounded-lg transition-transform hover:scale-[0.98] hover:shadow-md"
            onClick={() => openLightbox(index)}
          >
            <Image
              src={img}
              alt={`${title} image ${index + 1}`}
              fill
              className="object-cover"
            />
          </div>
        ))}
      </div>

      {/* Lightbox */}
      {currentImageIndex !== null && isFullscreen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur"
          onClick={closeLightbox}
        >
          <div className="relative w-full max-w-6xl p-4">
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 top-2 z-10 h-10 w-10 rounded-full bg-white/20 text-white hover:bg-white/30"
              onClick={closeLightbox}
            >
              <X className="h-6 w-6" />
            </Button>
            
            <div className="relative aspect-video w-full overflow-hidden rounded-lg">
              <Image
                src={images[currentImageIndex]}
                alt={`${title} image ${currentImageIndex + 1}`}
                fill
                className="object-contain"
              />
            </div>
            
            <Button
              variant="ghost"
              size="icon"
              className="absolute left-2 top-1/2 z-10 h-12 w-12 -translate-y-1/2 rounded-full bg-white/20 text-white hover:bg-white/30"
              onClick={(e) => {
                e.stopPropagation();
                prevImage();
              }}
            >
              <ChevronLeft className="h-8 w-8" />
            </Button>
            
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 top-1/2 z-10 h-12 w-12 -translate-y-1/2 rounded-full bg-white/20 text-white hover:bg-white/30"
              onClick={(e) => {
                e.stopPropagation();
                nextImage();
              }}
            >
              <ChevronRight className="h-8 w-8" />
            </Button>
            
            <div className="absolute bottom-4 left-1/2 z-10 w-full -translate-x-1/2 text-center text-sm text-white">
              {currentImageIndex + 1} of {images.length}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}