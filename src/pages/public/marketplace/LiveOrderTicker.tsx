import React, { useState, useEffect } from 'react';
import { X, ShoppingBag, CheckCircle } from 'lucide-react';

interface LiveOrderTickerProps {
  products: any[];
  onSelectProduct: (product: any) => void;
}

const sampleBuyers = [
  { name: 'তানভীর আহমেদ', location: 'মিরপুর-১০, ঢাকা' },
  { name: 'নুসরাত জাহান', location: 'চকবাজার, চট্টগ্রাম' },
  { name: 'রাকিবুল হাসান', location: 'উত্তরা সেক্টর-৭, ঢাকা' },
  { name: 'সাদিয়া ইসলাম', location: 'ধানমন্ডি, ঢাকা' },
  { name: 'মাহমুদুল হক', location: 'বোয়ালিয়া, রাজশাহী' },
  { name: 'ফারজানা আক্তার', location: 'জিন্দাবাজার, সিলেট' },
  { name: 'আরিফ হোসেন', location: 'খুলনা সদর' },
  { name: 'মেহজাবিন চৌধুরী', location: 'বনানী, ঢাকা' },
];

const timeSpans = ['১ মিনিট আগে', '২ মিনিট আগে', '৩ মিনিট আগে', '৫ মিনিট আগে'];

export const LiveOrderTicker: React.FC<LiveOrderTickerProps> = ({ products, onSelectProduct }) => {
  const [currentNotification, setCurrentNotification] = useState<{
    buyerName: string;
    location: string;
    product: any;
    timeAgo: string;
  } | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!products || products.length === 0) return;

    const triggerNext = () => {
      const randomProduct = products[Math.floor(Math.random() * products.length)];
      const randomBuyer = sampleBuyers[Math.floor(Math.random() * sampleBuyers.length)];
      const randomTime = timeSpans[Math.floor(Math.random() * timeSpans.length)];

      setCurrentNotification({
        buyerName: randomBuyer.name,
        location: randomBuyer.location,
        product: randomProduct,
        timeAgo: randomTime,
      });
      setIsVisible(true);

      // Hide after 6 seconds
      setTimeout(() => {
        setIsVisible(false);
      }, 6000);
    };

    // First trigger after 3.5 seconds
    const initialTimeout = setTimeout(triggerNext, 3500);

    // Then interval every 18 seconds
    const interval = setInterval(triggerNext, 18000);

    return () => {
      clearTimeout(initialTimeout);
      clearInterval(interval);
    };
  }, [products]);

  if (!currentNotification || !isVisible) return null;

  return (
    <div className="fixed bottom-20 left-4 z-40 max-w-xs sm:max-w-sm animate-slide-up transition-all">
      <div className="bg-white/95 backdrop-blur-md rounded-2xl p-2.5 sm:p-3 shadow-xl border border-orange-200/80 flex items-center gap-3 relative group">
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsVisible(false);
          }}
          className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-slate-200 hover:bg-slate-300 text-slate-600 flex items-center justify-center text-xs transition-colors cursor-pointer"
        >
          <X className="w-3 h-3" />
        </button>

        <div
          onClick={() => onSelectProduct(currentNotification.product)}
          className="w-12 h-12 rounded-xl overflow-hidden bg-slate-100 shrink-0 cursor-pointer border border-slate-200"
        >
          <img
            src={
              currentNotification.product.image ||
              'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=120&auto=format&fit=crop&q=60'
            }
            alt={currentNotification.product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
          />
        </div>

        <div
          onClick={() => onSelectProduct(currentNotification.product)}
          className="min-w-0 flex-1 cursor-pointer"
        >
          <div className="flex items-center gap-1 text-[11px] text-slate-500">
            <span className="font-bold text-slate-800 truncate">{currentNotification.buyerName}</span>
            <span>•</span>
            <span className="truncate">{currentNotification.location}</span>
          </div>

          <p className="text-xs font-bold text-slate-900 truncate group-hover:text-orange-600 transition-colors">
            {currentNotification.product.name}
          </p>

          <div className="flex items-center gap-1.5 mt-0.5 text-[10px]">
            <span className="text-emerald-700 font-bold flex items-center gap-0.5">
              <CheckCircle className="w-2.5 h-2.5" />
              এইমাত্র অর্ডার হয়েছে
            </span>
            <span className="text-slate-400">({currentNotification.timeAgo})</span>
          </div>
        </div>
      </div>
    </div>
  );
};
