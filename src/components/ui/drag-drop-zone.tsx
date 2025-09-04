/**
 * DragDropZone Component - Malaysian E-commerce Platform
 * Reusable drag & drop file upload component with modern UI
 * Centralized implementation following DRY principles
 */

'use client';

import React, { useState, useCallback, useRef } from 'react';
import { Upload, X, FileImage, Video, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import Image from 'next/image';

// Centralized file type configurations
export const FILE_CONFIGS = {
  hero_background: {
    accept: 'image/*,video/mp4,video/webm',
    acceptedTypes: ['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/webm'],
    maxSize: 10 * 1024 * 1024, // 10MB
    icon: FileImage,
    title: 'Drop media here',
    subtitle: 'or click to browse',
    description: 'Images: PNG, JPG, WebP | Videos: MP4, WebM',
    sizeText: 'Max size: 10MB'
  },
  logo: {
    accept: 'image/png,image/jpeg,image/jpg,image/svg+xml,image/webp',
    acceptedTypes: ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml', 'image/webp'],
    maxSize: 5 * 1024 * 1024, // 5MB
    icon: FileImage,
    title: 'Drop logo here',
    subtitle: 'or click to browse',
    description: 'PNG, JPEG, SVG, WebP',
    sizeText: 'Max size: 5MB',
    recommendation: 'Recommended: 120×40px'
  },
  favicon: {
    accept: 'image/png,image/x-icon,image/vnd.microsoft.icon',
    acceptedTypes: ['image/png', 'image/x-icon', 'image/vnd.microsoft.icon'],
    maxSize: 1 * 1024 * 1024, // 1MB
    icon: Star,
    title: 'Drop favicon here',
    subtitle: 'or click to browse',
    description: 'PNG, ICO formats',
    sizeText: 'Max size: 1MB',
    recommendation: 'Recommended: 32×32px'
  }
} as const;

export type FileType = keyof typeof FILE_CONFIGS;

interface DragDropZoneProps {
  type: FileType;
  onUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  currentFile?: {
    url: string;
    width?: number;
    height?: number;
  } | null;
  onRemove?: () => void;
  isUploading?: boolean;
  uploadProgress?: number;
  disabled?: boolean;
  className?: string;
}

export function DragDropZone({
  type,
  onUpload,
  currentFile,
  onRemove,
  isUploading = false,
  uploadProgress = 0,
  disabled = false,
  className
}: DragDropZoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const config = FILE_CONFIGS[type];
  const IconComponent = config.icon;

  // Centralized file validation
  const validateFile = useCallback((file: File): string | null => {
    // Check file type
    if (!config.acceptedTypes.includes(file.type)) {
      return `Invalid file type. Supported: ${config.description}`;
    }
    
    // Check file size
    if (file.size > config.maxSize) {
      const sizeMB = (config.maxSize / (1024 * 1024)).toFixed(0);
      return `File too large. Maximum size: ${sizeMB}MB`;
    }
    
    return null;
  }, [config]);

  // Drag & drop handlers
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled && !isUploading) {
      setIsDragOver(true);
    }
  }, [disabled, isUploading]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.currentTarget.contains(e.relatedTarget as Node)) {
      return;
    }
    setIsDragOver(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    setError(null);

    if (disabled || isUploading) return;

    const files = Array.from(e.dataTransfer.files);
    if (files.length === 0) return;

    const file = files[0];
    const validationError = validateFile(file);
    
    if (validationError) {
      setError(validationError);
      return;
    }

    // Create synthetic event for consistency with file input
    const syntheticEvent = {
      target: { files: [file] }
    } as React.ChangeEvent<HTMLInputElement>;
    
    onUpload(syntheticEvent);
  }, [disabled, isUploading, validateFile, onUpload]);

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const file = e.target.files?.[0];
    
    if (!file) return;

    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    onUpload(e);
  }, [validateFile, onUpload]);

  const handleClick = useCallback(() => {
    if (!disabled && !isUploading && fileInputRef.current) {
      fileInputRef.current.click();
    }
  }, [disabled, isUploading]);

  // Render current file preview
  const renderCurrentFile = () => {
    if (!currentFile) return null;

    return (
      <div className="border rounded-lg p-3 bg-white">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-gray-500">Current:</span>
          {onRemove && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onRemove}
              className="h-6 px-2 text-xs"
              disabled={disabled || isUploading}
            >
              <X className="w-3 h-3 mr-1" />
              Remove
            </Button>
          )}
        </div>
        
        <div className="flex items-center justify-center p-3 bg-gray-50 rounded">
          {type === 'hero_background' ? (
            <div className="text-center">
              <Video className="w-8 h-8 text-gray-400 mx-auto mb-1" />
              <p className="text-xs text-gray-500">Background media</p>
            </div>
          ) : (
            <Image
              src={currentFile.url}
              alt="Current file"
              width={type === 'favicon' ? 32 : currentFile.width || 120}
              height={type === 'favicon' ? 32 : currentFile.height || 40}
              className={cn(
                "max-w-full h-auto",
                type === 'logo' && "max-h-12",
                type === 'favicon' && "border"
              )}
            />
          )}
        </div>
        
        {currentFile.width && currentFile.height && type !== 'hero_background' && (
          <p className="text-xs text-gray-400 text-center mt-1">
            {currentFile.width}×{currentFile.height}px
          </p>
        )}
      </div>
    );
  };

  return (
    <div className={cn("space-y-3", className)}>
      {/* Current file preview */}
      {currentFile && renderCurrentFile()}
      
      {/* Upload progress */}
      {isUploading && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-gray-600">
            <span>Uploading...</span>
            <span>{uploadProgress}%</span>
          </div>
          <Progress value={uploadProgress} className="h-1" />
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded px-2 py-1">
          {error}
        </div>
      )}

      {/* Drag & drop zone */}
      <div
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={handleClick}
        className={cn(
          "relative border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all duration-200",
          "hover:border-blue-300 hover:bg-blue-50/50",
          isDragOver && "border-blue-400 bg-blue-50 scale-[1.02]",
          disabled && "opacity-50 cursor-not-allowed",
          isUploading && "cursor-wait",
          error ? "border-red-300 bg-red-50" : "border-gray-300 bg-gray-50"
        )}
      >
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept={config.accept}
          onChange={handleFileInputChange}
          disabled={disabled || isUploading}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          aria-label={`Upload ${type} file`}
        />

        {/* Upload icon and text */}
        <div className="space-y-2">
          <IconComponent 
            className={cn(
              "w-8 h-8 mx-auto transition-colors",
              isDragOver ? "text-blue-500" : "text-gray-400"
            )} 
          />
          
          <div className="space-y-1">
            <p className={cn(
              "text-sm font-medium transition-colors",
              isDragOver ? "text-blue-600" : "text-gray-600"
            )}>
              {config.title}
            </p>
            <p className="text-xs text-gray-500">{config.subtitle}</p>
          </div>
          
          <div className="space-y-0.5">
            <p className="text-xs text-gray-400">{config.description}</p>
            <p className="text-xs text-gray-400">{config.sizeText}</p>
            {config.recommendation && (
              <p className="text-xs text-gray-400">{config.recommendation}</p>
            )}
          </div>
        </div>

        {/* Drag overlay */}
        {isDragOver && (
          <div className="absolute inset-0 bg-blue-100/50 border-2 border-blue-400 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <Upload className="w-8 h-8 text-blue-500 mx-auto mb-2" />
              <p className="text-sm font-medium text-blue-600">Drop to upload</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}