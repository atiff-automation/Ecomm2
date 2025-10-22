'use client';

import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { fetchWithCSRF } from '@/lib/utils/fetch-with-csrf';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DragEndEvent,
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  GripVertical,
  Edit3,
  Trash2,
  Eye,
  EyeOff,
  Image as ImageIcon,
} from 'lucide-react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

// ==================== INTERFACES ====================

interface HeroSlide {
  id: string;
  imageUrl: string;
  altText?: string;
  order: number;
  isActive: boolean;
  mediaId?: string; // Track media upload ID for deletion
}

interface SlideManagerProps {
  slides: HeroSlide[];
  onChange: (slides: HeroSlide[]) => void;
  isLoading?: boolean;
}

interface SortableSlideProps {
  slide: HeroSlide;
  onEdit: (slide: HeroSlide) => void;
  onDelete: (slideId: string) => void;
  onToggleActive: (slideId: string, isActive: boolean) => void;
}

// ==================== SORTABLE SLIDE COMPONENT ====================

function SortableSlide({
  slide,
  onEdit,
  onDelete,
  onToggleActive,
}: SortableSlideProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: slide.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'bg-white border rounded-lg p-4 space-y-3',
        isDragging && 'opacity-50',
        !slide.isActive && 'opacity-75 bg-muted/20'
      )}
    >
      <div className="flex items-center gap-3 w-full">
        {/* Drag Handle */}
        <button
          className="flex items-center justify-center w-8 h-8 rounded bg-muted hover:bg-muted/80 transition-colors cursor-grab active:cursor-grabbing"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </button>

        {/* Slide Preview */}
        <div className="relative w-16 h-16 rounded-md overflow-hidden bg-muted flex-shrink-0">
          <Image
            src={slide.imageUrl}
            alt={slide.altText || `Slide ${slide.order + 1}`}
            fill
            className="object-cover"
            sizes="64px"
          />
        </div>

        {/* Slide Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="font-medium text-sm truncate">
              Slide {slide.order + 1}
            </h4>
            <Badge
              variant={slide.isActive ? 'default' : 'secondary'}
              className="text-xs"
            >
              {slide.isActive ? 'Active' : 'Hidden'}
            </Badge>
          </div>
          {slide.altText && (
            <p className="text-xs text-muted-foreground truncate">
              {slide.altText}
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onToggleActive(slide.id, !slide.isActive)}
            className="h-8 w-8 p-0 hover:bg-muted"
            title={slide.isActive ? 'Hide slide' : 'Show slide'}
          >
            {slide.isActive ? (
              <Eye className="h-4 w-4" />
            ) : (
              <EyeOff className="h-4 w-4" />
            )}
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(slide)}
            className="h-8 w-8 p-0 hover:bg-muted"
            title="Edit slide"
          >
            <Edit3 className="h-4 w-4" />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              if (
                window.confirm(
                  'Are you sure you want to delete this slide? This action cannot be undone and will also remove the image file from the server.'
                )
              ) {
                onDelete(slide.id);
              }
            }}
            className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
            title="Delete slide"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

// ==================== SLIDE EDIT DIALOG ====================

interface SlideEditDialogProps {
  slide: HeroSlide | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (slide: HeroSlide) => void;
}

function SlideEditDialog({
  slide,
  open,
  onOpenChange,
  onSave,
}: SlideEditDialogProps) {
  const [altText, setAltText] = useState(slide?.altText || '');

  React.useEffect(() => {
    setAltText(slide?.altText || '');
  }, [slide]);

  const handleSave = useCallback(() => {
    if (!slide) {
      return;
    }

    const updatedSlide: HeroSlide = {
      ...slide,
      altText: altText.trim() || undefined,
    };

    onSave(updatedSlide);
    onOpenChange(false);
  }, [slide, altText, onSave, onOpenChange]);

  if (!slide) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Slide</DialogTitle>
          <DialogDescription>
            Update the slide details and accessibility information.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Slide Preview */}
          <div className="relative w-full h-48 rounded-md overflow-hidden bg-muted">
            <Image
              src={slide.imageUrl}
              alt={slide.altText || `Slide ${slide.order + 1}`}
              fill
              className="object-cover"
            />
          </div>

          {/* Alt Text Input */}
          <div className="space-y-2">
            <Label htmlFor="alt-text">
              Alt Text
              <span className="text-xs text-muted-foreground ml-1">
                (optional)
              </span>
            </Label>
            <Input
              id="alt-text"
              value={altText}
              onChange={e => setAltText(e.target.value)}
              placeholder={`Slide ${slide.order + 1} description`}
              maxLength={200}
            />
            <div className="text-xs text-muted-foreground">
              Helps screen readers describe this image ({altText.length}/200)
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ==================== MAIN COMPONENT ====================

export function SlideManager({
  slides,
  onChange,
  isLoading = false,
}: SlideManagerProps) {
  const [editingSlide, setEditingSlide] = useState<HeroSlide | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // ==================== HANDLERS ====================

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;

      if (over && active.id !== over.id) {
        const oldIndex = slides.findIndex(slide => slide.id === active.id);
        const newIndex = slides.findIndex(slide => slide.id === over.id);

        if (oldIndex !== -1 && newIndex !== -1) {
          const reorderedSlides = arrayMove(slides, oldIndex, newIndex).map(
            (slide, index) => ({ ...slide, order: index })
          );
          onChange(reorderedSlides);
          toast.success('Slides reordered successfully');
        }
      }
    },
    [slides, onChange]
  );

  const handleEditSlide = useCallback((slide: HeroSlide) => {
    setEditingSlide(slide);
    setIsEditDialogOpen(true);
  }, []);

  const handleSaveSlide = useCallback(
    (updatedSlide: HeroSlide) => {
      const updatedSlides = slides.map(slide =>
        slide.id === updatedSlide.id ? updatedSlide : slide
      );
      onChange(updatedSlides);
      toast.success('Slide updated successfully');
    },
    [slides, onChange]
  );

  const handleDeleteSlide = useCallback(
    async (slideId: string) => {
      const slideToDelete = slides.find(slide => slide.id === slideId);

      if (slideToDelete?.mediaId) {
        try {
          // Delete the media file from server
          const response = await fetch(
            `/api/admin/site-customization/media/upload?id=${slideToDelete.mediaId}`,
            { method: 'DELETE' }
          );

          if (!response.ok) {
            console.warn(
              'Failed to delete media file, but continuing with slide removal'
            );
          }
        } catch (error) {
          console.warn('Error deleting media file:', error);
          // Continue with slide removal even if media deletion fails
        }
      }

      // Remove slide from configuration
      const updatedSlides = slides
        .filter(slide => slide.id !== slideId)
        .map((slide, index) => ({ ...slide, order: index }));
      onChange(updatedSlides);
      toast.success('Slide deleted successfully');
    },
    [slides, onChange]
  );

  const handleToggleActive = useCallback(
    (slideId: string, isActive: boolean) => {
      const updatedSlides = slides.map(slide =>
        slide.id === slideId ? { ...slide, isActive } : slide
      );
      onChange(updatedSlides);
      toast.success(`Slide ${isActive ? 'shown' : 'hidden'} successfully`);
    },
    [slides, onChange]
  );

  // ==================== RENDER ====================

  if (slides.length === 0) {
    return null;
  }

  const activeSlides = slides.filter(slide => slide.isActive);
  const inactiveSlides = slides.filter(slide => !slide.isActive);

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ImageIcon className="h-4 w-4" />
              <CardTitle>Manage Slides</CardTitle>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="default">{activeSlides.length} Active</Badge>
              {inactiveSlides.length > 0 && (
                <Badge variant="secondary">
                  {inactiveSlides.length} Hidden
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground">
              Drag slides to reorder them. Click the eye icon to show/hide
              slides.
            </div>

            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={slides.map(slide => slide.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-2">
                  {slides.map(slide => (
                    <SortableSlide
                      key={slide.id}
                      slide={slide}
                      onEdit={handleEditSlide}
                      onDelete={handleDeleteSlide}
                      onToggleActive={handleToggleActive}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          </div>
        </CardContent>
      </Card>

      <SlideEditDialog
        slide={editingSlide}
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        onSave={handleSaveSlide}
      />
    </>
  );
}
