import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useToast } from './Toast';
import { EntityImage } from '@greedy/shared';

interface ImageUploadProps {
  entityId: number;
  entityType: 'adventures' | 'sessions' | 'quests' | 'characters' | 'magic_items' | 'npcs';
  onImagesChanged?: (images: EntityImage[]) => void;
  className?: string;
  maxImages?: number;
  showInForm?: boolean;
  previewOnly?: boolean;
}

const ImageUpload: React.FC<ImageUploadProps> = ({
  entityId,
  entityType,
  onImagesChanged,
  className = '',
  maxImages = 20,
  showInForm = false,
  previewOnly = false
}) => {
  const [isDeleting, setIsDeleting] = useState<number | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<EntityImage | null>(null);
  const [currentImages, setCurrentImages] = useState<EntityImage[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const toast = useToast();

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    if (currentImages.length + files.length > maxImages) {
      toast.push(`Cannot upload more than ${maxImages} images`, { type: 'error' });
      return;
    }

    // Validate files
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file.type.startsWith('image/')) {
        toast.push(`File "${file.name}" is not an image`, { type: 'error' });
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.push(`File "${file.name}" is larger than 5MB`, { type: 'error' });
        return;
      }
    }

    // Upload each file
    for (let i = 0; i < files.length; i++) {
      await uploadImage(files[i]);
    }
  };

  const uploadImage = async (file: File) => {
    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch(`/api/images/${entityType}/${entityId}`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to upload image');
      }

      await response.json();
      toast.push('Image uploaded successfully', { type: 'success' });

      // Refresh images
      void refreshImages();

      // Clear the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      toast.push(error instanceof Error ? error.message : 'Failed to upload image', { type: 'error' });
    }
  };

  const deleteImage = async (imageId: number) => {
    setIsDeleting(imageId);
    try {
      const response = await fetch(`/api/images/${entityType}/${entityId}/${imageId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete image');
      }

      toast.push('Image deleted successfully', { type: 'success' });

      // Refresh images
      void refreshImages();
    } catch (error) {
      toast.push(error instanceof Error ? error.message : 'Failed to delete image', { type: 'error' });
    } finally {
      setIsDeleting(null);
    }
  };

  const refreshImages = useCallback(async () => {
    try {
      const response = await fetch(`/api/images/${entityType}/${entityId}`);
      if (response.ok) {
        const newImages = await response.json();
        setCurrentImages(newImages);
        onImagesChanged?.(newImages);
      }
    } catch (error) {
      // Failed to refresh images - ignore silently as this is a background operation
    }
  }, [entityId, entityType, onImagesChanged]);

    const handleDropZoneDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      // Create a synthetic event for the file input
      const syntheticEvent = {
        target: { files }
      } as React.ChangeEvent<HTMLInputElement>;
      void handleFileSelect(syntheticEvent);
    }
  };

  const getImageUrl = (imagePath: string) => {
    // Remove the 'images/' prefix if present, since the backend route expects just the category/filename
    const cleanPath = imagePath.startsWith('images/') ? imagePath.substring(7) : imagePath;
    return `/api/images/${cleanPath}`;
  };

  // Refresh images on mount and when entityId/entityType changes
  useEffect(() => {
    void refreshImages();
  }, [entityId, entityType, refreshImages]);

  const canUploadMore = currentImages.length < maxImages;

  return (
    <div className={`image-upload ${className}`}>
      {/* Header with controls - Hidden in preview mode unless in form */}
      {(!previewOnly || showInForm) && currentImages.length > 0 && (
        <div className="flex items-center justify-between mb-4">
          <div className="text-sm text-base-content/60">
            {currentImages.length} image{currentImages.length !== 1 ? 's' : ''} uploaded
          </div>
        </div>
      )}      {/* Upload Zone - Show when there are images and can upload more */}
      {(!previewOnly || showInForm) && canUploadMore && currentImages.length > 0 && (
        <div
          onDrop={handleDropZoneDrop}
          className={`
            relative border-2 border-dashed rounded-xl p-8 mb-6 transition-all duration-200 cursor-pointer
            ${dragOver
              ? 'border-primary bg-primary/10 scale-105'
              : 'border-base-300 hover:border-primary hover:bg-base-100'
            }
          `}
          onClick={() => fileInputRef.current?.click()}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              fileInputRef.current?.click();
            }
          }}
          tabIndex={0}
          role="button"
          aria-label="Upload images"
        >
          <div className="text-center">
            <div className={`mx-auto w-16 h-16 mb-4 rounded-full flex items-center justify-center transition-all duration-200 ${
              dragOver ? 'bg-primary text-primary-content' : 'bg-base-200 text-base-content/60'
            }`}>
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            <div className="space-y-2">
              <p className="text-lg font-medium text-base-content">
                {dragOver ? 'Drop images here' : 'Add more images'}
              </p>
              <p className="text-sm text-base-content/60">
                or click to browse files • PNG, JPG, GIF up to 5MB each
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Images Grid */}
      {currentImages.length > 0 ? (
        <div className={`grid gap-4 ${
          showInForm
            ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4'
            : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
        }`}>
          {currentImages.map((image, index) => (
            <div
              key={image.id}
              className={`
                relative group rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-200
              `}
            >
              {/* Image */}
              <div className="aspect-square relative">
                <img
                  src={getImageUrl(image.image_path)}
                  alt={`Upload ${index + 1}`}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />

                {/* Delete Icon - Hidden in preview mode unless in form */}
                {!previewOnly || showInForm && (
                  <div className="absolute top-2 right-2 z-10">
                    <button
                      type="button"
                      onClick={() => void deleteImage(image.id)}
                      disabled={isDeleting === image.id}
                      className="btn btn-circle btn-error btn-xs opacity-75 hover:opacity-100 transition-opacity"
                      title="Delete image"
                    >
                      {isDeleting === image.id ? (
                        <div className="loading loading-spinner loading-xs"></div>
                      ) : (
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      )}
                    </button>
                  </div>
                )}

                {/* Hover Overlay */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/60 transition-all duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setLightboxImage(image)}
                      className="btn btn-circle btn-ghost btn-sm text-white hover:bg-white/20"
                      title="View full size"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </button>

                    {/* Delete button in hover overlay - Hidden in preview mode unless in form */}
                    {!previewOnly || showInForm && (
                      <button
                        type="button"
                        onClick={() => void deleteImage(image.id)}
                        disabled={isDeleting === image.id}
                        className="btn btn-circle btn-error btn-sm"
                        title="Delete image"
                      >
                        {isDeleting === image.id ? (
                          <div className="loading loading-spinner loading-xs"></div>
                        ) : (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Upload Zone - Show when no images and can upload more */
        (!previewOnly || showInForm) && canUploadMore ? (
          <div
            onDrop={handleDropZoneDrop}
            className={`
              relative border-2 border-dashed rounded-xl p-8 mb-6 transition-all duration-200 cursor-pointer
              ${dragOver
                ? 'border-primary bg-primary/10 scale-105'
                : 'border-base-300 hover:border-primary hover:bg-base-100'
              }
            `}
            onClick={() => fileInputRef.current?.click()}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                fileInputRef.current?.click();
              }
            }}
            tabIndex={0}
            role="button"
            aria-label="Upload images"
          >
            <div className="text-center">
              <div className={`mx-auto w-16 h-16 mb-4 rounded-full flex items-center justify-center transition-all duration-200 ${
                dragOver ? 'bg-primary text-primary-content' : 'bg-base-200 text-base-content/60'
              }`}>
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
              <div className="space-y-2">
                <p className="text-lg font-medium text-base-content">
                  {dragOver ? 'Drop images here' : 'Drag & drop images here'}
                </p>
                <p className="text-sm text-base-content/60">
                  or click to browse files • PNG, JPG, GIF up to 5MB each
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-base-content/40 mb-2">
              <svg className="mx-auto w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="text-base-content/60">No images uploaded yet</p>
          </div>
        )
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
        aria-label="Upload images"
      />

      {/* Lightbox */}
      {lightboxImage && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4" onClick={() => setLightboxImage(null)}
             onKeyDown={(e) => {
               if (e.key === 'Escape') {
                 setLightboxImage(null);
               }
             }}
             tabIndex={-1}
             role="dialog"
             aria-modal="true"
             aria-label="Image lightbox"
        >
          <div className="relative max-w-4xl max-h-full">
            <img
              src={getImageUrl(lightboxImage.image_path)}
              alt="Full size upload"
              className="max-w-full max-h-full object-contain"
            />
            <button
              type="button"
              onClick={() => setLightboxImage(null)}
              className="absolute top-4 right-4 btn btn-circle btn-ghost text-white hover:bg-white/20"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageUpload;