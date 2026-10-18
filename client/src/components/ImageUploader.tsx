import React, { useState, useRef } from 'react';
import { 
  Upload, 
  X, 
  Star, 
  Image as ImageIcon, 
  AlertCircle, 
  Check, 
  Loader2, 
  ArrowLeftRight 
} from 'lucide-react';
import { api } from '../services/api';

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
      // If multiple upload endpoint available, try uploadMultipleImages first
      if (files.length > 1) {
        setUploadProgress(`Uploading ${files.length} images...`);
        try {
          const multiRes = await api.uploadMultipleImages(files);
          newUploadedUrls.push(...multiRes.map((r) => r.url));
        } catch (multiErr: any) {
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
          <label className="text-xs sm:text-sm font-bold text-slate-800 block">
            {label}
          </label>
          <span className="text-[11px] text-slate-500 block mt-0.5">
            {helperText}
          </span>
        </div>
        <span
          className={`text-xs font-extrabold px-2.5 py-1 rounded-full ${
            images.length >= minImages
              ? 'bg-emerald-100 text-emerald-800'
              : 'bg-amber-100 text-amber-800'
          }`}
        >
          {images.length} / {maxImages} Photos
        </span>
      </div>

      {/* Validation Error Alert */}
      {errorMessage && (
        <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium flex items-center justify-between gap-3 animate-fade-in">
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
          className={`relative border-2 border-dashed rounded-3xl p-6 sm:p-8 text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-3 ${
            isDragging
              ? 'border-campus-primary bg-emerald-50/60 scale-[1.01]'
              : 'border-slate-200 hover:border-campus-primary/60 bg-slate-50/60 hover:bg-white'
          } ${uploading ? 'pointer-events-none opacity-70' : ''}`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            onChange={handleFileSelect}
            className="hidden"
          />

          {uploading ? (
            <div className="py-2 flex flex-col items-center gap-2">
              <Loader2 className="w-8 h-8 text-campus-primary animate-spin" />
              <span className="text-xs font-bold text-slate-700">{uploadProgress}</span>
              <span className="text-[11px] text-slate-400">Verifying safe image format...</span>
            </div>
          ) : (
            <>
              <div className="w-12 h-12 rounded-2xl bg-white shadow-sm border border-slate-200/80 text-campus-primary flex items-center justify-center">
                <Upload className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs sm:text-sm font-bold text-slate-800 block">
                  Click to select photos or drag & drop here
                </span>
                <span className="text-[11px] text-slate-500 mt-1 block">
                  Accepts JPEG, PNG, and WebP (up to 5MB per file • 1 to 5 images)
                </span>
              </div>
            </>
          )}
        </div>
      )}

      {/* Uploaded Images Preview Grid */}
      {images.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 uppercase tracking-wider px-1">
            <span>Uploaded Gallery (Click star to set main cover photo)</span>
            {images.length >= minImages && (
              <span className="text-emerald-700 flex items-center gap-1 font-semibold">
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
                  className={`group relative rounded-2xl overflow-hidden border-2 bg-slate-100 transition-all aspect-square flex flex-col justify-between ${
                    isPrimary
                      ? 'border-campus-primary shadow-md ring-2 ring-campus-primary/20'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {/* Image */}
                  <img
                    src={imgUrl}
                    alt={`Item ${index + 1}`}
                    className="w-full h-full object-cover"
                  />

                  {/* Primary Badge or Set Primary Trigger */}
                  <div className="absolute top-2 left-2 right-2 flex items-center justify-between pointer-events-none">
                    {isPrimary ? (
                      <span className="px-2 py-0.5 rounded-md bg-campus-primary text-white text-[10px] font-extrabold shadow-sm flex items-center gap-1 pointer-events-auto">
                        <Star className="w-3 h-3 fill-current" />
                        <span>Primary Cover</span>
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSetPrimary(index);
                        }}
                        className="px-2 py-0.5 rounded-md bg-white/90 backdrop-blur-sm hover:bg-white text-slate-700 hover:text-campus-primary text-[10px] font-bold shadow-sm flex items-center gap-1 pointer-events-auto transition-all"
                        title="Set this as the primary cover photo for your listing"
                      >
                        <Star className="w-3 h-3 text-amber-500" />
                        <span>Set Primary</span>
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
                      className="w-7 h-7 rounded-xl bg-black/60 hover:bg-rose-600 text-white flex items-center justify-center backdrop-blur-sm shadow-sm transition-all"
                      title="Remove image"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Number Badge */}
                  <div className="absolute bottom-2 left-2">
                    <span className="px-1.5 py-0.5 rounded bg-black/50 text-[9px] font-bold text-white backdrop-blur-sm">
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
