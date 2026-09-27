import React, { useState } from 'react';
import { X, Share2, Copy, Check, MessageCircle, Gift, Sparkles } from 'lucide-react';
import { useToast } from '../../../context/ToastContext';
import { formatCurrency } from '../../../utils/formatters';

interface SocialShareModalProps {
  product: {
    id: string;
    name: string;
    sellingPrice: number;
    discount?: number;
    image?: string;
  };
  onClose: () => void;
}

export const SocialShareModal: React.FC<SocialShareModalProps> = ({ product, onClose }) => {
  const { showToast } = useToast();
  const [copied, setCopied] = useState(false);

  const finalPrice = product.sellingPrice - (product.discount || 0);
  const referralTag = 'SHOPX_WIN50';
  const shareUrl = `${window.location.origin}${window.location.pathname}?ref=${referralTag}#prod-${product.id}`;

  const shareText = `SmartShopX.bd-এ দারুণ অফার! "${product.name}" এখন মাত্র ৳${finalPrice} টাকায় পাওয়া যাচ্ছে। এখনই অর্ডার করুন: ${shareUrl}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    showToast('রেফারেল লিংক ক্লিপবোর্ডে কপি করা হয়েছে!', 'success');
    setTimeout(() => setCopied(false), 3000);
  };

  const handleShareWhatsApp = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, '_blank');
  };

  const handleShareFacebook = () => {
    window.open(
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
      '_blank'
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-3xl max-w-sm w-full p-5 sm:p-6 text-slate-800 space-y-4 shadow-2xl border border-slate-200 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center">
            <Share2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-black text-slate-900 leading-tight">শেয়ার করুন ও রিওয়ার্ড জিতুন</h3>
            <p className="text-xs text-slate-500">বন্ধু ও পরিবারকে লিংক শেয়ার করুন</p>
          </div>
        </div>

        {/* Product mini card */}
        <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-200">
          <img
            src={
              product.image ||
              'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=100&auto=format&fit=crop&q=60'
            }
            alt={product.name}
            className="w-12 h-12 rounded-xl object-cover border border-slate-200 shrink-0"
          />
          <div className="min-w-0">
            <h4 className="font-bold text-xs text-slate-900 truncate">{product.name}</h4>
            <span className="font-mono font-bold text-xs text-orange-600">
              {formatCurrency(finalPrice)}
            </span>
          </div>
        </div>

        {/* Reward Explanation Banner */}
        <div className="p-3 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-2">
          <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold block">শেয়ার অ্যান্ড আর্ন বোনাস:</span>
            <span>আপনার শেয়ার করা লিংক থেকে কেনাকাটা সম্পন্ন হলেই পাবেন ৫০টি দারাজ কয়েন বা ক্যাশব্যাক!</span>
          </div>
        </div>

        {/* Direct Action Buttons */}
        <div className="space-y-2 pt-1">
          <button
            type="button"
            onClick={handleShareWhatsApp}
            className="w-full py-2.5 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
          >
            <MessageCircle className="w-4 h-4" />
            <span>হোয়াটসঅ্যাপে শেয়ার করুন (WhatsApp)</span>
          </button>

          <button
            type="button"
            onClick={handleShareFacebook}
            className="w-full py-2.5 px-4 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
          >
            <Share2 className="w-4 h-4" />
            <span>ফেসবুকে শেয়ার করুন (Facebook)</span>
          </button>
        </div>

        {/* Copy Link Input */}
        <div className="pt-1">
          <label className="text-[11px] font-bold text-slate-500 block mb-1">সরাসরি লিংক কপি করুন:</label>
          <div className="flex items-center gap-1.5 p-1.5 rounded-xl bg-slate-100 border border-slate-200">
            <input
              type="text"
              readOnly
              value={shareUrl}
              className="bg-transparent text-xs text-slate-700 flex-1 px-2 border-none outline-none font-mono truncate"
            />
            <button
              type="button"
              onClick={handleCopyLink}
              className="px-3 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs flex items-center gap-1 cursor-pointer transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'কপি হয়েছে' : 'কপি'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
