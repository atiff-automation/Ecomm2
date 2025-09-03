/**
 * Image Upload Component - JRM E-commerce Platform
 * Drag & drop image upload with preview and validation
 */

'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import Image from 'next/image';
import { Button } from './button';
import { Progress } from './progress';
import { Badge } from './badge';
import {
  Upload,
  X,
  Image as ImageIcon,
  AlertCircle,
  CheckCircle,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface UploadedImage {
  url: string;
  altText?: string;
  filename?: string;
  width?: number;
  height?: number;
  size?: number;
}

interface ImageUploadProps {
  // Legacy props
  onUpload?: (images: UploadedImage[]) => void;
  onRemove?: (index: number) => void;
  initialImages?: UploadedImage[];
  acceptedTypes?: string[];
  
  // New props to match ProductForm interface
  value?: UploadedImage[];
  onChange?: (images: UploadedImage[]) => void;
  accept?: string;
  uploadPath?: string;
  
  maxFiles?: number;
  maxSize?: number; // in bytes
  className?: string;
  disabled?: boolean;
}

export default function ImageUpload({
  // Legacy props
  onUpload,
  onRemove,
  initialImages = [],
  acceptedTypes = ['image/jpeg', 'image/png', 'image/webp'],
  
  // New props
  value,
  onChange,
  accept,
  uploadPath,
  
  maxFiles = 5,
  maxSize = 10 * 1024 * 1024, // Default 10MB in bytes
  className,
  disabled = false,
}: ImageUploadProps) {
  // Support both interfaces - prefer new props over legacy
  const currentImages = value || initialImages;
  const currentOnChange = onChange || onUpload;
  
  // Parse accept prop if provided
  const currentAcceptedTypes = accept 
    ? accept.split(',').map(type => type.trim())
    : acceptedTypes;
  
  const [images, setImages] = useState<UploadedImage[]>(currentImages);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync images state when value prop changes (for controlled component)
  useEffect(() => {
    if (value && JSON.stringify(value) !== JSON.stringify(images)) {
      setImages(value);
    }
  }, [value]);

  // Update parent when images change
  useEffect(() => {
    if (currentOnChange && JSON.stringify(images) !== JSON.stringify(currentImages)) {
      currentOnChange(images);
    }
  }, [images, currentOnChange]);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) {
      return '0 Bytes';
    }
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const validateFiles = (
    files: File[]
  ): { valid: File[]; errors: string[] } => {
    const valid: File[] = [];
    const newErrors: string[] = [];

    for (const file of files) {
      // Check file type
      if (!currentAcceptedTypes.includes(file.type)) {
        newErrors.push(
          `${file.name}: Invalid file type. Only JPEG, PNG, and WebP are allowed.`
        );
        continue;
      }

      // Check file size (maxSize is now in bytes)
      if (file.size > maxSize) {
        const maxSizeMB = Math.round(maxSize / (1024 * 1024));
        newErrors.push(`${file.name}: File size exceeds ${maxSizeMB}MB limit.`);
        continue;
      }

      // Check total count
      if (images.length + valid.length >= maxFiles) {
        newErrors.push(`Maximum ${maxFiles} images allowed.`);
        break;
      }

      valid.push(file);
    }

    return { valid, errors: newErrors };
  };

  const uploadFile = async (file: File): Promise<UploadedImage | null> => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('maxWidth', '1200');
      formData.append('maxHeight', '1200');
      formData.append('quality', '85');
      formData.append('format', 'webp');
      formData.append('thumbnail', 'true');

      const response = await fetch(uploadPath || '/api/upload/image', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Upload failed');
      }

      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('Upload error:', error);
      throw error;
    }
  };

  const handleFiles = useCallback(
    async (files: File[]) => {
      if (disabled || files.length === 0) {
        return;
      }

      const { valid, errors: validationErrors } = validateFiles(files);
      setErrors(validationErrors);

      if (valid.length === 0) {
        return;
      }

      setUploading(true);
      setUploadProgress(0);

      const uploaded: UploadedImage[] = [];
      let successCount = 0;

      for (let i = 0; i < valid.length; i++) {
        try {
          const result = await uploadFile(valid[i]);
          if (result) {
            uploaded.push(result);
            successCount++;
          }
        } catch (error) {
          setErrors(prev => [...prev, `${valid[i].name}: Upload failed`]);
        }

        setUploadProgress(((i + 1) / valid.length) * 100);
      }

      if (uploaded.length > 0) {
        const newImages = [...images, ...uploaded];
        setImages(newImages);
        currentOnChange?.(newImages);
      }

      setUploading(false);
      setUploadProgress(0);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [images, disabled, maxFiles, maxSize, currentAcceptedTypes, currentOnChange]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragActive(false);

      const files = Array.from(e.dataTransfer.files);
      handleFiles(files);
    },
    [handleFiles]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    handleFiles(files);
  };

  const removeImage = async (index: number) => {
    const image = images[index];

    // Only try to delete from server if image has filename (was uploaded)
    if (image.filename) {
      try {
        await fetch(`/api/upload/image?filename=${image.filename}`, {
          method: 'DELETE',
        });
      } catch (error) {
        console.error('Failed to delete image:', error);
      }
    }

    const newImages = images.filter((_, i) => i !== index);
    setImages(newImages);
    onRemove?.(index);
    currentOnChange?.(newImages);
  };

  const clearErrors = () => setErrors([]);

  return (
    <div className={cn('space-y-4', className)}>
      {/* Upload Area */}
      <div
        className={cn(
          'border-2 border-dashed rounded-lg p-6 transition-colors cursor-pointer',
          dragActive
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => !disabled && fileInputRef.current?.click()}
      >
        <div className="text-center">
          {uploading ? (
            <div className="space-y-2">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-500" />
              <p className="text-sm text-gray-600">Uploading...</p>
              <Progress
                value={uploadProgress}
                className="w-full max-w-xs mx-auto"
              />
            </div>
          ) : (
            <>
              <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
              <p className="text-sm font-medium">
                Drop images here or click to upload
              </p>
              <p className="text-xs text-gray-500">
                Max {maxFiles} images, up to {maxSize}MB each
              </p>
              <p className="text-xs text-gray-500">JPEG, PNG, WebP supported</p>
            </>
          )}
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept={acceptedTypes.join(',')}
        onChange={handleFileSelect}
        className="hidden"
        disabled={disabled}
      />

      {/* Error Messages */}
      {errors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-md p-3">
          <div className="flex items-start">
            <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 mr-2 flex-shrink-0" />
            <div className="flex-1">
              <h4 className="text-sm font-medium text-red-800">
                Upload Errors:
              </h4>
              <ul className="mt-1 text-xs text-red-700 space-y-1">
                {errors.map((error, index) => (
                  <li key={index}>• {error}</li>
                ))}
              </ul>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearErrors}
                className="mt-2 h-6 px-2 text-xs text-red-600 hover:text-red-700"
              >
                Clear
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Image Grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {images.map((image, index) => (
            <div
              key={index}
              className="relative group border rounded-lg overflow-hidden"
            >
              <div className="aspect-square bg-gray-100 flex items-center justify-center">
                <Image
                  src={image.url}
                  alt={`Upload ${index + 1}`}
                  width={200}
                  height={200}
                  className="w-full h-full object-cover"
                  unoptimized={false}
                />
              </div>

              {/* Image Info */}
              <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-75 text-white p-2 text-xs">
                <p className="truncate">
                  {image.width && image.height 
                    ? `${image.width} × ${image.height}` 
                    : 'Unknown dimensions'
                  }
                </p>
                <p>
                  {image.size > 0 
                    ? formatFileSize(image.size) 
                    : 'Existing image'
                  }
                </p>
              </div>

              {/* Remove Button */}
              <Button
                variant="destructive"
                size="sm"
                className="absolute top-2 right-2 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={e => {
                  e.stopPropagation();
                  removeImage(index);
                }}
                disabled={disabled}
              >
                <X className="h-3 w-3" />
              </Button>

              {/* Success Indicator */}
              <div className="absolute top-2 left-2 h-6 w-6 bg-green-500 rounded-full flex items-center justify-center">
                <CheckCircle className="h-3 w-3 text-white" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Stats */}
      {images.length > 0 && (
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>
            {images.length} of {maxFiles} images uploaded
          </span>
          <span>
            Total:{' '}
            {formatFileSize(images.reduce((acc, img) => acc + (img.size || 0), 0))}
          </span>
        </div>
      )}
    </div>
  );
}
