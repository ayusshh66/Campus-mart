import { SmoothInput } from './motion/SmoothInput';
import React, { useState, useRef } from 'react';
import { 
  Upload, 
  X, 
  Star, 
  AlertCircle, 
  Check, 
  Loader2 
} from 'lucide-react';
import { api } from '../services/api';
import { resolveProductImageUrl, handleImageError } from '../utils/imageUtils';

interface ImageUploaderProps {
  images: string[];
  onChange: (images: string[]) => void;
  maxImages?: number; // default 5
  minImages?: number; // default 1
  label?: string;
  helperText?: string;
}

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export const ImageUploader: React.FC<ImageUploaderProps> = ({
  images,
  onChange,
  maxImages = 5,
  minImages = 1,
  label = 'Item Photographs (1 to 5 images)',
  helperText = 'Upload clear, real photos of your item on campus. First photo will be the main cover listing photo.',
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFiles = (files: File[]): boolean => {
    setErrorMessage(null);

    // Limit check
    if (images.length + files.length > maxImages) {
      setErrorMessage(
        `Maximum ${maxImages} images allowed. You already have ${images.length} photo${images.length !== 1 ? 's' : ''}, please select up to ${maxImages - images.length} more.`
      );
      return false;
    }

    // Type and size checks for each file
    for (const file of files) {
      const ext = '.' + file.name.split('.').pop()?.toLowerCase();
      const isValidExt = ALLOWED_EXTENSIONS.includes(ext);
      const isValidMime = ALLOWED_MIME_TYPES.includes(file.type.toLowerCase());

      if (!isValidExt || !isValidMime) {
        setErrorMessage(
          `"${file.name}" is not an accepted format. Only JPEG, PNG, and WebP images are allowed.`
        );
        return false;
      }

      if (file.size > MAX_FILE_SIZE) {
        const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
        setErrorMessage(
          `"${file.name}" is ${sizeMB}MB. Maximum allowed image size is 5MB.`
        );
        return false;
      }
    }

    return true;
  };

  const handleProcessFiles = async (selectedFiles: FileList | File[]) => {
    const files = Array.from(selectedFiles);
    if (files.length === 0) return;

    if (!validateFiles(files)) {
      return;
    }

    setUploading(true);
    const newUploadedUrls: string[] = [];

    try {
      if (files.length > 1) {
        setUploadProgress(`Uploading ${files.length} images...`);
        try {
          const multiRes = await api.uploadMultipleImages(files);
          newUploadedUrls.push(...multiRes.map((r) => r.url));
        } catch {
          // Fallback to sequential uploads
          for (let i = 0; i < files.length; i++) {
            setUploadProgress(`Uploading image ${i + 1} of ${files.length}...`);
            const res = await api.uploadImage(files[i]);
            newUploadedUrls.push(res.url);
          }
        }
      } else {
        setUploadProgress('Uploading image...');
        const res = await api.uploadImage(files[0]);
        newUploadedUrls.push(res.url);
      }

      onChange([...images, ...newUploadedUrls]);
      setErrorMessage(null);
    } catch (err: any) {
      console.error('Upload failed:', err);
      setErrorMessage(err.message || 'Failed to upload image. Please try again.');
    } finally {
      setUploading(false);
      setUploadProgress('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!uploading && images.length < maxImages) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (uploading || images.length >= maxImages) return;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleProcessFiles(e.dataTransfer.files);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleProcessFiles(e.target.files);
    }
  };

  const handleSetPrimary = (indexToPrimary: number) => {
    if (indexToPrimary === 0 || indexToPrimary >= images.length) return;
    const item = images[indexToPrimary];
    const remaining = images.filter((_, idx) => idx !== indexToPrimary);
    onChange([item, ...remaining]);
  };

  const handleRemoveImage = (indexToRemove: number) => {
    onChange(images.filter((_, idx) => idx !== indexToRemove));
    setErrorMessage(null);
  };

  return (
    <div className="space-y-4">
      {/* Header and counter */}
      <div className="flex items-center justify-between">
        <div>
          <label className="text-[13px] font-semibold text-shop-ink block tracking-tight">
            {label}
          </label>
          <span className="text-[12px] text-shop-muted block mt-0.5 tracking-tight">
            {helperText}
          </span>
        </div>
        <span
          className={`text-[11px] font-semibold px-3 py-1 rounded-full ${
            images.length >= minImages
              ? 'bg-emerald-50 text-emerald-700'
              : 'bg-amber-50 text-amber-800'
          }`}
        >
          {images.length} / {maxImages} Photos
        </span>
      </div>

      {/* Validation Error Alert */}
      {errorMessage && (
        <div className="p-3.5 rounded-[20px] bg-rose-50 border border-rose-200 text-rose-800 text-[12px] font-medium flex items-center justify-between gap-3 animate-fade-in">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="text-rose-500 hover:text-rose-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Drag & Drop Zone */}
      {images.length < maxImages && (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => !uploading && fileInputRef.current?.click()}
          className={`relative border-2 border-dashed rounded-[28px] p-6 sm:p-8 text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-3 ${
            isDragging
              ? 'border-[#C6DE41] bg-[#C6DE41]/10 scale-[1.01]'
              : 'border-white/10 hover:border-[#C6DE41]/50 bg-[#12160F] hover:bg-[#181D14]'
          } ${uploading ? 'pointer-events-none opacity-70' : ''}`}
        >
          <SmoothInput
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            onChange={handleFileSelect}
            className="hidden"
          />

          {uploading ? (
            <div className="py-2 flex flex-col items-center gap-2">
              <Loader2 className="w-7 h-7 text-[#C6DE41] animate-spin" />
              <span className="text-[13px] font-semibold text-white">{uploadProgress}</span>
              <span className="text-[11px] text-slate-400">Validating and optimizing photo...</span>
            </div>
          ) : (
            <>
              <div className="w-12 h-12 rounded-full bg-[#181D14] text-[#C6DE41] border border-[#C6DE41]/20 flex items-center justify-center shadow-[0_0_15px_rgba(198,222,65,0.15)]">
                <Upload className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[13px] font-bold text-white block tracking-tight">
                  Click to choose photos or drag & drop here
                </span>
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Supports JPEG, PNG, WebP (up to 5MB • 1 to 5 images)
                </span>
              </div>
            </>
          )}
        </div>
      )}

      {/* Uploaded Images Preview Grid */}
      {images.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-[11px] font-medium text-slate-400 uppercase tracking-wider px-1">
            <span>Uploaded Gallery (Click star to set primary photo)</span>
            {images.length >= minImages && (
              <span className="text-[#C6DE41] flex items-center gap-1 font-semibold">
                <Check className="w-3.5 h-3.5" /> Valid photo count
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {images.map((imgUrl, index) => {
              const isPrimary = index === 0;

              return (
                <div
                  key={`${imgUrl}-${index}`}
                  className={`group relative rounded-[20px] overflow-hidden border-2 bg-[#12160F] transition-all aspect-square flex flex-col justify-between ${
                    isPrimary
                      ? 'border-[#C6DE41] shadow-[0_0_15px_rgba(198,222,65,0.25)] ring-2 ring-[#C6DE41]/20'
                      : 'border-white/10 hover:border-[#C6DE41]/40'
                  }`}
                >
                  {/* Image */}
                  <img
                    src={resolveProductImageUrl(imgUrl)}
                    alt={`Item ${index + 1}`}
                    className="w-full h-full object-cover"
                    onError={handleImageError}
                  />

                  {/* Primary Badge or Set Primary Trigger */}
                  <div className="absolute top-2 left-2 right-2 flex items-center justify-between pointer-events-none">
                    {isPrimary ? (
                      <span className="px-2 py-0.5 rounded-full bg-[#C6DE41] text-[#090B09] text-[10px] font-black shadow-sm flex items-center gap-1 pointer-events-auto">
                        <Star className="w-3 h-3 fill-current" />
                        <span>Cover</span>
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSetPrimary(index);
                        }}
                        className="px-2 py-0.5 rounded-full bg-[#090B09]/80 border border-white/10 hover:border-[#C6DE41]/40 backdrop-blur-sm text-slate-200 hover:text-[#C6DE41] text-[10px] font-medium flex items-center gap-1 pointer-events-auto transition-all"
                        title="Set this as the primary cover photo for your listing"
                      >
                        <Star className="w-3 h-3 text-[#C6DE41]" />
                        <span>Set Cover</span>
                      </button>
                    )}
                  </div>

                  {/* Remove Button */}
                  <div className="absolute bottom-2 right-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveImage(index);
                      }}
                      className="w-7 h-7 rounded-full bg-black/60 hover:bg-rose-600 text-white flex items-center justify-center backdrop-blur-sm shadow-shop-pill transition-all"
                      title="Remove image"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Number Badge */}
                  <div className="absolute bottom-2 left-2">
                    <span className="px-1.5 py-0.5 rounded-full bg-black/50 text-[9px] font-medium text-white backdrop-blur-sm">
                      #{index + 1}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

