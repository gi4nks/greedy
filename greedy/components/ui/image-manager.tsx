'use client';

import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Upload, X, AlertCircle, Plus, Camera } from 'lucide-react';
import { EntityType, ImageInfo, parseImagesJson, ImageUploadResult } from '@/lib/utils/imageUtils.client';
import { showToast } from '@/lib/toast';

interface ImageManagerProps {
  entityType: EntityType;
  entityId: number;
  currentImages: unknown;
  onImagesChange: (images: ImageInfo[]) => void;
  className?: string;
}

export function ImageManager({
  entityType,
  entityId,
  currentImages,
  onImagesChange,
  className = ''
}: ImageManagerProps) {
  const [images, setImages] = useState<ImageInfo[]>(() => parseImagesJson(currentImages));
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    setUploading(true);

    try {
      // Create FormData for upload
      const formData = new FormData();
      files.forEach((file, index) => {
        formData.append(`file_${index}`, file);
      });
      formData.append('entityType', entityType);
      formData.append('entityId', entityId.toString());

      // Upload images via API
      const response = await fetch('/api/images/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const results = await response.json();
      
      // Filter successful uploads
      const successfulUploads = results
        .filter((result: ImageUploadResult) => result.success)
        .map((result: ImageUploadResult) => ({
          filename: result.filename!,
          url: result.url!,
          thumbnailUrl: result.thumbnailUrl,
          uploadedAt: new Date().toISOString()
        }));

      // Update images array
      const updatedImages = [...images, ...successfulUploads];
      setImages(updatedImages);
      onImagesChange(updatedImages);

      // Show success toast
      if (successfulUploads.length > 0) {
        showToast.success(
          `Uploaded ${successfulUploads.length} image${successfulUploads.length > 1 ? 's' : ''}`,
          'Images have been optimized and saved successfully'
        );
      }

      // Check for errors
      const failedUploads = results.filter((result: ImageUploadResult) => !result.success);
      if (failedUploads.length > 0) {
        showToast.error(
          `${failedUploads.length} upload${failedUploads.length > 1 ? 's' : ''} failed`,
          failedUploads.map((r: ImageUploadResult) => r.error).join(', ')
        );
      }
    } catch (error) {
      console.error('Upload error:', error);
      showToast.error('Upload failed', 'Please try again');
    } finally {
      setUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveImage = async (image: ImageInfo) => {
    try {
      // Delete from server
      const response = await fetch('/api/images/delete', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          filename: image.filename,
          entityType,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to delete image');
      }

      // Remove from state
      const updatedImages = images.filter(img => img.filename !== image.filename);
      setImages(updatedImages);
      onImagesChange(updatedImages);

      showToast.success('Image deleted', 'The image has been removed successfully');
    } catch (error) {
      console.error('Delete error:', error);
      showToast.error('Delete failed', 'Failed to delete the image');
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      // Create a proper FileList-like object
      const fileList = files as unknown as FileList;
      const changeEvent = {
        target: {
          files: fileList
        }
      } as unknown as React.ChangeEvent<HTMLInputElement>;
      handleFileSelect(changeEvent);
    }
  };

  const entityTypeNames: Record<EntityType, string> = {
    adventures: 'Adventure',
    sessions: 'Session', 
    quests: 'Quest',
    characters: 'Character',
    locations: 'Location',
    'magic-items': 'Magic Item'
  };

  return (
    <div className={className}>
      <Input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-base-content mb-2">
          {entityTypeNames[entityType] || 'Entity'} Images
        </h2>
        <p className="text-base-content/70">
          Upload and manage images for this {(entityTypeNames[entityType] || 'entity').toLowerCase()}. 
          You can add multiple images to create a visual gallery.
        </p>
      </div>

      {/* Main Content */}
      <div className="space-y-6">
        {images.length > 0 ? (
          <>
            {/* Images Grid with Upload Card */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {/* Add New Image Card */}
              <Card 
                className="border-2 border-dashed border-blue-300 bg-blue-50 hover:bg-blue-100 transition-colors cursor-pointer group"
                onClick={triggerFileSelect}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
              >
                <CardContent className="p-0">
                  <div className="aspect-square flex flex-col items-center justify-center text-blue-600">
                    {uploading ? (
                      <>
                        <Upload className="h-8 w-8 mb-2 animate-pulse" />
                        <span className="text-sm font-medium">Uploading...</span>
                      </>
                    ) : (
                      <>
                        <Plus className="h-8 w-8 mb-2 group-hover:scale-110 transition-transform" />
                        <span className="text-sm font-medium">Add Image</span>
                        <span className="text-xs opacity-75 mt-1">Click or drag</span>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Existing Images */}
              {images.map((image) => (
                <Card key={image.filename} className="relative group overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                  <CardContent className="p-0">
                    <div className="aspect-square relative">
                      <img
                        src={image.thumbnailUrl || image.url}
                        alt={`${entityType} image`}
                        className="w-full h-full object-cover transition-transform group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="absolute bottom-2 left-2 right-2 flex justify-center">
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleRemoveImage(image)}
                            className="flex items-center gap-1 text-xs"
                          >
                            <X className="h-3 w-3" />
                            Remove
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            
            {/* Upload Info */}
            <div className="flex items-center justify-between text-sm text-base-content/70">
              <span>{images.length} image{images.length !== 1 ? 's' : ''}</span>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs">
                  JPG, PNG, WebP • Max 5MB
                </Badge>
              </div>
            </div>
          </>
        ) : (
          /* Empty State - Large Upload Area */
          <Card 
            className="border-2 border-dashed border-base-300 bg-base-200 hover:bg-base-300 transition-colors cursor-pointer"
            onClick={triggerFileSelect}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          >
            <CardContent className="p-12 text-center">
              {uploading ? (
                <div className="space-y-4">
                  <Upload className="h-16 w-16 mx-auto text-blue-500 animate-pulse" />
                  <div>
                    <h3 className="text-lg font-medium text-base-content">Uploading images...</h3>
                    <p className="text-sm text-base-content/70 mt-1">Please wait while we process your files</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                    <Camera className="h-8 w-8 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-base-content">Upload images</h3>
                    <p className="text-sm text-base-content/70 mt-1">
                      Drag and drop your images here, or click to browse
                    </p>
                  </div>
                  <div className="flex items-center justify-center gap-4">
                    <Button
                      type="button"
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                      disabled={uploading}
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Choose Files
                    </Button>
                  </div>
                  <div className="text-xs text-base-content/60">
                    Supports: JPG, PNG, WebP, GIF • Maximum 5MB per file
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}