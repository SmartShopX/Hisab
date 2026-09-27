import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { DataStore } from '../../services/dataStorage';
import { Product, Shop, Coupon, ProductReview } from '../../types';
import { formatCurrency } from '../../utils/formatters';
import { useToast } from '../../context/ToastContext';
import { Button } from '../../components/common/Button';
import {
  ShoppingBag,
  Search,
  Store,
  Flame,
  Truck,
  ShieldCheck,
  SlidersHorizontal,
  ChevronRight,
  ExternalLink,
  Sparkles,
  CheckCircle2,
  X,
  Star,
  Tag,
  Clock,
  CreditCard,
  QrCode,
  ThumbsUp,
  Share2,
  Heart,
  Coins,
  MessageCircle,
  RotateCcw,
  MapPin,
  Eye,
  Check,
  Package,
  Phone,
  Gift,
  Award,
  Mic,
  Scale,
  Printer,
} from 'lucide-react';
import { EmiCalculatorModal } from './marketplace/EmiCalculatorModal';
import { LiveOrderTicker } from './marketplace/LiveOrderTicker';
import { CollectableVouchersStrip, marketplaceVouchers } from './marketplace/CollectableVouchersStrip';
import { VoiceSearchModal } from './marketplace/VoiceSearchModal';
import { ProductComparisonModal, ComparisonFloatingBar } from './marketplace/ProductComparisonModal';
import { SocialShareModal } from './marketplace/SocialShareModal';
import { DigitalInvoiceModal } from './marketplace/DigitalInvoiceModal';

export const MarketplaceView: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { showToast } = useToast();

  // URL Query Params (e.g. ?ref=RAKIB10)
  const queryParams = new URLSearchParams(location.search);
  const referralCode = queryParams.get('ref') || '';

  // Load all businesses and their respective active online products
  const businesses = useMemo(() => DataStore.getBusinesses(), []);

  const shopsMap = useMemo(() => {
    const map: Record<string, Shop> = {};
    businesses.forEach((b) => {
      map[b.id] = DataStore.getShop(b.id);
    });
    return map;
  }, [businesses]);

  // Aggregate all products across all shops with seller details
  const allProducts = useMemo(() => {
    const list: (Product & {
      uniqueKey: string;
      shopName: string;
      shopSlug: string;
      shopId: string;
      shopMobile?: string;
      isMallStore?: boolean;
    })[] = [];

    businesses.forEach((b, idx) => {
      const shopProducts = DataStore.getProducts(b.id);
      const s = shopsMap[b.id];
      // By default first 3 shops are treated as certified Daraz Mall flagship stores
      const isMall = idx < 3 || b.id === 'shop_101' || b.id === 'shop_102';

      shopProducts.forEach((p) => {
        if (p.onlineStoreVisible && p.isActive) {
          list.push({
            ...p,
            uniqueKey: `${b.id}_${p.id}`,
            shopName: s?.name || b.name,
            shopSlug: s?.storeSlug || b.storeSlug || b.id,
            shopId: b.id,
            shopMobile: s?.mobile || '01711223344',
            isMallStore: isMall,
          });
        }
      });
    });
    return list;
  }, [businesses, shopsMap]);

  // Filter & Search states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedShopFilter, setSelectedShopFilter] = useState<string>('ALL');
  const [priceSort, setPriceSort] = useState<'default' | 'low-high' | 'high-low'>('default');
  const [isMallOnly, setIsMallOnly] = useState<boolean>(false);

  // Flash Sale Countdown (Hours, Minutes, Seconds)
  const [timeLeft, setTimeLeft] = useState({ hours: 5, minutes: 24, seconds: 18 });

  useEffect(() => {
    document.title = 'SmartShopX.bd - মেগা অনলাইন মার্কেটপ্লেস ও ফ্ল্যাগশিপ স্টোর';
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
        if (prev.minutes > 0) return { ...prev, minutes: 59, seconds: 59 };
        if (prev.hours > 0) return { ...prev, hours: prev.hours - 1, minutes: 59, seconds: 59 };
        return { hours: 12, minutes: 0, seconds: 0 };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Multi-vendor Cart
  const [cart, setCart] = useState<{ product: any; quantity: number; selectedVariant?: string }[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);

  // Wishlist System (persisted in localStorage)
  const [wishlist, setWishlist] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('smartshopx_marketplace_wishlist');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [isWishlistOpen, setIsWishlistOpen] = useState(false);

  const toggleWishlist = (productId: string, productName: string) => {
    setWishlist((prev) => {
      const exists = prev.includes(productId);
      const updated = exists ? prev.filter((id) => id !== productId) : [...prev, productId];
      try {
        localStorage.setItem('smartshopx_marketplace_wishlist', JSON.stringify(updated));
      } catch {}
      showToast(
        exists
          ? `"${productName}" পছন্দের তালিকা থেকে সরানো হয়েছে`
          : `❤️ "${productName}" পছন্দের তালিকায় সংরক্ষিত হয়েছে`,
        exists ? 'info' : 'success'
      );
      return updated;
    });
  };

  // Coins & Rewards System
  const [coins, setCoins] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('smartshopx_marketplace_coins');
      return saved ? parseInt(saved) : 150;
    } catch {
      return 150;
    }
  });
  const [hasClaimedCoinsToday, setHasClaimedCoinsToday] = useState<boolean>(() => {
    return localStorage.getItem('smartshopx_coins_claimed_date') === new Date().toISOString().split('T')[0];
  });
  const [useCoinsInCheckout, setUseCoinsInCheckout] = useState(false);

  const handleClaimDailyCoins = () => {
    if (hasClaimedCoinsToday) {
      showToast('আপনি আজকের ২০ কয়েন ইতিমধ্যে গ্রহণ করেছেন! আগামীকাল আবার চেষ্টা করুন।', 'info');
      return;
    }
    const newTotal = coins + 20;
    setCoins(newTotal);
    setHasClaimedCoinsToday(true);
    localStorage.setItem('smartshopx_marketplace_coins', newTotal.toString());
    localStorage.setItem('smartshopx_coins_claimed_date', new Date().toISOString().split('T')[0]);
    showToast('🎉 অভিনন্দন! আপনি ২০টি ফ্রি দারাজ কয়েন পেয়েছেন!', 'success');
  };

  // Area Delivery System & Estimated Arrival Time
  const [deliveryArea, setDeliveryArea] = useState<'dhaka' | 'outside'>('dhaka');
  const deliveryCharge = deliveryArea === 'dhaka' ? 60 : 120;
  const deliveryETA =
    deliveryArea === 'dhaka'
      ? 'আগামী ২৪ থেকে ৪৮ ঘণ্টার মধ্যে এক্সপ্রেস হোম ডেলিভারি'
      : '২ থেকে ৪ কার্যদিবসের মধ্যে নির্ভরযোগ্য কুরিয়ার হোম ডেলিভারি';

  // Recently Viewed Products
  const [recentlyViewedIds, setRecentlyViewedIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('smartshopx_recently_viewed');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const trackRecentlyViewed = (productId: string) => {
    setRecentlyViewedIds((prev) => {
      const filtered = prev.filter((id) => id !== productId);
      const updated = [productId, ...filtered].slice(0, 8);
      try {
        localStorage.setItem('smartshopx_recently_viewed', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  // Order Tracking State
  const [isOrderTrackingOpen, setIsOrderTrackingOpen] = useState(false);
  const [trackingInput, setTrackingInput] = useState('');
  const [trackedOrder, setTrackedOrder] = useState<any | null>(null);
  const [trackingSearched, setTrackingSearched] = useState(false);

  const handleTrackOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackingInput.trim()) {
      showToast('দয়া করে অর্ডার নম্বর (যেমন: SX-123456) বা মোবাইল নম্বর লিখুন', 'error');
      return;
    }

    setTrackingSearched(true);
    // Search across all tenant orders
    let found: any = null;
    for (const b of businesses) {
      const orders = DataStore.getOrders(b.id);
      const q = trackingInput.trim().toLowerCase();
      const match = orders.find(
        (o) =>
          o.orderNumber?.toLowerCase() === q ||
          o.customerMobile?.includes(q) ||
          o.id.toLowerCase() === q
      );
      if (match) {
        found = { ...match, shopName: shopsMap[b.id]?.name || b.name };
        break;
      }
    }

    if (found) {
      setTrackedOrder(found);
      showToast('অর্ডারের লাইভ স্ট্যাটাস পাওয়া গেছে!', 'success');
    } else {
      // Mock realistic order if user entered a simulated order number
      if (
        trackingInput.toUpperCase().startsWith('SX-') ||
        trackingInput.toUpperCase().startsWith('DM-') ||
        trackingInput.length >= 10
      ) {
        setTrackedOrder({
          orderNumber: trackingInput.toUpperCase(),
          customerName: 'সম্মানিত ক্রেতা',
          customerAddress: 'ঢাকা, বাংলাদেশ',
          createdAt: new Date(Date.now() - 36 * 3600 * 1000).toISOString(),
          orderStatus: 'Courier Assigned',
          subtotal: 1450,
          deliveryCharge: 60,
          totalAmount: 1510,
          items: [{ productName: 'প্রিমিয়াম কোয়ালিটি ড্রেস / গ্যাজেট', quantity: 1, unitPrice: 1450 }],
          shopName: 'SmartShopX.bd Flagship Store',
          courierProvider: 'Steadfast Courier',
          trackingCode: 'ST-998412-BD',
        });
      } else {
        setTrackedOrder(null);
        showToast('দুঃখিত, কোনো অর্ডার রেকর্ড পাওয়া যায়নি!', 'warning');
      }
    }
  };

  // Dedicated Vendor Storefront Modal
  const [selectedVendorStore, setSelectedVendorStore] = useState<any | null>(null);
  const [followedShops, setFollowedShops] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('smartshopx_followed_shops');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const toggleFollowShop = (shopId: string, shopName: string) => {
    setFollowedShops((prev) => {
      const isFollowed = prev.includes(shopId);
      const updated = isFollowed ? prev.filter((id) => id !== shopId) : [...prev, shopId];
      try {
        localStorage.setItem('smartshopx_followed_shops', JSON.stringify(updated));
      } catch {}
      showToast(
        isFollowed ? `"${shopName}" আনফলো করা হয়েছে` : `✓ আপনি এখন "${shopName}"-কে ফলো করছেন`,
        'success'
      );
      return updated;
    });
  };

  // Product Review & Details Modal State
  const [selectedProductForDetail, setSelectedProductForDetail] = useState<any | null>(null);
  const [selectedVariantSize, setSelectedVariantSize] = useState<string>('M');
  const [selectedVariantColor, setSelectedVariantColor] = useState<string>('ব্ল্যাক (Black)');
  const [productReviews, setProductReviews] = useState<ProductReview[]>([]);
  const [newReviewRating, setNewReviewRating] = useState(5);
  const [newReviewComment, setNewReviewComment] = useState('');
  const [newReviewName, setNewReviewName] = useState('');
  const [newReviewPhoto, setNewReviewPhoto] = useState('');

  // Form states for checkout
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'COD' | 'bKash' | 'Nagad'>('COD');
  const [trxId, setTrxId] = useState('');

  // Coupon System State
  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);

  // 1. 0% EMI Calculator State
  const [selectedProductForEmi, setSelectedProductForEmi] = useState<any | null>(null);

  // 3. 1-Click Collectable Vouchers Hub
  const [collectedVouchers, setCollectedVouchers] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('smartshopx_collected_vouchers');
      return saved ? JSON.parse(saved) : ['DARAZ20', 'FREESHIP'];
    } catch {
      return ['DARAZ20', 'FREESHIP'];
    }
  });

  const handleCollectVoucher = (code: string) => {
    setCollectedVouchers((prev) => {
      if (prev.includes(code)) return prev;
      const updated = [...prev, code];
      try {
        localStorage.setItem('smartshopx_collected_vouchers', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  // 4. Bangla Voice Search State
  const [isVoiceSearchOpen, setIsVoiceSearchOpen] = useState(false);

  const handleApplyVoiceSearch = (spokenText: string) => {
    setSearchTerm(spokenText);
    showToast(`🎙️ ভয়েস সার্চ: "${spokenText}" অনুসন্ধান করা হয়েছে`, 'success');
    const el = document.getElementById('all-products');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  // 5. Product Comparison System
  const [comparedProductIds, setComparedProductIds] = useState<string[]>([]);
  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);

  const comparedProducts = useMemo(() => {
    return comparedProductIds
      .map((id) => allProducts.find((p) => p.id === id))
      .filter(Boolean) as (typeof allProducts)[0][];
  }, [allProducts, comparedProductIds]);

  const toggleCompareProduct = (product: any) => {
    setComparedProductIds((prev) => {
      if (prev.includes(product.id)) {
        const next = prev.filter((id) => id !== product.id);
        showToast(`"${product.name}" তুলনা তালিকা থেকে সরানো হয়েছে`, 'info');
        return next;
      }
      if (prev.length >= 4) {
        showToast('একই সাথে সর্বোচ্চ ৪টি পণ্য তুলনা করা যাবে!', 'warning');
        return prev;
      }
      showToast(`⚖️ "${product.name}" তুলনা তালিকায় যুক্ত হয়েছে`, 'success');
      return [...prev, product.id];
    });
  };

  const handleRemoveComparedProduct = (productId: string) => {
    setComparedProductIds((prev) => prev.filter((id) => id !== productId));
  };

  const handleClearCompared = () => {
    setComparedProductIds([]);
    setIsCompareModalOpen(false);
  };

  // 6. Social Share & Earn Cashback State
  const [productToShare, setProductToShare] = useState<any | null>(null);

  // 7. Digital Invoice & Receipt State
  const [invoiceOrder, setInvoiceOrder] = useState<any | null>(null);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [lastCompletedOrder, setLastCompletedOrder] = useState<any | null>(null);

  // When product detail modal opens, load its reviews and track recently viewed
  useEffect(() => {
    if (selectedProductForDetail) {
      const revs = DataStore.getReviews(selectedProductForDetail.id);
      // If no reviews exist, provide authentic demo unboxing reviews
      if (revs.length === 0) {
        setProductReviews([
          {
            id: `rev_demo_1_${selectedProductForDetail.id}`,
            productId: selectedProductForDetail.id,
            shopId: selectedProductForDetail.shopId,
            customerName: 'তানভীর আহমেদ',
            rating: 5,
            comment: 'পণ্যটি যেমন ছবিতে দেখেছি ঠিক তেমনই পেয়েছি! প্যাকেজিং ও ফেব্রিক/বিল্ড কোয়ালিটি অত্যন্ত চমৎকার। ধন্যবাদ দারাজ মল ও সেলারকে।',
            isVerifiedBuyer: true,
            photoUrl: 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=300&auto=format&fit=crop&q=60',
            createdAt: '২০২৬-০৩-২০',
            likesCount: 14,
          },
          {
            id: `rev_demo_2_${selectedProductForDetail.id}`,
            productId: selectedProductForDetail.id,
            shopId: selectedProductForDetail.shopId,
            customerName: 'ফারহানা ইসলাম',
            rating: 5,
            comment: 'খুব দ্রুত ডেলিভারি পেয়েছি। মাত্র ২৪ ঘণ্টায় হাতে পেলাম। একদম ১০০% আসল প্রডাক্ট!',
            isVerifiedBuyer: true,
            photoUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300&auto=format&fit=crop&q=60',
            createdAt: '২০২৬-০৩-২২',
            likesCount: 9,
          },
        ]);
      } else {
        setProductReviews(revs);
      }
      trackRecentlyViewed(selectedProductForDetail.id);
    }
  }, [selectedProductForDetail]);

  const categories = useMemo(() => {
    const set = new Set<string>();
    allProducts.forEach((p) => {
      if (p.category) set.add(p.category);
    });
    return Array.from(set);
  }, [allProducts]);

  const filteredProducts = useMemo(() => {
    let list = allProducts.filter((p) => {
      const matchMall = !isMallOnly || p.isMallStore;
      const matchCat = selectedCategory === 'ALL' || p.category === selectedCategory;
      const matchShop = selectedShopFilter === 'ALL' || p.shopId === selectedShopFilter;
      const matchSearch =
        !searchTerm ||
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.brand && p.brand.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (p.shopName && p.shopName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (p.category && p.category.toLowerCase().includes(searchTerm.toLowerCase()));
      return matchMall && matchCat && matchShop && matchSearch;
    });

    if (priceSort === 'low-high') {
      list = [...list].sort((a, b) => a.sellingPrice - b.sellingPrice);
    } else if (priceSort === 'high-low') {
      list = [...list].sort((a, b) => b.sellingPrice - a.sellingPrice);
    }

    return list;
  }, [allProducts, selectedCategory, selectedShopFilter, searchTerm, priceSort, isMallOnly]);

  // Flash Deals (Discounted items)
  const flashDeals = useMemo(() => {
    return allProducts.filter((p) => (p.discount || 0) > 0).slice(0, 6);
  }, [allProducts]);

  // Wishlist products resolution
  const wishlistProducts = useMemo(() => {
    return allProducts.filter((p) => wishlist.includes(p.id));
  }, [allProducts, wishlist]);

  // Recently viewed products resolution
  const recentlyViewedProducts = useMemo(() => {
    return recentlyViewedIds
      .map((id) => allProducts.find((p) => p.id === id))
      .filter(Boolean) as (typeof allProducts)[0][];
  }, [allProducts, recentlyViewedIds]);

  const handleAddToCart = (product: any, variant?: string) => {
    const variantDesc = variant || (product.hasVariants ? `${selectedVariantSize}, ${selectedVariantColor}` : undefined);
    setCart((prev) => {
      const existing = prev.find(
        (item) => item.product.id === product.id && item.selectedVariant === variantDesc
      );
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id && item.selectedVariant === variantDesc
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { product, quantity: 1, selectedVariant: variantDesc }];
    });
    showToast(`"${product.name}"${variantDesc ? ` (${variantDesc})` : ''} কার্টে যোগ করা হয়েছে`, 'success');
  };

  const handleUpdateQuantity = (productId: string, delta: number, variant?: string) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.product.id === productId && item.selectedVariant === variant) {
            const next = item.quantity + delta;
            return next > 0 ? { ...item, quantity: next } : null;
          }
          return item;
        })
        .filter(Boolean) as typeof cart
    );
  };

  const cartSubtotal = cart.reduce(
    (acc, item) => acc + (item.product.sellingPrice - (item.product.discount || 0)) * item.quantity,
    0
  );

  // Coupon discount calculation
  const couponDiscount = useMemo(() => {
    if (!appliedCoupon) return 0;
    if (cartSubtotal < appliedCoupon.minOrderAmount) return 0;
    if (appliedCoupon.discountType === 'percentage') {
      const val = (cartSubtotal * appliedCoupon.discountValue) / 100;
      return appliedCoupon.maxDiscount ? Math.min(val, appliedCoupon.maxDiscount) : val;
    }
    return appliedCoupon.discountValue;
  }, [appliedCoupon, cartSubtotal]);

  // Coins discount: 50 coins = ৳25 discount (if checked and eligible)
  const coinsDiscount = useCoinsInCheckout && coins >= 50 ? 25 : 0;

  const handleApplyCoupon = (overrideCode?: string) => {
    const codeToApply = (overrideCode || couponInput).trim().toUpperCase();
    if (!codeToApply) return;

    // Built-in marketplace vouchers
    const builtInVouchers: Record<string, Coupon> = {
      DARAZ20: {
        id: 'coup_daraz20',
        code: 'DARAZ20',
        discountType: 'percentage',
        discountValue: 20,
        minOrderAmount: 1000,
        maxDiscount: 300,
        isActive: true,
        expiryDate: '2026-12-31',
        usageCount: 0,
      },
      FREESHIP: {
        id: 'coup_freeship',
        code: 'FREESHIP',
        discountType: 'fixed',
        discountValue: 60,
        minOrderAmount: 800,
        isActive: true,
        expiryDate: '2026-12-31',
        usageCount: 0,
      },
      EID50: {
        id: 'coup_eid50',
        code: 'EID50',
        discountType: 'fixed',
        discountValue: 50,
        minOrderAmount: 500,
        isActive: true,
        expiryDate: '2026-12-31',
        usageCount: 0,
      },
      MALL100: {
        id: 'coup_mall100',
        code: 'MALL100',
        discountType: 'fixed',
        discountValue: 100,
        minOrderAmount: 1500,
        isActive: true,
        expiryDate: '2026-12-31',
        usageCount: 0,
      },
    };

    const allCoupons = DataStore.getCoupons();
    const found =
      allCoupons.find((c) => c.code.toUpperCase() === codeToApply && c.isActive) ||
      builtInVouchers[codeToApply];

    if (!found) {
      showToast('ভুল কুপন কোড! অনুগ্রহ করে সঠিক কোড দিন (যেমন: DARAZ20, EID50, FREESHIP, MALL100)', 'error');
      return;
    }

    if (cartSubtotal < found.minOrderAmount) {
      showToast(`এই কুপনটি ব্যবহারের জন্য সর্বনিম্ন ৳${found.minOrderAmount} এর অর্ডার প্রয়োজন`, 'warning');
      return;
    }

    setAppliedCoupon(found);
    setCouponInput(found.code);
    showToast(`🎉 কুপন "${found.code}" সফলভাবে অ্যাপ্লাই হয়েছে!`, 'success');
  };

  const handlePlaceOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName || !customerPhone || !customerAddress) {
      showToast('দয়া করে আপনার নাম, মোবাইল ও ঠিকানা পূরণ করুন', 'error');
      return;
    }

    if ((paymentMethod === 'bKash' || paymentMethod === 'Nagad') && !trxId.trim()) {
      showToast('দয়া করে আপনার পেমেন্টের ট্রানজেকশন আইডি (TrxID) লিখুন', 'error');
      return;
    }

    // Group cart items by shop and dispatch orders to respective tenant backend
    const ordersByShop: Record<string, typeof cart> = {};
    cart.forEach((item) => {
      const sId = item.product.shopId;
      if (!ordersByShop[sId]) ordersByShop[sId] = [];
      ordersByShop[sId].push(item);
    });

    const totalDiscount = couponDiscount + coinsDiscount;
    const generatedOrderNum = `SX-${Math.floor(100000 + Math.random() * 900000)}`;

    // Prepare complete snapshot for instant printable invoice
    const invoiceItems = cart.map((it) => ({
      productName: `${it.product.name}${it.selectedVariant ? ` (${it.selectedVariant})` : ''}`,
      quantity: it.quantity,
      unitPrice: it.product.sellingPrice - (it.product.discount || 0),
      total: (it.product.sellingPrice - (it.product.discount || 0)) * it.quantity,
    }));

    setLastCompletedOrder({
      orderNumber: generatedOrderNum,
      customerName,
      customerMobile: customerPhone,
      customerAddress: `${customerAddress} [এরিয়া: ${deliveryArea === 'dhaka' ? 'ঢাকার ভেতরে' : 'ঢাকার বাইরে'}]`,
      items: invoiceItems,
      subtotal: cartSubtotal,
      deliveryCharge,
      discount: totalDiscount,
      totalAmount: Math.max(0, cartSubtotal + deliveryCharge - totalDiscount),
      paymentMethod: paymentMethod === 'COD' ? 'ক্যাশ অন ডেলিভারি (COD)' : paymentMethod,
      paymentStatus: paymentMethod !== 'COD' ? 'Paid' : 'Pending',
      shopName: cart[0]?.product.shopName || 'SmartShopX.bd ফ্ল্যাগশিপ মার্চেন্ট',
      createdAt: new Date().toISOString(),
    });

    Object.entries(ordersByShop).forEach(([shopId, items]) => {
      const subtotal = items.reduce(
        (sum, it) => sum + (it.product.sellingPrice - (it.product.discount || 0)) * it.quantity,
        0
      );

      const orderPayload = {
        id: `ord_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        orderNumber: generatedOrderNum,
        channel: 'অনলাইন মার্কেটপ্লেস (SmartShopX.bd)',
        customerId: `cust_${Date.now()}`,
        customerName,
        customerMobile: customerPhone,
        customerAddress: `${customerAddress} [এরিয়া: ${deliveryArea === 'dhaka' ? 'ঢাকার ভেতরে' : 'ঢাকার বাইরে'}]`,
        items: items.map((it) => ({
          productId: it.product.id,
          productName: `${it.product.name}${it.selectedVariant ? ` (${it.selectedVariant})` : ''}`,
          quantity: it.quantity,
          unitPrice: it.product.sellingPrice - (it.product.discount || 0),
          total: (it.product.sellingPrice - (it.product.discount || 0)) * it.quantity,
        })),
        subtotal,
        discount: totalDiscount,
        deliveryCharge,
        totalAmount: Math.max(0, subtotal + deliveryCharge - totalDiscount),
        paidAmount: paymentMethod !== 'COD' ? subtotal + deliveryCharge - totalDiscount : 0,
        dueAmount: paymentMethod === 'COD' ? subtotal + deliveryCharge - totalDiscount : 0,
        paymentMethod: paymentMethod === 'COD' ? 'Cash' : paymentMethod,
        paymentStatus: paymentMethod !== 'COD' ? 'Paid' : 'Pending',
        orderStatus: 'New',
        advancePaymentTrxId: trxId || undefined,
        notes: `মার্কেটপ্লেস অর্ডার${referralCode ? ` [রিসেলার: ${referralCode}]` : ''}${appliedCoupon ? ` [কুপন: ${appliedCoupon.code}]` : ''}${coinsDiscount > 0 ? ' [কয়েন রিডিম: ৳২৫]' : ''} [ডেলিভারি ETA: ${deliveryETA}]`,
        createdAt: new Date().toISOString(),
      };

      const existingOrders = DataStore.getOrders(shopId);
      DataStore.setOrders([orderPayload as any, ...existingOrders], shopId);
    });

    // Record reseller commission if referral link was used
    if (referralCode) {
      DataStore.recordResellerSale(referralCode, cartSubtotal);
    }

    // Deduct coins if used and grant 30 reward coins for the purchase!
    if (useCoinsInCheckout && coins >= 50) {
      const remaining = coins - 50 + 30;
      setCoins(remaining);
      localStorage.setItem('smartshopx_marketplace_coins', remaining.toString());
    } else {
      const rewarded = coins + 30;
      setCoins(rewarded);
      localStorage.setItem('smartshopx_marketplace_coins', rewarded.toString());
    }

    setCart([]);
    setIsCheckoutOpen(false);
    setOrderSuccess(true);
    showToast('আপনার অর্ডারটি সফলভাবে সম্পন্ন হয়েছে! অর্ডারের জন্য ৩০টি রিওয়ার্ড কয়েন যোগ হয়েছে!', 'success');
  };

  const handleAddReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReviewComment.trim() || !newReviewName.trim() || !selectedProductForDetail) {
      showToast('দয়া করে নাম ও রিভিউ বিবরণ লিখুন', 'error');
      return;
    }

    const newRev: ProductReview = {
      id: `rev_${Date.now()}`,
      productId: selectedProductForDetail.id,
      shopId: selectedProductForDetail.shopId,
      customerName: newReviewName,
      rating: newReviewRating,
      comment: newReviewComment,
      photoUrl: newReviewPhoto || undefined,
      isVerifiedBuyer: true,
      createdAt: new Date().toISOString().split('T')[0],
      likesCount: 1,
    };

    DataStore.addReview(newRev);
    setProductReviews((prev) => [newRev, ...prev]);
    setNewReviewComment('');
    setNewReviewPhoto('');
    showToast('আপনার আনবক্সিং রিভিউ সফলভাবে যুক্ত হয়েছে!', 'success');
  };

  // WhatsApp Seller Direct Chat
  const handleOpenSellerChat = (product: any) => {
    const rawNumber = product.shopMobile || '01711223344';
    const cleanNumber = rawNumber.replace(/[^0-9]/g, '');
    const intlNumber = cleanNumber.startsWith('880')
      ? cleanNumber
      : cleanNumber.startsWith('0')
      ? `88${cleanNumber}`
      : `880${cleanNumber}`;

    const text = encodeURIComponent(
      `আসসালামু আলাইকুম! দারাজ মার্কেটপ্লেসে আপনার পণ্যটি দেখেছি: "${product.name}" (মূল্য: ৳${
        product.sellingPrice - (product.discount || 0)
      })। পণ্যটির স্টক, সাইজ ও ডেলিভারি সম্পর্কে বিস্তারিত জানতে চাই।`
    );

    window.open(`https://wa.me/${intlNumber}?text=${text}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* 1. TOP NOTICE & UTILITY BAR (Flash Sale + Coins + Track Order) */}
      <div className="bg-gradient-to-r from-orange-600 via-rose-600 to-amber-600 text-white text-xs py-2 px-3 sm:px-4 shadow-sm">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          {/* Left: Flash Sale badge */}
          <div className="flex items-center gap-2">
            <span className="bg-black/30 backdrop-blur-xs px-2.5 py-0.5 rounded-full text-[11px] font-bold flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
              SmartShopX.bd মেগা ফ্ল্যাশ সেল
            </span>
            <span className="hidden sm:inline text-orange-100 font-medium text-[11px]">
              ১০০% আসল ব্র্যান্ডেড পণ্য ও সারা দেশে ফাস্ট ডেলিভারি
            </span>
          </div>

          {/* Center: Live Countdown Clock */}
          <div className="flex items-center gap-1 bg-black/40 px-2.5 py-0.8 rounded-xl font-mono text-xs font-bold text-amber-200">
            <Clock className="w-3 h-3 text-amber-300" />
            <span className="hidden xs:inline">অফার শেষ হতে বাকি:</span>
            <span className="bg-white/20 px-1 py-0.2 rounded text-white text-[11px]">
              {String(timeLeft.hours).padStart(2, '0')}
            </span>
            :
            <span className="bg-white/20 px-1 py-0.2 rounded text-white text-[11px]">
              {String(timeLeft.minutes).padStart(2, '0')}
            </span>
            :
            <span className="bg-white/20 px-1 py-0.2 rounded text-white text-[11px]">
              {String(timeLeft.seconds).padStart(2, '0')}
            </span>
          </div>

          {/* Right: Coins Balance + Track Order button */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleClaimDailyCoins}
              className="bg-amber-400 hover:bg-amber-300 text-slate-900 font-bold px-2 py-0.8 rounded-lg flex items-center gap-1 text-[11px] transition-transform hover:scale-105 cursor-pointer shadow-xs"
              title="প্রতিদিন ২০ ফ্রি কয়েন নিন"
            >
              <Coins className="w-3.5 h-3.5 text-amber-900" />
              <span>{coins} কয়েন</span>
              {!hasClaimedCoinsToday && (
                <span className="w-2 h-2 rounded-full bg-rose-600 animate-ping" />
              )}
            </button>

            <button
              onClick={() => setIsOrderTrackingOpen(true)}
              className="bg-white/20 hover:bg-white/30 text-white font-bold px-2 py-0.8 rounded-lg flex items-center gap-1 text-[11px] transition-colors cursor-pointer"
            >
              <Package className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">অর্ডার ট্র্যাক করুন</span>
              <span className="sm:hidden">ট্র্যাক</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. MAIN STICKY NAVIGATION */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
          {/* Marketplace Brand Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-orange-600 via-rose-600 to-amber-500 text-white flex items-center justify-center shadow-md font-black text-sm tracking-tighter">
              SX
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="text-base sm:text-lg font-black text-slate-900 tracking-tight flex items-center gap-1">
                  SmartShopX.bd
                </h1>
                <span className="bg-amber-100 text-amber-800 text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider border border-amber-300 flex items-center gap-0.5">
                  <Award className="w-3 h-3 text-amber-600" />
                  MALL VERIFIED
                </span>
              </div>
              <p className="text-[11px] text-slate-500 hidden sm:block">
                বাংলাদেশের শীর্ষ শপসমূহের শতভাগ অথেনটিক পণ্যের মেগা মার্কেটপ্লেস
              </p>
            </div>
          </div>

          {/* Big Search Bar */}
          <div className="flex-1 max-w-lg relative hidden md:block">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="ShopX মলে পণ্য, ব্র্যান্ড বা শপের নাম খুঁজুন (যেমন: শার্ট, মোবাইল, ঘড়ি)..."
              className="w-full pl-10 pr-12 py-2.5 rounded-2xl bg-slate-100 border-none text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-orange-500 shadow-inner"
            />
            <button
              type="button"
              onClick={() => setIsVoiceSearchOpen(true)}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 rounded-xl hover:bg-orange-100 text-orange-600 transition-colors cursor-pointer"
              title="বাংলা ভয়েস সার্চ (কথা বলে খুঁজুন)"
            >
              <Mic className="w-4 h-4" />
            </button>
          </div>

          {/* Top Actions: Wishlist + Cart */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Wishlist Button */}
            <button
              onClick={() => setIsWishlistOpen(true)}
              className="relative p-2.5 rounded-2xl bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-600 transition-all flex items-center gap-1.5 border border-slate-200 cursor-pointer"
              title="পছন্দের তালিকা"
            >
              <Heart className={`w-4 h-4 ${wishlist.length > 0 ? 'text-rose-600 fill-rose-600' : ''}`} />
              <span className="text-xs font-bold hidden sm:inline">পছন্দ</span>
              {wishlist.length > 0 && (
                <span className="font-mono text-[10px] font-bold bg-rose-600 text-white w-4 h-4 rounded-full flex items-center justify-center">
                  {wishlist.length}
                </span>
              )}
            </button>

            {/* Shopping Bag Button */}
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative p-2.5 rounded-2xl bg-orange-50 hover:bg-orange-100 text-orange-700 transition-all flex items-center gap-2 border border-orange-200 cursor-pointer"
            >
              <ShoppingBag className="w-5 h-5" />
              <span className="text-xs font-bold hidden sm:inline">ব্যাগ</span>
              {cart.length > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-orange-600 text-white font-mono text-[11px] font-black w-5 h-5 rounded-full flex items-center justify-center shadow-md animate-bounce">
                  {cart.reduce((a, b) => a + b.quantity, 0)}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Search Input */}
        <div className="px-4 pb-2.5 md:hidden">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="পণ্য, ব্র্যান্ড বা শপ খুঁজুন..."
              className="w-full pl-9 pr-10 py-2 rounded-xl bg-slate-100 text-xs text-slate-800 focus:bg-white focus:ring-2 focus:ring-orange-500"
            />
            <button
              type="button"
              onClick={() => setIsVoiceSearchOpen(true)}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-orange-600 cursor-pointer"
              title="বাংলা ভয়েস সার্চ"
            >
              <Mic className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* 3. 4-PILLAR TRUST RIBBON */}
      <div className="bg-white border-b border-slate-200 py-2.5 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
          <div className="flex items-center gap-2 text-slate-700">
            <div className="w-7 h-7 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center shrink-0">
              <RotateCcw className="w-3.5 h-3.5" />
            </div>
            <div>
              <span className="font-bold block text-[11px] leading-tight text-slate-900">৭ দিনের ফ্রি রিটার্ন</span>
              <span className="text-[10px] text-slate-500">১০০% মানিব্যাক গ্যারান্টি</span>
            </div>
          </div>

          <div className="flex items-center gap-2 text-slate-700">
            <div className="w-7 h-7 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-3.5 h-3.5" />
            </div>
            <div>
              <span className="font-bold block text-[11px] leading-tight text-slate-900">১০০% আসল পণ্য</span>
              <span className="text-[10px] text-slate-500">ভেরিফাইড মার্চেন্ট ও অথেনটিক</span>
            </div>
          </div>

          <div className="flex items-center gap-2 text-slate-700">
            <div className="w-7 h-7 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center shrink-0">
              <Truck className="w-3.5 h-3.5" />
            </div>
            <div>
              <span className="font-bold block text-[11px] leading-tight text-slate-900">ফাস্ট হোম ডেলিভারি</span>
              <span className="text-[10px] text-slate-500">২৪-৭২ ঘণ্টায় ঘরে বসে নিন</span>
            </div>
          </div>

          <div className="flex items-center gap-2 text-slate-700">
            <div className="w-7 h-7 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
              <CreditCard className="w-3.5 h-3.5" />
            </div>
            <div>
              <span className="font-bold block text-[11px] leading-tight text-slate-900">ক্যাশ অন ডেলিভারি</span>
              <span className="text-[10px] text-slate-500">পণ্য দেখে টাকা পরিশোধ</span>
            </div>
          </div>
        </div>
      </div>

      {/* MAIN CONTENT AREA */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-8 flex-1 w-full">
        {/* HERO BANNER SECTION */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <div className="lg:col-span-8 bg-gradient-to-tr from-slate-950 via-orange-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white relative overflow-hidden flex flex-col justify-between shadow-xl border border-orange-900/50 min-h-[220px]">
            <div className="relative z-10 max-w-lg space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-600/30 border border-orange-500/40 text-orange-300 text-xs font-bold">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                SmartShopX.bd মেগা কালেকশন ২০২৬
              </div>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight">
                সকল প্রিয় দোকানের সেরা পণ্য এখন এক প্ল্যাটফর্মে!
              </h2>
              <p className="text-xs sm:text-sm text-slate-300">
                একই অর্ডারে একাধিক শপের প্রডাক্ট কিনুন। সারা বাংলাদেশে দ্রুত ক্যাশ অন ডেলিভারি ও সহজ রিটার্ন গ্যারান্টি।
              </p>
            </div>

            <div className="relative z-10 flex flex-wrap items-center gap-3 pt-4">
              <a
                href="#all-products"
                className="px-5 py-2.5 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs shadow-lg shadow-orange-500/30 transition-all flex items-center gap-1.5"
              >
                <span>পণ্য কালেকশন দেখুন</span>
                <ChevronRight className="w-4 h-4" />
              </a>
              <div className="flex items-center gap-1 text-xs text-amber-300 font-semibold bg-white/10 px-3 py-2 rounded-xl backdrop-blur-xs">
                <Tag className="w-3.5 h-3.5" />
                <span>কুপন কোড: <b>DARAZ20</b> বা <b>MALL100</b></span>
              </div>
            </div>

            {/* Subtle background glow */}
            <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-orange-600/20 rounded-full blur-3xl pointer-events-none" />
          </div>

          {/* Right Highlights & Area Delivery Card */}
          <div className="lg:col-span-4 bg-white rounded-3xl p-4 sm:p-5 border border-slate-200 shadow-xs flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-orange-600" />
                  ডেলিভারি লোকেশন ও চার্জ
                </span>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                  সারা বাংলাদেশ
                </span>
              </div>

              {/* Area Toggle */}
              <div className="grid grid-cols-2 gap-2 mt-3">
                <button
                  type="button"
                  onClick={() => setDeliveryArea('dhaka')}
                  className={`p-2 rounded-xl border text-xs font-bold transition-all cursor-pointer text-center ${
                    deliveryArea === 'dhaka'
                      ? 'border-orange-500 bg-orange-50 text-orange-700 shadow-2xs'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <span className="block font-black">ঢাকার ভেতরে</span>
                  <span className="text-[11px] font-mono text-emerald-600 font-bold">চার্জ: ৳৬০</span>
                </button>

                <button
                  type="button"
                  onClick={() => setDeliveryArea('outside')}
                  className={`p-2 rounded-xl border text-xs font-bold transition-all cursor-pointer text-center ${
                    deliveryArea === 'outside'
                      ? 'border-orange-500 bg-orange-50 text-orange-700 shadow-2xs'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <span className="block font-black">ঢাকার বাইরে</span>
                  <span className="text-[11px] font-mono text-emerald-600 font-bold">চার্জ: ৳১২০</span>
                </button>
              </div>

              <div className="mt-3 p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 text-[11px] text-slate-600 space-y-1">
                <div className="flex items-center gap-1 font-semibold text-slate-800">
                  <Clock className="w-3.5 h-3.5 text-orange-600 shrink-0" />
                  <span>আনুমানিক সময় (ETA):</span>
                </div>
                <p className="text-emerald-700 font-bold">{deliveryETA}</p>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                বায়ার প্রটেকশন পলিসি সক্রিয়
              </span>
            </div>
          </div>
        </div>

        {/* 3.5. COLLECTABLE VOUCHERS HUB (1-Click Collect Hub) */}
        <CollectableVouchersStrip
          collectedVouchers={collectedVouchers}
          onCollect={handleCollectVoucher}
          onOpenCartOrCheckout={() => setIsCartOpen(true)}
        />

        {/* 4. VERIFIED OFFICIAL STORES DIRECTORY (SmartShopX.bd Flagship Stores) */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm sm:text-base font-black text-slate-900 flex items-center gap-2">
              <Store className="w-4 h-4 text-orange-600" />
              <span>SmartShopX.bd অফিসিয়াল ফ্ল্যাগশিপ শপসমূহ (Mall Brands)</span>
            </h3>
            <span className="text-xs text-slate-400 font-medium">
              মোট {businesses.length} টি ভেরিফাইড ব্র্যান্ড
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {businesses.map((biz) => {
              const s = shopsMap[biz.id] || biz;
              const isFollowed = followedShops.includes(biz.id);

              return (
                <div
                  key={biz.id}
                  className="bg-white p-3 rounded-2xl border border-slate-200 hover:border-orange-400 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-slate-900 text-white font-bold flex items-center justify-center text-xs shrink-0 group-hover:bg-orange-600 transition-colors">
                      {s.name?.slice(0, 2) || 'SX'}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1">
                        <h4 className="font-bold text-xs text-slate-900 truncate leading-tight">
                          {s.name}
                        </h4>
                      </div>
                      <span className="text-[10px] text-amber-700 font-bold block truncate">
                        ★ ৯৮% পজিটিভ রেটিং
                      </span>
                    </div>
                  </div>

                  <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between">
                    <button
                      onClick={() => setSelectedVendorStore({ ...s, id: biz.id })}
                      className="text-[11px] text-orange-600 font-bold hover:underline cursor-pointer"
                    >
                      ভিজিট স্টোর
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleFollowShop(biz.id, s.name)}
                      className={`text-[10px] px-2 py-0.5 rounded-full font-bold transition-colors cursor-pointer ${
                        isFollowed
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                      }`}
                    >
                      {isFollowed ? 'ফলোড' : '+ ফলো'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 5. FLASH DEALS SECTION */}
        {flashDeals.length > 0 && (
          <div className="bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-rose-500/10 p-4 sm:p-5 rounded-3xl border border-amber-300/60 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-xl bg-rose-600 text-white flex items-center justify-center shadow-sm">
                  <Flame className="w-5 h-5 animate-bounce" />
                </span>
                <div>
                  <h3 className="text-base font-black text-slate-900">ফ্ল্যাশ ডিলস (Flash Deals & Mega Savings)</h3>
                  <p className="text-xs text-amber-700 font-medium">সীমিত সময়ের জন্য বিশেষ মূল্যছাড় ও ক্যাশ ডিসকাউন্ট</p>
                </div>
              </div>
              <span className="text-xs font-bold text-amber-800 bg-amber-100 px-3 py-1 rounded-full border border-amber-300">
                বিশেষ অফার
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {flashDeals.map((prod) => (
                <div
                  key={prod.uniqueKey || `${prod.shopId}_${prod.id}`}
                  className="bg-white rounded-2xl border border-amber-200/80 p-2.5 hover:shadow-md transition-all flex flex-col justify-between group relative"
                >
                  {/* Wishlist Heart Icon */}
                  <button
                    type="button"
                    onClick={() => toggleWishlist(prod.id, prod.name)}
                    className="absolute top-3.5 left-3.5 z-10 w-7 h-7 rounded-full bg-white/90 backdrop-blur-xs flex items-center justify-center shadow-sm hover:scale-110 transition-transform cursor-pointer"
                    title="পছন্দের তালিকায় রাখুন"
                  >
                    <Heart
                      className={`w-3.5 h-3.5 ${
                        wishlist.includes(prod.id) ? 'text-rose-600 fill-rose-600' : 'text-slate-400'
                      }`}
                    />
                  </button>

                  <div
                    onClick={() => setSelectedProductForDetail(prod)}
                    className="relative aspect-square rounded-xl overflow-hidden bg-slate-100 mb-2 cursor-pointer"
                  >
                    <img
                      src={
                        prod.image ||
                        'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300&auto=format&fit=crop&q=60'
                      }
                      alt={prod.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute top-1 right-1 bg-rose-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded-md shadow-xs">
                      -৳{prod.discount} ছাড়
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-400 font-medium block truncate">
                      {prod.shopName}
                    </span>
                    <h4
                      onClick={() => setSelectedProductForDetail(prod)}
                      className="font-bold text-xs text-slate-800 line-clamp-2 leading-snug group-hover:text-orange-600 transition-colors cursor-pointer"
                    >
                      {prod.name}
                    </h4>

                    {/* Star Rating snippet */}
                    <div className="flex items-center gap-1 mt-1 text-amber-500 text-[10px]">
                      <Star className="w-3 h-3 fill-amber-400" />
                      <span className="font-bold text-slate-700">4.9</span>
                      <span className="text-slate-400">(রিভিউ)</span>
                    </div>

                    <div className="mt-1.5 flex items-baseline gap-1.5">
                      <span className="font-mono font-black text-sm text-orange-600">
                        {formatCurrency(prod.sellingPrice - (prod.discount || 0))}
                      </span>
                      <span className="font-mono text-[10px] text-slate-400 line-through">
                        {formatCurrency(prod.sellingPrice)}
                      </span>
                    </div>

                    {(prod.sellingPrice - (prod.discount || 0)) >= 2000 && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedProductForEmi(prod);
                        }}
                        className="mt-1 text-[10px] text-orange-700 bg-orange-50 hover:bg-orange-100 font-bold px-1.5 py-0.5 rounded-md flex items-center gap-1 border border-orange-200 cursor-pointer"
                        title="০% কিস্তি হিসাব"
                      >
                        <CreditCard className="w-2.5 h-2.5 text-orange-600" />
                        <span>৳{Math.round((prod.sellingPrice - (prod.discount || 0)) / 12)}/মাস ০% EMI</span>
                      </button>
                    )}

                    <div className="flex items-center gap-1 mt-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleCompareProduct(prod);
                        }}
                        className={`p-1 rounded-lg border text-[10px] font-bold flex items-center justify-center gap-0.5 flex-1 cursor-pointer transition-colors ${
                          comparedProductIds.includes(prod.id)
                            ? 'border-orange-500 bg-orange-50 text-orange-700'
                            : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                        }`}
                        title="তুলনা করুন"
                      >
                        <Scale className="w-2.5 h-2.5" />
                        <span>{comparedProductIds.includes(prod.id) ? 'তুলনায়' : 'তুলনা'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setProductToShare(prod);
                        }}
                        className="p-1 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 cursor-pointer"
                        title="শেয়ার করুন"
                      >
                        <Share2 className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  </div>

                  <button
                    onClick={() => handleAddToCart(prod)}
                    className="mt-2.5 w-full py-1.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold flex items-center justify-center gap-1 shadow-2xs transition-colors cursor-pointer"
                  >
                    <ShoppingBag className="w-3.5 h-3.5" />
                    <span>কার্টে নিন</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 6. ALL PRODUCTS SECTION WITH MULTI-FILTERS & DARAZ MALL TOGGLE */}
        <div id="all-products" className="space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-2 border-b border-slate-200">
            <div>
              <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <span>সকল পণ্য কালেকশন ({filteredProducts.length})</span>
              </h3>
              <p className="text-xs text-slate-500">
                যেকোনো দোকানের পণ্য বেছে নিন এবং একই সাথে কার্টে অর্ডার করুন
              </p>
            </div>

            {/* Filter controls */}
            <div className="flex flex-wrap items-center gap-2">
              {/* SmartShopX.bd Only filter button */}
              <button
                type="button"
                onClick={() => setIsMallOnly(!isMallOnly)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  isMallOnly
                    ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
                    : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                <Award className={`w-3.5 h-3.5 ${isMallOnly ? 'text-slate-950' : 'text-amber-500'}`} />
                <span>SmartShopX.bd অনলি</span>
                {isMallOnly && <Check className="w-3 h-3 stroke-3" />}
              </button>

              <div className="flex items-center gap-1.5 bg-white px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs">
                <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" />
                <span className="text-slate-500">দোকান:</span>
                <select
                  value={selectedShopFilter}
                  onChange={(e) => setSelectedShopFilter(e.target.value)}
                  className="bg-transparent font-semibold text-slate-800 focus:outline-none cursor-pointer"
                >
                  <option value="ALL">সকল শপ (All Stores)</option>
                  {businesses.map((b) => (
                    <option key={b.id} value={b.id}>
                      {shopsMap[b.id]?.name || b.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-1.5 bg-white px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs">
                <span className="text-slate-500">মূল্য:</span>
                <select
                  value={priceSort}
                  onChange={(e) => setPriceSort(e.target.value as any)}
                  className="bg-transparent font-semibold text-slate-800 focus:outline-none cursor-pointer"
                >
                  <option value="default">সাধারণ</option>
                  <option value="low-high">কম থেকে বেশি</option>
                  <option value="high-low">বেশি থেকে কম</option>
                </select>
              </div>
            </div>
          </div>

          {/* Category Chips Bar */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            <button
              onClick={() => setSelectedCategory('ALL')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedCategory === 'ALL'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              সকল ক্যাটাগরি
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Product Grid */}
          {filteredProducts.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 space-y-2">
              <ShoppingBag className="w-12 h-12 text-slate-300 mx-auto" />
              <p className="text-sm font-bold text-slate-700">কোনো পণ্য পাওয়া যায়নি</p>
              <p className="text-xs text-slate-400">ফিল্টার পরিবর্তন করে আবার চেষ্টা করুন</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
              {filteredProducts.map((prod) => (
                <div
                  key={prod.uniqueKey || `${prod.shopId}_${prod.id}`}
                  className="bg-white rounded-3xl border border-slate-200 p-3 hover:shadow-xl hover:border-orange-300 transition-all flex flex-col justify-between group relative"
                >
                  {/* Wishlist Heart Icon */}
                  <button
                    type="button"
                    onClick={() => toggleWishlist(prod.id, prod.name)}
                    className="absolute top-4.5 left-4.5 z-10 w-7 h-7 rounded-full bg-white/90 backdrop-blur-xs flex items-center justify-center shadow-sm hover:scale-110 transition-transform cursor-pointer"
                    title="পছন্দের তালিকায় রাখুন"
                  >
                    <Heart
                      className={`w-3.5 h-3.5 ${
                        wishlist.includes(prod.id) ? 'text-rose-600 fill-rose-600' : 'text-slate-400'
                      }`}
                    />
                  </button>

                  <div>
                    <div
                      onClick={() => setSelectedProductForDetail(prod)}
                      className="relative aspect-square rounded-2xl overflow-hidden bg-slate-100 mb-2.5 cursor-pointer"
                    >
                      <img
                        src={
                          prod.image ||
                          'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300&auto=format&fit=crop&q=60'
                        }
                        alt={prod.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        referrerPolicy="no-referrer"
                      />
                      {(prod.discount || 0) > 0 && (
                        <div className="absolute top-2 right-2 bg-rose-600 text-white text-[10px] font-black px-2 py-0.5 rounded-lg shadow-sm">
                          -৳{prod.discount}
                        </div>
                      )}
                      {prod.isMallStore && (
                        <div className="absolute bottom-2 left-2 bg-slate-900/80 backdrop-blur-xs text-amber-300 text-[9px] font-bold px-1.5 py-0.5 rounded-md flex items-center gap-0.5">
                          <Award className="w-2.5 h-2.5 text-amber-400" />
                          <span>Mall</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className="text-[10px] text-emerald-700 font-bold flex items-center gap-1 truncate">
                        <Store className="w-2.5 h-2.5 shrink-0" />
                        <span className="truncate">{prod.shopName}</span>
                      </span>
                      <span className="text-[10px] text-slate-400">{prod.category}</span>
                    </div>

                    <h4
                      onClick={() => setSelectedProductForDetail(prod)}
                      className="font-bold text-xs sm:text-sm text-slate-900 line-clamp-2 leading-snug group-hover:text-orange-600 transition-colors cursor-pointer"
                    >
                      {prod.name}
                    </h4>

                    {/* Star ratings preview */}
                    <div className="flex items-center gap-1 mt-1 text-amber-500 text-[10px]">
                      <Star className="w-3 h-3 fill-amber-400" />
                      <span className="font-bold text-slate-700">4.8</span>
                      <span className="text-slate-400">(রিভিউ)</span>
                    </div>

                    <div className="mt-2 flex items-baseline gap-1.5">
                      <span className="font-mono font-black text-sm sm:text-base text-orange-600">
                        {formatCurrency(prod.sellingPrice - (prod.discount || 0))}
                      </span>
                      {(prod.discount || 0) > 0 && (
                        <span className="font-mono text-xs text-slate-400 line-through">
                          {formatCurrency(prod.sellingPrice)}
                        </span>
                      )}
                    </div>

                    {(prod.sellingPrice - (prod.discount || 0)) >= 2000 && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedProductForEmi(prod);
                        }}
                        className="mt-1 text-[10px] text-orange-700 bg-orange-50 hover:bg-orange-100 font-bold px-1.5 py-0.5 rounded-md flex items-center gap-1 border border-orange-200/80 cursor-pointer"
                        title="০% কিস্তির হিসাব দেখুন"
                      >
                        <CreditCard className="w-2.5 h-2.5 text-orange-600" />
                        <span>৳{Math.round((prod.sellingPrice - (prod.discount || 0)) / 12)}/মাস ০% EMI</span>
                      </button>
                    )}

                    <div className="flex items-center gap-1 mt-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleCompareProduct(prod);
                        }}
                        className={`p-1 rounded-lg border text-[10px] font-bold flex items-center justify-center gap-0.5 flex-1 cursor-pointer transition-colors ${
                          comparedProductIds.includes(prod.id)
                            ? 'border-orange-500 bg-orange-50 text-orange-700'
                            : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                        }`}
                        title="অন্য পণ্যের সাথে তুলনা করুন"
                      >
                        <Scale className="w-2.5 h-2.5" />
                        <span>{comparedProductIds.includes(prod.id) ? 'তুলনায়' : 'তুলনা'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setProductToShare(prod);
                        }}
                        className="p-1 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 cursor-pointer"
                        title="শেয়ার করুন ও রিওয়ার্ড জিতুন"
                      >
                        <Share2 className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  </div>

                  <div className="mt-3 pt-2 border-t border-slate-100 flex items-center gap-2">
                    <button
                      onClick={() => handleAddToCart(prod)}
                      className="flex-1 py-1.5 px-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold flex items-center justify-center gap-1 shadow-2xs transition-colors cursor-pointer"
                    >
                      <ShoppingBag className="w-3.5 h-3.5" />
                      <span>কার্ট</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedProductForDetail(prod)}
                      className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 text-xs transition-colors cursor-pointer"
                      title="বিস্তারিত ও রিভিউ দেখুন"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 7. RECENTLY VIEWED PRODUCTS CAROUSEL */}
        {recentlyViewedProducts.length > 0 && (
          <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-sm font-black text-slate-800 flex items-center gap-2">
                <Clock className="w-4 h-4 text-orange-600" />
                <span>সম্প্রতি দেখা পণ্যসমূহ (Recently Viewed)</span>
              </h3>
              <span className="text-xs text-slate-400">আপনার সাম্প্রতিক ব্রাউজিং</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
              {recentlyViewedProducts.slice(0, 6).map((p, idx) => (
                <div
                  key={`rv_${p.shopId || ''}_${p.id}_${idx}`}
                  onClick={() => setSelectedProductForDetail(p)}
                  className="p-2 rounded-2xl border border-slate-100 hover:border-orange-300 hover:shadow-sm transition-all cursor-pointer group"
                >
                  <div className="aspect-square rounded-xl overflow-hidden bg-slate-50 mb-1.5">
                    <img
                      src={p.image}
                      alt={p.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  </div>
                  <h5 className="font-bold text-[11px] text-slate-800 line-clamp-1 group-hover:text-orange-600">
                    {p.name}
                  </h5>
                  <span className="font-mono font-bold text-xs text-orange-600">
                    ৳{p.sellingPrice - (p.discount || 0)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* 8. SLIDE-OVER WISHLIST DRAWER */}
      {isWishlistOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white w-full max-w-md h-full shadow-2xl flex flex-col justify-between">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-rose-50">
              <div className="flex items-center gap-2">
                <Heart className="w-5 h-5 text-rose-600 fill-rose-600" />
                <h3 className="font-black text-sm text-slate-900">
                  পছন্দের তালিকা ({wishlistProducts.length} টি পণ্য)
                </h3>
              </div>
              <button
                onClick={() => setIsWishlistOpen(false)}
                className="w-8 h-8 rounded-full bg-white hover:bg-slate-100 flex items-center justify-center text-slate-500 border border-slate-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto flex-1 space-y-3">
              {wishlistProducts.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <Heart className="w-12 h-12 mx-auto mb-2 text-slate-300" />
                  <p className="text-xs">আপনার পছন্দের তালিকায় কোনো পণ্য নেই</p>
                  <p className="text-[11px] text-slate-400 mt-1">পণ্য কার্ডের হার্ট (❤️) আইকনে ক্লিক করে সংরক্ষণ করুন</p>
                </div>
              ) : (
                wishlistProducts.map((p, idx) => (
                  <div
                    key={`wl_${p.shopId || ''}_${p.id}_${idx}`}
                    className="p-3 rounded-2xl border border-slate-200 bg-slate-50/60 flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <img
                        src={p.image}
                        alt={p.name}
                        className="w-12 h-12 rounded-xl object-cover bg-white border border-slate-200 shrink-0"
                      />
                      <div className="min-w-0">
                        <span className="text-[10px] text-emerald-700 font-semibold block truncate">
                          {p.shopName}
                        </span>
                        <h4 className="font-bold text-xs text-slate-800 truncate">{p.name}</h4>
                        <p className="font-mono text-xs font-bold text-orange-600">
                          ৳{p.sellingPrice - (p.discount || 0)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => {
                          handleAddToCart(p);
                          toggleWishlist(p.id, p.name);
                        }}
                        className="px-2.5 py-1 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs cursor-pointer"
                      >
                        কার্টে নিন
                      </button>
                      <button
                        onClick={() => toggleWishlist(p.id, p.name)}
                        className="p-1 rounded-lg text-slate-400 hover:text-rose-600 cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {wishlistProducts.length > 0 && (
              <div className="p-4 border-t border-slate-200 bg-slate-50">
                <Button
                  onClick={() => {
                    wishlistProducts.forEach((p) => handleAddToCart(p));
                    setIsWishlistOpen(false);
                    setIsCartOpen(true);
                  }}
                  variant="primary"
                  size="md"
                  className="w-full bg-rose-600 hover:bg-rose-700"
                >
                  সবগুলো পণ্য কার্টে যোগ করুন
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 9. SLIDE-OVER CART DRAWER */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white w-full max-w-md h-full shadow-2xl flex flex-col justify-between">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-orange-50">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-orange-600" />
                <h3 className="font-black text-sm text-slate-900">
                  শপিং ব্যাগ ({cart.reduce((a, b) => a + b.quantity, 0)} টি পণ্য)
                </h3>
              </div>
              <button
                onClick={() => setIsCartOpen(false)}
                className="w-8 h-8 rounded-full bg-white hover:bg-slate-100 flex items-center justify-center text-slate-500 border border-slate-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto flex-1 space-y-3">
              {cart.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <ShoppingBag className="w-12 h-12 mx-auto mb-2 text-slate-300" />
                  <p className="text-xs">আপনার শপিং ব্যাগ বর্তমানে খালি</p>
                </div>
              ) : (
                cart.map((item) => (
                  <div
                    key={`${item.product.id}_${item.selectedVariant || ''}`}
                    className="p-3 rounded-2xl border border-slate-200 bg-slate-50/60 flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <img
                        src={item.product.image || 'https://via.placeholder.com/80'}
                        alt={item.product.name}
                        className="w-12 h-12 rounded-xl object-cover bg-white border border-slate-200 shrink-0"
                        referrerPolicy="no-referrer"
                      />
                      <div className="min-w-0">
                        <span className="text-[10px] text-emerald-700 font-semibold block truncate">
                          বিক্রেতা: {item.product.shopName}
                        </span>
                        <h4 className="font-bold text-xs text-slate-800 truncate">{item.product.name}</h4>
                        {item.selectedVariant && (
                          <span className="text-[10px] font-mono text-indigo-600 block">
                            ভ্যারিয়েন্ট: {item.selectedVariant}
                          </span>
                        )}
                        <p className="font-mono text-xs font-bold text-orange-600">
                          {formatCurrency(item.product.sellingPrice - (item.product.discount || 0))}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleUpdateQuantity(item.product.id, -1, item.selectedVariant)}
                        className="w-6 h-6 rounded-lg bg-white border border-slate-300 flex items-center justify-center text-xs font-bold cursor-pointer"
                      >
                        -
                      </button>
                      <span className="font-mono text-xs font-bold w-4 text-center">{item.quantity}</span>
                      <button
                        onClick={() => handleUpdateQuantity(item.product.id, 1, item.selectedVariant)}
                        className="w-6 h-6 rounded-lg bg-white border border-slate-300 flex items-center justify-center text-xs font-bold cursor-pointer"
                      >
                        +
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {cart.length > 0 && (
              <div className="p-4 border-t border-slate-200 bg-slate-50 space-y-3">
                {/* Coupon Code Input in Cart */}
                <div className="bg-white p-2.5 rounded-2xl border border-slate-200 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 flex items-center gap-1">
                      <Tag className="w-3.5 h-3.5 text-orange-600" />
                      কুপন / প্রমো কোড
                    </span>
                    {appliedCoupon && (
                      <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                        {appliedCoupon.code} এক্টিভ
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                      placeholder="যেমন: DARAZ20 বা EID50"
                      className="flex-1 px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-mono uppercase focus:ring-2 focus:ring-orange-500"
                    />
                    <button
                      onClick={() => handleApplyCoupon()}
                      className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold cursor-pointer"
                    >
                      অ্যাপ্লাই
                    </button>
                  </div>

                  {collectedVouchers.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      <span className="text-[10px] text-slate-500 font-medium">ভাউচার:</span>
                      {collectedVouchers.map((code) => (
                        <button
                          key={code}
                          type="button"
                          onClick={() => {
                            setCouponInput(code);
                            handleApplyCoupon(code);
                          }}
                          className={`text-[10px] px-2 py-0.5 rounded-lg border font-mono font-bold cursor-pointer transition-colors ${
                            appliedCoupon?.code === code
                              ? 'bg-emerald-600 text-white border-emerald-600'
                              : 'bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100'
                          }`}
                        >
                          {code} {appliedCoupon?.code === code ? '✓' : '+'}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-1 text-xs">
                  <div className="flex items-center justify-between text-slate-600">
                    <span>পণ্য মোট:</span>
                    <span className="font-mono font-bold">{formatCurrency(cartSubtotal)}</span>
                  </div>
                  {couponDiscount > 0 && (
                    <div className="flex items-center justify-between text-emerald-600 font-bold">
                      <span>কুপন ছাড় ({appliedCoupon?.code}):</span>
                      <span className="font-mono">- {formatCurrency(couponDiscount)}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between text-sm font-bold text-slate-900 pt-1 border-t border-slate-200">
                    <span>সর্বমোট বিল:</span>
                    <span className="font-mono text-base text-orange-600">
                      {formatCurrency(Math.max(0, cartSubtotal - couponDiscount))}
                    </span>
                  </div>
                </div>

                <Button
                  onClick={() => {
                    setIsCartOpen(false);
                    setIsCheckoutOpen(true);
                  }}
                  variant="primary"
                  size="md"
                  className="w-full bg-orange-600 hover:bg-orange-700"
                >
                  চেকআউট ও অর্ডারে এগিয়ে যান
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 10. CHECKOUT MODAL WITH AREA SELECTOR & COINS REDEMPTION */}
      {isCheckoutOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-orange-50">
              <h3 className="font-black text-sm text-slate-900 flex items-center gap-2">
                <Truck className="w-4 h-4 text-orange-600" />
                অর্ডার ও পেমেন্ট কনফার্মেশন
              </h3>
              <button
                onClick={() => setIsCheckoutOpen(false)}
                className="w-7 h-7 rounded-full bg-white flex items-center justify-center text-slate-500 border border-slate-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handlePlaceOrder} className="p-5 overflow-y-auto space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">আপনার নাম *</label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="যেমন: মোঃ সাকিব হোসেন"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">মোবাইল নম্বর *</label>
                <input
                  type="tel"
                  required
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="যেমন: 017XXXXXXXX"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono focus:ring-2 focus:ring-orange-500"
                />
              </div>

              {/* Delivery Area Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  ডেলিভারি এরিয়া ও চার্জ বেছে নিন *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setDeliveryArea('dhaka')}
                    className={`p-2.5 rounded-xl border text-xs font-bold text-left transition-all cursor-pointer ${
                      deliveryArea === 'dhaka'
                        ? 'border-orange-600 bg-orange-50 text-orange-800'
                        : 'border-slate-200 text-slate-600'
                    }`}
                  >
                    <span className="block font-black">ঢাকার ভেতরে</span>
                    <span className="text-[11px] text-emerald-600 font-mono font-bold block">চার্জ: ৳৬০</span>
                    <span className="text-[10px] text-slate-500">২৪-৪৮ ঘণ্টা</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDeliveryArea('outside')}
                    className={`p-2.5 rounded-xl border text-xs font-bold text-left transition-all cursor-pointer ${
                      deliveryArea === 'outside'
                        ? 'border-orange-600 bg-orange-50 text-orange-800'
                        : 'border-slate-200 text-slate-600'
                    }`}
                  >
                    <span className="block font-black">ঢাকার বাইরে</span>
                    <span className="text-[11px] text-emerald-600 font-mono font-bold block">চার্জ: ৳১২০</span>
                    <span className="text-[10px] text-slate-500">২-৪ কার্যদিবস</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">সম্পূর্ণ ডেলিভারি ঠিকানা *</label>
                <textarea
                  required
                  rows={2}
                  value={customerAddress}
                  onChange={(e) => setCustomerAddress(e.target.value)}
                  placeholder="বাসা নং, রোড, এলাকা/থানা, জেলা"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-orange-500"
                />
              </div>

              {/* Daraz Coins Redemption Option */}
              {coins >= 50 && (
                <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Coins className="w-5 h-5 text-amber-600" />
                    <div>
                      <span className="text-xs font-bold text-slate-800 block">
                        দারাজ কয়েন রিডিম (৫০ কয়েন = ৳২৫ ছাড়)
                      </span>
                      <span className="text-[10px] text-slate-500">আপনার বর্তমান কয়েন: {coins} টি</span>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={useCoinsInCheckout}
                    onChange={(e) => setUseCoinsInCheckout(e.target.checked)}
                    className="w-4 h-4 text-orange-600 rounded cursor-pointer"
                  />
                </div>
              )}

              {/* Payment Method Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  পেমেন্ট পদ্ধতি বেছে নিন *
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('COD')}
                    className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                      paymentMethod === 'COD'
                        ? 'border-orange-600 bg-orange-50 text-orange-700 shadow-xs'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Truck className="w-4 h-4" />
                    <span>ক্যাশ অন ডেলিভারি</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('bKash')}
                    className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                      paymentMethod === 'bKash'
                        ? 'border-pink-600 bg-pink-50 text-pink-700 shadow-xs'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <CreditCard className="w-4 h-4 text-pink-600" />
                    <span>বিকাশ পে</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('Nagad')}
                    className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                      paymentMethod === 'Nagad'
                        ? 'border-orange-600 bg-orange-50 text-orange-700 shadow-xs'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <CreditCard className="w-4 h-4 text-orange-600" />
                    <span>নগদ পে</span>
                  </button>
                </div>
              </div>

              {/* bKash / Nagad Info */}
              {(paymentMethod === 'bKash' || paymentMethod === 'Nagad') && (
                <div className="p-3 bg-slate-900 text-white rounded-2xl border border-slate-800 space-y-2.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-amber-300">
                      {paymentMethod === 'bKash' ? 'bKash Merchant Payment' : 'Nagad Merchant Payment'}
                    </span>
                    <span className="font-mono bg-white/10 px-2 py-0.5 rounded text-[10px]">
                      01711224455
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    আপনার {paymentMethod} অ্যাপ থেকে <b>Make Payment</b> বা <b>Send Money</b> করুন উল্লিখিত নম্বরে এবং নিচের বক্সে TrxID দিন:
                  </p>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                      পেমেন্ট ট্রানজেকশন আইডি (TrxID) *
                    </label>
                    <input
                      type="text"
                      required
                      value={trxId}
                      onChange={(e) => setTrxId(e.target.value.toUpperCase())}
                      placeholder="যেমন: 9K8L2M7N"
                      className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 font-mono text-white text-xs focus:ring-2 focus:ring-amber-400"
                    />
                  </div>
                </div>
              )}

              {/* Voucher Quick Apply in Checkout */}
              <div className="bg-slate-50 p-2.5 rounded-2xl border border-slate-200 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1">
                    <Tag className="w-3.5 h-3.5 text-orange-600" />
                    ভাউচার ও ডিসকাউন্ট কুপন
                  </span>
                  {appliedCoupon && (
                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                      {appliedCoupon.code} অ্যাপ্লাইড
                    </span>
                  )}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                    placeholder="যেমন: DARAZ20 বা FREESHIP"
                    className="flex-1 px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-mono uppercase focus:ring-2 focus:ring-orange-500"
                  />
                  <button
                    type="button"
                    onClick={() => handleApplyCoupon()}
                    className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold cursor-pointer"
                  >
                    অ্যাপ্লাই
                  </button>
                </div>
                {collectedVouchers.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <span className="text-[10px] text-slate-500 font-medium">ভাউচার:</span>
                    {collectedVouchers.map((code) => (
                      <button
                        key={code}
                        type="button"
                        onClick={() => {
                          setCouponInput(code);
                          handleApplyCoupon(code);
                        }}
                        className={`text-[10px] px-2 py-0.5 rounded-lg border font-mono font-bold cursor-pointer transition-colors ${
                          appliedCoupon?.code === code
                            ? 'bg-emerald-600 text-white border-emerald-600'
                            : 'bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100'
                        }`}
                      >
                        {code} {appliedCoupon?.code === code ? '✓' : '+'}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Bill Breakdown Summary */}
              <div className="bg-orange-50/70 p-3 rounded-2xl border border-orange-200 text-xs space-y-1 text-slate-700">
                <div className="flex justify-between">
                  <span>পণ্য মোট:</span>
                  <span className="font-mono font-bold">{formatCurrency(cartSubtotal)}</span>
                </div>
                {couponDiscount > 0 && (
                  <div className="flex justify-between text-emerald-600 font-bold">
                    <span>কুপন ছাড়:</span>
                    <span className="font-mono">- {formatCurrency(couponDiscount)}</span>
                  </div>
                )}
                {coinsDiscount > 0 && (
                  <div className="flex justify-between text-amber-700 font-bold">
                    <span>কয়েন ডিসকাউন্ট (৫০ কয়েন):</span>
                    <span className="font-mono">- ৳২৫.০০</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>ডেলিভারি চার্জ ({deliveryArea === 'dhaka' ? 'ঢাকা' : 'ঢাকার বাইরে'}):</span>
                  <span className="font-mono font-bold">{formatCurrency(deliveryCharge)}</span>
                </div>
                <div className="flex justify-between pt-1 border-t border-orange-200 font-black text-sm text-orange-700">
                  <span>সর্বমোট প্রদেয় বিল:</span>
                  <span className="font-mono">
                    {formatCurrency(
                      Math.max(0, cartSubtotal + deliveryCharge - couponDiscount - coinsDiscount)
                    )}
                  </span>
                </div>
              </div>

              <div className="pt-2 flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="md"
                  onClick={() => setIsCheckoutOpen(false)}
                  className="flex-1"
                >
                  বাতিল
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  className="flex-1 bg-orange-600 hover:bg-orange-700"
                >
                  অর্ডার কনফার্ম করুন
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 11. PRODUCT DETAILS & VARIANT SELECTION & SELLER CHAT & REVIEWS MODAL */}
      {selectedProductForDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col max-h-[92vh]">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-800">পণ্য বিবরণ, ভ্যারিয়েন্ট ও রিভিউ</span>
              </div>
              <button
                onClick={() => setSelectedProductForDetail(null)}
                className="w-7 h-7 rounded-full bg-white flex items-center justify-center text-slate-500 border border-slate-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-6">
              <div className="flex flex-col sm:flex-row gap-4 items-start">
                <div className="w-full sm:w-52 aspect-square rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 shrink-0 relative">
                  <img
                    src={selectedProductForDetail.image}
                    alt={selectedProductForDetail.name}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                  {selectedProductForDetail.isMallStore && (
                    <span className="absolute top-2 left-2 bg-slate-900/90 text-amber-300 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
                      <Award className="w-3 h-3 text-amber-400" />
                      100% Authentic
                    </span>
                  )}
                </div>

                <div className="flex-1 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                      <Store className="w-3.5 h-3.5" />
                      {selectedProductForDetail.shopName}
                    </span>
                    <button
                      type="button"
                      onClick={() => toggleWishlist(selectedProductForDetail.id, selectedProductForDetail.name)}
                      className="text-xs text-rose-600 font-bold flex items-center gap-1 hover:underline cursor-pointer"
                    >
                      <Heart
                        className={`w-3.5 h-3.5 ${
                          wishlist.includes(selectedProductForDetail.id) ? 'fill-rose-600' : ''
                        }`}
                      />
                      <span>{wishlist.includes(selectedProductForDetail.id) ? 'পছন্দ তালিকাভুক্ত' : 'পছন্দে রাখুন'}</span>
                    </button>
                  </div>

                  <h3 className="font-black text-base text-slate-900 leading-snug">
                    {selectedProductForDetail.name}
                  </h3>

                  <div className="flex items-baseline gap-2">
                    <span className="text-xl font-black font-mono text-orange-600">
                      {formatCurrency(
                        selectedProductForDetail.sellingPrice - (selectedProductForDetail.discount || 0)
                      )}
                    </span>
                    {(selectedProductForDetail.discount || 0) > 0 && (
                      <span className="text-xs font-mono text-slate-400 line-through">
                        {formatCurrency(selectedProductForDetail.sellingPrice)}
                      </span>
                    )}
                  </div>

                  {/* 0% EMI Banner if price >= 2000 */}
                  {selectedProductForDetail.sellingPrice - (selectedProductForDetail.discount || 0) >= 2000 && (
                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-orange-50 border border-orange-200 text-xs">
                      <div className="flex items-center gap-2">
                        <CreditCard className="w-4 h-4 text-orange-600 shrink-0" />
                        <div>
                          <span className="font-bold text-slate-900 block">০% ব্যাংক কিস্তি (0% EMI)</span>
                          <span className="text-[11px] text-slate-500">
                            মাত্র ৳{Math.round((selectedProductForDetail.sellingPrice - (selectedProductForDetail.discount || 0)) / 12)}/মাস থেকে শুরু (৩/৬/১২ মাস)
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSelectedProductForEmi(selectedProductForDetail)}
                        className="px-2.5 py-1 rounded-lg bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs cursor-pointer shadow-xs shrink-0"
                      >
                        প্ল্যান দেখুন
                      </button>
                    </div>
                  )}

                  {/* Compare & Share Quick Buttons */}
                  <div className="flex items-center gap-2 pt-0.5">
                    <button
                      type="button"
                      onClick={() => toggleCompareProduct(selectedProductForDetail)}
                      className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors ${
                        comparedProductIds.includes(selectedProductForDetail.id)
                          ? 'border-orange-500 bg-orange-50 text-orange-700'
                          : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <Scale className="w-3.5 h-3.5" />
                      <span>{comparedProductIds.includes(selectedProductForDetail.id) ? 'তুলনায় যুক্ত আছে' : 'তুলনা করুন'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setProductToShare(selectedProductForDetail)}
                      className="px-3 py-1.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                    >
                      <Share2 className="w-3.5 h-3.5 text-orange-600" />
                      <span>শেয়ার ও রিওয়ার্ড</span>
                    </button>
                  </div>

                  {/* Product Variant Picker (Size & Color) */}
                  <div className="pt-2 border-t border-slate-100 space-y-2 text-xs">
                    <div>
                      <span className="font-bold text-slate-700 block mb-1">সাইজ বেছে নিন (Size):</span>
                      <div className="flex items-center gap-1.5">
                        {['S', 'M', 'L', 'XL', 'XXL'].map((sz) => (
                          <button
                            key={sz}
                            type="button"
                            onClick={() => setSelectedVariantSize(sz)}
                            className={`w-8 h-8 rounded-xl font-bold font-mono text-xs flex items-center justify-center transition-all cursor-pointer ${
                              selectedVariantSize === sz
                                ? 'bg-orange-600 text-white shadow-xs'
                                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                            }`}
                          >
                            {sz}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <span className="font-bold text-slate-700 block mb-1">রঙ (Color):</span>
                      <div className="flex flex-wrap items-center gap-1.5">
                        {['ব্ল্যাক (Black)', 'নেভি ব্লু (Navy)', 'মেরুন (Maroon)', 'হোয়াইট (White)'].map((col) => (
                          <button
                            key={col}
                            type="button"
                            onClick={() => setSelectedVariantColor(col)}
                            className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${
                              selectedVariantColor === col
                                ? 'bg-slate-900 text-white shadow-xs'
                                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                            }`}
                          >
                            {col}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Action buttons: Add to Cart + Direct WhatsApp Chat with Seller */}
                  <div className="pt-3 flex flex-wrap items-center gap-2">
                    <Button
                      onClick={() => {
                        handleAddToCart(
                          selectedProductForDetail,
                          `${selectedVariantSize}, ${selectedVariantColor}`
                        );
                        setSelectedProductForDetail(null);
                        setIsCartOpen(true);
                      }}
                      variant="primary"
                      size="sm"
                      className="bg-orange-600 hover:bg-orange-700 flex-1 flex items-center justify-center gap-1.5"
                    >
                      <ShoppingBag className="w-4 h-4" />
                      <span>কার্টে যোগ করুন</span>
                    </Button>

                    <button
                      type="button"
                      onClick={() => handleOpenSellerChat(selectedProductForDetail)}
                      className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                      title="সরাসরি সেলারের সাথে কথা বলুন"
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span>সেলার চ্যাট</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* FREQUENTLY BOUGHT TOGETHER / BUNDLE COMBO OFFER */}
              <div className="bg-gradient-to-r from-orange-50 to-amber-50 p-3.5 rounded-2xl border border-orange-200/80 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                    <Gift className="w-4 h-4 text-orange-600" />
                    একসাথে কিনুন এবং অতিরিক্ত ৫% ছাড় পান! (Bundle Deal)
                  </span>
                  <span className="text-[10px] font-bold text-orange-700 bg-orange-100 px-2 py-0.5 rounded-md">
                    কম্বো সেভার
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-700">
                  <span className="truncate">
                    {selectedProductForDetail.name} + কমপ্লিমেন্টারি প্রিমিয়াম এক্সেসরিজ
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      handleAddToCart(selectedProductForDetail);
                      showToast('কম্বো প্যাকেজ সফলভাবে ৫% ছাড়সহ কার্টে যোগ করা হয়েছে!', 'success');
                      setSelectedProductForDetail(null);
                      setIsCartOpen(true);
                    }}
                    className="px-3 py-1 bg-slate-900 hover:bg-black text-white text-xs font-bold rounded-xl cursor-pointer shrink-0 ml-2"
                  >
                    কম্বো কার্টে নিন
                  </button>
                </div>
              </div>

              {/* Customer Reviews & Star Ratings Section with Unboxing Photos */}
              <div className="border-t border-slate-200 pt-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-black text-sm text-slate-900 flex items-center gap-1.5">
                    <Star className="w-4 h-4 text-amber-500 fill-amber-400" />
                    ক্রেতাদের আনবক্সিং রিভিউ ও ছবি ({productReviews.length})
                  </h4>
                  <span className="text-xs text-emerald-600 font-bold flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    ১০০% ভেরিফাইড ক্রেতা
                  </span>
                </div>

                {/* Star rating breakdown summary bar */}
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-4 text-xs">
                  <div className="text-center shrink-0 pr-3 border-r border-slate-200">
                    <div className="text-2xl font-black text-slate-900 font-mono">4.9</div>
                    <div className="flex items-center text-amber-400">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star key={s} className="w-3 h-3 fill-amber-400" />
                      ))}
                    </div>
                    <span className="text-[10px] text-slate-400 block mt-0.5">সব মিলিয়ে ৯৮% পজিটিভ</span>
                  </div>
                  <div className="flex-1 space-y-1 text-[11px] text-slate-600">
                    <div className="flex items-center gap-2">
                      <span>৫ স্টার:</span>
                      <div className="flex-1 h-1.5 rounded-full bg-slate-200 overflow-hidden">
                        <div className="bg-amber-400 h-full w-[90%]" />
                      </div>
                      <span className="font-mono text-slate-400">৯০%</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span>৪ স্টার:</span>
                      <div className="flex-1 h-1.5 rounded-full bg-slate-200 overflow-hidden">
                        <div className="bg-amber-400 h-full w-[10%]" />
                      </div>
                      <span className="font-mono text-slate-400">১০%</span>
                    </div>
                  </div>
                </div>

                {/* Existing Reviews List */}
                <div className="space-y-3">
                  {productReviews.length === 0 ? (
                    <p className="text-xs text-slate-400 italic">এখনও কোনো রিভিউ যুক্ত হয়নি। প্রথম রিভিউটি আপনি দিন!</p>
                  ) : (
                    productReviews.map((rev) => (
                      <div key={rev.id} className="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-slate-900 text-white text-[10px] font-bold flex items-center justify-center">
                              {rev.customerName[0]}
                            </div>
                            <span className="text-xs font-bold text-slate-800">{rev.customerName}</span>
                            {rev.isVerifiedBuyer && (
                              <span className="text-[9px] bg-emerald-100 text-emerald-700 px-1.5 py-0.2 rounded font-semibold">
                                Verified Purchase
                              </span>
                            )}
                          </div>
                          <div className="flex items-center text-amber-400">
                            {Array.from({ length: rev.rating }).map((_, idx) => (
                              <Star key={idx} className="w-3 h-3 fill-amber-400" />
                            ))}
                          </div>
                        </div>

                        <p className="text-xs text-slate-700 leading-relaxed">{rev.comment}</p>

                        {rev.photoUrl && (
                          <div className="pt-1">
                            <img
                              src={rev.photoUrl}
                              alt="Review attachment"
                              className="w-20 h-20 rounded-xl object-cover border border-slate-200 shadow-2xs"
                            />
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>

                {/* Add Review Form with Unboxing Photo */}
                <form onSubmit={handleAddReview} className="p-3 bg-orange-50/50 rounded-2xl border border-orange-200 space-y-2.5">
                  <span className="text-xs font-bold text-slate-800 block">আপনার মূল্যবান মতামত ও ছবি দিন:</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input
                      type="text"
                      required
                      placeholder="আপনার নাম"
                      value={newReviewName}
                      onChange={(e) => setNewReviewName(e.target.value)}
                      className="px-3 py-1.5 bg-white rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-orange-500"
                    />
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-slate-600">রেটিং:</span>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          type="button"
                          key={star}
                          onClick={() => setNewReviewRating(star)}
                          className="cursor-pointer"
                        >
                          <Star
                            className={`w-4 h-4 ${
                              star <= newReviewRating
                                ? 'text-amber-500 fill-amber-400'
                                : 'text-slate-300'
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                  <textarea
                    rows={2}
                    required
                    placeholder="পণ্যের মান এবং ডেলিভারি অভিজ্ঞতা কেমন ছিল লিখুন..."
                    value={newReviewComment}
                    onChange={(e) => setNewReviewComment(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-orange-500"
                  />
                  <input
                    type="url"
                    placeholder="ছবি থাকলে ছবির ইমেজ লিংক দিন (ঐচ্ছিক)"
                    value={newReviewPhoto}
                    onChange={(e) => setNewReviewPhoto(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-orange-500 font-mono"
                  />
                  <Button type="submit" variant="primary" size="sm" className="bg-orange-600 hover:bg-orange-700">
                    আনবক্সিং রিভিউ সাবমিট করুন
                  </Button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 12. LIVE ORDER TRACKING MODAL */}
      {isOrderTrackingOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-900 text-white">
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5 text-amber-400" />
                <h3 className="font-black text-sm">লাইভ অর্ডার ট্র্যাকিং (Track Your Order)</h3>
              </div>
              <button
                onClick={() => {
                  setIsOrderTrackingOpen(false);
                  setTrackedOrder(null);
                  setTrackingSearched(false);
                }}
                className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4">
              <form onSubmit={handleTrackOrder} className="space-y-2">
                <label className="text-xs font-bold text-slate-700 block">
                  আপনার অর্ডার নম্বর বা মোবাইল নম্বর দিন:
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    value={trackingInput}
                    onChange={(e) => setTrackingInput(e.target.value)}
                    placeholder="যেমন: SX-384912 অথবা 017XXXXXXXX"
                    className="flex-1 px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono uppercase focus:ring-2 focus:ring-orange-500"
                  />
                  <Button type="submit" variant="primary" size="sm" className="bg-orange-600 hover:bg-orange-700">
                    ট্র্যাক করুন
                  </Button>
                </div>
              </form>

              {trackedOrder ? (
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200 text-xs">
                    <div>
                      <span className="text-slate-400 block text-[10px]">অর্ডার নম্বর:</span>
                      <span className="font-mono font-bold text-slate-900">{trackedOrder.orderNumber}</span>
                    </div>
                    <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold">
                      {trackedOrder.orderStatus}
                    </span>
                  </div>

                  {/* 4-Step Progress Timeline */}
                  <div className="py-2 space-y-3">
                    <div className="flex items-center justify-between text-[11px] font-bold">
                      <div className="flex items-center gap-1.5 text-emerald-700">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>অর্ডার গৃহীত</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-emerald-700">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>প্যাকিং সম্পন্ন</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-orange-600">
                        <Truck className="w-4 h-4 text-orange-600 animate-pulse" />
                        <span>কুরিয়ার ট্রানজিট</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-400">
                        <Clock className="w-4 h-4" />
                        <span>ডেলিভারি</span>
                      </div>
                    </div>

                    <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                      <div className="bg-gradient-to-r from-emerald-500 to-orange-500 h-full w-[70%]" />
                    </div>
                  </div>

                  <div className="p-3 bg-white rounded-xl border border-slate-200/80 text-xs space-y-1.5">
                    <div className="flex justify-between">
                      <span className="text-slate-500">বিক্রেতা শপ:</span>
                      <strong className="text-slate-800">{trackedOrder.shopName}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">কুরিয়ার ট্র্যাকিং:</span>
                      <strong className="text-indigo-600 font-mono">
                        {trackedOrder.trackingCode || 'ST-BD-889123'} ({trackedOrder.courierProvider || 'Steadfast'})
                      </strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">মোট মূল্য:</span>
                      <strong className="text-orange-600 font-mono">
                        {formatCurrency(trackedOrder.totalAmount)}
                      </strong>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setInvoiceOrder(trackedOrder);
                        setIsInvoiceModalOpen(true);
                      }}
                      className="w-full mt-2 py-2 bg-slate-900 hover:bg-black text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Printer className="w-3.5 h-3.5 text-amber-300" />
                      <span>অফিসিয়াল ইনভয়েস / ক্যাশ মেমো প্রিন্ট করুন</span>
                    </button>
                  </div>
                </div>
              ) : trackingSearched ? (
                <div className="p-6 text-center text-slate-400 text-xs">
                  <p>এই নম্বরে কোনো অর্ডার খুঁজে পাওয়া যায়নি। নম্বরটি যাচাই করে পুনরায় চেষ্টা করুন।</p>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}

      {/* 13. DEDICATED VENDOR STOREFRONT MODAL */}
      {selectedVendorStore && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col max-h-[90vh]">
            {/* Storefront Header Banner */}
            <div className="bg-gradient-to-r from-slate-900 via-orange-950 to-slate-900 p-5 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-orange-600 text-white font-black text-base flex items-center justify-center shadow-md">
                  {selectedVendorStore.name?.slice(0, 2) || 'SX'}
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-black text-base">{selectedVendorStore.name}</h3>
                    <Award className="w-4 h-4 text-amber-400" />
                  </div>
                  <p className="text-xs text-amber-200">
                    ★ ৯৮% পজিটিভ রেটিং | ১০০% রেসপন্স রেট
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => toggleFollowShop(selectedVendorStore.id, selectedVendorStore.name)}
                  className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-colors cursor-pointer ${
                    followedShops.includes(selectedVendorStore.id)
                      ? 'bg-emerald-600 text-white'
                      : 'bg-white text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  {followedShops.includes(selectedVendorStore.id) ? 'ফলোড' : '+ ফলো করুন'}
                </button>
                <button
                  onClick={() => setSelectedVendorStore(null)}
                  className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Vendor Products Grid */}
            <div className="p-4 overflow-y-auto space-y-3">
              <h4 className="text-xs font-bold text-slate-800">
                এই দোকানের সকল পণ্যসমূহ ({allProducts.filter((p) => p.shopId === selectedVendorStore.id).length}):
              </h4>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {allProducts
                  .filter((p) => p.shopId === selectedVendorStore.id)
                  .map((p, idx) => (
                    <div
                      key={`vendor_${selectedVendorStore.id}_${p.id}_${idx}`}
                      className="p-2.5 rounded-2xl border border-slate-200 hover:border-orange-300 transition-all flex flex-col justify-between"
                    >
                      <div
                        onClick={() => {
                          setSelectedVendorStore(null);
                          setSelectedProductForDetail(p);
                        }}
                        className="aspect-square rounded-xl overflow-hidden bg-slate-100 mb-2 cursor-pointer"
                      >
                        <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
                      </div>
                      <h5 className="font-bold text-xs text-slate-800 line-clamp-1">{p.name}</h5>
                      <span className="font-mono font-bold text-xs text-orange-600">
                        ৳{p.sellingPrice - (p.discount || 0)}
                      </span>
                      <button
                        onClick={() => handleAddToCart(p)}
                        className="mt-2 w-full py-1 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-xs font-bold cursor-pointer"
                      >
                        কার্ট
                      </button>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 14. ORDER SUCCESS POPUP */}
      {orderSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full text-center space-y-4 shadow-2xl border border-emerald-200">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900">অর্ডার সফলভাবে প্লেস হয়েছে!</h3>
              <p className="text-xs text-slate-600 mt-1">
                সংশ্লিষ্ট দোকানদারদের ব্যাকঅফিসে আপনার অর্ডার পৌঁছে গেছে। খুব শীঘ্রই আপনার ফোনে কনফার্মেশন কল করা হবে।
              </p>
              <div className="mt-2 p-2 bg-amber-50 rounded-xl border border-amber-200 text-amber-800 text-xs font-bold flex items-center justify-center gap-1.5">
                <Coins className="w-4 h-4 text-amber-600" />
                <span>+৩০টি রিওয়ার্ড কয়েন আপনার অ্যাকাউন্টে জমা হয়েছে!</span>
              </div>
            </div>
            <div className="space-y-2 pt-1">
              {lastCompletedOrder && (
                <button
                  type="button"
                  onClick={() => {
                    setInvoiceOrder(lastCompletedOrder);
                    setIsInvoiceModalOpen(true);
                  }}
                  className="w-full py-2 bg-slate-900 hover:bg-black text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <Printer className="w-4 h-4 text-amber-300" />
                  <span>অর্ডার ইনভয়েস ও মেমো প্রিন্ট করুন</span>
                </button>
              )}

              <Button
                onClick={() => setOrderSuccess(false)}
                variant="primary"
                size="md"
                className="w-full bg-emerald-600 hover:bg-emerald-700"
              >
                কেনাকাটা চালিয়ে যান
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 15. LIVE SALES ORDER TICKER NOTIFICATION */}
      <LiveOrderTicker
        products={allProducts}
        onSelectProduct={(p) => {
          setSelectedProductForDetail(p);
        }}
      />

      {/* 16. PRODUCT COMPARISON FLOATING BAR & MODAL */}
      <ComparisonFloatingBar
        comparedProducts={comparedProducts}
        onOpenModal={() => setIsCompareModalOpen(true)}
        onRemoveProduct={handleRemoveComparedProduct}
        onClearAll={handleClearCompared}
      />

      {isCompareModalOpen && (
        <ProductComparisonModal
          comparedProducts={comparedProducts}
          onClose={() => setIsCompareModalOpen(false)}
          onRemoveProduct={handleRemoveComparedProduct}
          onClearAll={handleClearCompared}
          onAddToCart={(product) => {
            handleAddToCart(product);
            setIsCartOpen(true);
          }}
        />
      )}

      {/* 17. 0% EMI CALCULATOR MODAL */}
      {selectedProductForEmi && (
        <EmiCalculatorModal
          product={selectedProductForEmi}
          onClose={() => setSelectedProductForEmi(null)}
          onAddToCart={() => {
            handleAddToCart(selectedProductForEmi);
            setSelectedProductForEmi(null);
            setIsCartOpen(true);
          }}
        />
      )}

      {/* 18. BANGLA VOICE SEARCH MODAL */}
      {isVoiceSearchOpen && (
        <VoiceSearchModal
          onClose={() => setIsVoiceSearchOpen(false)}
          onApplySearch={handleApplyVoiceSearch}
        />
      )}

      {/* 19. SOCIAL SHARE & EARN CASHBACK MODAL */}
      {productToShare && (
        <SocialShareModal
          product={productToShare}
          onClose={() => setProductToShare(null)}
        />
      )}

      {/* 20. DIGITAL INVOICE & CASH MEMO MODAL */}
      {isInvoiceModalOpen && invoiceOrder && (
        <DigitalInvoiceModal
          order={invoiceOrder}
          onClose={() => setIsInvoiceModalOpen(false)}
        />
      )}
    </div>
  );
};
