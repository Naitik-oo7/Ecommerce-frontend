'use client';

import { useRef, useState } from 'react';
import { Upload, X, Loader2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ImageUploaderProps {
  value: string;
  onChange: (url: string) => void;
  onUpload: (file: File) => Promise<string>;
  isLoading?: boolean;
  error?: string;
  onError?: (error: string) => void;
}

export function ImageUploader({
  value,
  onChange,
  onUpload,
  isLoading = false,
  error,
  onError,
}: ImageUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadError, setUploadError] = useState('');

  const handleClearError = () => {
    setUploadError('');
    onError?.('');
  };

  const handleFile = async (file: File) => {
    // Validate file
    if (!file.type.startsWith('image/')) {
      const err = 'Please upload a valid image file (JPG, PNG, WebP, etc.)';
      setUploadError(err);
      onError?.(err);
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      const err = 'File size must be less than 10 MB';
      setUploadError(err);
      onError?.(err);
      return;
    }

    try {
      setUploadError('');
      onError?.('');
      const url = await onUpload(file);
      onChange(url);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to upload image';
      setUploadError(errorMsg);
      onError?.(errorMsg);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.currentTarget.files?.[0];
    if (file) handleFile(file);
  };

  const currentError = error || uploadError;

  return (
    <div className="space-y-3">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !isLoading && fileInputRef.current?.click()}
        className={cn(
          'relative rounded-lg border-2 border-dashed transition-all cursor-pointer overflow-hidden',
          isDragging
            ? 'border-primary bg-primary/5'
            : 'border-muted-foreground/25 bg-muted/20 hover:bg-muted/40',
          isLoading && 'opacity-60 cursor-not-allowed'
        )}
      >
        {value ? (
          <div className="relative h-48 w-full">
            <img src={value} alt="Uploaded" className="h-full w-full object-cover" />
            <div className="absolute inset-0 bg-black/0 hover:bg-black/20 transition-colors" />
            <button
              onClick={(e) => {
                e.stopPropagation();
                onChange('');
                if (fileInputRef.current) fileInputRef.current.value = '';
              }}
              className="absolute top-2 right-2 bg-destructive text-white rounded-full p-1.5 opacity-0 hover:opacity-100 transition-opacity"
              disabled={isLoading}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-8 text-center">
            {isLoading ? (
              <>
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mb-3" />
                <p className="text-sm font-medium text-muted-foreground">Uploading image...</p>
              </>
            ) : (
              <>
                <Upload className="h-8 w-8 text-muted-foreground/60 mb-3" />
                <p className="text-sm font-medium text-foreground">Drag and drop image here</p>
                <p className="text-xs text-muted-foreground mt-1">or click to select a file</p>
                <p className="text-xs text-muted-foreground/60 mt-2">Max 10 MB • JPG, PNG, WebP</p>
              </>
            )}
          </div>
        )}
      </div>

      {currentError && (
        <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
          <AlertCircle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
          <div className="flex-1">
            <p className="text-sm text-destructive">{currentError}</p>
          </div>
          <button
            onClick={handleClearError}
            className="text-destructive/60 hover:text-destructive ml-2"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
        disabled={isLoading}
      />

      {!value && (
        <div className="flex items-center gap-2">
          <div className="flex-1 h-px bg-muted-foreground/10" />
          <p className="text-xs text-muted-foreground/60">or paste URL below</p>
          <div className="flex-1 h-px bg-muted-foreground/10" />
        </div>
      )}
    </div>
  );
}
