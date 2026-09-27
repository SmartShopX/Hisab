import React, { useState, useRef } from 'react';
import {
  Upload,
  Camera,
  Trash2,
  Zap,
  CheckCircle2,
  RefreshCw,
  Link as LinkIcon,
  Image as ImageIcon,
} from 'lucide-react';
import { optimizeLogo, formatBytes, OptimizationResult } from '../../utils/imageOptimizer';

interface ShopLogoUploaderProps {
  logoUrl: string;
  shopName: string;
  onLogoChange: (newLogoUrl: string) => void;
  isEn?: boolean;
}

export const ShopLogoUploader: React.FC<ShopLogoUploaderProps> = ({
  logoUrl,
  shopName,
  onLogoChange,
  isEn = false,
}) => {
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optResult, setOptResult] = useState<OptimizationResult | null>(null);
  const [inputMode, setInputMode] = useState<'upload' | 'url'>('upload');
  const [dragOver, setDragOver] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleProcessFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setErrorMsg(isEn ? 'Please upload an image file (PNG, JPG, WebP, etc.)' : 'অনুগ্রহ করে একটি ছবি ফাইল নির্বাচন করুন (PNG, JPG, WebP ইত্যাদি)');
      return;
    }
    setErrorMsg(null);
    setIsOptimizing(true);
    try {
      const result = await optimizeLogo(file, 512);
      setOptResult(result);
      onLogoChange(result.dataUrl);
    } catch (err: any) {
      console.error('Logo optimization error:', err);
      setErrorMsg(err.message || (isEn ? 'Failed to process image' : 'ছবি প্রসেস করতে ব্যর্থ হয়েছে'));
    } finally {
      setIsOptimizing(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleProcessFile(e.target.files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleProcessFile(e.dataTransfer.files[0]);
    }
  };

  const handleRemoveLogo = () => {
    onLogoChange('');
    setOptResult(null);
  };

  const isWebP = logoUrl.startsWith('data:image/webp') || (optResult && optResult.format === 'image/webp');

  return (
    <div className="p-4 sm:p-5 rounded-2xl bg-slate-50/70 border border-slate-200 space-y-3.5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
            <ImageIcon className="w-4 h-4 text-emerald-600" />
            {isEn ? 'Store Logo / Branding' : 'দোকানের লোগো ও ব্র্যান্ডিং'}
          </label>
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300/60">
            <Zap className="w-3 h-3 text-emerald-600 fill-emerald-600" />
            {isEn ? 'Auto-WebP 512px' : 'অটো WebP অপ্টিমাইজড'}
          </span>
        </div>

        {/* Mode Switcher */}
        <div className="flex items-center gap-1 bg-white p-0.5 rounded-lg border border-slate-200">
          <button
            type="button"
            onClick={() => setInputMode('upload')}
            className={`px-2.5 py-1 text-[11px] font-semibold rounded-md transition-colors cursor-pointer flex items-center gap-1 ${
              inputMode === 'upload'
                ? 'bg-emerald-600 text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Upload className="w-3 h-3" /> {isEn ? 'File Upload' : 'ফাইল আপলোড'}
          </button>
          <button
            type="button"
            onClick={() => setInputMode('url')}
            className={`px-2.5 py-1 text-[11px] font-semibold rounded-md transition-colors cursor-pointer flex items-center gap-1 ${
              inputMode === 'url'
                ? 'bg-emerald-600 text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <LinkIcon className="w-3 h-3" /> {isEn ? 'Image URL' : 'ওয়েব লিঙ্ক (URL)'}
          </button>
        </div>
      </div>

      {/* Main Container */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
        {/* Preview Avatar Box */}
        <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-white border-2 border-slate-200 shadow-xs flex items-center justify-center text-emerald-700 font-black text-2xl overflow-hidden shrink-0 mx-auto sm:mx-0 group">
          {isOptimizing ? (
            <div className="absolute inset-0 bg-white/95 flex flex-col items-center justify-center text-emerald-600">
              <RefreshCw className="w-6 h-6 animate-spin" />
              <span className="text-[9px] font-bold mt-1">WebP...</span>
            </div>
          ) : logoUrl ? (
            <>
              <img
                src={logoUrl}
                alt="Shop Logo"
                className="w-full h-full object-cover p-1"
                referrerPolicy="no-referrer"
              />
              <span className="absolute bottom-0 right-0 text-[8px] font-bold bg-slate-900/80 text-white px-1.5 py-0.5 rounded-tl">
                {isWebP ? 'WebP' : 'IMG'}
              </span>
            </>
          ) : (
            <span className="text-3xl text-emerald-600 font-extrabold">{shopName ? shopName.charAt(0) : 'S'}</span>
          )}
        </div>

        {/* Input Zone */}
        <div className="flex-1 min-w-0">
          {inputMode === 'upload' ? (
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-xl p-3.5 text-center transition-all ${
                dragOver
                  ? 'border-emerald-500 bg-emerald-50'
                  : 'border-slate-300 bg-white hover:bg-slate-50'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />

              <div className="flex flex-wrap items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isOptimizing}
                  className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-2xs flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                >
                  <Upload className="w-3.5 h-3.5" />
                  {isEn ? 'Choose Logo (Auto WebP)' : 'লোগো ফাইল নির্বাচন করুন'}
                </button>

                {logoUrl && (
                  <button
                    type="button"
                    onClick={handleRemoveLogo}
                    className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    {isEn ? 'Remove' : 'মুছুন'}
                  </button>
                )}
              </div>

              <p className="text-[11px] text-slate-500 mt-2">
                {isEn
                  ? 'PNG, JPG, SVG supported. Automatically compressed into lightweight 512x512 WebP.'
                  : 'যেকোনো JPG, PNG ফাইল আপলোড করলেই অটো কমপ্যাক্ট WebP ফরম্যাটে রূপান্তর হয়ে যাবে।'}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <input
                type="url"
                value={logoUrl}
                onChange={(e) => onLogoChange(e.target.value)}
                placeholder="https://example.com/logo.webp"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 bg-white"
              />
              <p className="text-[11px] text-slate-500">
                {isEn ? 'Direct link to an online image' : 'অনলাইন ইমেজ লিঙ্ক সরাসরি পেস্ট করুন'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Error Message */}
      {errorMsg && (
        <p className="text-xs text-rose-600 bg-rose-50 p-2 rounded-lg border border-rose-200">
          {errorMsg}
        </p>
      )}

      {/* Optimization Savings Badge */}
      {optResult && (
        <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-left flex flex-wrap items-center justify-between gap-2 shadow-2xs">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-emerald-600 text-white flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
            <div>
              <p className="text-xs font-bold text-emerald-950">
                লোগোটি সফলভাবে WebP তে অপ্টিমাইজড হয়েছে (-{optResult.savedPercentage}% সাইজ সাশ্রয়)
              </p>
              <p className="text-[11px] text-emerald-800">
                মূল সাইজ {formatBytes(optResult.originalSize)} হতে কমে <strong>{formatBytes(optResult.optimizedSize)}</strong> হয়েছে ({optResult.width}×{optResult.height}px WebP)
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
