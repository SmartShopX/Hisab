import React, { useState, useMemo } from 'react';
import { Product } from '../../types';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { DataStore } from '../../services/dataStorage';
import { useAuth } from '../../context/AuthContext';
import { formatCurrency } from '../../utils/formatters';
import {
  Barcode,
  Printer,
  Tag,
  Grid,
  Sliders,
  CheckCircle2,
  Copy,
  Layers,
} from 'lucide-react';

interface BarcodePriceTagGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialProduct?: Product | null;
}

export const BarcodePriceTagGeneratorModal: React.FC<BarcodePriceTagGeneratorModalProps> = ({
  isOpen,
  onClose,
  initialProduct,
}) => {
  const { shop } = useAuth();
  const products = useMemo(() => DataStore.getProducts(), [isOpen]);

  const [selectedProductId, setSelectedProductId] = useState<string>(
    initialProduct?.id || products[0]?.id || ''
  );
  const [printCopies, setPrintCopies] = useState<number>(12);
  const [tagSize, setTagSize] = useState<'standard' | 'mini' | 'shelf_label'>('standard');
  const [showShopName, setShowShopName] = useState(true);
  const [showPrice, setShowPrice] = useState(true);
  const [showSku, setShowSku] = useState(true);
  const [showExpiry, setShowExpiry] = useState(true);

  const selectedProduct = useMemo(() => {
    return products.find((p) => p.id === selectedProductId) || initialProduct || products[0];
  }, [products, selectedProductId, initialProduct]);

  if (!isOpen || !selectedProduct) return null;

  const handlePrint = () => {
    window.print();
  };

  // Generate mock barcode bars visual representation
  const barcodeNumber = selectedProduct.barcode || selectedProduct.sku || '8901234567890';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="বারকোড ও প্রাইজ স্টিকার প্রিন্টার (Barcode & Shelf Tag Generator)"
      maxWidth="3xl"
    >
      <div className="space-y-4">
        {/* Controls Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">পণ্য নির্বাচন করুন</label>
            <select
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-xl font-medium focus:ring-2 focus:ring-emerald-500"
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} (৳{p.sellingPrice})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">স্টিকার সাইজ ও ধরন</label>
            <select
              value={tagSize}
              onChange={(e) => setTagSize(e.target.value as any)}
              className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-xl font-medium focus:ring-2 focus:ring-emerald-500"
            >
              <option value="standard">স্ট্যান্ডার্ড বারকোড স্টিকার (38×25mm)</option>
              <option value="mini">মিনি ড্রাগ/জুয়েলারি লেবেল (25×15mm)</option>
              <option value="shelf_label">সেলফ / র‍্যাক প্রাইজ ট্যাগ (50×30mm)</option>
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">প্রিন্ট কপি সংখ্যা</label>
            <div className="flex items-center gap-1.5">
              <input
                type="number"
                min={1}
                max={100}
                value={printCopies}
                onChange={(e) => setPrintCopies(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-20 px-2.5 py-1.5 bg-white border border-slate-300 rounded-xl font-bold text-center"
              />
              <div className="flex items-center gap-1">
                {[6, 12, 24].map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setPrintCopies(c)}
                    className="px-2 py-1 bg-white border border-slate-200 rounded-lg text-[11px] font-bold text-slate-600 hover:bg-slate-100"
                  >
                    {c}টি
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Options Checklist */}
        <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-700 px-1">
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={showShopName}
              onChange={(e) => setShowShopName(e.target.checked)}
              className="rounded text-emerald-600"
            />
            <span>দোকানের নাম</span>
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={showPrice}
              onChange={(e) => setShowPrice(e.target.checked)}
              className="rounded text-emerald-600"
            />
            <span>বিক্রয় মূল্য (MRP)</span>
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={showSku}
              onChange={(e) => setShowSku(e.target.checked)}
              className="rounded text-emerald-600"
            />
            <span>SKU / কোড</span>
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={showExpiry}
              onChange={(e) => setShowExpiry(e.target.checked)}
              className="rounded text-emerald-600"
            />
            <span>মেয়াদ / ব্যাচ</span>
          </label>
        </div>

        {/* Printable Stickers Sheet Preview */}
        <div className="p-4 bg-slate-100 rounded-2xl border border-slate-200 max-h-[50vh] overflow-y-auto">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 print:grid-cols-3 print:gap-1.5 bg-white p-4 rounded-xl border border-slate-300">
            {Array.from({ length: printCopies }).map((_, i) => (
              <div
                key={i}
                className={`border border-dashed border-slate-400 p-2 rounded-lg bg-white flex flex-col items-center justify-between text-center ${
                  tagSize === 'shelf_label'
                    ? 'p-3 min-h-[110px]'
                    : tagSize === 'mini'
                    ? 'p-1.5 min-h-[75px]'
                    : 'p-2 min-h-[95px]'
                }`}
              >
                {/* Shop Name */}
                {showShopName && (
                  <span className="text-[9px] font-black text-slate-800 uppercase tracking-tighter truncate max-w-full">
                    {shop.name}
                  </span>
                )}

                {/* Product Name */}
                <span className="text-[10px] font-bold text-slate-900 line-clamp-1 leading-tight mt-0.5">
                  {selectedProduct.name}
                </span>

                {/* Barcode Visual Bars */}
                <div className="my-1 flex flex-col items-center">
                  <div className="flex items-center justify-center gap-[1.5px] h-6 px-1">
                    {Array.from({ length: 30 }).map((_, bIdx) => (
                      <span
                        key={bIdx}
                        className={`inline-block bg-slate-900 ${
                          bIdx % 3 === 0
                            ? 'w-[2px] h-6'
                            : bIdx % 2 === 0
                            ? 'w-[1px] h-5'
                            : 'w-[1.5px] h-6'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="font-mono text-[9px] font-black tracking-widest text-slate-900 mt-0.5">
                    {barcodeNumber}
                  </span>
                </div>

                {/* Meta details: MRP, SKU, Expiry */}
                <div className="w-full flex items-center justify-between text-[9px] border-t border-slate-100 pt-0.5 mt-0.5">
                  {showPrice && (
                    <span className="font-black text-emerald-800 text-[10px]">
                      MRP: ৳{selectedProduct.sellingPrice}
                    </span>
                  )}
                  {showSku && (
                    <span className="font-mono text-slate-500">{selectedProduct.sku}</span>
                  )}
                </div>

                {showExpiry && (selectedProduct.expiryDate || selectedProduct.batchNumber) && (
                  <span className="text-[8px] text-slate-500 font-mono">
                    Exp: {selectedProduct.expiryDate || 'N/A'} {selectedProduct.batchNumber ? `| B:${selectedProduct.batchNumber}` : ''}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
          <Button variant="outline" size="sm" onClick={onClose}>
            বন্ধ করুন
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={handlePrint}
            leftIcon={<Printer className="w-4 h-4" />}
            className="bg-slate-900 hover:bg-slate-800"
          >
            {printCopies} টি স্টিকার প্রিন্ট করুন
          </Button>
        </div>
      </div>
    </Modal>
  );
};
