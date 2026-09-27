import React, { useState, useEffect, useRef } from 'react';
import { Product } from '../../types';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import {
  Camera,
  Barcode,
  Volume2,
  VolumeX,
  Flashlight,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Package,
  X,
  Search,
} from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';

interface CameraBarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  onProductScanned: (product: Product) => void;
}

export const CameraBarcodeScannerModal: React.FC<CameraBarcodeScannerModalProps> = ({
  isOpen,
  onClose,
  products,
  onProductScanned,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [isTorchOn, setIsTorchOn] = useState(false);
  const [hasTorch, setHasTorch] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isContinuous, setIsContinuous] = useState(true);
  const [lastScannedCode, setLastScannedCode] = useState<string>('');
  const [recentlyScannedProduct, setRecentlyScannedProduct] = useState<Product | null>(null);
  const [manualQuery, setManualQuery] = useState('');

  // Audio Beep generator using Web Audio API
  const playBeep = () => {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(1760, ctx.currentTime); // High pitch POS scan beep (A6)
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.12);
    } catch {
      // AudioContext not allowed without user gesture in some contexts
    }
  };

  // Start Camera
  const startCamera = async () => {
    setErrorMessage('');
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('আপনার ব্রাউজারে ক্যামেরা সাপোর্ট করে না');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }

      setHasCameraPermission(true);

      // Check for torch capability
      const videoTrack = stream.getVideoTracks()[0];
      const capabilities = (videoTrack as any)?.getCapabilities?.();
      if (capabilities && 'torch' in capabilities) {
        setHasTorch(true);
      } else {
        setHasTorch(false);
      }
    } catch (err: any) {
      console.warn('Camera access error:', err);
      setHasCameraPermission(false);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setErrorMessage('ক্যামেরা ব্যবহারের অনুমতি দেওয়া হয়নি। অনুগ্রহ করে ব্রাউজার সেটিংসে ক্যামেরার পারমিশন অন করুন।');
      } else {
        setErrorMessage(err?.message || 'ক্যামেরা চালু করতে সমস্যা হয়েছে');
      }
    }
  };

  // Stop Camera
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  // Toggle Torch
  const toggleTorch = async () => {
    if (!streamRef.current) return;
    const videoTrack = streamRef.current.getVideoTracks()[0];
    try {
      await (videoTrack as any)?.applyConstraints({
        advanced: [{ torch: !isTorchOn }],
      });
      setIsTorchOn(!isTorchOn);
    } catch (e) {
      console.warn('Torch failed:', e);
    }
  };

  // Toggle Camera Facing
  const toggleFacingMode = () => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  // Lifecycle
  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopCamera();
      setRecentlyScannedProduct(null);
      setLastScannedCode('');
    }
    return () => {
      stopCamera();
    };
  }, [isOpen, facingMode]);

  // Frame processing loop
  useEffect(() => {
    if (!isOpen || hasCameraPermission !== true) return;

    let animationFrameId: number;
    let isDetecting = false;
    let barcodeDetector: any = null;

    // Check BarcodeDetector API
    if ('BarcodeDetector' in window) {
      try {
        barcodeDetector = new (window as any).BarcodeDetector({
          formats: ['code_128', 'code_39', 'ean_13', 'ean_8', 'qr_code', 'upc_a', 'upc_e'],
        });
      } catch (err) {
        console.warn('BarcodeDetector format error:', err);
      }
    }

    const processFrame = async () => {
      if (
        !isDetecting &&
        videoRef.current &&
        videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA
      ) {
        isDetecting = true;
        try {
          if (barcodeDetector) {
            const barcodes = await barcodeDetector.detect(videoRef.current);
            if (barcodes.length > 0) {
              const rawValue = barcodes[0].rawValue;
              if (rawValue && rawValue !== lastScannedCode) {
                handleMatchedCode(rawValue);
              }
            }
          }
        } catch {
          // Frame skip
        } finally {
          isDetecting = false;
        }
      }
      animationFrameId = requestAnimationFrame(processFrame);
    };

    animationFrameId = requestAnimationFrame(processFrame);
    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [isOpen, hasCameraPermission, lastScannedCode, products]);

  // Match Barcode to Product
  const handleMatchedCode = (code: string) => {
    const clean = code.trim().toLowerCase();
    const match = products.find(
      (p) =>
        p.barcode.toLowerCase() === clean ||
        p.sku.toLowerCase() === clean ||
        (p.imeiList && p.imeiList.some((im) => im.toLowerCase() === clean))
    );

    setLastScannedCode(code);
    playBeep();

    if (match) {
      setRecentlyScannedProduct(match);
      onProductScanned(match);

      if (!isContinuous) {
        setTimeout(() => {
          onClose();
        }, 600);
      } else {
        // Reset code lock after 1.8s so user can re-scan same item if needed
        setTimeout(() => {
          setLastScannedCode('');
        }, 1800);
      }
    } else {
      setRecentlyScannedProduct(null);
    }
  };

  const handleManualSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualQuery.trim()) return;
    handleMatchedCode(manualQuery.trim());
    setManualQuery('');
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="ক্যামেরা বারকোড স্ক্যানার (Camera Barcode POS)"
      subtitle="ফোনের ক্যামেরা পণ্যের বারকোডের সামনে ধরুন"
      maxWidth="lg"
    >
      <div className="space-y-4">
        {/* Scanner Viewport */}
        <div className="relative w-full aspect-4/3 bg-slate-950 rounded-2xl overflow-hidden shadow-inner flex items-center justify-center border-2 border-slate-800">
          {hasCameraPermission === false ? (
            <div className="p-6 text-center text-white space-y-3 max-w-sm">
              <div className="w-12 h-12 rounded-full bg-rose-500/20 text-rose-400 mx-auto flex items-center justify-center">
                <AlertCircle className="w-6 h-6" />
              </div>
              <p className="text-xs text-rose-200">{errorMessage}</p>
              <Button onClick={startCamera} variant="outline" size="sm" className="bg-white/10 text-white border-white/20">
                পুনরায় অনুমতি চান
              </Button>
            </div>
          ) : (
            <>
              <video
                ref={videoRef}
                playsInline
                muted
                className="w-full h-full object-cover"
              />
              <canvas ref={canvasRef} className="hidden" />

              {/* Scanning Target Overlay */}
              <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center p-6">
                {/* Visual reticle box */}
                <div className="relative w-64 sm:w-80 h-36 sm:h-44 border-2 border-emerald-400/70 rounded-2xl shadow-[0_0_0_9999px_rgba(15,23,42,0.6)]">
                  {/* Corner Highlights */}
                  <span className="absolute -top-1 -left-1 w-5 h-5 border-t-4 border-l-4 border-emerald-400 rounded-tl-lg" />
                  <span className="absolute -top-1 -right-1 w-5 h-5 border-t-4 border-r-4 border-emerald-400 rounded-tr-lg" />
                  <span className="absolute -bottom-1 -left-1 w-5 h-5 border-b-4 border-l-4 border-emerald-400 rounded-bl-lg" />
                  <span className="absolute -bottom-1 -right-1 w-5 h-5 border-b-4 border-r-4 border-emerald-400 rounded-br-lg" />

                  {/* Animated Laser Aim Line */}
                  <div className="w-full h-0.5 bg-rose-500 shadow-[0_0_12px_#f43f5e] animate-bounce my-auto mt-16 sm:mt-20 opacity-80" />
                </div>
                <p className="mt-4 text-xs font-medium text-emerald-300 drop-shadow-md">
                  বারকোডটি বক্সের মাঝে সোজা রাখুন
                </p>
              </div>

              {/* Floating Camera Controls Top Right */}
              <div className="absolute top-3 right-3 flex items-center gap-1.5 z-20">
                {hasTorch && (
                  <button
                    type="button"
                    onClick={toggleTorch}
                    className={`p-2 rounded-xl backdrop-blur-md transition-colors ${
                      isTorchOn ? 'bg-amber-400 text-slate-950 font-bold' : 'bg-slate-900/70 text-white hover:bg-slate-900'
                    }`}
                    title="ফ্ল্যাশ লাইট"
                  >
                    <Flashlight className="w-4 h-4" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={toggleFacingMode}
                  className="p-2 rounded-xl bg-slate-900/70 hover:bg-slate-900 text-white backdrop-blur-md transition-colors"
                  title="ক্যামেরা পরিবর্তন করুন"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setSoundEnabled(!soundEnabled)}
                  className={`p-2 rounded-xl backdrop-blur-md transition-colors ${
                    soundEnabled ? 'bg-slate-900/70 text-emerald-400' : 'bg-slate-900/70 text-slate-400'
                  }`}
                  title={soundEnabled ? 'শব্দ অন' : 'শব্দ অফ'}
                >
                  {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                </button>
              </div>
            </>
          )}
        </div>

        {/* Recently Scanned Confirmation Banner */}
        {recentlyScannedProduct && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between gap-3 text-xs animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="flex items-center gap-2.5 truncate">
              <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div className="truncate">
                <p className="font-bold text-slate-900 truncate">{recentlyScannedProduct.name}</p>
                <p className="text-[11px] text-emerald-800 font-mono">
                  {formatCurrency(recentlyScannedProduct.sellingPrice)} | স্টক: {recentlyScannedProduct.stock} {recentlyScannedProduct.unit}
                </p>
              </div>
            </div>
            <span className="px-2 py-1 bg-emerald-600 text-white rounded-md text-[10px] font-bold shrink-0">
              কার্টে যোগ হয়েছে ✓
            </span>
          </div>
        )}

        {/* Options & Manual Fallback */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
          <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={isContinuous}
              onChange={(e) => setIsContinuous(e.target.checked)}
              className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
            />
            <span>একটানা মাল্টি-স্ক্যান মোড (একটি স্ক্যান হলে পপআপ বন্ধ হবে না)</span>
          </label>

          <form onSubmit={handleManualSearch} className="flex items-center gap-2 w-full sm:w-auto">
            <input
              type="text"
              value={manualQuery}
              onChange={(e) => setManualQuery(e.target.value)}
              placeholder="বারকোড/SKU ম্যানুয়াল লিখুন"
              className="px-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 w-full sm:w-44 font-mono"
            />
            <Button type="submit" variant="secondary" size="sm">
              যোগ
            </Button>
          </form>
        </div>

        {/* Bottom Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-100">
          <span className="text-[11px] text-slate-400">
            টিপস: আবছা আলো হলে ফ্ল্যাশ লাইট অন করুন অথবা ক্যামেরার ফোকাস ঠিক করুন
          </span>
          <Button onClick={onClose} variant="primary" size="sm">
            সম্পন্ন (Done)
          </Button>
        </div>
      </div>
    </Modal>
  );
};
