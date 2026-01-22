"use client"

import { useState, useRef } from "react"
import { Upload } from "lucide-react"

interface ImageUploadAreaProps {
  onUploadSuccess: (url: string) => void
  isLoading: boolean
}

/**
 * Image upload area component with drag-and-drop support
 */
export function ImageUploadArea({ onUploadSuccess, isLoading }: ImageUploadAreaProps) {
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUploadClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleFiles = async (files: FileList) => {
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      // Upload the file to Supabase storage
      try {
        const timestamp = Date.now();
        const fileName = `${timestamp}-${file.name.replace(/\s+/g, '-')}`;
        const filePath = `properties/${fileName}`;
        
        const formData = new FormData();
        formData.append('file', file);
        formData.append('filePath', filePath);
        
        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });
        
        if (!response.ok) {
          throw new Error('Upload failed');
        }
        
        const result = await response.json();
        
        if (result.url) {
          onUploadSuccess(result.url);
        }
      } catch (error) {
        console.error('Error uploading file:', error);
        alert(`Failed to upload ${file.name}`);
      }
    }
  };

  const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  return (
    <div 
      className={`relative border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
        dragActive ? "border-primary bg-primary/5" : "border-gray-300 hover:border-gray-400"
      }`}
      onClick={handleUploadClick}
      onDragEnter={handleDrag}
      onDragOver={handleDrag}
      onDragLeave={handleDrag}
      onDrop={handleDrop}
    >
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        multiple
        accept="image/*"
        onChange={handleFileChange}
      />
      
      <div className="flex flex-col items-center justify-center gap-3">
        <Upload className="h-8 w-8 text-muted-foreground" />
        <div className="flex flex-col gap-1">
          <p className="font-medium">Click to upload or drag and drop</p>
          <p className="text-sm text-muted-foreground">PNG, JPG, GIF up to 5MB</p>
        </div>
      </div>
      
      {dragActive && (
        <div className="absolute inset-0 bg-primary/10 rounded-lg flex items-center justify-center">
          <div className="bg-primary text-primary-foreground rounded-full p-3">
            <Upload className="h-8 w-8" />
          </div>
        </div>
      )}
    </div>
  );
}
