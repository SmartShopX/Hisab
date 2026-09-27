import React, { useState, useMemo, useEffect, useDeferredValue } from 'react';
import { Product, Customer, CartItem, PaymentMethod, Order } from '../../types';
import { DataStore } from '../../services/dataStorage';
import { salesService } from '../../services/salesService';
import { smsService } from '../../services/smsService';
import { formatCurrency } from '../../utils/formatters';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { InvoiceModal } from '../../components/invoice/InvoiceModal';
import { MedicineSubstituteModal } from '../../components/pharmacy/MedicineSubstituteModal';
import { NearExpiryReportModal } from '../../components/pharmacy/NearExpiryReportModal';
import { QuickStockInwardModal } from '../../components/products/QuickStockInwardModal';
import { CameraBarcodeScannerModal } from '../../components/pos/CameraBarcodeScannerModal';
import { DayEndCashClosingModal } from '../../components/pos/DayEndCashClosingModal';
import { PosBiometricLockOverlay } from '../../components/pos/PosBiometricLockOverlay';
import { BarcodePriceTagGeneratorModal } from '../../components/products/BarcodePriceTagGeneratorModal';
import { SupplierDuePaymentModal } from '../../components/suppliers/SupplierDuePaymentModal';
import { StaffPerformanceModal } from '../../components/staff/StaffPerformanceModal';
import { CrossSellSuggestionBanner } from '../../components/pos/CrossSellSuggestionBanner';
import { CrossSellCartSection } from '../../components/pos/CrossSellCartSection';
import { CostProfitWidget } from '../../components/pos/CostProfitWidget';
import { CostProfitAnalysisModal } from '../../components/pos/CostProfitAnalysisModal';
import {
  PosCategoryDepartmentFilter,
  PosViewMode,
  PosSortOption,
} from '../../components/pos/PosCategoryDepartmentFilter';
import { PosGroupedProductList } from '../../components/pos/PosGroupedProductList';
import { PosCompactProductTable } from '../../components/pos/PosCompactProductTable';
import { offlineSyncService } from '../../services/offlineSyncService';
import { biometricAuthService } from '../../services/biometricAuthService';
import { crossSellService, CrossSellItem } from '../../services/crossSellService';
import { costProfitService, BasketMarginSummary } from '../../services/costProfitService';
import { getExpiryStatus, findMedicineSubstitutes, getPharmacyUnitInfo } from '../../utils/pharmacyHelper';
import {
  Search,
  Barcode,
  Plus,
  Minus,
  Trash2,
  UserPlus,
  CheckCircle2,
  CreditCard,
  ShoppingBag,
  Sparkles,
  Pill,
  AlertTriangle,
  TrendingUp,
  Calculator,
  MapPin,
  Layers,
  Calendar,
  FileText,
  Stethoscope,
  PackagePlus,
  Camera,
  Coins,
  Wifi,
  WifiOff,
  RefreshCw,
  Gift,
  Briefcase,
  Tag,
  Building2,
  Users,
  Lock,
  Unlock,
  Fingerprint,
  ScanFace,
  ShieldCheck,
} from 'lucide-react';

export const PosPage: React.FC = () => {
  const { shop } = useAuth();
  const { showToast } = useToast();

  const [products, setProducts] = useState<Product[]>(() => DataStore.getProducts());
  const [customers, setCustomers] = useState<Customer[]>(() => DataStore.getCustomers());

  // Listen to product updates across tabs / components
  useEffect(() => {
    const handleProductsUpdated = () => {
      setProducts(DataStore.getProducts());
    };
    window.addEventListener('smartshopx_products_updated', handleProductsUpdated);
    return () => {
      window.removeEventListener('smartshopx_products_updated', handleProductsUpdated);
    };
  }, []);

  // Quick Stock Inward from POS
  const [isPosQuickStockOpen, setIsPosQuickStockOpen] = useState(false);
  const [posQuickStockProduct, setPosQuickStockProduct] = useState<Product | null>(null);

  const handleOpenPosQuickStock = (p: Product) => {
    setPosQuickStockProduct(p);
    setIsPosQuickStockOpen(true);
  };

  const handleSavePosQuickStock = (
    productId: string,
    addedStock: number,
    details?: { batchNumber?: string; expiryDate?: string; purchasePrice?: number }
  ) => {
    const updated = products.map((p) => {
      if (p.id === productId) {
        return {
          ...p,
          stock: (Number(p.stock) || 0) + addedStock,
          batchNumber: details?.batchNumber !== undefined ? details.batchNumber : p.batchNumber,
          expiryDate: details?.expiryDate !== undefined ? details.expiryDate : p.expiryDate,
          purchasePrice: details?.purchasePrice !== undefined ? details.purchasePrice : p.purchasePrice,
        };
      }
      return p;
    });

    setProducts(updated);
    DataStore.setProducts(updated);

    const refreshedTarget = updated.find((p) => p.id === productId);
    showToast(
      `"${refreshedTarget?.name || 'পণ্য'}" এ ${addedStock} টি নতুন স্টক যোগ করা হয়েছে! এখন কার্টে যোগ করা যাবে।`,
      'success'
    );

    if (refreshedTarget) {
      addToCart(refreshedTarget, 'Pcs');
    }
  };

  // POS State
  const [searchQuery, setSearchQuery] = useState('');
  const deferredSearchQuery = useDeferredValue(searchQuery);
  const [barcodeQuery, setBarcodeQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedSubCategory, setSelectedSubCategory] = useState<string>('all');
  const [selectedBrand, setSelectedBrand] = useState<string>('all');
  const [stockFilter, setStockFilter] = useState<'all' | 'in_stock' | 'low_stock'>('all');
  const [viewMode, setViewMode] = useState<PosViewMode>('grid');
  const [sortOption, setSortOption] = useState<PosSortOption>('default');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer>(() => {
    return customers.find((c) => c.id === 'cust_5') || customers[0];
  });
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [paidAmount, setPaidAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Cash');
  const [doctorRef, setDoctorRef] = useState('');
  const [notes, setNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Modals
  const [isNewCustomerModalOpen, setIsNewCustomerModalOpen] = useState(false);
  const [newCustName, setNewCustName] = useState('');
  const [newCustMobile, setNewCustMobile] = useState('');
  const [newCustAddress, setNewCustAddress] = useState('');

  // Pharmacy Modals
  const [isSubstituteModalOpen, setIsSubstituteModalOpen] = useState(false);
  const [activeSubstituteProduct, setActiveSubstituteProduct] = useState<Product | null>(null);
  const [substitutesList, setSubstitutesList] = useState<Product[]>([]);
  const [isNearExpiryModalOpen, setIsNearExpiryModalOpen] = useState(false);

  // Completed Invoice State
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [displayLimit, setDisplayLimit] = useState(36);

  // Camera Barcode Scanner, Barcode Generator & Day-End Cash Closing Modals
  const [isCameraScannerOpen, setIsCameraScannerOpen] = useState(false);
  const [isDayEndClosingOpen, setIsDayEndClosingOpen] = useState(false);
  const [isBarcodeModalOpen, setIsBarcodeModalOpen] = useState(false);
  const [barcodeTargetProduct, setBarcodeTargetProduct] = useState<Product | null>(null);
  const [isSupplierDueModalOpen, setIsSupplierDueModalOpen] = useState(false);
  const [isStaffPerformanceModalOpen, setIsStaffPerformanceModalOpen] = useState(false);

  // Pricing Mode: Retail vs Wholesale
  const [pricingMode, setPricingMode] = useState<'Retail' | 'Wholesale'>('Retail');

  // Staff Salesperson Selection
  const staffList = useMemo(() => DataStore.getStaff(), []);
  const [selectedStaffId, setSelectedStaffId] = useState<string>(
    staffList[0]?.id || ''
  );

  // Customer Loyalty Points Redemption
  const [redeemedLoyaltyPoints, setRedeemedLoyaltyPoints] = useState<number>(0);

  // Split Payment State
  const [isSplitPayment, setIsSplitPayment] = useState(false);
  const [splitCashAmount, setSplitCashAmount] = useState<number>(0);
  const [splitDigitalMethod, setSplitDigitalMethod] = useState<PaymentMethod>('bKash');

  // Offline Mode & Auto-Sync State
  const [isOnline, setIsOnline] = useState<boolean>(() => offlineSyncService.isOnline());
  const [pendingOfflineCount, setPendingOfflineCount] = useState<number>(() =>
    offlineSyncService.getPendingCount()
  );
  const [isSyncingOffline, setIsSyncingOffline] = useState(false);

  // Listen to network status & offline queue changes
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      handleSyncOfflineSales();
    };
    const handleOffline = () => {
      setIsOnline(false);
      showToast('ইন্টারনেট সংযোগ বিচ্ছিন্ন! স্মার্ট অফলাইন মোড চালু হয়েছে — সকল বিক্রয় লোকালি সংরক্ষিত থাকবে।', 'warning');
    };
    const handleQueueUpdate = () => {
      setPendingOfflineCount(offlineSyncService.getPendingCount());
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('smartshopx_offline_queue_updated', handleQueueUpdate);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('smartshopx_offline_queue_updated', handleQueueUpdate);
    };
  }, []);

  const handleSyncOfflineSales = async () => {
    const count = offlineSyncService.getPendingCount();
    if (count === 0) return;
    setIsSyncingOffline(true);
    try {
      const res = await offlineSyncService.syncAllPending();
      setPendingOfflineCount(offlineSyncService.getPendingCount());
      if (res.synced > 0) {
        showToast(`${res.synced} টি অফলাইন বিক্রয় সফলভাবে ক্লাউডে সিঙ্ক হয়েছে!`, 'success');
      }
    } catch {
      showToast('অফলাইন বিক্রয় সিঙ্ক করতে সমস্যা হয়েছে', 'error');
    } finally {
      setIsSyncingOffline(false);
    }
  };

  // Near Expiry Count
  // Biometric POS Lock & Inactivity Timer
  const [isPosLocked, setIsPosLocked] = useState(false);
  const [bioSettings, setBioSettings] = useState(() => biometricAuthService.getSettings());

  // Smart Cross-Sell Recommendations State
  const [lastAddedProduct, setLastAddedProduct] = useState<Product | null>(null);
  const [crossSellSuggestions, setCrossSellSuggestions] = useState<CrossSellItem[]>([]);
  const [isCrossSellBannerVisible, setIsCrossSellBannerVisible] = useState(false);

  // Cart-level holistic cross-sell recommendations
  const cartCrossSells = useMemo(() => {
    return crossSellService.getRecommendationsForCart(cart, products, 6);
  }, [cart, products]);

  // Smart Cost-to-Profit Calculator State
  const [isCostProfitModalOpen, setIsCostProfitModalOpen] = useState(false);
  const [costProfitThreshold, setCostProfitThreshold] = useState<number>(() =>
    costProfitService.getSettings().targetMarginThreshold
  );

  // Real-time basket margin & cost calculations
  const basketMarginSummary = useMemo(() => {
    return costProfitService.calculateBasketMargin(cart, discountAmount, costProfitThreshold);
  }, [cart, discountAmount, costProfitThreshold]);

  useEffect(() => {
    const handleSettingsChange = (e: any) => {
      setBioSettings(e.detail || biometricAuthService.getSettings());
    };
    window.addEventListener('smartshopx_biometric_settings_changed', handleSettingsChange);
    return () => {
      window.removeEventListener('smartshopx_biometric_settings_changed', handleSettingsChange);
    };
  }, []);

  // Auto-lock on inactivity
  useEffect(() => {
    if (!bioSettings.enabled || !bioSettings.allowPosQuickUnlock || bioSettings.posAutoLockTimeoutMinutes <= 0) {
      return;
    }

    let timeoutId: any;
    const timeoutMs = bioSettings.posAutoLockTimeoutMinutes * 60 * 1000;

    const resetTimer = () => {
      if (timeoutId) clearTimeout(timeoutId);
      if (!isPosLocked) {
        timeoutId = setTimeout(() => {
          setIsPosLocked(true);
          showToast('নিষ্ক্রিয়তার কারণে POS স্ক্রিন স্বয়ংক্রিয়ভাবে লক করা হয়েছে', 'info');
        }, timeoutMs);
      }
    };

    resetTimer();

    const activityEvents = ['mousedown', 'mousemove', 'keydown', 'touchstart', 'scroll'];
    activityEvents.forEach((evt) => window.addEventListener(evt, resetTimer));

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      activityEvents.forEach((evt) => window.removeEventListener(evt, resetTimer));
    };
  }, [bioSettings, isPosLocked]);

  // Near Expiry Count
  const nearExpiryCount = useMemo(() => {
    return products.filter((p) => {
      if (!p.expiryDate) return false;
      const status = getExpiryStatus(p.expiryDate, 90);
      return status.isNearExpiry || status.isExpired;
    }).length;
  }, [products]);

  // Categories list
  const categories = useMemo(() => {
    const set = new Set(products.map((p) => p.category));
    return ['all', ...Array.from(set)];
  }, [products]);

  // Filtered products (Supports category, sub-category, brand, stock, trade name, sku, barcode, generic name, brand, rack location & sort)
  const filteredProducts = useMemo(() => {
    let result = products.filter((p) => {
      if (!p.isActive) return false;
      if (selectedCategory !== 'all' && p.category !== selectedCategory) return false;
      if (
        selectedSubCategory !== 'all' &&
        p.subCategory !== selectedSubCategory &&
        p.dosageForm !== selectedSubCategory
      ) {
        return false;
      }
      if (
        selectedBrand !== 'all' &&
        p.brand !== selectedBrand &&
        p.manufacturer !== selectedBrand
      ) {
        return false;
      }
      if (stockFilter === 'in_stock' && p.stock <= 0) return false;
      if (stockFilter === 'low_stock' && (p.stock > (p.minStock || 10) || p.stock <= 0)) {
        return false;
      }

      if (deferredSearchQuery.trim()) {
        const q = deferredSearchQuery.toLowerCase();
        const matches =
          p.name.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q) ||
          p.barcode.includes(q) ||
          (p.genericName && p.genericName.toLowerCase().includes(q)) ||
          (p.brand && p.brand.toLowerCase().includes(q)) ||
          (p.manufacturer && p.manufacturer.toLowerCase().includes(q)) ||
          (p.rackLocation && p.rackLocation.toLowerCase().includes(q)) ||
          p.category.toLowerCase().includes(q) ||
          (p.subCategory && p.subCategory.toLowerCase().includes(q));
        if (!matches) return false;
      }
      return true;
    });

    // Apply Sorting
    if (sortOption === 'name_asc') {
      result = [...result].sort((a, b) => a.name.localeCompare(b.name, 'bn'));
    } else if (sortOption === 'name_desc') {
      result = [...result].sort((a, b) => b.name.localeCompare(a.name, 'bn'));
    } else if (sortOption === 'price_asc') {
      result = [...result].sort((a, b) => a.sellingPrice - b.sellingPrice);
    } else if (sortOption === 'price_desc') {
      result = [...result].sort((a, b) => b.sellingPrice - a.sellingPrice);
    } else if (sortOption === 'stock_desc') {
      result = [...result].sort((a, b) => b.stock - a.stock);
    }

    return result;
  }, [
    products,
    selectedCategory,
    selectedSubCategory,
    selectedBrand,
    stockFilter,
    deferredSearchQuery,
    sortOption,
  ]);

  // Grouped products by Category/Department
  const productsByCategory = useMemo(() => {
    const map: Record<string, Product[]> = {};
    filteredProducts.forEach((p) => {
      const cat = p.category || 'সাধারণ পণ্য';
      if (!map[cat]) map[cat] = [];
      map[cat].push(p);
    });
    return map;
  }, [filteredProducts]);

  const visibleProducts = useMemo(() => {
    return filteredProducts.slice(0, displayLimit);
  }, [filteredProducts, displayLimit]);

  // Barcode scanner simulator handler
  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcodeQuery.trim()) return;
    const found = products.find(
      (p) => p.barcode === barcodeQuery.trim() || p.sku.toLowerCase() === barcodeQuery.trim().toLowerCase()
    );
    if (found) {
      addToCart(found);
      setBarcodeQuery('');
      showToast(`${found.name} কার্টে যোগ হয়েছে`, 'success');
    } else {
      showToast('বারকোড অনুযায়ী কোনো পণ্য পাওয়া যায়নি', 'warning');
    }
  };

  // Add to cart with unit support (Pcs, Strip, Box)
  const addToCart = (product: Product, unit: 'Pcs' | 'Strip' | 'Box' = 'Pcs') => {
    if (product.stock <= 0) {
      // Suggest substitutes if out of stock!
      const subs = findMedicineSubstitutes(product, products);
      if (subs.length > 0) {
        setActiveSubstituteProduct(product);
        setSubstitutesList(subs);
        setIsSubstituteModalOpen(true);
        showToast('ওষুধটি স্টক আউট! বিকল্প ওষুধ দেখুন', 'warning');
        return;
      }
      showToast('পণ্যটি স্টক আউট! বিক্রি সম্ভব নয়', 'error');
      return;
    }

    const unitInfo = getPharmacyUnitInfo(product, unit);
    const activeUnitPrice = pricingMode === 'Wholesale'
      ? (product.wholesalePrice || Math.round(unitInfo.unitPrice * 0.85))
      : unitInfo.unitPrice;

    setCart((prev) => {
      const existing = prev.find(
        (item) => item.product.id === product.id && (item.selectedUnit || 'Pcs') === unit
      );
      if (existing) {
        const nextQty = existing.quantity + 1;
        const totalPcsNeeded = nextQty * unitInfo.multiplier;
        if (totalPcsNeeded > product.stock) {
          showToast(`স্টকে সর্বোচ্চ ${product.stock} টি পিস রয়েছে`, 'warning');
          return prev;
        }
        return prev.map((item) =>
          item.product.id === product.id && (item.selectedUnit || 'Pcs') === unit
            ? {
                ...item,
                quantity: nextQty,
                unitPrice: activeUnitPrice,
                total: nextQty * activeUnitPrice,
              }
            : item
        );
      }

      return [
        ...prev,
        {
          product,
          quantity: 1,
          unitPrice: activeUnitPrice,
          discount: product.discount,
          total: activeUnitPrice,
          selectedUnit: unit,
          unitMultiplier: unitInfo.multiplier,
        },
      ];
    });

    // Smart Cross-sell Recommendation Trigger
    try {
      const currentCartIds = cart.map((item) => item.product.id);
      const recs = crossSellService.getRecommendationsForProduct(
        product,
        products,
        [...currentCartIds, product.id],
        5
      );
      if (recs.length > 0) {
        setLastAddedProduct(product);
        setCrossSellSuggestions(recs);
        setIsCrossSellBannerVisible(true);
      }
    } catch {
      // Graceful fallback
    }
  };

  // Add multiple combo items together
  const handleBatchAddCombos = (comboProducts: Product[]) => {
    comboProducts.forEach((p) => {
      addToCart(p, 'Pcs');
    });
    showToast(
      `${comboProducts.length} টি কম্বো পণ্য কার্টে যোগ করা হয়েছে!`,
      'success'
    );
  };

  // Switch Unit for item already in cart
  const changeItemUnit = (productId: string, newUnit: 'Pcs' | 'Strip' | 'Box') => {
    setCart((prev) =>
      prev.map((item) => {
        if (item.product.id === productId) {
          const unitInfo = getPharmacyUnitInfo(item.product, newUnit);
          return {
            ...item,
            selectedUnit: newUnit,
            unitMultiplier: unitInfo.multiplier,
            unitPrice: unitInfo.unitPrice,
            total: item.quantity * unitInfo.unitPrice,
          };
        }
        return item;
      })
    );
  };

  const updateQuantity = (productId: string, delta: number, unit?: string) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.product.id === productId && (!unit || item.selectedUnit === unit)) {
            const newQty = item.quantity + delta;
            if (newQty <= 0) return null;
            const multiplier = item.unitMultiplier || 1;
            if (newQty * multiplier > item.product.stock) {
              showToast(`স্টকে সর্বোচ্চ ${item.product.stock} টি পিস রয়েছে`, 'warning');
              return item;
            }
            return {
              ...item,
              quantity: newQty,
              total: newQty * item.unitPrice,
            };
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const removeFromCart = (productId: string, unit?: string) => {
    setCart((prev) =>
      prev.filter((item) => !(item.product.id === productId && (!unit || item.selectedUnit === unit)))
    );
  };

  const clearCart = () => {
    setCart([]);
    setDiscountAmount(0);
    setPaidAmount(0);
    setDoctorRef('');
    setNotes('');
  };

  // Open substitute modal
  const handleOpenSubstitute = (e: React.MouseEvent, product: Product) => {
    e.stopPropagation();
    const subs = findMedicineSubstitutes(product, products);
    setActiveSubstituteProduct(product);
    setSubstitutesList(subs);
    setIsSubstituteModalOpen(true);
  };

  // Calculations
  const subtotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.total, 0);
  }, [cart]);

  const total = useMemo(() => {
    return Math.max(0, subtotal - discountAmount);
  }, [subtotal, discountAmount]);

  const due = useMemo(() => {
    return Math.max(0, total - paidAmount);
  }, [total, paidAmount]);

  const setFullPaid = () => {
    setPaidAmount(total);
  };

  // Quick add customer
  const handleCreateCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustName.trim() || !newCustMobile.trim()) {
      showToast('গ্রাহকের নাম ও মোবাইল নম্বর আবশ্যক', 'warning');
      return;
    }
    const newCust: Customer = {
      id: `cust_${Date.now()}`,
      name: newCustName.trim(),
      mobile: newCustMobile.trim(),
      address: newCustAddress.trim(),
      totalPurchase: 0,
      totalPaid: 0,
      totalDue: 0,
      ordersCount: 0,
      riskLevel: 'Low',
      deliverySuccessRate: 100,
      ordersDelivered: 0,
      ordersCancelled: 0,
      ordersReturned: 0,
      createdAt: new Date().toISOString().split('T')[0],
    };
    const updated = [newCust, ...customers];
    setCustomers(updated);
    DataStore.setCustomers(updated);
    setSelectedCustomer(newCust);
    setIsNewCustomerModalOpen(false);
    setNewCustName('');
    setNewCustMobile('');
    setNewCustAddress('');
    showToast('নতুন গ্রাহক সফলভাবে যুক্ত করা হয়েছে', 'success');
  };

  // Complete Sale
  const handleCompleteSale = async () => {
    if (cart.length === 0) {
      showToast('কার্টে কোনো পণ্য যোগ করা হয়নি', 'warning');
      return;
    }

    setIsProcessing(true);
    try {
      const splitDetails = isSplitPayment
        ? `স্প্লিট পেমেন্ট: ক্যাশ ৳${splitCashAmount} + ${splitDigitalMethod} ৳${Math.max(0, (paidAmount > 0 ? paidAmount : total) - splitCashAmount)}`
        : null;

      const combinedNotes = [
        doctorRef.trim() ? `প্রেসক্রিপশন/ডাক্তার: ${doctorRef.trim()}` : null,
        splitDetails,
        notes.trim() || null,
      ]
        .filter(Boolean)
        .join(' | ');

      const effectivePaymentMethod = isSplitPayment ? 'Other' : paymentMethod;

      const salePayload = {
        customer: selectedCustomer,
        items: cart,
        subtotal,
        discount: discountAmount,
        total,
        paidAmount: paidAmount > 0 ? paidAmount : total,
        dueAmount: paidAmount > 0 ? Math.max(0, total - paidAmount) : 0,
        paymentMethod: effectivePaymentMethod,
        notes: combinedNotes || undefined,
      };

      // Check if network is offline
      const currentlyOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;

      if (!currentlyOnline) {
        const queued = offlineSyncService.enqueueSale(salePayload);
        const offlineOrder: Order = {
          id: queued.id,
          orderNumber: `OFF-${Date.now().toString().slice(-6)}`,
          customerId: selectedCustomer.id,
          customerName: selectedCustomer.name,
          customerMobile: selectedCustomer.mobile,
          customerAddress: selectedCustomer.address,
          items: cart.map((it) => ({
            productId: it.product.id,
            productName: it.product.name,
            quantity: it.quantity,
            unitPrice: it.unitPrice,
            total: it.total,
            selectedUnit: it.selectedUnit || (it.product.unit ? it.product.unit : 'Pcs'),
            genericName: it.product.genericName,
            rackLocation: it.product.rackLocation,
          })),
          subtotal,
          discount: discountAmount,
          deliveryCharge: 0,
          totalAmount: total,
          paidAmount: paidAmount > 0 ? paidAmount : total,
          dueAmount: paidAmount > 0 ? Math.max(0, total - paidAmount) : 0,
          paymentMethod: effectivePaymentMethod,
          paymentStatus:
            (paidAmount > 0 ? Math.max(0, total - paidAmount) : 0) <= 0 ? 'Paid' : 'Partially Paid',
          orderStatus: 'Delivered',
          channel: 'POS',
          notes: combinedNotes ? `${combinedNotes} [অফলাইনে সংরক্ষিত]` : '[অফলাইনে সংরক্ষিত মেমো]',
          createdAt: new Date().toISOString(),
        };

        // 1. Immediately deduct local product stocks in state & DataStore
        const currentProducts = DataStore.getProducts();
        const updatedProducts = currentProducts.map((p) => {
          const cartItem = cart.find((item) => item.product.id === p.id);
          if (cartItem) {
            const multiplier = cartItem.unitMultiplier || 1;
            const deducted = cartItem.quantity * multiplier;
            return { ...p, stock: Math.max(0, p.stock - deducted) };
          }
          return p;
        });
        setProducts(updatedProducts);
        DataStore.setProducts(updatedProducts);

        // 2. Persist local order into DataStore
        const currentOrders = DataStore.getOrders();
        DataStore.setOrders([offlineOrder, ...currentOrders]);

        // 3. Update customer stats if selected
        if (selectedCustomer.id) {
          const currentCustomers = DataStore.getCustomers();
          const updatedCusts = currentCustomers.map((c) => {
            if (c.id === selectedCustomer.id) {
              return {
                ...c,
                totalPurchase: (c.totalPurchase || 0) + total,
                totalPaid: (c.totalPaid || 0) + (paidAmount > 0 ? paidAmount : total),
                totalDue: (c.totalDue || 0) + (paidAmount > 0 ? Math.max(0, total - paidAmount) : 0),
                ordersCount: (c.ordersCount || 0) + 1,
                lastOrderDate: new Date().toISOString().split('T')[0],
              };
            }
            return c;
          });
          setCustomers(updatedCusts);
          DataStore.setCustomers(updatedCusts);
        }

        setCompletedOrder(offlineOrder);
        setIsInvoiceModalOpen(true);
        clearCart();
        setPendingOfflineCount(offlineSyncService.getPendingCount());
        showToast(
          'অফলাইন মোড সক্রিয় — বিক্রয় সফলভাবে লোকাল মেমোরিতে সংরক্ষিত হয়েছে এবং মেমো তৈরি হয়েছে! ইন্টারনেট পাওয়া মাত্রই স্বয়ংক্রিয় ক্লাউড সিঙ্ক হবে।',
          'info'
        );
        return;
      }

      const staffMember = staffList.find((s) => s.id === selectedStaffId);
      const pointsEarned = Math.floor(total / 100);

      const order = await salesService.completePosSale({
        ...salePayload,
        servedByStaffName: staffMember?.name || 'প্রধান ক্যাশিয়ার',
        servedByStaffId: selectedStaffId,
        pricingMode,
        loyaltyPointsUsed: redeemedLoyaltyPoints,
        loyaltyPointsEarned: pointsEarned,
      } as any);

      // Credit loyalty points to customer
      if (selectedCustomer.id) {
        const currentPts = selectedCustomer.loyaltyPoints || 0;
        const updatedPts = Math.max(0, currentPts - redeemedLoyaltyPoints) + pointsEarned;
        const updatedCusts = customers.map((c) =>
          c.id === selectedCustomer.id ? { ...c, loyaltyPoints: updatedPts } : c
        );
        setCustomers(updatedCusts);
        DataStore.setCustomers(updatedCusts);
        setSelectedCustomer((prev) => ({ ...prev, loyaltyPoints: updatedPts }));
      }
      setRedeemedLoyaltyPoints(0);

      setCompletedOrder(order);
      setIsInvoiceModalOpen(true);
      clearCart();

      // Trigger background sync for any previous pending items
      if (offlineSyncService.getPendingCount() > 0) {
        offlineSyncService.syncAllPending().then(() => {
          setPendingOfflineCount(offlineSyncService.getPendingCount());
        });
      }

      // Trigger automatic SMS receipt if enabled in SMS settings
      try {
        smsService.triggerOrderSms(order, 'POS_SALE');
      } catch (err) {
        console.error('POS SMS Trigger error:', err);
      }

      showToast('বিক্রয় সফল হয়েছে এবং ক্যাশ মেমো প্রস্তুত!', 'success');
    } catch {
      showToast('বিক্রয় সম্পন্ন করতে সমস্যা হয়েছে', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* POS Top Control Toolbar: Offline/Online Sync, Camera Barcode, Day-End Closing */}
      <div className="bg-white px-4 py-3 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        {/* Left: Quick Shop & Online/Offline Status Indicator */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-900">{shop.name}</span>
            <span className="text-slate-300">|</span>
          </div>

          {/* Online/Offline Badge */}
          <div
            className={`px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 ${
              isOnline
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-rose-50 text-rose-700 border border-rose-200 animate-pulse'
            }`}
          >
            {isOnline ? (
              <>
                <Wifi className="w-3.5 h-3.5 text-emerald-600" />
                <span>অনলাইন (সিঙ্কড)</span>
              </>
            ) : (
              <>
                <WifiOff className="w-3.5 h-3.5 text-rose-600" />
                <span>অফলাইন মোড (লোকাল সেভ)</span>
              </>
            )}
          </div>

          {/* Pending Offline Sales Sync CTA */}
          {pendingOfflineCount > 0 && (
            <button
              type="button"
              onClick={handleSyncOfflineSales}
              disabled={isSyncingOffline || !isOnline}
              className="px-2.5 py-1 rounded-full bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-60"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-amber-600 ${isSyncingOffline ? 'animate-spin' : ''}`} />
              <span>পেন্ডিং অফলাইন বিক্রয়: {pendingOfflineCount} টি</span>
              <span className="underline ml-1">সিঙ্ক করুন</span>
            </button>
          )}
          {/* Wholesale vs Retail Switcher */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200">
            <button
              type="button"
              onClick={() => setPricingMode('Retail')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                pricingMode === 'Retail'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              🛍️ খুচরা দর
            </button>
            <button
              type="button"
              onClick={() => setPricingMode('Wholesale')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                pricingMode === 'Wholesale'
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              📦 পাইকারি (Wholesale)
            </button>
          </div>
        </div>

        {/* Right: Camera Barcode, Tag Printer, Supplier Due, Staff & Day-End Cash Closing Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            type="button"
            onClick={() => setIsSupplierDueModalOpen(true)}
            variant="outline"
            size="sm"
            leftIcon={<Building2 className="w-4 h-4 text-rose-600" />}
            className="bg-rose-50 border-rose-200 text-rose-900 hover:bg-rose-100"
          >
            সাপ্লায়ার দেনা
          </Button>

          <Button
            type="button"
            onClick={() => setIsStaffPerformanceModalOpen(true)}
            variant="outline"
            size="sm"
            leftIcon={<Users className="w-4 h-4 text-indigo-600" />}
            className="bg-indigo-50 border-indigo-200 text-indigo-900 hover:bg-indigo-100"
          >
            স্টাফ সেলস
          </Button>

          <Button
            type="button"
            onClick={() => setIsBarcodeModalOpen(true)}
            variant="outline"
            size="sm"
            leftIcon={<Barcode className="w-4 h-4 text-purple-600" />}
            className="bg-purple-50 border-purple-200 text-purple-800 hover:bg-purple-100"
          >
            বারকোড ট্যাগ
          </Button>

          <Button
            type="button"
            onClick={() => setIsCameraScannerOpen(true)}
            variant="outline"
            size="sm"
            leftIcon={<Camera className="w-4 h-4 text-emerald-600" />}
            className="bg-emerald-50 border-emerald-300 text-emerald-800 hover:bg-emerald-100"
          >
            ক্যামেরা স্ক্যানার
          </Button>

          <Button
            type="button"
            onClick={() => setIsDayEndClosingOpen(true)}
            variant="outline"
            size="sm"
            leftIcon={<Coins className="w-4 h-4 text-amber-600" />}
            className="bg-amber-50 border-amber-300 text-amber-900 hover:bg-amber-100 font-bold"
          >
            ক্যাশ ড্রয়ার ক্লোজিং
          </Button>

          {/* Smart Cost-to-Profit Margin Toolbar Button */}
          <Button
            type="button"
            onClick={() => setIsCostProfitModalOpen(true)}
            variant="outline"
            size="sm"
            leftIcon={<TrendingUp className="w-4 h-4 text-emerald-600" />}
            className={`font-bold shadow-2xs ${
              basketMarginSummary.netProfit < 0
                ? 'bg-rose-50 border-rose-300 text-rose-900 hover:bg-rose-100'
                : basketMarginSummary.overallMarginPercent < costProfitThreshold
                ? 'bg-amber-50 border-amber-300 text-amber-900 hover:bg-amber-100'
                : 'bg-emerald-50 border-emerald-300 text-emerald-900 hover:bg-emerald-100'
            }`}
            title="রিয়েল-টাইম কস্ট ও প্রফিট মার্জিন অ্যানালাইজার"
          >
            <span>📊 মার্জিন: {basketMarginSummary.overallMarginPercent}%</span>
            {basketMarginSummary.belowThresholdCount > 0 && (
              <span className="px-1.5 py-0.2 bg-amber-500 text-white rounded-full text-[9px] font-mono ml-1">
                {basketMarginSummary.belowThresholdCount}
              </span>
            )}
          </Button>

          {/* Smart Cross-Sell Recommendations Toggle */}
          <Button
            type="button"
            onClick={() => {
              if (cart.length > 0) {
                const target = lastAddedProduct || cart[0].product;
                const recs = crossSellService.getRecommendationsForProduct(
                  target,
                  products,
                  cart.map((i) => i.product.id),
                  5
                );
                setLastAddedProduct(target);
                setCrossSellSuggestions(recs);
                setIsCrossSellBannerVisible(true);
                showToast(`"${target.name}" এর জন্য প্রস্তাবিত ক্রস-সেল কম্বো দেখানো হচ্ছে`, 'info');
              } else if (products.length > 0) {
                const sampleProd = products[0];
                const recs = crossSellService.getRecommendationsForProduct(sampleProd, products, [], 5);
                setLastAddedProduct(sampleProd);
                setCrossSellSuggestions(recs);
                setIsCrossSellBannerVisible(true);
                showToast('জনপ্রিয় কম্বো ও ক্রস-সেল অনুষঙ্গ সমূহ', 'info');
              }
            }}
            variant="outline"
            size="sm"
            leftIcon={<Sparkles className="w-4 h-4 text-amber-500 animate-spin" />}
            className="bg-amber-50 border-amber-300 text-amber-900 hover:bg-amber-100 font-bold shadow-2xs"
            title="কার্ট পণ্যের সাথে প্রায়শই কেনা অনুষঙ্গ ও কম্বো সাজেশন"
          >
            💡 ক্রস-সেল কম্বো
          </Button>

          {/* Biometric Quick POS Lock / Shift Switch Button */}
          <Button
            type="button"
            onClick={() => {
              setIsPosLocked(true);
              showToast('POS স্ক্রিন লক করা হয়েছে। আনলক করতে ফিঙ্গারপ্রিন্ট বা ফেস আইডি দিন।', 'info');
            }}
            variant="outline"
            size="sm"
            leftIcon={<Fingerprint className="w-4 h-4 text-emerald-600 animate-pulse" />}
            className="bg-emerald-50 border-emerald-300 text-emerald-900 hover:bg-emerald-100 font-bold shadow-xs"
          >
            <Lock className="w-3.5 h-3.5 text-slate-700 mr-1" />
            POS লক (বায়োমেট্রিক)
          </Button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-5 items-start">
        {/* LEFT SECTION: Search, Category Tabs, Product Catalog */}
        <div className="flex-1 w-full space-y-4">
          {/* Frequently Bought Together / Cross-Sell Suggestion Banner */}
          {isCrossSellBannerVisible && lastAddedProduct && crossSellSuggestions.length > 0 && (
            <CrossSellSuggestionBanner
              triggerProduct={lastAddedProduct}
              suggestions={crossSellSuggestions}
              onAddToCart={(p) => addToCart(p, 'Pcs')}
              onAddAllCombos={handleBatchAddCombos}
              onDismiss={() => setIsCrossSellBannerVisible(false)}
            />
          )}

          {/* Search & Barcode Bar with Near-Expiry Alert Button */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-3 items-center">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ওষুধের নাম, জেনেরিক নাম (যেমন Paracetamol), র‌্যাক বা বারকোড খুঁজুন..."
                className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Barcode Search Box with Direct Camera Button */}
            <div className="flex items-center gap-1.5 w-full sm:w-auto">
              <form onSubmit={handleBarcodeSubmit} className="relative w-full sm:w-52">
                <Barcode className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={barcodeQuery}
                  onChange={(e) => setBarcodeQuery(e.target.value)}
                  placeholder="বারকোড স্ক্যান/টাইপ"
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                />
              </form>

              <button
                type="button"
                onClick={() => setIsCameraScannerOpen(true)}
                className="p-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-300 transition-colors cursor-pointer shrink-0"
                title="ক্যামেরা বারকোড স্ক্যানার"
              >
                <Camera className="w-4 h-4" />
              </button>
            </div>

            {/* Pharmacy Near-Expiry Quick Access */}
            {nearExpiryCount > 0 && (
              <button
                type="button"
                onClick={() => setIsNearExpiryModalOpen(true)}
                className="px-3 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 text-xs font-bold flex items-center gap-1.5 shrink-0 transition-colors cursor-pointer"
              >
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
                <span>মেয়াদোত্তীর্ণ অ্যালার্ট</span>
                <span className="px-1.5 py-0.5 rounded-full bg-amber-600 text-white text-[10px] font-mono">
                  {nearExpiryCount}
                </span>
              </button>
            )}
          </div>

        {/* Department/Category Filtering, Sub-Categories, Brands & View Switcher */}
        <PosCategoryDepartmentFilter
          categories={categories}
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
          selectedSubCategory={selectedSubCategory}
          onSelectSubCategory={setSelectedSubCategory}
          selectedBrand={selectedBrand}
          onSelectBrand={setSelectedBrand}
          stockFilter={stockFilter}
          onSelectStockFilter={setStockFilter}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          sortOption={sortOption}
          onSortOptionChange={setSortOption}
          products={products}
        />

        {/* Dynamic Product View based on selected view mode */}
        {viewMode === 'grouped' ? (
          <PosGroupedProductList
            productsByCategory={productsByCategory}
            onAddToCart={addToCart}
            onOpenSubstitute={handleOpenSubstitute}
            onQuickInwardStock={handleOpenPosQuickStock}
          />
        ) : viewMode === 'list' ? (
          <PosCompactProductTable
            products={visibleProducts}
            onAddToCart={addToCart}
            onOpenSubstitute={handleOpenSubstitute}
          />
        ) : (
          <div>
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
          {visibleProducts.map((p) => {
            const isOutOfStock = p.stock <= 0;
            const finalPrice = p.sellingPrice - p.discount;
            const exp = getExpiryStatus(p.expiryDate);
            const hasPharmacyDetails = Boolean(p.genericName || p.rackLocation || p.piecesPerStrip);

            return (
              <div
                key={p.id}
                onClick={() => !isOutOfStock && addToCart(p, 'Pcs')}
                className={`group bg-white rounded-2xl border p-3 flex flex-col justify-between transition-all cursor-pointer select-none ${
                  isOutOfStock
                    ? 'border-slate-200 bg-slate-50/50'
                    : 'border-slate-200 hover:border-emerald-500 hover:shadow-md'
                }`}
              >
                <div>
                  <div className="relative aspect-4/3 rounded-xl overflow-hidden bg-slate-100 mb-2.5">
                    {p.image ? (
                      <img
                        src={p.image}
                        alt={p.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-300">
                        {p.category === 'Pharmacy & Medicine' ? (
                          <Pill className="w-8 h-8 text-emerald-300" />
                        ) : (
                          <ShoppingBag className="w-8 h-8" />
                        )}
                      </div>
                    )}

                    {/* Stock badge */}
                    <span
                      className={`absolute bottom-1.5 left-1.5 text-[10px] font-mono px-1.5 py-0.5 rounded-md font-bold ${
                        p.stock === 0
                          ? 'bg-rose-600 text-white'
                          : p.stock <= p.minStock
                          ? 'bg-amber-500 text-white'
                          : 'bg-slate-900/80 text-white backdrop-blur-xs'
                      }`}
                    >
                      স্টক: {p.stock}
                    </span>

                    {/* Rx badge */}
                    {p.requiresPrescription && (
                      <span className="absolute top-1.5 right-1.5 text-[9px] bg-rose-600 text-white font-bold px-1.5 py-0.5 rounded shadow-xs">
                        Rx প্রেসক্রিপশন
                      </span>
                    )}
                  </div>

                  {/* Product Title */}
                  <h4 className="text-xs font-bold text-slate-800 line-clamp-1 leading-tight">
                    {p.name}
                  </h4>

                  {/* Generic Name */}
                  {p.genericName && (
                    <p className="text-[11px] text-emerald-700 font-semibold truncate mt-0.5" title={p.genericName}>
                      {p.genericName}
                    </p>
                  )}

                  {/* Rack Location & SKU */}
                  <div className="flex items-center justify-between gap-1 text-[10px] text-slate-400 font-mono mt-1">
                    <span className="truncate">{p.sku}</span>
                    {p.rackLocation && (
                      <span className="flex items-center gap-0.5 text-blue-700 font-bold bg-blue-50 px-1 py-0.5 rounded shrink-0">
                        <MapPin className="w-2.5 h-2.5" />
                        {p.rackLocation}
                      </span>
                    )}
                  </div>

                  {/* Expiry Alert Badge */}
                  {exp.isNearExpiry && (
                    <div className="mt-1.5">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-md border block text-center truncate ${exp.badgeClass}`}>
                        {exp.formattedText}
                      </span>
                    </div>
                  )}
                </div>

                <div className="mt-3 pt-2 border-t border-slate-100">
                  {/* Substitute Finder Button */}
                  {p.genericName && (
                    <button
                      type="button"
                      onClick={(e) => handleOpenSubstitute(e, p)}
                      className="w-full mb-2 py-1 px-2 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-[10px] font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                    >
                      <Layers className="w-3 h-3 text-emerald-600" />
                      <span>বিকল্প ওষুধ (Substitute)</span>
                    </button>
                  )}

                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-sm font-black text-emerald-700 font-mono">
                        {formatCurrency(finalPrice)}
                      </span>
                      {p.discount > 0 && (
                        <span className="text-[10px] text-slate-400 line-through block font-mono">
                          {formatCurrency(p.sellingPrice)}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      {/* Unit Quick Add (if medicine has strips) */}
                      {p.piecesPerStrip && !isOutOfStock && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            addToCart(p, 'Strip');
                          }}
                          className="px-1.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold cursor-pointer transition-colors"
                          title="১ পাতা কার্টে যোগ করুন"
                        >
                          +১ পাতা
                        </button>
                      )}

                      {isOutOfStock ? (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenPosQuickStock(p);
                          }}
                          className="px-2 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-[10px] font-bold border border-emerald-200 transition-colors cursor-pointer flex items-center gap-1 shrink-0 shadow-2xs"
                          title="দোকানে মাল আসলে স্টক ইনওয়ার্ড করে বিক্রি চালু করুন"
                        >
                          <PackagePlus className="w-3 h-3 text-emerald-600" />
                          <span>+স্টক</span>
                        </button>
                      ) : (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            addToCart(p, 'Pcs');
                          }}
                          className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 group-hover:bg-emerald-600 group-hover:text-white flex items-center justify-center transition-colors shrink-0 cursor-pointer"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {filteredProducts.length > visibleProducts.length && (
          <div className="mt-4 text-center">
            <button
              onClick={() => setDisplayLimit((prev) => prev + 36)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
            >
              আরও পণ্য দেখুন (+{Math.min(36, filteredProducts.length - visibleProducts.length)} টি) — মোট {filteredProducts.length} টি
            </button>
          </div>
        )}
          </div>
        )}
      </div>

      {/* RIGHT SECTION: Cart, Customer Selection, Units, Complete Sale */}
      <div className="w-full lg:w-96 bg-white rounded-3xl border border-slate-200 shadow-md p-5 flex flex-col shrink-0 sticky top-20">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <span>বিক্রয় কার্ট (Cart)</span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-mono font-bold">
                {cart.length}
              </span>
            </h3>
          </div>
          {cart.length > 0 && (
            <button
              onClick={clearCart}
              className="text-xs text-rose-600 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>খালি করুন</span>
            </button>
          )}
        </div>

        {/* Customer Selector */}
        <div className="py-3 border-b border-slate-100">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-semibold text-slate-700">ক্রেতা নির্বাচন</span>
            <button
              onClick={() => setIsNewCustomerModalOpen(true)}
              className="text-xs text-emerald-600 hover:text-emerald-700 font-semibold flex items-center gap-1 cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>নতুন কাস্টমার</span>
            </button>
          </div>

          <select
            value={selectedCustomer.id}
            onChange={(e) => {
              const c = customers.find((item) => item.id === e.target.value);
              if (c) setSelectedCustomer(c);
            }}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50"
          >
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.mobile}) {c.totalDue > 0 ? `[বকেয়া: ৳${c.totalDue}]` : ''}
              </option>
            ))}
          </select>

          {/* Customer Loyalty Points Reward & Redemption */}
          {selectedCustomer && (
            <div className="mt-2 p-2 bg-amber-50/90 border border-amber-200 rounded-xl flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 text-amber-950 font-semibold">
                <Gift className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  লয়ালটি পয়েন্ট: <strong className="font-mono text-amber-900 font-bold">{selectedCustomer.loyaltyPoints || 0} pts</strong>
                </span>
              </div>
              {(selectedCustomer.loyaltyPoints || 0) > 0 && redeemedLoyaltyPoints === 0 ? (
                <button
                  type="button"
                  onClick={() => {
                    const discountVal = selectedCustomer.loyaltyPoints || 0;
                    setDiscountAmount((prev) => prev + discountVal);
                    setRedeemedLoyaltyPoints(discountVal);
                    showToast(`${discountVal} লয়ালটি পয়েন্ট ভাঙিয়ে ৳${discountVal} ছাড় দেওয়া হয়েছে!`, 'success');
                  }}
                  className="px-2 py-0.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-[11px] font-bold cursor-pointer transition-colors shadow-2xs"
                >
                  পয়েন্ট ভাঙান (৳{selectedCustomer.loyaltyPoints} ছাড়)
                </button>
              ) : redeemedLoyaltyPoints > 0 ? (
                <span className="text-[11px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded">
                  ✓ ৳{redeemedLoyaltyPoints} ছাড় প্রযোজ্য
                </span>
              ) : null}
            </div>
          )}

          {/* Credit Limit & Risk Alert */}
          {selectedCustomer && (selectedCustomer.isCreditLocked || (selectedCustomer.creditLimit && selectedCustomer.creditLimit > 0 && selectedCustomer.totalDue >= selectedCustomer.creditLimit)) && (
            <div className="mt-2 p-2 bg-rose-50 border border-rose-200 rounded-xl text-[11px] text-rose-800 flex items-start gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block">
                  {selectedCustomer.isCreditLocked ? 'বাকি বিক্রয় নিষিদ্ধ (Locked)' : 'বকেয়া সীমা অতিক্রান্ত!'}
                </span>
                <span>
                  পূর্বের বকেয়া: ৳{selectedCustomer.totalDue.toLocaleString('bn-BD')} | সীমা: ৳{(selectedCustomer.creditLimit || 0).toLocaleString('bn-BD')}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Staff Salesperson Selector */}
        <div className="py-2 border-b border-slate-100 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-slate-700 text-xs font-semibold">
            <Users className="w-3.5 h-3.5 text-indigo-600" />
            <span>বিক্রয়কর্মী (Staff):</span>
          </div>
          <select
            value={selectedStaffId}
            onChange={(e) => setSelectedStaffId(e.target.value)}
            className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-emerald-500"
          >
            {staffList.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.role})
              </option>
            ))}
          </select>
        </div>

        {/* Optional Doctor / Rx Reference Input */}
        <div className="py-2.5 border-b border-slate-100">
          <div className="flex items-center gap-1 text-slate-600 text-xs font-semibold mb-1">
            <Stethoscope className="w-3.5 h-3.5 text-blue-600" />
            <span>ডাক্তার / প্রেসক্রিপশন নং (ঐচ্ছিক)</span>
          </div>
          <input
            type="text"
            value={doctorRef}
            onChange={(e) => setDoctorRef(e.target.value)}
            placeholder="যেমন: Dr. Rafiq, Rx #412"
            className="w-full px-3 py-1.5 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>

        {/* Cart Item List with Pharmacy Unit Conversion */}
        <div className="flex-1 overflow-y-auto max-h-56 divide-y divide-slate-100 py-1">
          {cart.length === 0 ? (
            <div className="py-10 text-center text-slate-400 text-xs">
              <ShoppingBag className="w-8 h-8 mx-auto text-slate-300 mb-2" />
              <p>কার্টে কোনো আইটেম নেই</p>
              <p className="text-[11px] text-slate-400 mt-0.5">বামপাশের ওষুধ বা পণ্য তালিকায় ক্লিক করে যোগ করুন</p>
            </div>
          ) : (
            cart.map((item) => {
              const hasMultiUnits = Boolean(item.product.piecesPerStrip);
              const currentUnit = item.selectedUnit || 'Pcs';
              const itemMargin = basketMarginSummary.items.find(
                (d) => d.productId === item.product.id && d.selectedUnit === currentUnit
              );

              return (
                <div
                  key={`${item.product.id}-${currentUnit}`}
                  className={`py-2.5 space-y-1.5 transition-colors ${
                    itemMargin?.status === 'LOSS'
                      ? 'bg-rose-50/60 dark:bg-rose-950/20 -mx-2 px-2 rounded-xl border-l-3 border-rose-500'
                      : itemMargin?.isBelowThreshold
                      ? 'bg-amber-50/50 dark:bg-amber-950/10 -mx-2 px-2 rounded-xl border-l-3 border-amber-400'
                      : ''
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex-1 truncate">
                      <div className="flex items-center gap-1.5">
                        <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                          {item.product.name}
                        </p>
                        {itemMargin && (
                          <span
                            className={`text-[9px] px-1.5 py-0.2 rounded font-mono font-bold shrink-0 ${
                              itemMargin.status === 'LOSS'
                                ? 'bg-rose-600 text-white'
                                : itemMargin.isBelowThreshold
                                ? 'bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-700'
                                : 'bg-emerald-50 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300'
                            }`}
                            title={`ক্রয়: ৳${itemMargin.unitCost} | মার্জিন: ${itemMargin.marginPercent}%`}
                          >
                            {itemMargin.status === 'LOSS'
                              ? 'লোকসান'
                              : `${itemMargin.marginPercent > 0 ? '+' : ''}${itemMargin.marginPercent}% লাভ`}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                        <span>
                          {formatCurrency(item.unitPrice)} × {item.quantity}
                        </span>
                        {item.product.rackLocation && (
                          <span className="text-blue-700 bg-blue-50 dark:bg-blue-950/50 dark:text-blue-300 px-1 rounded font-bold">
                            {item.product.rackLocation}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden">
                        <button
                          onClick={() => updateQuantity(item.product.id, -1, item.selectedUnit)}
                          className="px-1.5 py-1 text-slate-600 hover:bg-slate-100 cursor-pointer"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="px-2 text-xs font-mono font-bold">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.product.id, 1, item.selectedUnit)}
                          className="px-1.5 py-1 text-slate-600 hover:bg-slate-100 cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <span className="w-16 text-right font-mono font-bold text-xs text-slate-900 dark:text-slate-100">
                        {formatCurrency(item.total)}
                      </span>

                      <button
                        onClick={() => removeFromCart(item.product.id, item.selectedUnit)}
                        className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Unit conversion buttons: [পিস] [পাতা] [বক্স] */}
                  {hasMultiUnits && (
                    <div className="flex items-center gap-1 pl-1">
                      <span className="text-[10px] text-slate-400">বিক্রয় ইউনিট:</span>
                      {(['Pcs', 'Strip', 'Box'] as const).map((u) => (
                        <button
                          key={u}
                          type="button"
                          onClick={() => changeItemUnit(item.product.id, u)}
                          className={`text-[10px] px-2 py-0.5 rounded font-semibold cursor-pointer transition-all ${
                            currentUnit === u
                              ? 'bg-emerald-600 text-white shadow-xs'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          {u === 'Pcs' ? 'পিস' : u === 'Strip' ? 'পাতা' : 'বক্স'}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* In-Cart Smart Cross-Sell Recommendations */}
        {cart.length > 0 && cartCrossSells.length > 0 && (
          <CrossSellCartSection
            suggestions={cartCrossSells}
            onAddToCart={(p) => addToCart(p, 'Pcs')}
            className="my-2"
          />
        )}

        {/* Calculation Summary */}
        <div className="pt-3 border-t border-slate-100 space-y-2 text-xs">
          {/* Smart Cost-to-Profit Margin Indicator */}
          {cart.length > 0 && (
            <CostProfitWidget
              summary={basketMarginSummary}
              onOpenAnalysis={() => setIsCostProfitModalOpen(true)}
              className="mb-2.5"
            />
          )}

          <div className="flex justify-between text-slate-600">
            <span>সাবটোটাল</span>
            <span className="font-mono font-semibold">{formatCurrency(subtotal)}</span>
          </div>

          {/* Discount input */}
          <div className="flex items-center justify-between gap-2">
            <span className="text-slate-600">ডিসকাউন্ট (৳)</span>
            <input
              type="number"
              min={0}
              value={discountAmount === 0 ? '' : discountAmount}
              onChange={(e) => setDiscountAmount(Math.max(0, Number(e.target.value) || 0))}
              placeholder="0"
              className="w-24 px-2 py-1 text-right font-mono rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          <div className="flex justify-between text-base font-bold text-slate-900 pt-1 border-t border-slate-100">
            <span>সর্বমোট</span>
            <span className="font-mono text-emerald-700">{formatCurrency(total)}</span>
          </div>

          {/* Paid Amount Input & Quick Currency Taka Buttons */}
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-slate-700">পরিশোধ (Paid)</span>
                <button
                  type="button"
                  onClick={setFullPaid}
                  className="text-[10px] bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded font-medium hover:bg-emerald-100 cursor-pointer"
                >
                  পুরো পরিশোধ
                </button>
              </div>
              <input
                type="number"
                min={0}
                value={paidAmount === 0 ? '' : paidAmount}
                onChange={(e) => setPaidAmount(Math.max(0, Number(e.target.value) || 0))}
                placeholder="0"
                className="w-24 px-2 py-1 text-right font-mono rounded-lg border border-slate-200 text-xs font-bold focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            {/* Quick Note Buttons */}
            <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5">
              {[100, 500, 1000, 2000].map((note) => (
                <button
                  key={note}
                  type="button"
                  onClick={() => setPaidAmount(note)}
                  className="px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-200 text-[11px] font-mono font-bold text-slate-700 cursor-pointer shrink-0"
                >
                  ৳{note}
                </button>
              ))}
              <button
                type="button"
                onClick={setFullPaid}
                className="px-2 py-0.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-[11px] font-bold text-emerald-700 cursor-pointer shrink-0"
              >
                মোট ৳{total}
              </button>
            </div>
          </div>

          {/* Change Return Calculator (If customer pays extra) */}
          {paidAmount > total && (
            <div className="flex items-center justify-between bg-emerald-100/90 text-emerald-950 border border-emerald-300 p-2 rounded-xl text-xs font-black animate-in fade-in">
              <span className="flex items-center gap-1">
                <Coins className="w-4 h-4 text-emerald-700" />
                <span>কাস্টমারকে ফেরত দিন:</span>
              </span>
              <span className="font-mono text-sm font-black text-emerald-900">
                ৳{(paidAmount - total).toLocaleString('bn-BD')}
              </span>
            </div>
          )}

          {/* Auto Due display */}
          <div
            className={`flex justify-between font-semibold p-2 rounded-xl text-xs ${
              due > 0 ? 'bg-amber-50 text-amber-800' : 'bg-emerald-50 text-emerald-800'
            }`}
          >
            <span>{due > 0 ? 'বকেয়া / বাকি' : 'সম্পূর্ণ পেইড'}</span>
            <span className="font-mono">{formatCurrency(due)}</span>
          </div>

          {/* Payment Method Selector & Split Payment */}
          <div className="pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[11px] font-semibold text-slate-700">
                পেমেন্ট মাধ্যম
              </label>
              <button
                type="button"
                onClick={() => {
                  setIsSplitPayment(!isSplitPayment);
                  if (!isSplitPayment) {
                    setSplitCashAmount(Math.round(total / 2));
                  }
                }}
                className={`text-[10px] font-bold px-2 py-0.5 rounded-lg cursor-pointer transition-colors ${
                  isSplitPayment
                    ? 'bg-purple-600 text-white shadow-2xs'
                    : 'bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100'
                }`}
              >
                {isSplitPayment ? '✓ স্প্লিট পেমেন্ট সক্রিয়' : '+ স্প্লিট পেমেন্ট'}
              </button>
            </div>

            {!isSplitPayment ? (
              <div className="grid grid-cols-3 gap-1.5">
                {(['Cash', 'bKash', 'Nagad', 'Rocket', 'Bank', 'Other'] as PaymentMethod[]).map(
                  (method) => (
                    <button
                      key={method}
                      type="button"
                      onClick={() => setPaymentMethod(method)}
                      className={`py-1.5 px-2 rounded-xl text-[11px] font-semibold transition-all cursor-pointer ${
                        paymentMethod === method
                          ? 'bg-slate-900 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {method === 'Cash'
                        ? 'নগদ ক্যাশ'
                        : method === 'bKash'
                        ? 'বিকাশ'
                        : method === 'Nagad'
                        ? 'নগদ পে'
                        : method}
                    </button>
                  )
                )}
              </div>
            ) : (
              <div className="p-2.5 bg-purple-50/70 border border-purple-200 rounded-xl space-y-2 text-xs">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-purple-900">নগদ ক্যাশ (Cash):</span>
                  <input
                    type="number"
                    min={0}
                    max={total}
                    value={splitCashAmount === 0 ? '' : splitCashAmount}
                    onChange={(e) => setSplitCashAmount(Math.min(total, Math.max(0, Number(e.target.value) || 0)))}
                    placeholder="0"
                    className="w-24 px-2 py-1 bg-white border border-purple-300 rounded-lg text-right font-mono font-bold text-xs"
                  />
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-purple-900">ডিজিটাল মাধ্যম:</span>
                  <select
                    value={splitDigitalMethod}
                    onChange={(e) => setSplitDigitalMethod(e.target.value as any)}
                    className="px-2 py-1 bg-white border border-purple-300 rounded-lg text-xs font-semibold"
                  >
                    <option value="bKash">bKash (বিকাশ)</option>
                    <option value="Nagad">Nagad (নগদ)</option>
                    <option value="Bank">Bank / Card</option>
                  </select>
                </div>
                <div className="flex items-center justify-between text-[11px] font-bold text-purple-900 pt-1 border-t border-purple-200">
                  <span>ডিজিটালে নেওয়া হবে:</span>
                  <span className="font-mono text-sm text-purple-800">
                    ৳{Math.max(0, (paidAmount > 0 ? paidAmount : total) - splitCashAmount).toLocaleString('bn-BD')}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Complete Sale Action */}
        <div className="pt-4">
          <Button
            onClick={handleCompleteSale}
            variant="primary"
            size="lg"
            disabled={cart.length === 0}
            isLoading={isProcessing}
            className="w-full shadow-md"
            leftIcon={<CheckCircle2 className="w-5 h-5" />}
          >
            বিক্রয় সম্পন্ন ও মেমো তৈরি
          </Button>
        </div>
      </div>

      {/* New Customer Modal */}
      <Modal
        isOpen={isNewCustomerModalOpen}
        onClose={() => setIsNewCustomerModalOpen(false)}
        title="নতুন গ্রাহক যুক্ত করুন"
      >
        <form onSubmit={handleCreateCustomer} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              গ্রাহকের নাম <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={newCustName}
              onChange={(e) => setNewCustName(e.target.value)}
              placeholder="যেমন: মো: আরিফুল ইসলাম"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              মোবাইল নম্বর <span className="text-rose-500">*</span>
            </label>
            <input
              type="tel"
              required
              value={newCustMobile}
              onChange={(e) => setNewCustMobile(e.target.value)}
              placeholder="01XXXXXXXXX"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">ঠিকানা (ঐচ্ছিক)</label>
            <textarea
              value={newCustAddress}
              onChange={(e) => setNewCustAddress(e.target.value)}
              rows={2}
              placeholder="গ্রাহকের পূর্ণ ঠিকানা লিখুন"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsNewCustomerModalOpen(false)}
            >
              বাতিল
            </Button>
            <Button type="submit" variant="primary" size="sm">
              সংরক্ষণ করুন
            </Button>
          </div>
        </form>
      </Modal>

      {/* Pharmacy Substitute Finder Modal */}
      <MedicineSubstituteModal
        isOpen={isSubstituteModalOpen}
        onClose={() => setIsSubstituteModalOpen(false)}
        product={activeSubstituteProduct}
        substitutes={substitutesList}
        onSelectSubstitute={(sub) => {
          addToCart(sub, 'Pcs');
          showToast(`${sub.name} কার্টে যোগ করা হয়েছে`, 'success');
        }}
      />

      {/* Pharmacy Near Expiry Report Modal */}
      <NearExpiryReportModal
        isOpen={isNearExpiryModalOpen}
        onClose={() => setIsNearExpiryModalOpen(false)}
        products={products}
      />

      {/* POS Invoice Print / Share Modal */}
      {completedOrder && (
        <InvoiceModal
          isOpen={isInvoiceModalOpen}
          onClose={() => setIsInvoiceModalOpen(false)}
          order={completedOrder}
          shop={shop}
          onNewSale={() => {
            setIsInvoiceModalOpen(false);
          }}
        />
      )}

      {/* Camera Barcode Scanner Modal */}
      <CameraBarcodeScannerModal
        isOpen={isCameraScannerOpen}
        onClose={() => setIsCameraScannerOpen(false)}
        products={products}
        onProductScanned={(p) => {
          addToCart(p);
          showToast(`${p.name} কার্টে যোগ হয়েছে!`, 'success');
        }}
      />

      {/* Day-End Cash Closing Modal */}
      <DayEndCashClosingModal
        isOpen={isDayEndClosingOpen}
        onClose={() => setIsDayEndClosingOpen(false)}
      />

      {/* Barcode & Price Shelf Label Generator Modal */}
      <BarcodePriceTagGeneratorModal
        isOpen={isBarcodeModalOpen}
        onClose={() => {
          setIsBarcodeModalOpen(false);
          setBarcodeTargetProduct(null);
        }}
        initialProduct={barcodeTargetProduct}
      />

      {/* Supplier Due & Payable Management Modal */}
      <SupplierDuePaymentModal
        isOpen={isSupplierDueModalOpen}
        onClose={() => setIsSupplierDueModalOpen(false)}
      />

      {/* Staff Performance & Sales Commission Modal */}
      <StaffPerformanceModal
        isOpen={isStaffPerformanceModalOpen}
        onClose={() => setIsStaffPerformanceModalOpen(false)}
      />

      {/* Quick Stock Inward Modal */}
      <QuickStockInwardModal
        isOpen={isPosQuickStockOpen}
        onClose={() => {
          setIsPosQuickStockOpen(false);
          setPosQuickStockProduct(null);
        }}
        product={posQuickStockProduct}
        onSaveStock={handleSavePosQuickStock}
      />

      {/* POS Biometric Lock & Fast Cashier Switch Overlay */}
      <PosBiometricLockOverlay
        isLocked={isPosLocked}
        onUnlock={() => setIsPosLocked(false)}
      />

      {/* Smart Cost-to-Profit Margin Analysis Modal */}
      <CostProfitAnalysisModal
        isOpen={isCostProfitModalOpen}
        onClose={() => setIsCostProfitModalOpen(false)}
        summary={basketMarginSummary}
        onApplyDiscount={(suggestedDiscount) => setDiscountAmount(suggestedDiscount)}
        onUpdateTargetThreshold={(newThreshold) => setCostProfitThreshold(newThreshold)}
      />
    </div>
    </div>
  );
};

export default PosPage;
