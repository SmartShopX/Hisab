import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Scissors,
  Palette,
  Lightbulb,
  ShoppingBag,
  Crop,
  Image as ImageIcon,
  FileText,
  Film,
  Check,
  RefreshCw,
  Undo2,
  AlertCircle,
  Play,
  Trash2,
  Layers,
  ChevronRight,
  Sliders,
  ExternalLink,
  Zap,
} from 'lucide-react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import {
  aiProductStudioService,
  AiImageAction,
  AiQuotaResponse,
  GeneratedProductInfo,
  VideoJobResponse,
} from '../../services/aiProductStudioService';

interface AiProductStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  originalImage: string;
  currentName?: string;
  currentCategory?: string;
  currentPrice?: number;
  onApplyProcessedImage: (processedUrl: string) => void;
  onApplyProductInfo: (info: GeneratedProductInfo) => void;
  onApplyVideoUrl?: (videoUrl: string) => void;
}

export const AiProductStudioModal: React.FC<AiProductStudioModalProps> = ({
  isOpen,
  onClose,
  originalImage,
  currentName = '',
  currentCategory = '',
  currentPrice = 0,
  onApplyProcessedImage,
  onApplyProductInfo,
  onApplyVideoUrl,
}) => {
  // Navigation tabs: 'image' | 'info' | 'video'
  const [activeTab, setActiveTab] = useState<'image' | 'info' | 'video'>('image');

  // Image Studio States
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  const [activeAction, setActiveAction] = useState<AiImageAction | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [comparisonMode, setComparisonMode] = useState<'slider' | 'side-by-side' | 'toggle'>('slider');
  const [sliderPosition, setSliderPosition] = useState<number>(50);
  const [selectedBgTheme, setSelectedBgTheme] = useState<string>('studio-white');

  // Quota state
  const [quota, setQuota] = useState<AiQuotaResponse | null>(null);

  // AI Product Information States
  const [isGeneratingInfo, setIsGeneratingInfo] = useState<boolean>(false);
  const [generatedInfo, setGeneratedInfo] = useState<GeneratedProductInfo | null>(null);
  const [editableInfo, setEditableInfo] = useState<GeneratedProductInfo>({
    productName: currentName || '',
    category: currentCategory || 'ইলেকট্রনিক্স ও গ্যাজেট',
    subcategory: '',
    shortDescription: '',
    detailedDescription: '',
    keywords: [],
    tags: [],
  });

  // AI Video States
  const [videoJob, setVideoJob] = useState<VideoJobResponse | null>(null);
  const [isVideoLoading, setIsVideoLoading] = useState<boolean>(false);
  const [isVideoPlaying, setIsVideoPlaying] = useState<boolean>(false);
  const videoPollRef = useRef<any>(null);

  // Load backend quota on open
  useEffect(() => {
    if (isOpen) {
      loadQuota();
      // Reset temporary states
      setProcessedImage(null);
      setErrorMessage(null);
      setStatusMessage(null);
      setActiveAction(null);
    }
  }, [isOpen]);

  const loadQuota = async () => {
    try {
      const q = await aiProductStudioService.getQuota();
      setQuota(q);
    } catch (e) {
      // fallback handled in service
    }
  };

  // Clean up video polling on unmount
  useEffect(() => {
    return () => {
      if (videoPollRef.current) {
        clearInterval(videoPollRef.current);
      }
    };
  }, []);

  // 1. Process Image Handler
  const handleProcessImage = async (action: AiImageAction, bgType?: string) => {
    setIsProcessing(true);
    setErrorMessage(null);
    setStatusMessage(null);
    setActiveAction(action);

    try {
      const response = await aiProductStudioService.processImage(
        originalImage,
        action,
        bgType ? { backgroundType: bgType } : { backgroundType: selectedBgTheme }
      );

      if (response.success && response.processedImage) {
        setProcessedImage(response.processedImage);
        setStatusMessage(response.message || 'AI প্রসেসিং সফল হয়েছে!');
        loadQuota(); // refresh quota count
      } else {
        setErrorMessage(
          response.error || 'AI processing could not be completed. Your original image is safe.'
        );
      }
    } catch (err: any) {
      setErrorMessage('AI processing could not be completed. Your original image is safe.');
    } finally {
      setIsProcessing(false);
    }
  };

  // 2. Generate Product Info Handler
  const handleGenerateInfo = async () => {
    setIsGeneratingInfo(true);
    try {
      const res = await aiProductStudioService.generateProductInfo(
        processedImage || originalImage,
        currentName,
        currentCategory
      );
      if (res.success && res.suggestions) {
        setGeneratedInfo(res.suggestions);
        setEditableInfo(res.suggestions);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsGeneratingInfo(false);
    }
  };

  // 3. Create Video Handler (Non-blocking!)
  const handleCreateVideo = async () => {
    setIsVideoLoading(true);
    try {
      const res = await aiProductStudioService.createProductVideo(
        processedImage || originalImage,
        editableInfo.productName || currentName || 'পণ্য শোকেস',
        currentPrice
      );

      setVideoJob(res);

      // Start non-blocking polling
      if (videoPollRef.current) clearInterval(videoPollRef.current);

      const pollJobId = res.jobId;
      videoPollRef.current = setInterval(async () => {
        try {
          const statusRes = await aiProductStudioService.getVideoStatus(pollJobId);
          setVideoJob(statusRes);
          if (statusRes.status === 'ready' || statusRes.status === 'failed') {
            clearInterval(videoPollRef.current);
            setIsVideoLoading(false);
          }
        } catch (e) {
          clearInterval(videoPollRef.current);
          setIsVideoLoading(false);
        }
      }, 1000);
    } catch (err) {
      setIsVideoLoading(false);
    }
  };

  const handleDeleteVideo = async () => {
    if (videoJob?.jobId) {
      await aiProductStudioService.deleteVideo(videoJob.jobId);
      setVideoJob(null);
    }
  };

  // 4. Confirm & Apply Actions
  const handleConfirmImage = () => {
    if (processedImage) {
      onApplyProcessedImage(processedImage);
      onClose();
    }
  };

  const handleUseOriginal = () => {
    onApplyProcessedImage(originalImage);
    onClose();
  };

  const handleApplyInfoToForm = () => {
    onApplyProductInfo(editableInfo);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="✨ AI Product Studio"
      subtitle="স্মার্ট এআই দিয়ে আপনার পণ্যের ছবি, বিবরণ ও মার্কেটিং ভিডিও প্রফেশনাল ই-কমার্সে রূপান্তর করুন"
      maxWidth="4xl"
    >
      <div className="space-y-4">
        {/* Top Header & Quota Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-gradient-to-r from-emerald-50 via-slate-50 to-indigo-50 border border-emerald-100 rounded-2xl">
          {/* Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-white rounded-xl border border-slate-200 shadow-2xs">
            <button
              type="button"
              onClick={() => setActiveTab('image')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'image'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <ImageIcon className="w-3.5 h-3.5" /> ইমেজ স্টুডিও
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('info')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'info'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <FileText className="w-3.5 h-3.5" /> প্রোডাক্ট ইনফো
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('video')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'video'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Film className="w-3.5 h-3.5" /> এআই ভিডিও
            </button>
          </div>

          {/* Backend Quota Counter */}
          {quota && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-600">
                <span className="font-semibold text-slate-800">{quota.plan}</span> প্ল্যান
              </span>
              <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100/80 border border-emerald-300 text-emerald-800 text-[11px] font-bold">
                <Zap className="w-3 h-3 text-emerald-600" />
                <span>
                  {quota.remainingCredits} / {quota.totalCredits} ক্রেডিট অবশিষ্ট
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Error notification */}
        {errorMessage && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center justify-between gap-3 text-xs text-rose-800 animate-fadeIn">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
            <div className="flex items-center gap-1.5">
              {activeAction && (
                <button
                  type="button"
                  onClick={() => handleProcessImage(activeAction)}
                  className="px-2.5 py-1 bg-white border border-rose-300 hover:bg-rose-100 text-rose-700 rounded-lg font-bold text-[11px] flex items-center gap-1 cursor-pointer"
                >
                  <RefreshCw className="w-3 h-3" /> Retry
                </button>
              )}
              <button
                type="button"
                onClick={handleUseOriginal}
                className="px-2.5 py-1 bg-rose-700 hover:bg-rose-800 text-white rounded-lg font-bold text-[11px] cursor-pointer"
              >
                Use Original
              </button>
            </div>
          </div>
        )}

        {/* Status notification */}
        {statusMessage && (
          <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-xs text-emerald-800">
            <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>{statusMessage}</span>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 1: IMAGE STUDIO                                       */}
        {/* ========================================================= */}
        {activeTab === 'image' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Left: Preview Canvas / Slider (Col 7) */}
            <div className="lg:col-span-7 flex flex-col space-y-3">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-700">প্রিভিউ মোড:</span>
                  <div className="inline-flex rounded-lg border border-slate-200 bg-slate-100 p-0.5">
                    <button
                      type="button"
                      onClick={() => setComparisonMode('slider')}
                      className={`px-2 py-0.5 rounded-md text-[11px] font-medium transition-colors ${
                        comparisonMode === 'slider'
                          ? 'bg-white text-emerald-700 shadow-2xs'
                          : 'text-slate-600'
                      }`}
                    >
                      স্লাইডার
                    </button>
                    <button
                      type="button"
                      onClick={() => setComparisonMode('side-by-side')}
                      className={`px-2 py-0.5 rounded-md text-[11px] font-medium transition-colors ${
                        comparisonMode === 'side-by-side'
                          ? 'bg-white text-emerald-700 shadow-2xs'
                          : 'text-slate-600'
                      }`}
                    >
                      পাশাপাশি
                    </button>
                    <button
                      type="button"
                      onClick={() => setComparisonMode('toggle')}
                      className={`px-2 py-0.5 rounded-md text-[11px] font-medium transition-colors ${
                        comparisonMode === 'toggle'
                          ? 'bg-white text-emerald-700 shadow-2xs'
                          : 'text-slate-600'
                      }`}
                    >
                      টগল
                    </button>
                  </div>
                </div>

                <span className="text-[11px] text-slate-500">
                  {processedImage ? 'Original vs AI Processed' : 'অরিজিনাল ছবি'}
                </span>
              </div>

              {/* Display Canvas Area */}
              <div className="relative aspect-square w-full rounded-2xl overflow-hidden border-2 border-slate-200 bg-slate-100 shadow-sm flex items-center justify-center select-none">
                {isProcessing && (
                  <div className="absolute inset-0 z-30 bg-white/80 backdrop-blur-xs flex flex-col items-center justify-center gap-3">
                    <div className="w-12 h-12 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin" />
                    <p className="text-xs font-bold text-slate-800 animate-pulse">
                      স্মার্ট এআই প্রসেসিং চলছে...
                    </p>
                    <span className="text-[11px] text-slate-500">
                      আপনার অরিজিনাল ছবি সম্পূর্ণ সুরক্ষিত আছে
                    </span>
                  </div>
                )}

                {/* SLIDER COMPARISON MODE */}
                {comparisonMode === 'slider' && (
                  <div className="relative w-full h-full">
                    {/* Processed (Right / Underneath) */}
                    <img
                      src={processedImage || originalImage}
                      alt="AI Processed"
                      referrerPolicy="no-referrer"
                      className="absolute inset-0 w-full h-full object-contain p-3"
                    />

                    {/* Original (Left / Clipped) */}
                    {processedImage && (
                      <div
                        className="absolute inset-0 overflow-hidden"
                        style={{ width: `${sliderPosition}%` }}
                      >
                        <img
                          src={originalImage}
                          alt="Original"
                          referrerPolicy="no-referrer"
                          className="absolute inset-0 w-full h-full object-contain p-3 max-w-none"
                          style={{ width: '100%', height: '100%' }}
                        />
                        <span className="absolute top-3 left-3 bg-black/60 text-white text-[10px] font-bold px-2 py-0.5 rounded">
                          Original
                        </span>
                      </div>
                    )}

                    {processedImage && (
                      <>
                        <span className="absolute top-3 right-3 bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-sm">
                          AI Processed
                        </span>

                        {/* Interactive Slider Bar */}
                        <div
                          className="absolute top-0 bottom-0 w-1 bg-emerald-500 shadow-md cursor-ew-resize flex items-center justify-center pointer-events-none"
                          style={{ left: `${sliderPosition}%` }}
                        >
                          <div className="w-6 h-6 rounded-full bg-emerald-600 text-white shadow-lg flex items-center justify-center text-[10px] border-2 border-white">
                            ↔
                          </div>
                        </div>

                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={sliderPosition}
                          onChange={(e) => setSliderPosition(Number(e.target.value))}
                          className="absolute inset-x-4 bottom-3 opacity-70 hover:opacity-100 cursor-pointer accent-emerald-600 z-20"
                        />
                      </>
                    )}
                  </div>
                )}

                {/* SIDE-BY-SIDE MODE */}
                {comparisonMode === 'side-by-side' && (
                  <div className="grid grid-cols-2 w-full h-full gap-2 p-2">
                    <div className="relative rounded-xl overflow-hidden bg-white border border-slate-200 flex items-center justify-center">
                      <img
                        src={originalImage}
                        alt="Original"
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-contain p-2"
                      />
                      <span className="absolute bottom-2 left-2 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded">
                        Original
                      </span>
                    </div>

                    <div className="relative rounded-xl overflow-hidden bg-white border border-slate-200 flex items-center justify-center">
                      <img
                        src={processedImage || originalImage}
                        alt="Processed"
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-contain p-2"
                      />
                      <span className="absolute bottom-2 right-2 bg-emerald-600 text-white text-[10px] px-1.5 py-0.5 rounded">
                        {processedImage ? 'AI Processed' : 'Original'}
                      </span>
                    </div>
                  </div>
                )}

                {/* TOGGLE MODE */}
                {comparisonMode === 'toggle' && (
                  <div className="relative w-full h-full flex items-center justify-center p-3">
                    <img
                      src={processedImage || originalImage}
                      alt="Preview"
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-contain"
                    />
                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-slate-900/80 p-1 rounded-xl text-white text-xs backdrop-blur-xs">
                      <button
                        type="button"
                        onClick={() => setProcessedImage(null)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${
                          !processedImage ? 'bg-emerald-600' : 'hover:bg-slate-800'
                        }`}
                      >
                        Original
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (!processedImage) handleProcessImage('enhance');
                        }}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${
                          processedImage ? 'bg-emerald-600' : 'hover:bg-slate-800'
                        }`}
                      >
                        AI Processed
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Bottom Quick Action Controls */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleUseOriginal}
                    className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
                  >
                    [Use Original]
                  </button>
                  {processedImage && (
                    <button
                      type="button"
                      onClick={() => activeAction && handleProcessImage(activeAction)}
                      className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-xl transition-colors cursor-pointer flex items-center gap-1"
                    >
                      <RefreshCw className="w-3 h-3" /> [Try Again]
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {processedImage && (
                    <button
                      type="button"
                      onClick={handleConfirmImage}
                      className="px-4 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                      <Check className="w-3.5 h-3.5" /> [Use This]
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      if (processedImage) {
                        onApplyProcessedImage(processedImage);
                      } else {
                        onApplyProcessedImage(originalImage);
                      }
                      onClose();
                    }}
                    className="px-4 py-1.5 text-xs font-bold text-slate-900 bg-emerald-400 hover:bg-emerald-300 rounded-xl shadow-xs transition-colors cursor-pointer"
                  >
                    [Save Product]
                  </button>
                </div>
              </div>
            </div>

            {/* Right: AI Tools Palette (Col 5) */}
            <div className="lg:col-span-5 space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  এআই টুলবক্স (AI Operations)
                </span>
                <span className="text-[11px] text-slate-500">ঐচ্ছিক (Optional)</span>
              </div>

              {/* 8 Distinct AI Operations as Requested */}
              <div className="grid grid-cols-2 gap-2">
                {/* 1. Enhance */}
                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={() => handleProcessImage('enhance')}
                  className={`p-2.5 rounded-xl border text-left flex flex-col gap-1 transition-all cursor-pointer ${
                    activeAction === 'enhance'
                      ? 'bg-emerald-50 border-emerald-500 ring-2 ring-emerald-200'
                      : 'bg-white border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/30'
                  }`}
                >
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                    <Sparkles className="w-4 h-4 text-emerald-600" />
                    <span>✨ Enhance Image</span>
                  </div>
                  <p className="text-[10px] text-slate-500 leading-tight">
                    শার্পনেস ও হাই-রেজোলিউশন ডিটেইলিং
                  </p>
                </button>

                {/* 2. Remove BG */}
                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={() => handleProcessImage('remove-bg')}
                  className={`p-2.5 rounded-xl border text-left flex flex-col gap-1 transition-all cursor-pointer ${
                    activeAction === 'remove-bg'
                      ? 'bg-emerald-50 border-emerald-500 ring-2 ring-emerald-200'
                      : 'bg-white border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/30'
                  }`}
                >
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                    <Scissors className="w-4 h-4 text-indigo-600" />
                    <span>✂️ Remove BG</span>
                  </div>
                  <p className="text-[10px] text-slate-500 leading-tight">
                    ব্যাকগ্রাউন্ড মুছে পিউর প্রোডাক্ট আলাদা করুন
                  </p>
                </button>

                {/* 3. Improve Lighting */}
                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={() => handleProcessImage('improve-lighting')}
                  className={`p-2.5 rounded-xl border text-left flex flex-col gap-1 transition-all cursor-pointer ${
                    activeAction === 'improve-lighting'
                      ? 'bg-emerald-50 border-emerald-500 ring-2 ring-emerald-200'
                      : 'bg-white border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/30'
                  }`}
                >
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                    <Lightbulb className="w-4 h-4 text-amber-500" />
                    <span>💡 Improve Lighting</span>
                  </div>
                  <p className="text-[10px] text-slate-500 leading-tight">
                    সফট স্টুডিও লাইটিং ও শ্যাডো রিমুভাল
                  </p>
                </button>

                {/* 4. Optimize Color */}
                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={() => handleProcessImage('optimize-color')}
                  className={`p-2.5 rounded-xl border text-left flex flex-col gap-1 transition-all cursor-pointer ${
                    activeAction === 'optimize-color'
                      ? 'bg-emerald-50 border-emerald-500 ring-2 ring-emerald-200'
                      : 'bg-white border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/30'
                  }`}
                >
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                    <Palette className="w-4 h-4 text-rose-500" />
                    <span>🎨 Optimize Color</span>
                  </div>
                  <p className="text-[10px] text-slate-500 leading-tight">
                    ট্রু-টোন ভাইব্রেন্ট আসল কালার কারেকশন
                  </p>
                </button>

                {/* 5. E-commerce Optimize */}
                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={() => handleProcessImage('ecommerce-optimize')}
                  className={`p-2.5 rounded-xl border text-left flex flex-col gap-1 transition-all cursor-pointer ${
                    activeAction === 'ecommerce-optimize'
                      ? 'bg-emerald-50 border-emerald-500 ring-2 ring-emerald-200'
                      : 'bg-white border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/30'
                  }`}
                >
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                    <ShoppingBag className="w-4 h-4 text-teal-600" />
                    <span>🛍️ E-com Optimize</span>
                  </div>
                  <p className="text-[10px] text-slate-500 leading-tight">
                    ১:১ স্কয়ার রেশিও ও ড্রপ শ্যাডো ব্যালান্স
                  </p>
                </button>

                {/* 6. Auto Crop */}
                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={() => handleProcessImage('auto-crop')}
                  className={`p-2.5 rounded-xl border text-left flex flex-col gap-1 transition-all cursor-pointer ${
                    activeAction === 'auto-crop'
                      ? 'bg-emerald-50 border-emerald-500 ring-2 ring-emerald-200'
                      : 'bg-white border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/30'
                  }`}
                >
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                    <Crop className="w-4 h-4 text-blue-600" />
                    <span>📐 Auto Crop</span>
                  </div>
                  <p className="text-[10px] text-slate-500 leading-tight">
                    সেন্ট্রাল অবজেক্ট ফোকাস ও বাউন্ডিং
                  </p>
                </button>

                {/* 7. Generate Thumbnail */}
                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={() => handleProcessImage('thumbnail')}
                  className={`p-2.5 rounded-xl border text-left flex flex-col gap-1 transition-all cursor-pointer ${
                    activeAction === 'thumbnail'
                      ? 'bg-emerald-50 border-emerald-500 ring-2 ring-emerald-200'
                      : 'bg-white border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/30'
                  }`}
                >
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                    <ImageIcon className="w-4 h-4 text-amber-600" />
                    <span>🖼️ Thumbnail</span>
                  </div>
                  <p className="text-[10px] text-slate-500 leading-tight">
                    ফাস্ট লোডিং ওয়েব সাইজ কম্প্রেস
                  </p>
                </button>

                {/* 8. Change Background Trigger */}
                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={() => handleProcessImage('change-bg', selectedBgTheme)}
                  className={`p-2.5 rounded-xl border text-left flex flex-col gap-1 transition-all cursor-pointer ${
                    activeAction === 'change-bg'
                      ? 'bg-emerald-50 border-emerald-500 ring-2 ring-emerald-200'
                      : 'bg-white border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/30'
                  }`}
                >
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                    <Layers className="w-4 h-4 text-purple-600" />
                    <span>🎨 Change BG</span>
                  </div>
                  <p className="text-[10px] text-slate-500 leading-tight">
                    স্টুডিও ব্যাকগ্রাউন্ড রিপ্লেসমেন্ট
                  </p>
                </button>
              </div>

              {/* Background Theme Selector */}
              <div className="pt-2 border-t border-slate-200 space-y-2">
                <label className="block text-[11px] font-bold text-slate-700">
                  ব্যাকগ্রাউন্ড প্রিসেট পছন্দ করুন:
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { id: 'studio-white', label: 'স্টুডিও হোয়াইট', color: 'bg-white border-slate-300' },
                    { id: 'warm-pastel', label: 'ওয়ার্ম প্যাস্টেল', color: 'bg-[#FFFBF5] border-amber-200' },
                    { id: 'wooden-table', label: 'উডেন টেবিল', color: 'bg-[#DEB887] border-amber-700' },
                    { id: 'marble-counter', label: 'মার্বেল কাউন্টার', color: 'bg-slate-200 border-slate-400' },
                    { id: 'gradient-modern', label: 'মডার্ন গ্রেডিয়েন্ট', color: 'bg-gradient-to-r from-emerald-100 to-indigo-100 border-emerald-300' },
                    { id: 'ecom-podium', label: '৩ডি পোডিয়াম', color: 'bg-slate-100 border-slate-300' },
                  ].map((bg) => (
                    <button
                      key={bg.id}
                      type="button"
                      onClick={() => {
                        setSelectedBgTheme(bg.id);
                        handleProcessImage('change-bg', bg.id);
                      }}
                      className={`px-2 py-1.5 rounded-lg border text-[10px] font-semibold text-slate-700 flex items-center gap-1.5 transition-all cursor-pointer ${
                        selectedBgTheme === bg.id
                          ? 'border-emerald-500 ring-2 ring-emerald-200 bg-white'
                          : 'hover:bg-slate-100'
                      }`}
                    >
                      <span className={`w-3 h-3 rounded-full border ${bg.color}`} />
                      <span className="truncate">{bg.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 2: AI PRODUCT INFORMATION                             */}
        {/* ========================================================= */}
        {activeTab === 'info' && (
          <div className="space-y-4">
            <div className="p-4 bg-emerald-50/60 border border-emerald-200 rounded-2xl flex flex-wrap items-center justify-between gap-3">
              <div>
                <h4 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-emerald-600" /> এআই প্রোডাক্ট ইনফরমেশন জেনারেটর
                </h4>
                <p className="text-xs text-slate-600 mt-0.5">
                  ছবি ও পণ্যের নাম বিশ্লেষণ করে হাই-কনভার্টিং ডেসক্রিপশন, ক্যাটাগরি ও কি-ওয়ার্ড স্বয়ংক্রিয় তৈরি করুন
                </p>
              </div>

              <button
                type="button"
                disabled={isGeneratingInfo}
                onClick={handleGenerateInfo}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-2xs flex items-center gap-1.5 transition-all cursor-pointer"
              >
                {isGeneratingInfo ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" /> জেনারেট হচ্ছে...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" /> এআই তথ্য জেনারেট করুন
                  </>
                )}
              </button>
            </div>

            {/* Editable Form Controls */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
              {/* Product Name */}
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  পণ্যের নাম (Product Name)
                </label>
                <input
                  type="text"
                  value={editableInfo.productName}
                  onChange={(e) =>
                    setEditableInfo({ ...editableInfo, productName: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500"
                  placeholder="যেমন: Wireless Bluetooth Earbuds Pro"
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ক্যাটাগরি (Category)
                </label>
                <input
                  type="text"
                  value={editableInfo.category}
                  onChange={(e) =>
                    setEditableInfo({ ...editableInfo, category: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Subcategory */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  সাব-ক্যাটাগরি (Subcategory)
                </label>
                <input
                  type="text"
                  value={editableInfo.subcategory}
                  onChange={(e) =>
                    setEditableInfo({ ...editableInfo, subcategory: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Short Description */}
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  সংক্ষিপ্ত বিবরণ (Short Description for Facebook/SMS)
                </label>
                <input
                  type="text"
                  value={editableInfo.shortDescription}
                  onChange={(e) =>
                    setEditableInfo({ ...editableInfo, shortDescription: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500"
                  placeholder="১-২ লাইনের আকর্ষণীয় মার্কেটিং ক্যাপশন..."
                />
              </div>

              {/* Detailed Description */}
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  বিস্তারিত ডেসক্রিপশন ও ফিচার স্পেক্স (Detailed Description)
                </label>
                <textarea
                  rows={4}
                  value={editableInfo.detailedDescription}
                  onChange={(e) =>
                    setEditableInfo({ ...editableInfo, detailedDescription: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500"
                  placeholder="পয়েন্ট ভিত্তিক পণ্যের মূল বৈশিষ্ট্যসমূহ..."
                />
              </div>

              {/* Keywords & Tags */}
              <div className="md:col-span-2 flex flex-wrap gap-2 pt-2 border-t border-slate-100">
                <div className="flex-1">
                  <span className="text-[11px] font-bold text-slate-700 block mb-1">
                    সার্চ কি-ওয়ার্ডস (Keywords):
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {editableInfo.keywords?.length > 0 ? (
                      editableInfo.keywords.map((kw, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 bg-slate-100 text-slate-700 text-xs rounded-md border border-slate-200"
                        >
                          #{kw}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-slate-400">কোনো কি-ওয়ার্ড জেনারেট হয়নি</span>
                    )}
                  </div>
                </div>

                <div className="flex-1">
                  <span className="text-[11px] font-bold text-slate-700 block mb-1">
                    মার্কেটপ্লেস ট্যাগস (Tags):
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {editableInfo.tags?.length > 0 ? (
                      editableInfo.tags.map((t, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-xs rounded-md border border-emerald-200"
                        >
                          {t}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-slate-400">কোনো ট্যাগ তৈরি হয়নি</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Apply Information Button */}
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" size="sm" onClick={onClose}>
                বাতিল
              </Button>
              <button
                type="button"
                onClick={handleApplyInfoToForm}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-2xs flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Check className="w-4 h-4" /> ফর্মটিতে এই তথ্য যুক্ত করুন
              </button>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 3: AI PRODUCT VIDEO                                   */}
        {/* ========================================================= */}
        {activeTab === 'video' && (
          <div className="space-y-4">
            <div className="p-4 bg-slate-900 text-white rounded-2xl flex flex-wrap items-center justify-between gap-3 shadow-md">
              <div>
                <div className="flex items-center gap-2">
                  <Film className="w-5 h-5 text-emerald-400" />
                  <h4 className="text-sm font-bold text-white">
                    🎬 ক্রিয়েট এআই প্রোডাক্ট ভিডিও (Create AI Product Video)
                  </h4>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/40">
                    ডেমো শোকেস প্লেয়ার / Non-blocking
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-1">
                  ফেসবুক রিলস, টিকটক ও ইনস্টাগ্রাম শপ প্রমোশনের জন্য অটোমেটিক সিনেমেটিক প্রোডাক্ট ভিডিও শোকেস
                </p>
              </div>

              {!videoJob && (
                <button
                  type="button"
                  onClick={handleCreateVideo}
                  disabled={isVideoLoading}
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold rounded-xl shadow-md flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5 fill-current" /> ভিডিও তৈরি করুন
                </button>
              )}
            </div>

            {/* Video Status & Rendering Card */}
            {videoJob && (
              <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-2xs space-y-4">
                {/* Status Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-700">স্ট্যাটাস:</span>
                    <span
                      className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                        videoJob.status === 'ready'
                          ? 'bg-emerald-100 text-emerald-800'
                          : videoJob.status === 'processing'
                          ? 'bg-amber-100 text-amber-800 animate-pulse'
                          : videoJob.status === 'failed'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {videoJob.status === 'queued' && 'Queued (কিউতে অপেক্ষারত)'}
                      {videoJob.status === 'processing' && `Processing (${videoJob.progress || 40}%)`}
                      {videoJob.status === 'ready' && 'Ready (ভিডিও প্রস্তুত)'}
                      {videoJob.status === 'failed' && 'Failed (ব্যর্থ)'}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    {videoJob.status === 'ready' && (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            if (videoJob.videoUrl && onApplyVideoUrl) {
                              onApplyVideoUrl(videoJob.videoUrl);
                            }
                            onClose();
                          }}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5" /> Use Video
                        </button>
                        <button
                          type="button"
                          onClick={handleCreateVideo}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1 cursor-pointer"
                        >
                          <RefreshCw className="w-3 h-3" /> Regenerate
                        </button>
                      </>
                    )}

                    <button
                      type="button"
                      onClick={handleDeleteVideo}
                      className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
                      title="Delete Video"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Progress bar during processing */}
                {videoJob.status === 'processing' && (
                  <div className="space-y-1">
                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 transition-all duration-500"
                        style={{ width: `${videoJob.progress || 45}%` }}
                      />
                    </div>
                    <p className="text-[11px] text-slate-500">
                      সিনেমেটিক ক্যামেরা মোশন ও থিম রেন্ডার হচ্ছে... ব্যাকগ্রাউন্ডে চলবে, পেজ ফ্রিজ হবে না।
                    </p>
                  </div>
                )}

                {/* Ready Showcase Player */}
                {videoJob.status === 'ready' && videoJob.videoUrl && (
                  <div className="relative aspect-square max-w-sm mx-auto rounded-2xl overflow-hidden border-2 border-slate-900 bg-black shadow-lg flex items-center justify-center">
                    <img
                      src={videoJob.videoUrl}
                      alt="Animated Product Video"
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-contain"
                    />
                    <div className="absolute top-2 left-2 bg-emerald-500/90 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Play className="w-2.5 h-2.5 fill-current" /> 1080p HD Showcase
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
};
