'use client';

import React, { useRef, useState } from 'react';
import { chatUtils } from './utils/chat-utils';
import type { ChatAttachment } from './types';

interface MediaUploadProps {
  onFileUpload: (files: File[], attachments: ChatAttachment[]) => void;
  disabled?: boolean;
  maxFiles?: number;
  maxFileSize?: number; // in MB
  acceptedTypes?: string[];
  config?: {
    enableDragDrop?: boolean;
    showPreview?: boolean;
    enableCompression?: boolean;
  };
}

/**
 * Media Upload Component
 * Handles file uploads with drag-and-drop, preview, and validation
 * Follows DRY principles with centralized configuration
 */
export const MediaUpload: React.FC<MediaUploadProps> = ({
  onFileUpload,
  disabled = false,
  maxFiles = 5,
  maxFileSize = 10, // 10MB default
  acceptedTypes = ['image/*', 'video/*', 'audio/*', 'application/pdf', '.doc,.docx'],
  config = {}
}) => {
  const {
    enableDragDrop = true,
    showPreview = true,
    enableCompression = true
  } = config;

  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [previews, setPreviews] = useState<ChatAttachment[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): { valid: boolean; error?: string } => {
    // Size validation
    if (file.size > maxFileSize * 1024 * 1024) {
      return {
        valid: false,
        error: `File "${file.name}" exceeds ${maxFileSize}MB limit`
      };
    }

    // Type validation
    const isValidType = acceptedTypes.some(type => {
      if (type.includes('*')) {
        const baseType = type.split('/')[0];
        return file.type.startsWith(baseType + '/');
      }
      return type.includes(file.type) || file.name.toLowerCase().endsWith(type);
    });

    if (!isValidType) {
      return {
        valid: false,
        error: `File type "${file.type}" is not supported`
      };
    }

    return { valid: true };
  };

  const processFiles = async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    
    if (fileArray.length > maxFiles) {
      alert(`You can only upload up to ${maxFiles} files at once`);
      return;
    }

    const validFiles: File[] = [];
    const tempAttachments: ChatAttachment[] = [];

    // Validate all files first
    for (const file of fileArray) {
      const validation = validateFile(file);
      
      if (!validation.valid) {
        alert(validation.error);
        continue;
      }

      validFiles.push(file);

      // Create temporary attachment metadata for preview
      const tempAttachment: ChatAttachment = {
        type: getAttachmentType(file),
        url: URL.createObjectURL(file), // Temporary URL for preview
        title: file.name,
        size: file.size,
        mimeType: file.type,
        thumbnail: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined
      };

      tempAttachments.push(tempAttachment);
    }

    if (validFiles.length === 0) {
      return;
    }

    // Update previews immediately for better UX
    if (showPreview) {
      setPreviews(prev => [...prev, ...tempAttachments]);
    }

    try {
      // Upload files to server
      const formData = new FormData();
      validFiles.forEach(file => {
        formData.append('files', file);
      });

      // Show upload progress
      const uploadPromises = validFiles.map((file, index) => {
        const fileId = `${file.name}-${Date.now()}-${index}`;
        setUploadProgress(prev => ({ ...prev, [fileId]: 0 }));
        return fileId;
      });

      const response = await fetch('/api/chat/upload', {
        method: 'POST',
        body: formData
      });

      // Clear upload progress
      uploadPromises.forEach(fileId => {
        setUploadProgress(prev => {
          const updated = { ...prev };
          delete updated[fileId];
          return updated;
        });
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Upload failed');
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Upload failed');
      }

      // Convert server response to attachments
      const serverAttachments: ChatAttachment[] = result.files.map((file: any) => ({
        type: file.type === 'document' ? 'file' : file.type,
        url: file.url,
        title: file.originalName,
        size: file.size,
        mimeType: file.mimeType,
        thumbnail: file.type === 'image' ? file.url : undefined
      }));

      // Replace temp attachments with server URLs
      if (showPreview) {
        setPreviews(prev => {
          // Remove temp attachments and add server attachments
          const withoutTemp = prev.filter(att => 
            !tempAttachments.some(temp => temp.title === att.title)
          );
          
          // Revoke temp URLs
          tempAttachments.forEach(temp => {
            if (temp.url.startsWith('blob:')) {
              URL.revokeObjectURL(temp.url);
            }
            if (temp.thumbnail?.startsWith('blob:')) {
              URL.revokeObjectURL(temp.thumbnail);
            }
          });
          
          return [...withoutTemp, ...serverAttachments];
        });
      }

      // Call parent handler with server URLs
      onFileUpload(validFiles, serverAttachments);

    } catch (error) {
      console.error('Upload error:', error);
      alert(`Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      
      // Remove temp previews on error
      if (showPreview) {
        setPreviews(prev => {
          const withoutTemp = prev.filter(att => 
            !tempAttachments.some(temp => temp.title === att.title)
          );
          
          // Revoke temp URLs
          tempAttachments.forEach(temp => {
            if (temp.url.startsWith('blob:')) {
              URL.revokeObjectURL(temp.url);
            }
            if (temp.thumbnail?.startsWith('blob:')) {
              URL.revokeObjectURL(temp.thumbnail);
            }
          });
          
          return withoutTemp;
        });
      }

      // Clear any upload progress
      validFiles.forEach((file, index) => {
        const fileId = `${file.name}-${Date.now()}-${index}`;
        setUploadProgress(prev => {
          const updated = { ...prev };
          delete updated[fileId];
          return updated;
        });
      });
    }
  };

  const getAttachmentType = (file: File): ChatAttachment['type'] => {
    if (file.type.startsWith('image/')) return 'image';
    if (file.type.startsWith('video/')) return 'file';
    if (file.type.startsWith('audio/')) return 'file';
    return 'file';
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      processFiles(files);
    }
    // Reset input value to allow same file selection
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    if (disabled || !enableDragDrop) return;
    setIsDragOver(true);
  };

  const handleDragLeave = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragOver(false);
    
    if (disabled || !enableDragDrop) return;

    const files = event.dataTransfer.files;
    if (files && files.length > 0) {
      processFiles(files);
    }
  };

  const removePreview = (index: number) => {
    setPreviews(prev => {
      const updated = prev.filter((_, i) => i !== index);
      // Revoke object URLs to prevent memory leaks
      const removed = prev[index];
      if (removed.url.startsWith('blob:')) {
        URL.revokeObjectURL(removed.url);
      }
      if (removed.thumbnail?.startsWith('blob:')) {
        URL.revokeObjectURL(removed.thumbnail);
      }
      return updated;
    });
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getAcceptString = () => {
    return acceptedTypes.join(',');
  };

  return (
    <div className="media-upload">
      {enableDragDrop && (
        <div
          className={`media-upload__drop-zone ${isDragOver ? 'media-upload__drop-zone--active' : ''} ${disabled ? 'media-upload__drop-zone--disabled' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => !disabled && fileInputRef.current?.click()}
        >
          <div className="media-upload__drop-zone-content">
            <div className="media-upload__drop-zone-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 15V3M12 3L8 7M12 3L16 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M2 17L2 19C2 20.1046 2.89543 21 4 21L20 21C21.1046 21 22 20.1046 22 19L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>
            <div className="media-upload__drop-zone-text">
              <p className="media-upload__drop-zone-primary">
                {isDragOver ? 'Drop files here' : 'Click to upload or drag and drop'}
              </p>
              <p className="media-upload__drop-zone-secondary">
                Max {maxFiles} files, up to {maxFileSize}MB each
              </p>
            </div>
          </div>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept={getAcceptString()}
        onChange={handleFileSelect}
        disabled={disabled}
        style={{ display: 'none' }}
        aria-label="Upload files"
      />

      {!enableDragDrop && (
        <button
          type="button"
          className="media-upload__button"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled}
        >
          <span className="media-upload__button-icon">📎</span>
          <span className="media-upload__button-text">Attach Files</span>
        </button>
      )}

      {showPreview && previews.length > 0 && (
        <div className="media-upload__previews">
          <div className="media-upload__previews-header">
            <span className="media-upload__previews-title">
              {previews.length} file{previews.length > 1 ? 's' : ''} selected
            </span>
            <button
              type="button"
              className="media-upload__clear-all"
              onClick={() => {
                // Revoke all object URLs
                previews.forEach(preview => {
                  if (preview.url.startsWith('blob:')) {
                    URL.revokeObjectURL(preview.url);
                  }
                  if (preview.thumbnail?.startsWith('blob:')) {
                    URL.revokeObjectURL(preview.thumbnail);
                  }
                });
                setPreviews([]);
              }}
            >
              Clear All
            </button>
          </div>
          
          <div className="media-upload__previews-list">
            {previews.map((attachment, index) => (
              <div key={`preview-${index}`} className="media-upload__preview">
                <div className="media-upload__preview-content">
                  {attachment.type === 'image' && attachment.thumbnail ? (
                    <div className="media-upload__preview-image">
                      <img
                        src={attachment.thumbnail}
                        alt={attachment.title || 'Preview'}
                        onError={(e) => {
                          const img = e.target as HTMLImageElement;
                          img.style.display = 'none';
                        }}
                      />
                    </div>
                  ) : (
                    <div className="media-upload__preview-icon">
                      {attachment.type === 'image' ? '🖼️' : '📄'}
                    </div>
                  )}
                  
                  <div className="media-upload__preview-info">
                    <div className="media-upload__preview-name">
                      {attachment.title}
                    </div>
                    <div className="media-upload__preview-size">
                      {formatFileSize(attachment.size || 0)}
                    </div>
                  </div>
                </div>
                
                <button
                  type="button"
                  className="media-upload__preview-remove"
                  onClick={() => removePreview(index)}
                  aria-label={`Remove ${attachment.title}`}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <style jsx>{`
        .media-upload {
          margin: 12px 0;
        }

        .media-upload__drop-zone {
          border: 2px dashed #cbd5e0;
          border-radius: 8px;
          padding: 24px;
          text-align: center;
          cursor: pointer;
          transition: all 200ms ease;
          background: #f8f9fa;
        }

        .media-upload__drop-zone:hover:not(.media-upload__drop-zone--disabled) {
          border-color: #007bff;
          background: #f0f7ff;
        }

        .media-upload__drop-zone--active {
          border-color: #007bff;
          background: #e6f3ff;
          transform: scale(1.02);
        }

        .media-upload__drop-zone--disabled {
          opacity: 0.5;
          cursor: not-allowed;
          background: #f1f3f4;
        }

        .media-upload__drop-zone-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
        }

        .media-upload__drop-zone-icon {
          color: #6c757d;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .media-upload__drop-zone--active .media-upload__drop-zone-icon {
          color: #007bff;
        }

        .media-upload__drop-zone-text {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .media-upload__drop-zone-primary {
          font-size: 14px;
          font-weight: 500;
          color: #374151;
          margin: 0;
        }

        .media-upload__drop-zone-secondary {
          font-size: 12px;
          color: #6c757d;
          margin: 0;
        }

        .media-upload__button {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          border: 1px solid #e1e5e9;
          border-radius: 6px;
          background: white;
          color: #374151;
          font-size: 14px;
          cursor: pointer;
          transition: all 200ms ease;
        }

        .media-upload__button:hover:not(:disabled) {
          border-color: #007bff;
          background: #f8f9ff;
          color: #007bff;
        }

        .media-upload__button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .media-upload__button-icon {
          font-size: 16px;
        }

        .media-upload__previews {
          margin-top: 16px;
          border: 1px solid #e1e5e9;
          border-radius: 8px;
          overflow: hidden;
          background: white;
        }

        .media-upload__previews-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 16px;
          border-bottom: 1px solid #e1e5e9;
          background: #f8f9fa;
        }

        .media-upload__previews-title {
          font-size: 13px;
          font-weight: 500;
          color: #374151;
        }

        .media-upload__clear-all {
          font-size: 12px;
          color: #dc3545;
          background: none;
          border: none;
          cursor: pointer;
          padding: 4px 8px;
          border-radius: 4px;
          transition: background-color 200ms ease;
        }

        .media-upload__clear-all:hover {
          background: #ffe6e6;
        }

        .media-upload__previews-list {
          max-height: 200px;
          overflow-y: auto;
        }

        .media-upload__preview {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          border-bottom: 1px solid #f1f3f4;
          transition: background-color 200ms ease;
        }

        .media-upload__preview:last-child {
          border-bottom: none;
        }

        .media-upload__preview:hover {
          background: #f8f9fa;
        }

        .media-upload__preview-content {
          display: flex;
          align-items: center;
          gap: 12px;
          flex: 1;
          min-width: 0;
        }

        .media-upload__preview-image {
          width: 40px;
          height: 40px;
          border-radius: 6px;
          overflow: hidden;
          background: #f1f3f4;
          flex-shrink: 0;
        }

        .media-upload__preview-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .media-upload__preview-icon {
          width: 40px;
          height: 40px;
          border-radius: 6px;
          background: #f1f3f4;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
          flex-shrink: 0;
        }

        .media-upload__preview-info {
          flex: 1;
          min-width: 0;
        }

        .media-upload__preview-name {
          font-size: 13px;
          font-weight: 500;
          color: #374151;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .media-upload__preview-size {
          font-size: 12px;
          color: #6c757d;
          margin-top: 2px;
        }

        .media-upload__preview-remove {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          border: none;
          background: #f1f3f4;
          color: #6c757d;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          transition: all 200ms ease;
          flex-shrink: 0;
        }

        .media-upload__preview-remove:hover {
          background: #dc3545;
          color: white;
        }

        /* Dark theme support */
        .chat-window--dark .media-upload__drop-zone {
          border-color: #4a5568;
          background: #2d3748;
        }

        .chat-window--dark .media-upload__drop-zone-primary {
          color: #e2e8f0;
        }

        .chat-window--dark .media-upload__drop-zone-secondary {
          color: #a0aec0;
        }

        .chat-window--dark .media-upload__button {
          border-color: #4a5568;
          background: #2d3748;
          color: #e2e8f0;
        }

        .chat-window--dark .media-upload__previews {
          border-color: #4a5568;
          background: #2d3748;
        }

        .chat-window--dark .media-upload__previews-header {
          border-bottom-color: #4a5568;
          background: #374151;
        }

        .chat-window--dark .media-upload__previews-title {
          color: #e2e8f0;
        }

        .chat-window--dark .media-upload__preview {
          border-bottom-color: #4a5568;
        }

        .chat-window--dark .media-upload__preview:hover {
          background: #374151;
        }

        .chat-window--dark .media-upload__preview-name {
          color: #e2e8f0;
        }

        .chat-window--dark .media-upload__preview-size {
          color: #a0aec0;
        }

        /* Mobile responsiveness */
        @media (max-width: 768px) {
          .media-upload__drop-zone {
            padding: 20px 16px;
          }

          .media-upload__drop-zone-content {
            gap: 8px;
          }

          .media-upload__previews-list {
            max-height: 150px;
          }

          .media-upload__preview {
            padding: 10px 12px;
          }

          .media-upload__preview-image,
          .media-upload__preview-icon {
            width: 32px;
            height: 32px;
          }
        }

        /* Accessibility improvements */
        .media-upload__drop-zone:focus-within {
          outline: 2px solid #007bff;
          outline-offset: 2px;
        }

        .media-upload__button:focus-visible,
        .media-upload__preview-remove:focus-visible {
          outline: 2px solid #007bff;
          outline-offset: 2px;
        }

        /* Reduced motion preference */
        @media (prefers-reduced-motion: reduce) {
          .media-upload__drop-zone,
          .media-upload__button,
          .media-upload__preview-remove {
            transition: none;
          }
          
          .media-upload__drop-zone--active {
            transform: none;
          }
        }
      `}</style>
    </div>
  );
};