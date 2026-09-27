import React, { useState, useRef } from 'react';
import {
  Upload,
  Camera,
  Sparkles,
  Check,
  X,
  Image as ImageIcon,
  Zap,
  Sliders,
  RefreshCw,
  Info,
} from 'lucide-react';
import { Button } from '../common/Button';
import {
  optimizeProductImage,
  optimizeImage,
  formatBytes,
  OptimizationResult,
} from '../../utils/imageOptimizer';

interface ProductImageUploaderProps {
  currentImage?: string;
  onImageChange: (newImageUrl: string) => void;
  onOpenAiStudio: (initialImage: string) => void;
  productName?: string;
  category?: string;
}

export const ProductImageUploader: React.FC<ProductImageUploaderProps> = ({
  currentImage,
  onImageChange,
  onOpenAiStudio,
}) => {
  const [selectedImages, setSelectedImages] = useState<string[]>(
    currentImage ? [currentImage] : []
  );
  const [activeImageIndex, setActiveImageIndex] = useState<number>(0);
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [isDragOver, setIsDragOver] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isOptimizing, setIsOptimizing] = useState<boolean>(false);
  const [optStats, setOptStats] = useState<Record<number, OptimizationResult>>({});
  const [autoWebP, setAutoWebP] = useState<boolean>(true);
  const [qualityLevel, setQualityLevel] = useState<number>(0.82);
  const [showSettings, setShowSettings] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const activeImage = selectedImages[activeImageIndex] || currentImage || '';
  const currentStat = optStats[activeImageIndex];

  // Handle file uploads (file picker & drag drop) with automatic WebP conversion
  const handleFiles = async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    const validImageFiles = fileArray.filter((file) => file.type.startsWith('image/'));

    if (validImageFiles.length === 0) return;

    setIsOptimizing(true);
    try {
      const newImages: string[] = [];
      const newStats: Record<number, OptimizationResult> = { ...optStats };
      const startIdx = selectedImages.length;

      for (let i = 0; i < validImageFiles.length; i++) {
        const file = validImageFiles[i];
        if (autoWebP) {
          const result = await optimizeImage(file, {
            maxWidth: 1200,
            maxHeight: 1200,
            quality: qualityLevel,
            format: 'image/webp',
          });
          newImages.push(result.dataUrl);
          newStats[startIdx + i] = result;
        } else {
          // Fallback to standard dataURL if autoWebP disabled
          const dataUrl = await new Promise<string>((res) => {
            const reader = new FileReader();
            reader.onload = (e) => res(e.target?.result as string);
            reader.readAsDataURL(file);
          });
          newImages.push(dataUrl);
        }
      }

      const combined = [...selectedImages, ...newImages];
      setSelectedImages(combined);
      setOptStats(newStats);
      const newIdx = selectedImages.length; // Focus on first newly added image
      setActiveImageIndex(newIdx);
      if (newImages.length > 0) {
        onImageChange(newImages[0]);
      }
    } catch (err: any) {
      console.error('Image optimization error:', err);
    } finally {
      setIsOptimizing(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  // Camera capture support with instant WebP compression
  const startCamera = async () => {
    setCameraError(null);
    setIsCameraActive(true);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('আপনার ব্রাউজার ক্যামেরা সাপোর্ট করে না');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (err: any) {
      console.warn('Camera access denied or unavailable:', err.message);
      setCameraError(err.message || 'ক্যামেরা চালু করা সম্ভব হয়নি। অনুগ্রহ করে পারমিশন চেক করুন।');
      if (fileInputRef.current) {
        fileInputRef.current.setAttribute('capture', 'environment');
        fileInputRef.current.click();
      }
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  const capturePhoto = async () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth || 800;
    canvas.height = videoRef.current.videoHeight || 800;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      const rawUrl = canvas.toDataURL('image/png');
      setIsOptimizing(true);
      try {
        const result = await optimizeProductImage(rawUrl);
        const combined = [...selectedImages, result.dataUrl];
        const newIdx = combined.length - 1;
        setSelectedImages(combined);
        setOptStats((prev) => ({ ...prev, [newIdx]: result }));
        setActiveImageIndex(newIdx);
        onImageChange(result.dataUrl);
      } catch (err) {
        const combined = [...selectedImages, rawUrl];
        setSelectedImages(combined);
        setActiveImageIndex(combined.length - 1);
        onImageChange(rawUrl);
      } finally {
        setIsOptimizing(false);
      }
    }
    stopCamera();
  };

  const removeImage = (idx: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = selectedImages.filter((_, i) => i !== idx);
    setSelectedImages(updated);
    // Re-index stats
    const updatedStats: Record<number, OptimizationResult> = {};
    let newI = 0;
    for (let i = 0; i < selectedImages.length; i++) {
      if (i !== idx && optStats[i]) {
        updatedStats[newI] = optStats[i];
        newI++;
      }
    }
    setOptStats(updatedStats);

    if (activeImageIndex >= updated.length) {
      const nextIdx = Math.max(0, updated.length - 1);
      setActiveImageIndex(nextIdx);
      onImageChange(updated[nextIdx] || '');
    } else {
      onImageChange(updated[activeImageIndex] || '');
    }
  };

  // Convert current non-webp / existing image to WebP
  const optimizeCurrentActiveImage = async () => {
    if (!activeImage) return;
    setIsOptimizing(true);
    try {
      const res = await optimizeImage(activeImage, {
        maxWidth: 1200,
        maxHeight: 1200,
        quality: qualityLevel,
        format: 'image/webp',
      });
      const updated = [...selectedImages];
      updated[activeImageIndex] = res.dataUrl;
      setSelectedImages(updated);
      setOptStats((prev) => ({ ...prev, [activeImageIndex]: res }));
      onImageChange(res.dataUrl);
    } catch (err) {
      console.error('Failed to convert image to WebP:', err);
    } finally {
      setIsOptimizing(false);
    }
  };

  const isCurrentWebP =
    activeImage.startsWith('data:image/webp') ||
    (currentStat && currentStat.format === 'image/webp');

  return (
    <div className="space-y-3">
      {/* Header and Auto-WebP Switch */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <label className="block text-xs font-semibold text-slate-700">
            পণ্যের ছবি (Product Image) *
          </label>
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
            <Zap className="w-3 h-3 text-emerald-600 fill-emerald-500" />
            অটো WebP অন
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowSettings(!showSettings)}
            className="p-1 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg text-xs flex items-center gap-1 transition-colors cursor-pointer"
            title="অপ্টিমাইজেশন সেটিংস"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span className="text-[11px] hidden sm:inline">কম্প্রেশন সেটিংস</span>
          </button>

          {activeImage && (
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
              <Check className="w-3 h-3 text-emerald-600" /> ছবি সংযুক্ত আছে
            </span>
          )}
        </div>
      </div>

      {/* Settings Drawer / Accordion */}
      {showSettings && (
        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2.5 animate-fadeIn">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-slate-800 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-emerald-600" /> স্বয়ংক্রিয় WebP রূপান্তর ও কম্প্রেশন
            </span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={autoWebP}
                onChange={(e) => setAutoWebP(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-8 h-4.5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-emerald-600"></div>
            </label>
          </div>
          <div className="flex items-center gap-3 pt-1">
            <span className="text-slate-600 text-[11px] shrink-0">কোয়ালিটি মোড:</span>
            <div className="flex gap-1.5 w-full">
              {[
                { label: 'কমপ্যাক্ট (WebP 70%)', val: 0.7 },
                { label: 'ব্যালান্সড (WebP 82%)', val: 0.82 },
                { label: 'হাই-কোয়ালিটি (WebP 92%)', val: 0.92 },
              ].map((opt) => (
                <button
                  key={opt.val}
                  type="button"
                  onClick={() => setQualityLevel(opt.val)}
                  className={`flex-1 py-1 px-2 rounded-lg text-[10px] font-medium border transition-colors ${
                    qualityLevel === opt.val
                      ? 'bg-emerald-600 text-white border-emerald-600'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Hidden native input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0) {
            handleFiles(e.target.files);
          }
        }}
      />

      {/* Camera Modal / Live View */}
      {isCameraActive && (
        <div className="relative rounded-2xl overflow-hidden bg-slate-900 border border-slate-700 p-2 shadow-lg">
          <div className="relative aspect-square max-h-72 w-full flex items-center justify-center bg-black rounded-xl overflow-hidden">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 border-2 border-dashed border-emerald-400/60 rounded-xl pointer-events-none m-4 flex items-center justify-center">
              <span className="text-white/70 text-xs bg-black/40 px-2 py-1 rounded">
                পণ্যটি ফ্রেমের মাঝে রাখুন
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between mt-2 px-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={stopCamera}
              className="text-white border-slate-700 bg-slate-800 hover:bg-slate-700 text-xs"
            >
              বাতিল
            </Button>
            <button
              type="button"
              onClick={capturePhoto}
              disabled={isOptimizing}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-md flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
            >
              <Camera className="w-4 h-4" /> ছবি তুলুন (অটো WebP)
            </button>
          </div>
        </div>
      )}

      {cameraError && (
        <div className="text-xs text-rose-600 bg-rose-50 p-2 rounded-lg border border-rose-200">
          {cameraError}
        </div>
      )}

      {/* Primary Dropzone & Preview Box */}
      {!isCameraActive && (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragOver(true);
          }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleDrop}
          className={`relative border-2 border-dashed rounded-2xl p-4 transition-all duration-200 text-center ${
            isDragOver
              ? 'border-emerald-500 bg-emerald-50/50 scale-[1.01]'
              : 'border-slate-200 bg-slate-50 hover:bg-slate-50/80'
          }`}
        >
          {isOptimizing && (
            <div className="absolute inset-0 bg-white/90 backdrop-blur-xs rounded-2xl flex flex-col items-center justify-center z-10 space-y-2">
              <RefreshCw className="w-7 h-7 text-emerald-600 animate-spin" />
              <p className="text-xs font-bold text-slate-800">
                ছবিটি WebP ফরম্যাটে অপ্টিমাইজ ও কম্প্রেশন হচ্ছে...
              </p>
              <p className="text-[10px] text-slate-500">
                হাই-কোয়ালিটি বজায় রেখে সাইজ কমানো হচ্ছে
              </p>
            </div>
          )}

          {activeImage ? (
            <div className="space-y-3">
              {/* Image Display */}
              <div className="relative group mx-auto w-48 h-48 sm:w-56 sm:h-56 rounded-2xl overflow-hidden border border-slate-200 bg-white shadow-sm flex items-center justify-center">
                <img
                  src={activeImage}
                  alt="Product preview"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-contain p-2"
                />

                {/* Overlays */}
                <div className="absolute top-2 right-2 flex items-center gap-1">
                  <button
                    type="button"
                    onClick={(e) => removeImage(activeImageIndex, e)}
                    className="p-1.5 bg-rose-600/80 hover:bg-rose-600 text-white rounded-lg shadow-sm transition-colors cursor-pointer"
                    title="ছবি ডিলিট করুন"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Format Tag */}
                <div className="absolute bottom-2 left-2">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-900/75 text-white backdrop-blur-xs shadow-xs uppercase">
                    {isCurrentWebP ? 'WebP' : 'JPG/PNG'}
                  </span>
                </div>
              </div>

              {/* Optimization Metric Badge Banner */}
              {currentStat && (
                <div className="p-2.5 bg-emerald-50/90 border border-emerald-200 rounded-xl text-left flex flex-wrap items-center justify-between gap-2 shadow-2xs">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0">
                      <Zap className="w-4 h-4 fill-white" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                        <span>স্বয়ংক্রিয় WebP অপ্টিমাইজড</span>
                        <span className="bg-emerald-600 text-white text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                          -{currentStat.savedPercentage}% সাইজ সেভ
                        </span>
                      </div>
                      <p className="text-[11px] text-emerald-800">
                        {formatBytes(currentStat.originalSize)} হতে কমিয়ে{' '}
                        <strong>{formatBytes(currentStat.optimizedSize)}</strong> করা হয়েছে ({currentStat.width}×{currentStat.height}px)
                      </p>
                    </div>
                  </div>

                  <span className="text-[10px] font-semibold text-emerald-700 bg-white px-2 py-1 rounded-md border border-emerald-200">
                    ✓ দ্রুত লোডিং ও ক্যাশ ফ্রেন্ডলি
                  </span>
                </div>
              )}

              {/* Action Banner: Use Original vs AI Product Studio vs Manual Convert */}
              <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-2 text-left">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-slate-800">ছবি নির্বাচন সম্পন্ন</span>
                    {activeImage.includes('data:image/svg+xml') && (
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-semibold">
                        AI স্টুডিও প্রসেসড
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500">
                    WebP ফরম্যাটে স্বয়ংক্রিয়ভাবে সংরক্ষিত হয়েছে। AI স্টুডিও দিয়ে ব্যাকগ্রাউন্ড পরিবর্তন করতে পারেন।
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {!isCurrentWebP && (
                    <button
                      type="button"
                      onClick={optimizeCurrentActiveImage}
                      className="px-3 py-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition-colors cursor-pointer flex items-center gap-1"
                    >
                      <Zap className="w-3.5 h-3.5" /> WebP রূপান্তর করুন
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => onOpenAiStudio(activeImage)}
                    className="px-3 py-1.5 text-xs font-bold text-white bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 hover:opacity-95 rounded-xl shadow-sm flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
                    AI Product Studio
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-6 space-y-3">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shadow-2xs">
                <ImageIcon className="w-7 h-7" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-800">
                  পণ্যের ছবি আপলোড করুন অথবা ড্রপ করুন
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  JPG, PNG, WebP যেকোনো ছবি আপলোড করলেই <strong className="text-emerald-700">অটো WebP কমপ্যাক্ট</strong> সাইজ হয়ে যাবে
                </p>
              </div>

              {/* Upload Buttons */}
              <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-2xs flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Upload className="w-4 h-4" /> ছবি আপলোড (Auto WebP)
                </button>

                <button
                  type="button"
                  onClick={startCamera}
                  className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-xl text-xs font-bold shadow-2xs flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Camera className="w-4 h-4 text-emerald-600" /> ক্যামেরা দিয়ে তুলুন
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Multiple Images Selector Bar */}
      {selectedImages.length > 1 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {selectedImages.map((img, idx) => (
            <div
              key={idx}
              onClick={() => {
                setActiveImageIndex(idx);
                onImageChange(img);
              }}
              className={`relative w-14 h-14 rounded-xl overflow-hidden border-2 flex-shrink-0 cursor-pointer transition-all ${
                activeImageIndex === idx
                  ? 'border-emerald-500 ring-2 ring-emerald-300'
                  : 'border-slate-200 opacity-70 hover:opacity-100'
              }`}
            >
              <img
                src={img}
                alt={`Thumb ${idx}`}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
              <span className="absolute bottom-0 right-0 bg-black/60 text-white text-[8px] px-1 rounded-tl">
                WebP
              </span>
              <button
                type="button"
                onClick={(e) => removeImage(idx, e)}
                className="absolute top-0.5 right-0.5 w-4 h-4 bg-black/60 hover:bg-rose-600 text-white rounded-full flex items-center justify-center text-[9px]"
              >
                ×
              </button>
            </div>
          ))}

          {/* Add more button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-14 h-14 rounded-xl border-2 border-dashed border-slate-300 hover:border-emerald-500 text-slate-400 hover:text-emerald-600 flex flex-col items-center justify-center flex-shrink-0 text-xs transition-colors cursor-pointer bg-white"
            title="আরও ছবি যোগ করুন (Auto WebP)"
          >
            <Upload className="w-4 h-4" />
            <span className="text-[10px]">+যোগ</span>
          </button>
        </div>
      )}
    </div>
  );
};
