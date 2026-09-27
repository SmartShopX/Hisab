import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Building2,
  GitCompare,
  ArrowRightLeft,
  Plus,
  TrendingUp,
  Package,
  Boxes,
  Users,
  Phone,
  MapPin,
  CheckCircle2,
  Clock,
  Truck,
  AlertCircle,
  Search,
  Filter,
  Layers,
  Sparkles,
  ArrowUpRight,
  Printer,
  ChevronRight,
  ShieldCheck,
  Edit2,
  Trash2,
  X,
  DollarSign,
  Send,
  Calendar,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useToast } from '../../context/ToastContext';
import { DataStore } from '../../services/dataStorage';
import { Branch, StockTransferRequest, Product, StockTransferItem } from '../../types';
import { Button } from '../../components/common/Button';

export const BranchManagementPage: React.FC = () => {
  const { shop, user } = useAuth();
  const { t, isEn, formatNumber } = useLanguage();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Active View Tab: 'grid' (Side-by-side performance) | 'transfers' (Transfer History & Logistics)
  const [activeTab, setActiveTab] = useState<'grid' | 'transfers'>('grid');

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [cityFilter, setCityFilter] = useState<string>('all');
  const [transferStatusFilter, setTransferStatusFilter] = useState<string>('all');

  // Modals state
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [isBranchModalOpen, setIsBranchModalOpen] = useState(false);
  const [selectedBranchForEdit, setSelectedBranchForEdit] = useState<Branch | null>(null);
  const [selectedTransferForPrint, setSelectedTransferForPrint] = useState<StockTransferRequest | null>(null);

  // Data
  const [branches, setBranches] = useState<Branch[]>(() => DataStore.getBranches());
  const [stockTransfers, setStockTransfers] = useState<StockTransferRequest[]>(() => DataStore.getStockTransfers());
  const [products] = useState<Product[]>(() => DataStore.getProducts());

  // Reload data
  const refreshData = () => {
    setBranches(DataStore.getBranches());
    setStockTransfers(DataStore.getStockTransfers());
  };

  // Pre-fill Transfer Modal state
  const [transferSourceId, setTransferSourceId] = useState<string>('');
  const [transferDestId, setTransferDestId] = useState<string>('');
  const [transferItems, setTransferItems] = useState<{
    productId: string;
    productName: string;
    sku: string;
    quantity: number;
    unitPrice: number;
    unit: string;
  }[]>([]);
  const [selectedProductToAdd, setSelectedProductToAdd] = useState<string>('');
  const [addQuantity, setAddQuantity] = useState<number>(1);
  const [transportVehicle, setTransportVehicle] = useState<string>('');
  const [trackingNumber, setTrackingNumber] = useState<string>('');
  const [transferNotes, setTransferNotes] = useState<string>('');

  // Branch Form State
  const [branchForm, setBranchForm] = useState({
    name: '',
    code: '',
    isMainBranch: false,
    managerName: '',
    phone: '',
    email: '',
    address: '',
    city: 'ঢাকা',
    targetMonthlySales: 200000,
  });

  // Calculate Overall Performance Metrics across branches
  const overallMetrics = useMemo(() => {
    const totalActive = branches.filter((b) => b.status === 'active').length;
    const totalMonthlySales = branches.reduce((acc, b) => acc + (b.currentMonthlySales || 0), 0);
    const totalTodaySales = branches.reduce((acc, b) => acc + (b.todaySales || 0), 0);
    const totalStockQty = branches.reduce((acc, b) => acc + (b.totalStockQuantity || 0), 0);
    const totalStockVal = branches.reduce((acc, b) => acc + (b.totalStockValuation || 0), 0);
    const inTransitCount = stockTransfers.filter((t) => t.status === 'in_transit').length;
    const inTransitQty = stockTransfers
      .filter((t) => t.status === 'in_transit')
      .reduce((acc, t) => acc + (t.totalQuantity || 0), 0);

    return {
      totalActive,
      totalMonthlySales,
      totalTodaySales,
      totalStockQty,
      totalStockVal,
      inTransitCount,
      inTransitQty,
    };
  }, [branches, stockTransfers]);

  // Cities list for filtering
  const availableCities = useMemo(() => {
    const set = new Set(branches.map((b) => b.city).filter(Boolean));
    return Array.from(set);
  }, [branches]);

  // Filtered branches
  const filteredBranches = useMemo(() => {
    return branches.filter((b) => {
      const matchSearch =
        b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.managerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.address.toLowerCase().includes(searchQuery.toLowerCase());
      const matchCity = cityFilter === 'all' || b.city === cityFilter;
      return matchSearch && matchCity;
    });
  }, [branches, searchQuery, cityFilter]);

  // Filtered Transfers
  const filteredTransfers = useMemo(() => {
    return stockTransfers.filter((t) => {
      const matchStatus = transferStatusFilter === 'all' || t.status === transferStatusFilter;
      const matchSearch =
        t.transferNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.sourceBranchName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.destinationBranchName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.items.some((it) => it.productName.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchStatus && matchSearch;
    });
  }, [stockTransfers, transferStatusFilter, searchQuery]);

  // Open Transfer Modal with optional source preselection
  const handleOpenTransferModal = (sourceId?: string, destId?: string) => {
    const validSource = sourceId || branches[0]?.id || '';
    const validDest = destId || branches.find((b) => b.id !== validSource)?.id || '';
    setTransferSourceId(validSource);
    setTransferDestId(validDest);
    setTransferItems([]);
    setSelectedProductToAdd('');
    setAddQuantity(1);
    setTransportVehicle('দোকানের নিজস্ব ডেলিভারি ভ্যান');
    setTrackingNumber('');
    setTransferNotes('');
    setIsTransferModalOpen(true);
  };

  useEffect(() => {
    if (searchParams.get('action') === 'new_transfer') {
      handleOpenTransferModal();
    }
  }, [searchParams]);

  // Add Item to Transfer Basket
  const handleAddItemToTransfer = () => {
    if (!selectedProductToAdd) {
      showToast(isEn ? 'Please select a product' : 'দয়া করে পণ্য নির্বাচন করুন', 'error');
      return;
    }
    const product = products.find((p) => p.id === selectedProductToAdd);
    if (!product) return;

    if (addQuantity <= 0) {
      showToast(isEn ? 'Quantity must be greater than 0' : 'পরিমাণ ১ বা তার বেশি হতে হবে', 'error');
      return;
    }

    const existingIdx = transferItems.findIndex((it) => it.productId === product.id);
    if (existingIdx > -1) {
      const updated = [...transferItems];
      updated[existingIdx].quantity += addQuantity;
      setTransferItems(updated);
    } else {
      setTransferItems([
        ...transferItems,
        {
          productId: product.id,
          productName: product.name,
          sku: product.sku || product.barcode || 'SKU-ITEM',
          quantity: addQuantity,
          unitPrice: product.purchasePrice || product.sellingPrice || 10,
          unit: product.unit || 'Pcs',
        },
      ]);
    }

    setSelectedProductToAdd('');
    setAddQuantity(1);
    showToast(isEn ? 'Product added to transfer list' : 'পণ্য ট্রান্সফার তালিকায় যুক্ত হয়েছে', 'success');
  };

  // Remove Item from transfer list
  const handleRemoveTransferItem = (productId: string) => {
    setTransferItems(transferItems.filter((it) => it.productId !== productId));
  };

  // Submit Stock Transfer
  const handleCreateStockTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferSourceId || !transferDestId) {
      showToast(isEn ? 'Please select source and destination branches' : 'উৎস ও গন্তব্য শাখা বাছাই করুন', 'error');
      return;
    }
    if (transferSourceId === transferDestId) {
      showToast(isEn ? 'Source and destination cannot be the same' : 'একই শাখায় ট্রান্সফার করা যাবে না', 'error');
      return;
    }
    if (transferItems.length === 0) {
      showToast(isEn ? 'Please add at least one product' : 'কমপক্ষে একটি পণ্য তালিকায় যোগ করুন', 'error');
      return;
    }

    const srcBranch = branches.find((b) => b.id === transferSourceId);
    const destBranch = branches.find((b) => b.id === transferDestId);

    const totalQuantity = transferItems.reduce((acc, it) => acc + it.quantity, 0);
    const totalValue = transferItems.reduce((acc, it) => acc + it.quantity * it.unitPrice, 0);

    const created = DataStore.createStockTransfer({
      sourceBranchId: transferSourceId,
      sourceBranchName: srcBranch?.name || 'উৎস শাখা',
      destinationBranchId: transferDestId,
      destinationBranchName: destBranch?.name || 'গন্তব্য শাখা',
      items: transferItems,
      totalQuantity,
      totalValue,
      status: 'in_transit',
      transferDate: new Date().toISOString().split('T')[0],
      initiatedBy: user?.name || 'অ্যাডমিন',
      transportVehicle,
      trackingNumber,
      notes: transferNotes,
    });

    refreshData();
    setIsTransferModalOpen(false);
    showToast(
      isEn
        ? `Transfer request ${created.transferNumber} dispatched successfully!`
        : `স্টক চালান #${created.transferNumber} সফলভাবে পাঠানো হয়েছে!`,
      'success'
    );
  };

  // Handle Mark Received / Reject
  const handleUpdateTransferStatus = (transferId: string, newStatus: 'received' | 'rejected' | 'cancelled') => {
    const updated = DataStore.updateStockTransferStatus(transferId, newStatus, user?.name || 'ব্রাঞ্চ ম্যানেজার');
    if (updated) {
      refreshData();
      showToast(
        newStatus === 'received'
          ? isEn ? 'Stock received and branch inventory updated!' : 'স্টক সফলভাবে গ্রহণ ও ইনভেন্টরি আপডেট করা হয়েছে!'
          : isEn ? 'Transfer updated' : 'ট্রান্সফার স্ট্যাটাস আপডেট হয়েছে',
        'success'
      );
    }
  };

  // Open Edit Branch Modal
  const handleOpenBranchModal = (branchToEdit?: Branch) => {
    if (branchToEdit) {
      setSelectedBranchForEdit(branchToEdit);
      setBranchForm({
        name: branchToEdit.name,
        code: branchToEdit.code,
        isMainBranch: !!branchToEdit.isMainBranch,
        managerName: branchToEdit.managerName,
        phone: branchToEdit.phone,
        email: branchToEdit.email || '',
        address: branchToEdit.address,
        city: branchToEdit.city,
        targetMonthlySales: branchToEdit.targetMonthlySales || 200000,
      });
    } else {
      setSelectedBranchForEdit(null);
      setBranchForm({
        name: '',
        code: `BR-0${branches.length + 1}`,
        isMainBranch: branches.length === 0,
        managerName: '',
        phone: '',
        email: '',
        address: '',
        city: 'ঢাকা',
        targetMonthlySales: 200000,
      });
    }
    setIsBranchModalOpen(true);
  };

  // Save Branch Form
  const handleSaveBranch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!branchForm.name.trim() || !branchForm.code.trim()) {
      showToast(isEn ? 'Branch name and code are required' : 'ব্রাঞ্চের নাম ও কোড আবশ্যক', 'error');
      return;
    }

    if (selectedBranchForEdit) {
      DataStore.updateBranch(selectedBranchForEdit.id, {
        ...branchForm,
      });
      showToast(isEn ? 'Branch updated successfully' : 'শাখা তথ্য সফলভাবে আপডেট হয়েছে', 'success');
    } else {
      DataStore.createBranch({
        ...branchForm,
        status: 'active',
        currentMonthlySales: 0,
        todaySales: 0,
        totalStockQuantity: 1500,
        totalStockValuation: 220000,
        staffCount: 2,
        openingDate: new Date().toISOString().split('T')[0],
      });
      showToast(isEn ? 'New branch created successfully' : 'নতুন শাখা সফলভাবে যুক্ত হয়েছে', 'success');
    }

    refreshData();
    setIsBranchModalOpen(false);
  };

  // Print Transfer Challan Modal
  const handlePrintTransferChallan = (transfer: StockTransferRequest) => {
    setSelectedTransferForPrint(transfer);
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto pb-16">
      {/* 1. Header Banner */}
      <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-700 rounded-3xl p-5 sm:p-6 text-white shadow-md relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-8 -mt-8 w-48 h-48 rounded-full bg-white/10 blur-2xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-2xl bg-white/20 backdrop-blur-md text-white">
                <Building2 className="w-6 h-6" />
              </span>
              <div>
                <h1 className="text-xl sm:text-2xl font-black tracking-tight">
                  {isEn ? 'Multi-Branch Management & Stock Hub' : 'মাল্টি-ব্রাঞ্চ ম্যানেজমেন্ট ও স্টক ট্রান্সফার হাব'}
                </h1>
                <p className="text-xs sm:text-sm text-emerald-100 mt-0.5">
                  {isEn
                    ? 'Compare branch performance side-by-side and transfer inventory instantly'
                    : 'শাখাগুলোর পারফরম্যান্স পাশাপাশি তুলনা করুন ও ১-ক্লিকে স্টক ট্রান্সফার করুন'}
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => handleOpenTransferModal()}
              className="px-4 py-2.5 rounded-2xl bg-white text-emerald-800 hover:bg-emerald-50 font-black text-xs sm:text-sm shadow-sm transition-all hover:scale-105 cursor-pointer flex items-center gap-2"
            >
              <ArrowRightLeft className="w-4 h-4 text-emerald-600" />
              <span>{isEn ? 'Transfer Stock' : 'স্টক ট্রান্সফার করুন'}</span>
            </button>

            <button
              type="button"
              onClick={() => handleOpenBranchModal()}
              className="px-3.5 py-2.5 rounded-2xl bg-emerald-500/40 hover:bg-emerald-500/60 border border-white/30 text-white font-bold text-xs sm:text-sm transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>{isEn ? 'Add Branch' : 'নতুন শাখা যোগ'}</span>
            </button>
          </div>
        </div>

        {/* 2. Top Metric KPI Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-4 border-t border-white/20">
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-3 border border-white/15">
            <span className="text-[11px] text-emerald-100 font-medium block">
              {isEn ? 'Active Branches' : 'সক্রিয় শাখা সংখ্যা'}
            </span>
            <div className="text-lg sm:text-xl font-black font-mono mt-0.5">
              {overallMetrics.totalActive} {isEn ? 'Outlets' : 'টি শাখা'}
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-3 border border-white/15">
            <span className="text-[11px] text-emerald-100 font-medium block">
              {isEn ? 'Combined Month Sales' : 'সকল শাখার মাসিক বিক্রি'}
            </span>
            <div className="text-lg sm:text-xl font-black font-mono mt-0.5">
              ৳ {overallMetrics.totalMonthlySales.toLocaleString()}
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-3 border border-white/15">
            <span className="text-[11px] text-emerald-100 font-medium block">
              {isEn ? 'In-Transit Shipments' : 'চলতি স্টক চালান (In-Transit)'}
            </span>
            <div className="text-lg sm:text-xl font-black font-mono mt-0.5 flex items-center gap-1.5">
              <Truck className="w-4 h-4 text-amber-300 animate-pulse" />
              <span>{overallMetrics.inTransitCount} {isEn ? 'transfers' : 'টি চালান'} ({overallMetrics.inTransitQty} pcs)</span>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-3 border border-white/15">
            <span className="text-[11px] text-emerald-100 font-medium block">
              {isEn ? 'Total Inventory Valuation' : 'সর্বমোট স্টক সম্পদ মূল্য'}
            </span>
            <div className="text-lg sm:text-xl font-black font-mono mt-0.5">
              ৳ {overallMetrics.totalStockVal.toLocaleString()}
            </div>
          </div>
        </div>
      </div>

      {/* 3. Navigation Tabs & Search / Filter Toolbar */}
      <div className="bg-white rounded-2xl p-3 shadow-xs border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Tab switchers */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => setActiveTab('grid')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'grid'
                ? 'bg-white text-emerald-800 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <GitCompare className="w-3.5 h-3.5" />
            <span>{isEn ? 'Side-by-Side Performance Grid' : 'পারফরম্যান্স তুলনা গ্রিড'}</span>
            <span className="px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-mono">
              {branches.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('transfers')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'transfers'
                ? 'bg-white text-emerald-800 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ArrowRightLeft className="w-3.5 h-3.5" />
            <span>{isEn ? 'Stock Transfer & Logistics' : 'স্টক ট্রান্সফার ও চালান'}</span>
            {overallMetrics.inTransitCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-amber-100 text-amber-800 text-[10px] font-mono font-bold animate-pulse">
                {overallMetrics.inTransitCount}
              </span>
            )}
          </button>
        </div>

        {/* Search & City Filter */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={isEn ? 'Search branches or transfers...' : 'শাখা বা চালানের নম্বর খুঁজুন...'}
              className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {activeTab === 'grid' && (
            <select
              value={cityFilter}
              onChange={(e) => setCityFilter(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
            >
              <option value="all">{isEn ? 'All Cities' : 'সকল শহর'}</option>
              {availableCities.map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>
          )}

          {activeTab === 'transfers' && (
            <select
              value={transferStatusFilter}
              onChange={(e) => setTransferStatusFilter(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
            >
              <option value="all">{isEn ? 'All Status' : 'সকল স্ট্যাটাস'}</option>
              <option value="in_transit">{isEn ? 'In Transit' : 'পথে আছে (In Transit)'}</option>
              <option value="received">{isEn ? 'Received' : 'গৃহীত (Received)'}</option>
              <option value="pending">{isEn ? 'Pending' : 'অপেক্ষমাণ'}</option>
              <option value="rejected">{isEn ? 'Rejected' : 'বাতিলকৃত'}</option>
            </select>
          )}
        </div>
      </div>

      {/* 4. TAB 1: SIDE-BY-SIDE PERFORMANCE GRID VIEW */}
      {activeTab === 'grid' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {filteredBranches.map((branch) => {
              const target = branch.targetMonthlySales || 250000;
              const current = branch.currentMonthlySales || 0;
              const progressPercent = Math.min(100, Math.round((current / target) * 100));

              return (
                <div
                  key={branch.id}
                  className={`bg-white rounded-3xl border shadow-xs transition-all duration-200 hover:shadow-md flex flex-col justify-between overflow-hidden relative ${
                    branch.isMainBranch ? 'border-emerald-300 ring-2 ring-emerald-500/20' : 'border-slate-200'
                  }`}
                >
                  {/* Top Header */}
                  <div className="p-4 bg-gradient-to-b from-slate-50/80 to-white border-b border-slate-100">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-slate-200/80 text-slate-700">
                            {branch.code}
                          </span>
                          {branch.isMainBranch && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                              {isEn ? 'Main Hub' : 'প্রধান শোরুম'}
                            </span>
                          )}
                        </div>
                        <h3 className="text-base font-black text-slate-900 mt-1">
                          {branch.name}
                        </h3>
                        <div className="flex items-center gap-1 text-slate-500 text-xs mt-0.5">
                          <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="truncate">{branch.address}, {branch.city}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleOpenBranchModal(branch)}
                          className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                          title={isEn ? 'Edit Branch' : 'শাখা তথ্য সম্পাদনা'}
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Body Metrics */}
                  <div className="p-4 space-y-3.5 flex-1">
                    {/* Sales Metrics */}
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-emerald-50/60 p-2.5 rounded-2xl border border-emerald-100">
                        <span className="text-[10px] text-emerald-800 font-semibold block">
                          {isEn ? "Today's Sales" : 'আজকের বিক্রি'}
                        </span>
                        <div className="text-base font-black text-emerald-700 font-mono">
                          ৳ {(branch.todaySales || 0).toLocaleString()}
                        </div>
                      </div>

                      <div className="bg-blue-50/60 p-2.5 rounded-2xl border border-blue-100">
                        <span className="text-[10px] text-blue-800 font-semibold block">
                          {isEn ? 'Month Sales' : 'মাসিক বিক্রি'}
                        </span>
                        <div className="text-base font-black text-blue-700 font-mono">
                          ৳ {current.toLocaleString()}
                        </div>
                      </div>
                    </div>

                    {/* Sales Target Progress Bar */}
                    <div>
                      <div className="flex items-center justify-between text-[11px] mb-1">
                        <span className="text-slate-500 font-medium">
                          {isEn ? 'Monthly Target' : 'মাসিক বিক্রয় লক্ষ্য'}: ৳{target.toLocaleString()}
                        </span>
                        <span className="font-bold text-emerald-700 font-mono">
                          {progressPercent}%
                        </span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                        <div
                          style={{ width: `${progressPercent}%` }}
                          className={`h-full rounded-full transition-all duration-500 ${
                            progressPercent >= 90
                              ? 'bg-emerald-500'
                              : progressPercent >= 60
                              ? 'bg-blue-500'
                              : 'bg-amber-500'
                          }`}
                        />
                      </div>
                    </div>

                    {/* Inventory & Assets */}
                    <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 space-y-1.5 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 flex items-center gap-1">
                          <Boxes className="w-3.5 h-3.5 text-slate-400" />
                          {isEn ? 'Total Stock Qty' : 'মোট মজুদ সংখ্যা'}:
                        </span>
                        <strong className="font-mono text-slate-800">
                          {(branch.totalStockQuantity || 0).toLocaleString()} {isEn ? 'pcs' : 'টি'}
                        </strong>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 flex items-center gap-1">
                          <DollarSign className="w-3.5 h-3.5 text-slate-400" />
                          {isEn ? 'Stock Valuation' : 'স্টক সম্পদ মূল্য'}:
                        </span>
                        <strong className="font-mono text-emerald-700">
                          ৳ {(branch.totalStockValuation || 0).toLocaleString()}
                        </strong>
                      </div>

                      <div className="flex items-center justify-between pt-1 border-t border-slate-200/60">
                        <span className="text-slate-500 flex items-center gap-1">
                          <Users className="w-3.5 h-3.5 text-slate-400" />
                          {isEn ? 'Manager & Staff' : 'ম্যানেজার ও স্টাফ'}:
                        </span>
                        <span className="font-medium text-slate-700 truncate max-w-[120px]">
                          {branch.managerName} ({branch.staffCount || 1})
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Footer Actions */}
                  <div className="p-3 bg-slate-50/80 border-t border-slate-100 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleOpenTransferModal(branch.id)}
                      className="flex-1 py-2 px-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-2xs transition-all cursor-pointer flex items-center justify-center gap-1"
                      title={isEn ? 'Ship stock from this branch' : 'এই শাখা থেকে পণ্য পাঠান'}
                    >
                      <ArrowRightLeft className="w-3.5 h-3.5" />
                      <span>{isEn ? 'Ship Stock' : 'স্টক পাঠান'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleOpenTransferModal(undefined, branch.id)}
                      className="flex-1 py-2 px-2.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold text-xs transition-all cursor-pointer flex items-center justify-center gap-1"
                      title={isEn ? 'Receive stock here' : 'এই শাখায় পণ্য আনুন'}
                    >
                      <Package className="w-3.5 h-3.5 text-slate-500" />
                      <span>{isEn ? 'Receive Here' : 'স্টক আনুন'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 5. TAB 2: STOCK TRANSFERS & LOGISTICS SHIPMENTS */}
      {activeTab === 'transfers' && (
        <div className="space-y-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                  <Truck className="w-4 h-4 text-emerald-600" />
                  <span>{isEn ? 'Inter-Branch Stock Movement Records' : 'আন্তঃশাখা স্টক চালান ও ট্র্যাকিং হিস্ট্রি'}</span>
                </h3>
                <p className="text-xs text-slate-500">
                  {isEn
                    ? 'Real-time stock transfer verification and delivery acceptance'
                    : 'শাখা থেকে শাখায় পণ্য পাঠানো, ট্র্যাকিং ও রিসিভ নিশ্চিতকরণ'}
                </p>
              </div>

              <button
                type="button"
                onClick={() => handleOpenTransferModal()}
                className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-2xs transition-all cursor-pointer flex items-center gap-1.5 self-start sm:self-auto"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{isEn ? 'New Stock Transfer' : '+ নতুন স্টক ট্রান্সফার চালান'}</span>
              </button>
            </div>

            {filteredTransfers.length === 0 ? (
              <div className="p-12 text-center text-slate-400">
                <Boxes className="w-12 h-12 mx-auto mb-2 text-slate-300" />
                <p className="text-sm font-medium">{isEn ? 'No transfer records found' : 'কোনো ট্রান্সফার রেকর্ড পাওয়া যায়নি'}</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50/80 text-slate-500 font-semibold border-b border-slate-100">
                    <tr>
                      <th className="p-3.5">{isEn ? 'Challan No' : 'চালান নম্বর'}</th>
                      <th className="p-3.5">{isEn ? 'Route (From → To)' : 'রুট (উৎস → গন্তব্য)'}</th>
                      <th className="p-3.5">{isEn ? 'Items & Quantity' : 'পণ্য ও মোট পরিমাণ'}</th>
                      <th className="p-3.5">{isEn ? 'Transfer Value' : 'মোট মূল্য'}</th>
                      <th className="p-3.5">{isEn ? 'Transport & Tracking' : 'পরিবহন ও ট্র্যাকিং'}</th>
                      <th className="p-3.5">{isEn ? 'Status' : 'স্ট্যাটাস'}</th>
                      <th className="p-3.5 text-right">{isEn ? 'Action' : 'অ্যাকশন'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {filteredTransfers.map((transfer) => {
                      const isPending = transfer.status === 'pending';
                      const isInTransit = transfer.status === 'in_transit';
                      const isReceived = transfer.status === 'received';

                      return (
                        <tr key={transfer.id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="p-3.5 font-mono font-bold text-slate-900">
                            <div>{transfer.transferNumber}</div>
                            <span className="text-[10px] text-slate-400 font-sans font-normal">
                              {transfer.transferDate}
                            </span>
                          </td>

                          <td className="p-3.5">
                            <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                              <span className="text-slate-900">{transfer.sourceBranchName}</span>
                              <ChevronRight className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                              <span className="text-emerald-700">{transfer.destinationBranchName}</span>
                            </div>
                            <span className="text-[10px] text-slate-400 block mt-0.5">
                              {isEn ? 'Initiated by' : 'প্রেরক'}: {transfer.initiatedBy}
                            </span>
                          </td>

                          <td className="p-3.5">
                            <div className="font-bold text-slate-900 font-mono">
                              {transfer.totalQuantity} {isEn ? 'pcs' : 'টি'} ({transfer.items.length} {isEn ? 'items' : 'ধরনের পণ্য'})
                            </div>
                            <div className="text-[10px] text-slate-500 truncate max-w-xs">
                              {transfer.items.map((it) => `${it.productName} (${it.quantity})`).join(', ')}
                            </div>
                          </td>

                          <td className="p-3.5 font-mono font-bold text-emerald-700">
                            ৳ {transfer.totalValue.toLocaleString()}
                          </td>

                          <td className="p-3.5">
                            <div className="text-slate-800 font-medium">
                              {transfer.transportVehicle || (isEn ? 'Store Delivery' : 'নিজস্ব ডেলিভারি')}
                            </div>
                            {transfer.trackingNumber && (
                              <span className="text-[10px] font-mono text-indigo-600 bg-indigo-50 px-1.5 py-0.2 rounded">
                                #{transfer.trackingNumber}
                              </span>
                            )}
                          </td>

                          <td className="p-3.5">
                            {isInTransit && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 font-bold text-[10px] border border-amber-200 animate-pulse">
                                <Truck className="w-3 h-3 text-amber-600" />
                                <span>{isEn ? 'In Transit' : 'চলতি পথে (In Transit)'}</span>
                              </span>
                            )}
                            {isReceived && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px] border border-emerald-200">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                <span>{isEn ? 'Received' : 'গৃহীত (Received)'}</span>
                              </span>
                            )}
                            {isPending && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 text-slate-800 font-bold text-[10px]">
                                <Clock className="w-3 h-3 text-slate-500" />
                                <span>{isEn ? 'Pending' : 'অপেক্ষমাণ'}</span>
                              </span>
                            )}
                          </td>

                          <td className="p-3.5 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => handlePrintTransferChallan(transfer)}
                                className="p-1.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer"
                                title={isEn ? 'Print Challan' : 'চালান রসিদ প্রিন্ট'}
                              >
                                <Printer className="w-3.5 h-3.5" />
                              </button>

                              {isInTransit && (
                                <button
                                  type="button"
                                  onClick={() => handleUpdateTransferStatus(transfer.id, 'received')}
                                  className="px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-2xs transition-colors cursor-pointer flex items-center gap-1"
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  <span>{isEn ? 'Accept' : 'রিসিভ করুন'}</span>
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL 1: INTER-BRANCH STOCK TRANSFER */}
      {isTransferModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-5 sm:p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center">
                  <ArrowRightLeft className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    {isEn ? 'New Stock Transfer Between Branches' : 'নতুন আন্তঃশাখা স্টক ট্রান্সফার চালান'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {isEn ? 'Move goods and update branch balances automatically' : 'এক শাখা থেকে অন্য শাখায় পণ্য পাঠিয়ে ব্যালেন্স সমন্বয় করুন'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsTransferModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateStockTransfer} className="space-y-4">
              {/* Source & Destination Branches */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    {isEn ? 'Source Branch (From / কোথা থেকে)' : 'উৎস শাখা (কোথা থেকে যাবে)'} *
                  </label>
                  <select
                    value={transferSourceId}
                    onChange={(e) => setTransferSourceId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                    required
                  >
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name} ({b.city}) - স্টক: {b.totalStockQuantity} টি
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    {isEn ? 'Destination Branch (To / কোথায় যাবে)' : 'গন্তব্য শাখা (কোথায় জমা হবে)'} *
                  </label>
                  <select
                    value={transferDestId}
                    onChange={(e) => setTransferDestId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                    required
                  >
                    {branches
                      .filter((b) => b.id !== transferSourceId)
                      .map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name} ({b.city})
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              {/* Product Picker & Basket */}
              <div className="space-y-2.5">
                <label className="text-xs font-bold text-slate-800 block">
                  {isEn ? 'Select Products to Transfer' : 'স্থানান্তরের পণ্য ও পরিমাণ নির্বাচন করুন'} *
                </label>

                <div className="flex items-center gap-2">
                  <select
                    value={selectedProductToAdd}
                    onChange={(e) => setSelectedProductToAdd(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                  >
                    <option value="">{isEn ? '-- Select Product from Catalog --' : '-- ক্যাটালগ থেকে পণ্য বাছাই করুন --'}</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} (ক্রয়মূল্য: ৳{p.purchasePrice || p.sellingPrice} | স্টক: {p.stock} {p.unit})
                      </option>
                    ))}
                  </select>

                  <input
                    type="number"
                    min="1"
                    value={addQuantity}
                    onChange={(e) => setAddQuantity(parseInt(e.target.value) || 1)}
                    className="w-20 px-2 py-2 rounded-xl border border-slate-200 bg-white text-xs font-mono font-bold text-center focus:ring-2 focus:ring-emerald-500"
                    placeholder="Qty"
                  />

                  <button
                    type="button"
                    onClick={handleAddItemToTransfer}
                    className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors cursor-pointer shrink-0"
                  >
                    + যোগ
                  </button>
                </div>

                {/* Transfer items table */}
                {transferItems.length > 0 ? (
                  <div className="rounded-2xl border border-slate-200 overflow-hidden">
                    <table className="w-full text-xs">
                      <thead className="bg-slate-100 text-slate-600 font-semibold">
                        <tr>
                          <th className="p-2.5 text-left">{isEn ? 'Product' : 'পণ্যের নাম'}</th>
                          <th className="p-2.5 text-center">{isEn ? 'Quantity' : 'পরিমাণ'}</th>
                          <th className="p-2.5 text-right">{isEn ? 'Subtotal' : 'সাবটোটাল'}</th>
                          <th className="p-2.5 text-center">মুছুন</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {transferItems.map((item) => (
                          <tr key={item.productId} className="hover:bg-slate-50">
                            <td className="p-2.5 font-medium text-slate-800">
                              {item.productName}
                              <span className="text-[10px] text-slate-400 block font-mono">SKU: {item.sku}</span>
                            </td>
                            <td className="p-2.5 text-center font-mono font-bold text-slate-900">
                              {item.quantity} {item.unit}
                            </td>
                            <td className="p-2.5 text-right font-mono font-bold text-emerald-700">
                              ৳ {(item.quantity * item.unitPrice).toLocaleString()}
                            </td>
                            <td className="p-2.5 text-center">
                              <button
                                type="button"
                                onClick={() => handleRemoveTransferItem(item.productId)}
                                className="p-1 rounded-lg text-rose-500 hover:bg-rose-50 cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    <div className="p-3 bg-emerald-50/50 border-t border-slate-200 flex items-center justify-between font-bold text-xs">
                      <span className="text-slate-700">
                        {isEn ? 'Total Transfer Quantity' : 'সর্বমোট ট্রান্সফার পরিমাণ'}:{' '}
                        <strong className="font-mono text-emerald-800">
                          {transferItems.reduce((a, b) => a + b.quantity, 0)} টি
                        </strong>
                      </span>
                      <span className="text-slate-700">
                        {isEn ? 'Total Asset Value' : 'মোট সম্পদ মূল্য'}:{' '}
                        <strong className="font-mono text-emerald-800">
                          ৳ {transferItems.reduce((a, b) => a + b.quantity * b.unitPrice, 0).toLocaleString()}
                        </strong>
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 rounded-xl border border-dashed border-slate-300 text-center text-slate-400 text-xs">
                    {isEn ? 'No products added yet. Choose a product above to add.' : 'এখনো কোনো পণ্য যোগ করা হয়নি। উপরের ড্রপডাউন থেকে পণ্য নির্বাচন করুন।'}
                  </div>
                )}
              </div>

              {/* Logistics Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    {isEn ? 'Transport Vehicle / Driver' : 'পরিবহন মাধ্যম / ড্রাইভার / কুরিয়ার'}
                  </label>
                  <input
                    type="text"
                    value={transportVehicle}
                    onChange={(e) => setTransportVehicle(e.target.value)}
                    placeholder="যেমন: ডেলিভারি ভ্যান ঢাকা মেট্রো-ন ১২-৩৪৫৬"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    {isEn ? 'Waybill / Tracking Number' : 'ট্র্যাকিং / চালান রেফারেন্স নম্বর'}
                  </label>
                  <input
                    type="text"
                    value={trackingNumber}
                    onChange={(e) => setTrackingNumber(e.target.value)}
                    placeholder="যেমন: TRK-9921"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  {isEn ? 'Transfer Notes / Remarks' : 'বিশেষ নোট বা মন্তব্য'}
                </label>
                <textarea
                  rows={2}
                  value={transferNotes}
                  onChange={(e) => setTransferNotes(e.target.value)}
                  placeholder="জরুরি স্টক রিস্টকিং..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsTransferModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 cursor-pointer"
                >
                  {isEn ? 'Cancel' : 'বাতিল'}
                </button>

                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-xs transition-all hover:scale-105 cursor-pointer flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isEn ? 'Dispatch Transfer Challan' : 'চালান প্রেরণ করুন'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: ADD / EDIT BRANCH */}
      {isBranchModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-2xl bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center justify-center">
                  <Building2 className="w-5 h-5" />
                </div>
                <h3 className="text-base font-black text-slate-900">
                  {selectedBranchForEdit
                    ? (isEn ? 'Edit Branch Information' : 'শাখার তথ্য সম্পাদনা')
                    : (isEn ? 'Add New Outlet / Branch' : 'নতুন শাখা বা আউটলেট যুক্ত করুন')}
                </h3>
              </div>

              <button
                type="button"
                onClick={() => setIsBranchModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveBranch} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2 sm:col-span-1">
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    {isEn ? 'Branch Name' : 'শাখার নাম'} *
                  </label>
                  <input
                    type="text"
                    value={branchForm.name}
                    onChange={(e) => setBranchForm({ ...branchForm, name: e.target.value })}
                    placeholder="যেমন: ধানমন্ডি আউটলেট"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-500 font-bold"
                    required
                  />
                </div>

                <div className="col-span-2 sm:col-span-1">
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    {isEn ? 'Branch Code' : 'ব্রাঞ্চ কোড'} *
                  </label>
                  <input
                    type="text"
                    value={branchForm.code}
                    onChange={(e) => setBranchForm({ ...branchForm, code: e.target.value })}
                    placeholder="BR-05"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono font-bold focus:ring-2 focus:ring-indigo-500 uppercase"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    {isEn ? 'Manager Name' : 'ম্যানেজারের নাম'} *
                  </label>
                  <input
                    type="text"
                    value={branchForm.managerName}
                    onChange={(e) => setBranchForm({ ...branchForm, managerName: e.target.value })}
                    placeholder="জনাব আরিফ"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    {isEn ? 'Phone Number' : 'মোবাইল নম্বর'} *
                  </label>
                  <input
                    type="text"
                    value={branchForm.phone}
                    onChange={(e) => setBranchForm({ ...branchForm, phone: e.target.value })}
                    placeholder="017xxxxxxxx"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    {isEn ? 'City / Division' : 'শহর / বিভাগ'} *
                  </label>
                  <input
                    type="text"
                    value={branchForm.city}
                    onChange={(e) => setBranchForm({ ...branchForm, city: e.target.value })}
                    placeholder="ঢাকা"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    {isEn ? 'Target Monthly Sales (৳)' : 'মাসিক বিক্রয় টার্গেট (৳)'}
                  </label>
                  <input
                    type="number"
                    value={branchForm.targetMonthlySales}
                    onChange={(e) => setBranchForm({ ...branchForm, targetMonthlySales: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono font-bold focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  {isEn ? 'Full Address' : 'পূর্ণাঙ্গ ঠিকানা'} *
                </label>
                <input
                  type="text"
                  value={branchForm.address}
                  onChange={(e) => setBranchForm({ ...branchForm, address: e.target.value })}
                  placeholder="রোড #২৭, ধানমন্ডি, ঢাকা"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              <div className="pt-1 flex items-center gap-2">
                <input
                  type="checkbox"
                  id="mainBranchCheckbox"
                  checked={branchForm.isMainBranch}
                  onChange={(e) => setBranchForm({ ...branchForm, isMainBranch: e.target.checked })}
                  className="w-4 h-4 text-emerald-600 rounded cursor-pointer"
                />
                <label htmlFor="mainBranchCheckbox" className="text-xs text-slate-700 font-bold cursor-pointer">
                  {isEn ? 'Set as Central Main Hub' : 'প্রধান কেন্দ্রীয় শোরুম (Main Hub) হিসেবে চিহ্নিত করুন'}
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsBranchModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 cursor-pointer"
                >
                  {isEn ? 'Cancel' : 'বাতিল'}
                </button>

                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs shadow-xs transition-all hover:scale-105 cursor-pointer"
                >
                  {isEn ? 'Save Branch' : 'শাখা সংরক্ষণ করুন'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: PRINTABLE CHALLAN RECEIPT */}
      {selectedTransferForPrint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div>
                <h4 className="text-base font-black text-slate-900">
                  {shop.name || 'SmartShopX Enterprise'}
                </h4>
                <p className="text-xs text-slate-500">
                  {isEn ? 'Official Inter-Branch Delivery Challan' : 'অফিসিয়াল আন্তঃশাখা পণ্য স্থানান্তর চালান'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTransferForPrint(null)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 text-xs space-y-1.5 font-mono">
              <div className="flex justify-between">
                <span className="text-slate-500">চালান নম্বর:</span>
                <span className="font-bold text-slate-900">{selectedTransferForPrint.transferNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">তারিখ:</span>
                <span>{selectedTransferForPrint.transferDate}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">উৎস শাখা:</span>
                <span className="font-bold text-slate-800">{selectedTransferForPrint.sourceBranchName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">গন্তব্য শাখা:</span>
                <span className="font-bold text-emerald-700">{selectedTransferForPrint.destinationBranchName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">পরিবহন মাধ্যম:</span>
                <span>{selectedTransferForPrint.transportVehicle || 'নিজস্ব বাহন'}</span>
              </div>
            </div>

            <div className="border border-slate-200 rounded-2xl overflow-hidden text-xs">
              <table className="w-full">
                <thead className="bg-slate-100 text-slate-600 font-bold">
                  <tr>
                    <th className="p-2 text-left">পণ্য বিবরণী</th>
                    <th className="p-2 text-center">পরিমাণ</th>
                    <th className="p-2 text-right">মূল্য (৳)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {selectedTransferForPrint.items.map((it, idx) => (
                    <tr key={idx}>
                      <td className="p-2 font-medium">{it.productName}</td>
                      <td className="p-2 text-center font-mono font-bold">{it.quantity} {it.unit}</td>
                      <td className="p-2 text-right font-mono">৳{(it.quantity * it.unitPrice).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="p-2.5 bg-slate-50 border-t border-slate-200 flex justify-between font-bold text-xs">
                <span>সর্বমোট:</span>
                <span className="font-mono text-emerald-700">৳{selectedTransferForPrint.totalValue.toLocaleString()}</span>
              </div>
            </div>

            <div className="pt-6 grid grid-cols-2 gap-4 text-center text-xs text-slate-400">
              <div className="border-t border-slate-300 pt-1">
                প্রেরকের স্বাক্ষর
              </div>
              <div className="border-t border-slate-300 pt-1">
                গ্রহীতার স্বাক্ষর
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedTransferForPrint(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 cursor-pointer"
              >
                {isEn ? 'Close' : 'বন্ধ করুন'}
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Printer className="w-4 h-4" />
                <span>{isEn ? 'Print Challan' : 'প্রিন্ট করুন'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
