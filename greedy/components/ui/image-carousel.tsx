'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ChevronLeft, ChevronRight, Image as ImageIcon } from 'lucide-react';
import { ImageInfo } from '@/lib/utils/imageUtils.client';

interface EntityImageCarouselProps {
  images: ImageInfo[];
  entityType?: string; // e.g., 'adventure', 'session', 'quest', 'character'
  className?: string;
}

export function EntityImageCarousel({
  images,
  entityType = 'entity',
  className = ''
}: EntityImageCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const carouselRef = useRef<HTMLDivElement>(null);

  // Minimum swipe distance (in px)
  const minSwipeDistance = 50;

  const goToPrevious = useCallback(() => {
    setCurrentIndex((prevIndex) =>
      prevIndex === 0 ? images.length - 1 : prevIndex - 1
    );
  }, [images.length]);

  const goToNext = useCallback(() => {
    setCurrentIndex((prevIndex) =>
      prevIndex === images.length - 1 ? 0 : prevIndex + 1
    );
  }, [images.length]);

  const goToSlide = (slideIndex: number) => {
    setCurrentIndex(slideIndex);
  };

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    if (isLeftSwipe) {
      goToNext();
    }
    if (isRightSwipe) {
      goToPrevious();
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'ArrowLeft') {
        goToPrevious();
      } else if (event.key === 'ArrowRight') {
        goToNext();
      }
    };

    const carouselElement = carouselRef.current;
    if (carouselElement) {
      carouselElement.addEventListener('keydown', handleKeyDown);
      return () => {
        carouselElement.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [goToNext, goToPrevious]);

  if (!images || images.length === 0) {
    return (
      <Card className={`w-full ${className}`}>
        <CardContent className="p-8 text-center">
          <ImageIcon className="w-12 h-12 mx-auto text-base-content/40 mb-4" />
          <p className="text-base-content/60">No images available</p>
        </CardContent>
      </Card>
    );
  }

  const currentImage = images[currentIndex];

  return (
    <Card className={`w-full overflow-hidden ${className}`} ref={carouselRef} tabIndex={0}>
      <CardContent className="p-0 relative">
        {/* Main Image */}
        <div
          className="relative aspect-video bg-base-200"
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          <img
            src={currentImage.url}
            alt={`${entityType} image ${currentIndex + 1}`}
            className="w-full h-full object-cover"
          />

          {/* Navigation Arrows */}
          {images.length > 1 && (
            <>
              <Button
                variant="secondary"
                size="sm"
                className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white border-0"
                onClick={goToPrevious}
                aria-label="Previous image"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="secondary"
                size="sm"
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white border-0"
                onClick={goToNext}
                aria-label="Next image"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </>
          )}
        </div>

        {/* Image Counter */}
        {images.length > 1 && (
          <div className="absolute top-2 right-2 bg-black/50 text-white px-2 py-1 rounded text-sm">
            {currentIndex + 1} / {images.length}
          </div>
        )}

        {/* Thumbnail Navigation */}
        {images.length > 1 && (
          <div className="flex justify-center gap-2 p-4 bg-base-100">
            {images.map((image, index) => (
              <button
                key={image.filename}
                onClick={() => goToSlide(index)}
                className={`relative w-16 h-16 rounded overflow-hidden border-2 transition-all ${
                  index === currentIndex
                    ? 'border-primary ring-2 ring-primary/20'
                    : 'border-base-300 hover:border-base-content/50'
                }`}
                aria-label={`Go to image ${index + 1}`}
              >
                <img
                  src={image.url}
                  alt={`Thumbnail ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Legacy export for backward compatibility
export const ImageCarousel = EntityImageCarousel;