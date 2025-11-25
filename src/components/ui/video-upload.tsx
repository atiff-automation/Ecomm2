/**
 * Video Upload Component - JRM E-commerce Platform
 * Drag & drop video upload with preview and validation
 */

'use client';

import React, { useState, useCallback, useRef } from 'react';
import { Button } from './button';
import { Progress } from './progress';
import {
  Upload,
  X,
  Video as VideoIcon,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { fetchWithCSRF } from '@/lib/utils/fetch-with-csrf';

export interface UploadedVideo {
  url: string;
  filename?: string;
  size?: number;
  type?: string;
}

interface VideoUploadProps {
  value?: UploadedVideo | null;
  onChange?: (video: UploadedVideo | null) => void;
  maxSize?: number; // in bytes, default 100MB
  className?: string;
  disabled?: boolean;
  uploadPath?: string;
}

const DEFAULT_MAX_SIZE = 100 * 1024 * 1024; // 100MB
const ACCEPTED_VIDEO_TYPES = [
  'video/mp4',
  'video/webm',
  'video/ogg',
  'video/quicktime',
];

export default function VideoUpload({
  value,
  onChange,
  maxSize = DEFAULT_MAX_SIZE,
  className,
  disabled = false,
  uploadPath = '/api/upload/video',
}: VideoUploadProps) {
  const [video, setVideo] = useState<UploadedVideo | null>(value || null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const validateFile = (file: File): string | null => {
    // Check file type
    if (!ACCEPTED_VIDEO_TYPES.includes(file.type)) {
      return `Invalid file type. Only MP4, WebM, OGG, and MOV are allowed.`;
    }

    // Check file size
    if (file.size > maxSize) {
      const maxSizeMB = Math.round(maxSize / (1024 * 1024));
      return `File size exceeds ${maxSizeMB}MB limit.`;
    }

    return null;
  };

  const uploadFile = async (file: File): Promise<UploadedVideo | null> => {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetchWithCSRF(uploadPath, {
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

  const handleFile = useCallback(
    async (file: File) => {
      if (disabled) return;

      const validationError = validateFile(file);
      if (validationError) {
        setError(validationError);
        return;
      }

      setError(null);
      setUploading(true);
      setUploadProgress(0);

      try {
        // Simulate progress
        const progressInterval = setInterval(() => {
          setUploadProgress((prev) => Math.min(prev + 10, 90));
        }, 200);

        const result = await uploadFile(file);

        clearInterval(progressInterval);
        setUploadProgress(100);

        if (result) {
          setVideo(result);
          onChange?.(result);
        }
      } catch (error) {
        setError(`Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      } finally {
        setUploading(false);
        setUploadProgress(0);
      }
    },
    [disabled, maxSize, onChange, uploadPath]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragActive(false);

      const file = e.dataTransfer.files[0];
      if (file) {
        handleFile(file);
      }
    },
    [handleFile]
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
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  const removeVideo = async () => {
    if (video?.filename) {
      try {
        await fetchWithCSRF(`${uploadPath}?filename=${video.filename}`, {
          method: 'DELETE',
        });
      } catch (error) {
        console.error('Failed to delete video:', error);
      }
    }

    setVideo(null);
    onChange?.(null);
  };

  const clearError = () => setError(null);

  return (
    <div className={cn('space-y-4', className)}>
      {/* Video Preview */}
      {video && !uploading && (
        <div className="relative border rounded-lg overflow-hidden bg-black">
          <video
            src={video.url}
            controls
            className="w-full h-auto max-h-[400px] object-contain"
          >
            Your browser does not support the video tag.
          </video>

          {/* Video Info */}
          {video.size && (
            <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-75 text-white p-2 text-xs">
              <p>{formatFileSize(video.size)}</p>
            </div>
          )}

          {/* Remove Button */}
          <Button
            variant="destructive"
            size="sm"
            className="absolute top-2 right-2 h-8 w-8 p-0"
            onClick={removeVideo}
            disabled={disabled}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Upload Area */}
      {!video && (
        <div
          className={cn(
            'border-2 border-dashed rounded-lg p-8 transition-colors cursor-pointer',
            dragActive
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-300 hover:border-gray-400',
            disabled && 'cursor-not-allowed opacity-50'
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
                <p className="text-sm text-gray-600">Uploading video...</p>
                <Progress
                  value={uploadProgress}
                  className="w-full max-w-xs mx-auto"
                />
              </div>
            ) : (
              <>
                <VideoIcon className="h-12 w-12 mx-auto text-gray-400 mb-3" />
                <p className="text-sm font-medium">
                  Drop video here or click to upload
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  MP4, WebM, OGG, MOV supported
                </p>
                <p className="text-xs text-gray-500">
                  Max {Math.round(maxSize / (1024 * 1024))}MB
                </p>
              </>
            )}
          </div>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPTED_VIDEO_TYPES.join(',')}
        onChange={handleFileSelect}
        className="hidden"
        disabled={disabled}
      />

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-3">
          <div className="flex items-start">
            <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 mr-2 flex-shrink-0" />
            <div className="flex-1">
              <h4 className="text-sm font-medium text-red-800">Upload Error:</h4>
              <p className="mt-1 text-xs text-red-700">{error}</p>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearError}
                className="mt-2 h-6 px-2 text-xs text-red-600 hover:text-red-700"
              >
                Clear
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
