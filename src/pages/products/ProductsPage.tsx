import React, { useState, useMemo, useEffect, useDeferredValue } from 'react';
import { useSearchParams, useLocation } from 'react-router-dom';
import { Product } from '../../types';
import { DataStore } from '../../services/dataStorage';
import { productService } from '../../services/productService';
import { productsApi } from '../../services/apiServices';
import { formatCurrency } from '../../utils/formatters';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/common/Button';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { BarcodePrintModal } from '../../components/products/BarcodePrintModal';
import { BulkProductImportModal } from '../../components/products/BulkProductImportModal';
import { AiProductStudioModal } from '../../components/products/AiProductStudioModal';
import { ProductFormModal } from '../../components/products/ProductFormModal';
import { ProductDetailsModal } from '../../components/products/ProductDetailsModal';
import { BulkPriceStockModal } from '../../components/products/BulkPriceStockModal';
import { QuickStockInwardModal } from '../../components/products/QuickStockInwardModal';
import { csvHelper } from '../../utils/csvHelper';
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  Eye,
  Package,
  Layers,
  Sparkles,
  Barcode,
  UploadCloud,
  Download,
  Sliders,
  CheckSquare,
  Square,
  MapPin,
  Calendar,
  Smartphone,
  Star,
  Tag,
  Pill,
  PackagePlus,
  Globe,
} from 'lucide-react';

export const ProductsPage: React.FC = () => {
  const { showToast } = useToast();
  const { shop } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const [products, setProducts] = useState<Product[]>(() => DataStore.getProducts());

  // Filters & Search
  const [search, setSearch] = useState('');
  const deferredSearch = useDeferredValue(search);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [stockStatusFilter, setStockStatusFilter] = useState('all');

  // Bulk Selection
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const [togglingOnlineId, setTogglingOnlineId] = useState<string | null>(null);
  const [isBulkOnlineLoading, setIsBulkOnlineLoading] = useState(false);

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isBarcodeModalOpen, setIsBarcodeModalOpen] = useState(false);
  const [isBulkImportModalOpen, setIsBulkImportModalOpen] = useState(false);
  const [isBulkPriceStockModalOpen, setIsBulkPriceStockModalOpen] = useState(false);
  const [isAiStudioOpen, setIsAiStudioOpen] = useState(false);
  const [aiStudioInitialImage, setAiStudioInitialImage] = useState('');
  const [activeProduct, setActiveProduct] = useState<Product | null>(null);
  const [isQuickStockModalOpen, setIsQuickStockModalOpen] = useState(false);
  const [quickStockProduct, setQuickStockProduct] = useState<Product | null>(null);

  // Automatically open Add Product modal when navigated with add intent
  useEffect(() => {
    const isAddAction =
      searchParams.get('action') === 'add' ||
      searchParams.get('new') === 'true' ||
      (location.state as any)?.openAdd ||
      location.pathname.endsWith('/products/new') ||
      location.pathname.endsWith('/products/add');

    if (isAddAction) {
      setActiveProduct(null);
      setIsAddModalOpen(true);
    }
  }, [searchParams, location]);

  // Global window listener for smartshopx_open_add_product
  useEffect(() => {
    const handleOpenAdd = () => {
      setActiveProduct(null);
      setIsAddModalOpen(true);
    };
    window.addEventListener('smartshopx_open_add_product', handleOpenAdd);
    return () => {
      window.removeEventListener('smartshopx_open_add_product', handleOpenAdd);
    };
  }, []);

  const categories = useMemo(() => {
    const set = new Set(products.map((p) => p.category));
    return ['all', ...Array.from(set)];
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (categoryFilter !== 'all' && p.category !== categoryFilter) return false;
      if (stockStatusFilter === 'in_stock' && p.stock <= p.minStock) return false;
      if (stockStatusFilter === 'low_stock' && (p.stock === 0 || p.stock > p.minStock)) return false;
      if (stockStatusFilter === 'out_of_stock' && p.stock !== 0) return false;
      if (stockStatusFilter === 'has_variants' && (!p.hasVariants || !p.variants?.length)) return false;
      if (stockStatusFilter === 'has_serial' && (!p.hasSerialTracking || !p.serials?.length)) return false;

      if (deferredSearch.trim()) {
        const q = deferredSearch.toLowerCase();
        return (
          p.name.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q) ||
          p.barcode.includes(q) ||
          (p.brand && p.brand.toLowerCase().includes(q)) ||
          (p.rackLocation && p.rackLocation.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [products, deferredSearch, categoryFilter, stockStatusFilter]);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  useEffect(() => {
    setCurrentPage(1);
  }, [search, categoryFilter, stockStatusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / itemsPerPage));
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredProducts.slice(start, start + itemsPerPage);
  }, [filteredProducts, currentPage, itemsPerPage]);

  // Selection handlers
  const handleToggleSelectProduct = (id: string) => {
    setSelectedProductIds((prev) =>
      prev.includes(id) ? prev.filter((pId) => pId !== id) : [...prev, id]
    );
  };

  const handleToggleSelectAll = () => {
    if (selectedProductIds.length === paginatedProducts.length && paginatedProducts.length > 0) {
      setSelectedProductIds([]);
    } else {
      setSelectedProductIds(paginatedProducts.map((p) => p.id));
    }
  };

  const selectedProducts = useMemo(() => {
    return products.filter((p) => selectedProductIds.includes(p.id));
  }, [products, selectedProductIds]);

  // Open Edit Modal
  const handleOpenEdit = (p: Product) => {
    setActiveProduct(p);
    setIsEditModalOpen(true);
  };

  // Open Details Modal
  const handleOpenDetails = (p: Product) => {
    setActiveProduct(p);
    setIsDetailsModalOpen(true);
  };

  // Open Delete Dialog
  const handleOpenDelete = (p: Product) => {
    setActiveProduct(p);
    setIsDeleteDialogOpen(true);
  };

  // Save new product
  const handleCreateProduct = async (formData: any) => {
    if (!formData.name?.trim() || !formData.sellingPrice || Number(formData.sellingPrice) <= 0) {
      showToast('পণ্যের নাম এবং সঠিক বিক্রয়মূল্য দেওয়া আবশ্যক', 'warning');
      return;
    }

    try {
      const created = await productService.addProduct({
        ...formData,
        purchasePrice: Number(formData.purchasePrice) || 0,
        sellingPrice: Number(formData.sellingPrice) || 0,
        wholesalePrice: Number(formData.wholesalePrice) || 0,
        discount: Number(formData.discount) || 0,
        stock: Number(formData.stock) || 0,
        minStock: Number(formData.minStock) || 1,
        sku: formData.sku?.trim() || `SKU-${Date.now().toString().slice(-5)}`,
        barcode:
          formData.barcode?.trim() ||
          `${Math.floor(100000000000 + Math.random() * 900000000000)}`,
        image:
          formData.image?.trim() ||
          'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=400&auto=format&fit=crop&q=60',
      });

      // Synchronize state with freshly updated DataStore
      setProducts(DataStore.getProducts());

      // Reset filters so the newly added product is immediately visible at the top!
      setCategoryFilter('all');
      setSearch('');
      setStockStatusFilter('all');
      setCurrentPage(1);

      // Highlight new product row
      setHighlightedId(created.id);
      setTimeout(() => setHighlightedId(null), 4000);

      setIsAddModalOpen(false);
      showToast(`'${created.name}' সফলভাবে পণ্য তালিকায় যুক্ত হয়েছে`, 'success');
    } catch (e: any) {
      showToast(e?.message || 'পণ্য তৈরি করতে সমস্যা হয়েছে', 'error');
    }
  };

  // Save edited product
  const handleUpdateProduct = async (formData: any) => {
    if (!activeProduct) return;

    try {
      const updated = await productService.updateProduct(activeProduct.id, formData);
      setProducts(DataStore.getProducts());
      setIsEditModalOpen(false);
      showToast(`${updated.name} সফলভাবে আপডেট হয়েছে`, 'success');
    } catch {
      showToast('পণ্য আপডেট করতে সমস্যা হয়েছে', 'error');
    }
  };

  // Delete product
  const handleConfirmDelete = async () => {
    if (!activeProduct) return;
    try {
      await productService.deleteProduct(activeProduct.id);
      setProducts(DataStore.getProducts());
      setSelectedProductIds((prev) => prev.filter((id) => id !== activeProduct.id));
      setIsDeleteDialogOpen(false);
      showToast('পণ্যটি সফলভাবে মুছে ফেলা হয়েছে', 'success');
    } catch {
      showToast('পণ্য মুছে ফেলা সম্ভব হয়নি', 'error');
    }
  };

  // Bulk Apply updates
  const handleApplyBulkUpdate = (updates: {
    priceAdjustment?: { type: 'PERCENT_INC' | 'PERCENT_DEC' | 'FIXED_INC' | 'FIXED_DEC'; value: number };
    wholesaleAdjustment?: { type: 'PERCENT_INC' | 'PERCENT_DEC' | 'FIXED_INC' | 'FIXED_DEC'; value: number };
    stockAdjustment?: { type: 'ADD' | 'SUBTRACT' | 'SET'; value: number };
    newRackLocation?: string;
    newVatPercent?: number;
  }) => {
    const updatedList = products.map((prod) => {
      if (!selectedProductIds.includes(prod.id)) return prod;

      let newSelling = prod.sellingPrice;
      if (updates.priceAdjustment) {
        const { type, value } = updates.priceAdjustment;
        if (type === 'PERCENT_INC') newSelling = Math.round(prod.sellingPrice * (1 + value / 100));
        if (type === 'PERCENT_DEC') newSelling = Math.max(0, Math.round(prod.sellingPrice * (1 - value / 100)));
        if (type === 'FIXED_INC') newSelling = prod.sellingPrice + value;
        if (type === 'FIXED_DEC') newSelling = Math.max(0, prod.sellingPrice - value);
      }

      let newWholesale = prod.wholesalePrice;
      if (updates.wholesaleAdjustment) {
        const { type, value } = updates.wholesaleAdjustment;
        const baseWs = prod.wholesalePrice || prod.sellingPrice;
        if (type === 'PERCENT_INC') newWholesale = Math.round(baseWs * (1 + value / 100));
        if (type === 'PERCENT_DEC') newWholesale = Math.max(0, Math.round(baseWs * (1 - value / 100)));
        if (type === 'FIXED_INC') newWholesale = baseWs + value;
        if (type === 'FIXED_DEC') newWholesale = Math.max(0, baseWs - value);
      }

      let newStock = prod.stock;
      if (updates.stockAdjustment) {
        const { type, value } = updates.stockAdjustment;
        if (type === 'ADD') newStock = prod.stock + value;
        if (type === 'SUBTRACT') newStock = Math.max(0, prod.stock - value);
        if (type === 'SET') newStock = value;
      }

      return {
        ...prod,
        sellingPrice: newSelling,
        wholesalePrice: newWholesale,
        stock: newStock,
        rackLocation: updates.newRackLocation !== undefined ? updates.newRackLocation : prod.rackLocation,
        vatPercent: updates.newVatPercent !== undefined ? updates.newVatPercent : prod.vatPercent,
      };
    });

    setProducts(updatedList);
    DataStore.setProducts(updatedList);
    setSelectedProductIds([]);
  };

  // Bulk Delete
  const handleBulkDelete = () => {
    if (selectedProductIds.length === 0) return;
    const remaining = products.filter((p) => !selectedProductIds.includes(p.id));
    setProducts(remaining);
    DataStore.setProducts(remaining);
    showToast(`${selectedProductIds.length} টি পণ্য মুছে ফেলা হয়েছে`, 'info');
    setSelectedProductIds([]);
  };

  // Bulk Import
  const handleBulkImportComplete = (newProds: Product[]) => {
    const combined = [...newProds, ...products];
    setProducts(combined);
    DataStore.setProducts(combined);
  };

  // Quick Stock Inward
  const handleOpenQuickStock = (prod: Product) => {
    setQuickStockProduct(prod);
    setIsQuickStockModalOpen(true);
  };

  const handleSaveQuickStock = (
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
    setHighlightedId(productId);
    setTimeout(() => setHighlightedId(null), 3500);

    const target = products.find((p) => p.id === productId);
    showToast(
      `"${target?.name || 'পণ্য'}" এ ${addedStock} টি নতুন স্টক যোগ করা হয়েছে! এখন POS এ বিক্রি চালু।`,
      'success'
    );
  };

  // Pharmacy Zero-Stock Catalog Sync
  const handleSyncPharmacyCatalog = () => {
    const synced = DataStore.syncPharmacyZeroStockCatalog();
    setProducts(synced);
    setCategoryFilter('Pharmacy & Medicine');
    setStockStatusFilter('all');
    showToast(
      'ফার্মেসির জনপ্রিয় ওষুধ ও স্বাস্থ্য সামগ্রী (০ স্টক সহ) ক্যাটালগে প্রস্তুত! চালান আসলে সরাসরি স্টক ইনওয়ার্ড করে বিক্রি শুরু করতে পারবেন।',
      'success'
    );
  };

  // Export CSV
  const handleExportCsv = () => {
    csvHelper.exportToCsv('SmartShopX_Products', products, [
      { key: 'name', header: 'পণ্যের নাম' },
      { key: 'category', header: 'ক্যাটাগরি' },
      { key: 'sku', header: 'SKU' },
      { key: 'barcode', header: 'বারকোড' },
      { key: 'purchasePrice', header: 'ক্রয় মূল্য' },
      { key: 'sellingPrice', header: 'খুচরা বিক্রয় মূল্য' },
      { key: 'wholesalePrice', header: 'পাইকারি মূল্য' },
      { key: 'stock', header: 'স্টক সংখ্যা' },
      { key: 'unit', header: 'একক' },
      { key: 'rackLocation', header: 'র্যাক লোকেশন' },
      { key: 'warrantyPeriod', header: 'ওয়ারেন্টি' },
      { key: 'batchNumber', header: 'ব্যাচ' },
      { key: 'expiryDate', header: 'মেয়াদ' },
    ]);
    showToast('পণ্য তালিকা CSV ফরম্যাটে সফলভাবে এক্সপোর্ট হয়েছে', 'success');
  };

  // 1-Click Online Toggle with Optimistic UI & Rollback
  const handleToggleOnlineStatus = async (product: Product) => {
    const previousStatus = product.onlineStoreVisible ?? true;
    const nextStatus = !previousStatus;

    // Optimistic UI update
    setProducts((prev) =>
      prev.map((p) => (p.id === product.id ? { ...p, onlineStoreVisible: nextStatus } : p))
    );
    setTogglingOnlineId(product.id);

    try {
      await productsApi.updateOnlineStatus(product.id, nextStatus);
      showToast(
        nextStatus
          ? `"${product.name}" এখন SmartShopX.bd মার্কেটপ্লেস ও স্টোরে লাইভ (ONLINE ON)`
          : `"${product.name}" অনলাইন স্টোর থেকে বন্ধ করা হয়েছে (ONLINE OFF) - ইনভেন্টরি ও স্টক অক্ষত`,
        'success'
      );
    } catch (err: any) {
      // Rollback on failure
      setProducts((prev) =>
        prev.map((p) => (p.id === product.id ? { ...p, onlineStoreVisible: previousStatus } : p))
      );
      showToast('অনলাইন স্ট্যাটাস পরিবর্তন করা সম্ভব হয়নি, পূর্বের অবস্থায় ফিরিয়ে নেওয়া হয়েছে', 'error');
    } finally {
      setTogglingOnlineId(null);
    }
  };

  // Bulk Online Toggle with Optimistic UI & Rollback
  const handleBulkOnlineToggle = async (enable: boolean) => {
    if (selectedProductIds.length === 0) return;
    const targetIds = [...selectedProductIds];
    const previousProducts = [...products];

    // Optimistic UI update
    const idSet = new Set(targetIds);
    setProducts((prev) =>
      prev.map((p) => (idSet.has(p.id) ? { ...p, onlineStoreVisible: enable } : p))
    );
    setIsBulkOnlineLoading(true);

    try {
      await productsApi.bulkUpdateOnlineStatus(targetIds, enable);
      showToast(
        enable
          ? `${targetIds.length} টি পণ্য সফলভাবে অনলাইনে (ONLINE ON) চালু করা হয়েছে`
          : `${targetIds.length} টি পণ্য অনলাইন থেকে বন্ধ (ONLINE OFF) করা হয়েছে`,
        'success'
      );
      setSelectedProductIds([]);
    } catch (err: any) {
      // Rollback on failure
      setProducts(previousProducts);
      showToast('বাল্ক অনলাইন স্ট্যাটাস পরিবর্তন ব্যর্থ হয়েছে, পূর্বের অবস্থায় ফিরে যাওয়া হয়েছে', 'error');
    } finally {
      setIsBulkOnlineLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Top action header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900">
            পণ্য ব্যবস্থাপনা (Smart Product Management)
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            ভ্যারিয়েন্ট (সাইজ/রং), পাইকারি রেট, আইএমইআই/সিরিয়াল, র্যাক লোকেশন ও এক্সপায়ারি ট্র্যাকিং
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Barcode Print Button */}
          <button
            onClick={() => {
              setActiveProduct(selectedProducts[0] || products[0] || null);
              setIsBarcodeModalOpen(true);
            }}
            className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
            title="বারকোড ও প্রাইস স্টিকার প্রিন্ট করুন"
          >
            <Barcode className="w-4 h-4 text-emerald-600" />
            <span>বারকোড স্টিকার</span>
          </button>

          {/* Bulk Import Button */}
          <button
            onClick={() => setIsBulkImportModalOpen(true)}
            className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
            title="এক্সেলে তৈরি CSV ফাইল থেকে বাল্ক আপলোড"
          >
            <UploadCloud className="w-4 h-4 text-indigo-600" />
            <span>বাল্ক ইম্পোর্ট</span>
          </button>

          {/* Export CSV Button */}
          <button
            onClick={handleExportCsv}
            className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
            title="সকল পণ্য CSV ফাইলে ডাউনলোড করুন"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>এক্সপোর্ট</span>
          </button>

          {/* Pharmacy 0-Stock Catalog Quick Sync Button */}
          <button
            onClick={handleSyncPharmacyCatalog}
            className="px-3 py-2 rounded-xl border border-emerald-200 bg-emerald-50/80 hover:bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
            title="ফার্মেসির শীর্ষ ওষুধ ও স্বাস্থ্য সামগ্রী (০ স্টক সহ) ক্যাটালগে সেট করুন"
          >
            <Pill className="w-4 h-4 text-emerald-600" />
            <span>ফার্মেসি ক্যাটালগ (০ স্টক)</span>
          </button>

          {/* AI Product Studio Quick Action */}
          <button
            onClick={() => {
              setActiveProduct(null);
              setIsAddModalOpen(true);
              setAiStudioInitialImage(
                'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80'
              );
              setIsAiStudioOpen(true);
            }}
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 hover:opacity-95 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer"
            title="এআই দিয়ে স্বয়ংক্রিয় ছবি ও বিবরণ তৈরি করুন"
          >
            <Sparkles className="w-4 h-4 text-yellow-300" />
            <span>AI Product Studio</span>
          </button>

          <Button
            onClick={() => {
              setActiveProduct(null);
              setIsAddModalOpen(true);
            }}
            variant="primary"
            size="md"
            leftIcon={<Plus className="w-4 h-4 shrink-0" />}
            title="নতুন পণ্য অ্যাড / যোগ করুন (Add Product)"
          >
            নতুন পণ্য যোগ
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-3 items-center">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="পণ্য, SKU, বারকোড, ব্র্যান্ড বা র্যাক নম্বর লিখে খুঁজুন..."
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="w-full sm:w-44 px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50"
        >
          <option value="all">সব ক্যাটাগরি</option>
          {categories
            .filter((c) => c !== 'all')
            .map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
        </select>

        <select
          value={stockStatusFilter}
          onChange={(e) => setStockStatusFilter(e.target.value)}
          className="w-full sm:w-44 px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50"
        >
          <option value="all">সব ফিল্টার</option>
          <option value="in_stock">পর্যাপ্ত স্টক</option>
          <option value="low_stock">কম স্টক (Low Stock)</option>
          <option value="out_of_stock">স্টক আউট</option>
          <option value="has_variants">ভ্যারিয়েন্ট পণ্য</option>
          <option value="has_serial">IMEI / সিরিয়াল পণ্য</option>
        </select>
      </div>

      {/* Pharmacy & Medicine Zero-Stock Guidance Banner */}
      {categoryFilter === 'Pharmacy & Medicine' && (
        <div className="p-3 bg-emerald-50/90 border border-emerald-200 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
              <Pill className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-emerald-950">
                ফার্মেসি ও মেডিসিন স্টোর ক্যাটালগ (প্রারম্ভিক স্টক ০)
              </p>
              <p className="text-[11px] text-emerald-800">
                দোকানদার প্রয়োজন মতো পণ্য তৈরি বা ক্যাটালগ থেকে নির্বাচন করতে পারবেন। নতুন চালান আসার পর পণ্যের পাশে{' '}
                <span className="font-bold underline text-emerald-900">+ স্টক যোগ</span> বাটনে ক্লিক করলেই স্বয়ংক্রিয়ভাবে POS-এ বিক্রি চালু হয়ে যাবে।
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleSyncPharmacyCatalog}
              className="px-2.5 py-1 bg-white hover:bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-semibold rounded-lg transition-colors cursor-pointer shadow-2xs"
            >
              ৩২টি পণ্য রিলোড (০ স্টক)
            </button>
          </div>
        </div>
      )}

      {/* Multi-Selection Bulk Action Floating / Sticky Bar */}
      {selectedProductIds.length > 0 && (
        <div className="p-3 bg-slate-900 text-white rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 shadow-lg animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2 text-xs font-medium">
            <span className="w-6 h-6 rounded-full bg-emerald-500 text-slate-900 font-mono font-bold flex items-center justify-center text-xs">
              {selectedProductIds.length}
            </span>
            <span>টি পণ্য নির্বাচিত হয়েছে</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setIsBulkPriceStockModalOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>বাল্ক মূল্য ও স্টক পরিবর্তন</span>
            </button>

            <button
              onClick={() => handleBulkOnlineToggle(true)}
              disabled={isBulkOnlineLoading}
              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              title="নির্বাচিত পণ্যগুলো SmartShopX.bd অনলাইন স্টোরে চালু করুন (ONLINE ON)"
            >
              <Globe className="w-3.5 h-3.5" />
              <span>Enable Online</span>
            </button>

            <button
              onClick={() => handleBulkOnlineToggle(false)}
              disabled={isBulkOnlineLoading}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border border-slate-700"
              title="নির্বাচিত পণ্যগুলো অনলাইন স্টোর ও মার্কেটপ্লেস থেকে হাইড করুন (ONLINE OFF)"
            >
              <Globe className="w-3.5 h-3.5 opacity-50" />
              <span>Disable Online</span>
            </button>

            <button
              onClick={() => {
                setActiveProduct(selectedProducts[0] || null);
                setIsBarcodeModalOpen(true);
              }}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border border-slate-700"
            >
              <Barcode className="w-3.5 h-3.5 text-emerald-400" />
              <span>বারকোড প্রিন্ট</span>
            </button>

            <button
              onClick={handleBulkDelete}
              className="px-3 py-1.5 rounded-xl bg-rose-600/80 hover:bg-rose-600 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>মুছুন</span>
            </button>

            <button
              onClick={() => setSelectedProductIds([])}
              className="px-2.5 py-1.5 rounded-xl text-slate-400 hover:text-white text-xs cursor-pointer"
            >
              বাতিল
            </button>
          </div>
        </div>
      )}

      {/* Product List Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/70 text-slate-500 font-semibold">
                <th className="py-3 px-3 text-center w-10">
                  <button
                    type="button"
                    onClick={handleToggleSelectAll}
                    className="cursor-pointer text-slate-400 hover:text-slate-700"
                    title="সব নির্বাচন করুন"
                  >
                    {selectedProductIds.length === paginatedProducts.length &&
                    paginatedProducts.length > 0 ? (
                      <CheckSquare className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                  </button>
                </th>
                <th className="py-3 px-4">পণ্য ও ছবি</th>
                <th className="py-3 px-4">ক্যাটাগরি ও অবস্থান</th>
                <th className="py-3 px-4">ক্রয়মূল্য</th>
                <th className="py-3 px-4">বিক্রয় ও পাইকারি</th>
                <th className="py-3 px-4">লাভ ও মার্জিন</th>
                <th className="py-3 px-4">বর্তমান স্টক</th>
                <th className="py-3 px-4 text-center">অনলাইন (SmartShopX)</th>
                <th className="py-3 px-4">স্ট্যাটাস</th>
                <th className="py-3 px-4 text-center">অ্যাকশন</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedProducts.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center">
                    <div className="flex flex-col items-center justify-center max-w-sm mx-auto p-4">
                      <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3 shadow-xs">
                        <Package className="w-6 h-6" />
                      </div>
                      <h3 className="text-sm font-bold text-slate-800 mb-1">
                        {search.trim() ? 'কোনো পণ্য খুঁজে পাওয়া যায়নি' : 'এখনো কোনো পণ্য যুক্ত করা হয়নি'}
                      </h3>
                      <p className="text-xs text-slate-500 mb-4">
                        {search.trim()
                          ? 'অন্য কোনো নাম, SKU বা বারকোড লিখে পুনরায় চেষ্টা করুন'
                          : 'নতুন পণ্য যোগ করে আপনার ইনভেন্টরি ও পিওএস বিক্রয় শুরু করুন'}
                      </p>
                      <Button
                        onClick={() => {
                          setActiveProduct(null);
                          setIsAddModalOpen(true);
                        }}
                        variant="primary"
                        size="sm"
                        leftIcon={<Plus className="w-4 h-4" />}
                      >
                        নতুন পণ্য যোগ করুন (Add Product)
                      </Button>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedProducts.map((p) => {
                const finalSelling = p.sellingPrice - (p.discount || 0);
                const profit = finalSelling - (p.purchasePrice || 0);
                const marginPct =
                  p.purchasePrice > 0
                    ? Math.round((profit / p.purchasePrice) * 100)
                    : 100;
                const isSelected = selectedProductIds.includes(p.id);

                return (
                  <tr
                    key={p.id}
                    className={`transition-all duration-300 ${
                      p.id === highlightedId
                        ? 'bg-emerald-100/70 ring-2 ring-emerald-500 ring-inset'
                        : isSelected
                        ? 'bg-emerald-50/40'
                        : 'hover:bg-slate-50/50'
                    }`}
                  >
                    <td className="py-3 px-3 text-center">
                      <button
                        type="button"
                        onClick={() => handleToggleSelectProduct(p.id)}
                        className="cursor-pointer text-slate-400 hover:text-slate-700"
                      >
                        {isSelected ? (
                          <CheckSquare className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <Square className="w-4 h-4" />
                        )}
                      </button>
                    </td>

                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="relative shrink-0">
                          <img
                            src={p.image}
                            alt={p.name}
                            className="w-11 h-11 rounded-xl object-cover border border-slate-100"
                            referrerPolicy="no-referrer"
                          />
                          {p.isFeatured && (
                            <span
                              className="absolute -top-1 -left-1 w-4 h-4 rounded-full bg-amber-500 text-white flex items-center justify-center shadow-xs"
                              title="ফিচারড পণ্য"
                            >
                              <Star className="w-2.5 h-2.5 fill-current" />
                            </span>
                          )}
                        </div>

                        <div className="truncate max-w-[210px] space-y-0.5">
                          <span className="font-bold text-slate-900 block truncate">{p.name}</span>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[11px] text-slate-400 font-mono">
                              {p.sku}
                            </span>
                            {p.hasVariants && p.variants && p.variants.length > 0 && (
                              <span className="px-1.5 py-0.2 rounded-md bg-purple-100 text-purple-800 text-[10px] font-semibold flex items-center gap-0.5">
                                <Layers className="w-2.5 h-2.5" />
                                {p.variants.length} ভ্যারিয়েন্ট
                              </span>
                            )}
                            {p.hasSerialTracking && p.serials && p.serials.length > 0 && (
                              <span className="px-1.5 py-0.2 rounded-md bg-blue-100 text-blue-800 text-[10px] font-semibold flex items-center gap-0.5">
                                <Smartphone className="w-2.5 h-2.5" />
                                {p.serials.length} IMEI
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <span className="text-slate-800 font-medium block">{p.category}</span>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        {p.brand ? (
                          <span className="text-[11px] text-slate-400">{p.brand}</span>
                        ) : null}
                        {p.rackLocation ? (
                          <span className="text-[10px] text-indigo-700 bg-indigo-50 px-1.5 py-0.2 rounded-md font-semibold flex items-center gap-0.5 border border-indigo-100">
                            <MapPin className="w-2.5 h-2.5" />
                            {p.rackLocation}
                          </span>
                        ) : null}
                      </div>
                    </td>

                    <td className="py-3 px-4 font-mono font-medium text-slate-600">
                      {formatCurrency(p.purchasePrice)}
                    </td>

                    <td className="py-3 px-4">
                      <span className="font-mono font-bold text-slate-900 block">
                        খুচরা: {formatCurrency(finalSelling)}
                      </span>
                      {p.wholesalePrice ? (
                        <span className="text-[10px] text-blue-700 font-mono font-semibold block">
                          পাইকারি: {formatCurrency(p.wholesalePrice)}
                        </span>
                      ) : null}
                      {p.vatPercent ? (
                        <span className="text-[10px] text-slate-400 font-mono">
                          +{p.vatPercent}% ভ্যাট
                        </span>
                      ) : null}
                    </td>

                    <td className="py-3 px-4">
                      <span className="font-mono font-bold text-emerald-700 block">
                        +{formatCurrency(profit)}
                      </span>
                      <span className="text-[10px] text-emerald-600 font-semibold">
                        মার্জিন: {marginPct}%
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      <div className="flex flex-col items-start gap-1">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`inline-block font-mono font-bold px-2 py-0.5 rounded-lg text-xs ${
                              p.stock === 0
                                ? 'bg-rose-100 text-rose-700'
                                : p.stock <= p.minStock
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-emerald-50 text-emerald-800'
                            }`}
                          >
                            {p.stock} {p.unit.split(' ')[0]}
                          </span>

                          <button
                            type="button"
                            onClick={() => handleOpenQuickStock(p)}
                            className="p-1 text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 rounded-md transition-colors cursor-pointer"
                            title="স্টক ইনওয়ার্ড / বৃদ্ধি করুন"
                          >
                            <PackagePlus className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {p.stock === 0 ? (
                          <button
                            type="button"
                            onClick={() => handleOpenQuickStock(p)}
                            className="flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-1.5 py-0.5 rounded-md transition-colors cursor-pointer"
                            title="স্টক ইনওয়ার্ড করে বিক্রি চালু করুন"
                          >
                            <Plus className="w-2.5 h-2.5" />
                            <span>স্টক যোগ</span>
                          </button>
                        ) : null}

                        {p.expiryDate && (
                          <div className="text-[10px] text-rose-600 font-mono mt-0.5 flex items-center gap-0.5">
                            <Calendar className="w-2.5 h-2.5" />
                            <span>Exp: {p.expiryDate}</span>
                          </div>
                        )}
                      </div>
                    </td>

                    <td className="py-3 px-4 text-center">
                      <button
                        type="button"
                        disabled={togglingOnlineId === p.id}
                        onClick={() => handleToggleOnlineStatus(p)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold transition-all cursor-pointer shadow-2xs border ${
                          (p.onlineStoreVisible ?? true)
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100 hover:border-emerald-400'
                            : 'bg-slate-100 text-slate-500 border-slate-300 hover:bg-slate-200 hover:text-slate-700'
                        } ${togglingOnlineId === p.id ? 'opacity-50 cursor-wait' : ''}`}
                        title={
                          (p.onlineStoreVisible ?? true)
                            ? 'অনলাইনে চালু আছে (SmartShopX.bd-তে দৃশ্যমান) - বন্ধ করতে ক্লিক করুন'
                            : 'অনলাইনে বন্ধ আছে (SmartShopX.bd-তে লুকানো) - চালু করতে ক্লিক করুন'
                        }
                      >
                        <span
                          className={`w-2 h-2 rounded-full ${
                            (p.onlineStoreVisible ?? true) ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
                          }`}
                        />
                        <span>{(p.onlineStoreVisible ?? true) ? 'ONLINE ON' : 'ONLINE OFF'}</span>
                        <Globe className="w-3 h-3 ml-0.5 opacity-70" />
                      </button>
                    </td>

                    <td className="py-3 px-4">
                      <span
                        className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${
                          p.isActive
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-700'
                        }`}
                      >
                        {p.isActive ? 'সক্রিয়' : 'নিষ্ক্রিয়'}
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => {
                            setActiveProduct(p);
                            setIsBarcodeModalOpen(true);
                          }}
                          className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg cursor-pointer transition-colors"
                          title="বারকোড স্টিকার প্রিন্ট করুন"
                        >
                          <Barcode className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleOpenDetails(p)}
                          className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors"
                          title="বিস্তারিত বিবরণ"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleOpenEdit(p)}
                          className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors"
                          title="সম্পাদনা"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleOpenDelete(p)}
                          className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors"
                          title="মুছুন"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              }))}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="p-3.5 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-600">
            <div>
              মোট <span className="font-bold font-mono text-slate-800">{filteredProducts.length}</span> টির মধ্যে{' '}
              <span className="font-bold font-mono text-slate-800">
                {(currentPage - 1) * itemsPerPage + 1}
              </span>{' '}
              -{' '}
              <span className="font-bold font-mono text-slate-800">
                {Math.min(currentPage * itemsPerPage, filteredProducts.length)}
              </span>{' '}
              দেখাচ্ছে
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 font-medium disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer shadow-2xs"
              >
                পূর্ববর্তী পাতা
              </button>
              <span className="font-mono font-bold px-2 py-1 bg-white border border-slate-200 rounded-lg text-slate-800">
                {currentPage} / {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 font-medium disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer shadow-2xs"
              >
                পরবর্তী পাতা
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Comprehensive Add & Edit Product Modal */}
      <ProductFormModal
        isOpen={isAddModalOpen || isEditModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setIsEditModalOpen(false);
          setActiveProduct(null);
          if (searchParams.get('action') === 'add' || searchParams.get('new') === 'true') {
            const next = new URLSearchParams(searchParams);
            next.delete('action');
            next.delete('new');
            setSearchParams(next, { replace: true });
          }
        }}
        isEdit={isEditModalOpen}
        initialData={activeProduct}
        onSubmit={isEditModalOpen ? handleUpdateProduct : handleCreateProduct}
        onOpenAiStudio={(initialImg) => {
          setAiStudioInitialImage(initialImg);
          setIsAiStudioOpen(true);
        }}
        existingCategories={categories}
      />

      {/* Comprehensive Product Details Modal */}
      <ProductDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={() => {
          setIsDetailsModalOpen(false);
          setActiveProduct(null);
        }}
        product={activeProduct}
        onEdit={(p) => {
          setIsDetailsModalOpen(false);
          handleOpenEdit(p);
        }}
        onPrintBarcode={(p) => {
          setActiveProduct(p);
          setIsBarcodeModalOpen(true);
        }}
      />

      {/* Bulk Price & Stock Adjuster Modal */}
      <BulkPriceStockModal
        isOpen={isBulkPriceStockModalOpen}
        onClose={() => setIsBulkPriceStockModalOpen(false)}
        selectedProducts={selectedProducts}
        onApplyBulkUpdate={handleApplyBulkUpdate}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleConfirmDelete}
        title="পণ্য মুছে ফেলা"
        message={`আপনি কি নিশ্চিত যে "${activeProduct?.name}" পণ্যটি তালিকা থেকে মুছে ফেলতে চান?`}
        confirmText="হ্যাঁ, মুছে ফেলুন"
      />

      {/* Barcode Sticker Print Modal */}
      <BarcodePrintModal
        isOpen={isBarcodeModalOpen}
        onClose={() => setIsBarcodeModalOpen(false)}
        products={
          activeProduct
            ? [activeProduct, ...products.filter((p) => p.id !== activeProduct.id)]
            : products
        }
        shop={shop}
      />

      {/* Bulk Product CSV Import Modal */}
      <BulkProductImportModal
        isOpen={isBulkImportModalOpen}
        onClose={() => setIsBulkImportModalOpen(false)}
        onImportComplete={handleBulkImportComplete}
      />

      {/* AI Product Studio Modal */}
      <AiProductStudioModal
        isOpen={isAiStudioOpen}
        onClose={() => setIsAiStudioOpen(false)}
        originalImage={
          aiStudioInitialImage ||
          activeProduct?.image ||
          'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80'
        }
        currentName={activeProduct?.name || ''}
        currentCategory={activeProduct?.category || ''}
        currentPrice={activeProduct?.sellingPrice || 0}
        onApplyProcessedImage={(processedUrl) => {
          if (activeProduct) {
            handleUpdateProduct({ ...activeProduct, image: processedUrl });
          }
          showToast('AI প্রসেসড ছবি সফলভাবে পণ্যে যুক্ত করা হয়েছে!', 'success');
        }}
        onApplyProductInfo={(info) => {
          if (activeProduct) {
            handleUpdateProduct({
              ...activeProduct,
              name: info.productName || activeProduct.name,
              category: info.category || activeProduct.category,
              description: info.detailedDescription
                ? `${info.shortDescription ? info.shortDescription + '\n\n' : ''}${info.detailedDescription}`
                : activeProduct.description,
            });
          }
          showToast('AI স্টুডিও থেকে পণ্যের তথ্য সফলভাবে যুক্ত করা হয়েছে!', 'success');
        }}
      />

      {/* Quick Stock Inward Modal */}
      <QuickStockInwardModal
        isOpen={isQuickStockModalOpen}
        onClose={() => {
          setIsQuickStockModalOpen(false);
          setQuickStockProduct(null);
        }}
        product={quickStockProduct}
        onSaveStock={handleSaveQuickStock}
      />
    </div>
  );
};
