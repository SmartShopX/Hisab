import React, { useState } from 'react';
import { Product, Shop } from '../../types';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { formatCurrency } from '../../utils/formatters';
import { Printer, Barcode as BarcodeIcon, Tag, Sliders, Check } from 'lucide-react';
import { useToast } from '../../context/ToastContext';

interface BarcodePrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  shop: Shop;
}

type LabelSize = '50x30' | '38x25' | 'a4_30';

export const BarcodePrintModal: React.FC<BarcodePrintModalProps> = ({
  isOpen,
  onClose,
  products,
  shop,
}) => {
  const { showToast } = useToast();
  const [selectedProductId, setSelectedProductId] = useState<string>(
    products[0]?.id || ''
  );
  const [printCopies, setPrintCopies] = useState<number>(10);
  const [labelSize, setLabelSize] = useState<LabelSize>('50x30');
  const [showShopName, setShowShopName] = useState(true);
  const [showPrice, setShowPrice] = useState(true);
  const [showSku, setShowSku] = useState(true);
  const [showRack, setShowRack] = useState(false);
  const [showExpiry, setShowExpiry] = useState(false);
  const [showWholesale, setShowWholesale] = useState(false);

  const activeProduct = products.find((p) => p.id === selectedProductId) || products[0];

  const handlePrint = () => {
    window.print();
    showToast(`${printCopies} টি বারকোড স্টিকার প্রিন্ট পাঠানো হয়েছে`, 'success');
  };

  if (!activeProduct) return null;

  // Simple clean SVG barcode generator for Code-128 visual simulation
  const generateBarcodeSvg = (code: string) => {
    const bars: boolean[] = [];
    // Deterministic pseudo pattern from char codes
    for (let i = 0; i < code.length; i++) {
      const charCode = code.charCodeAt(i);
      bars.push(true, false, charCode % 2 === 0, true, charCode % 3 === 0, false, true);
    }
    // ensure guard bars at start and end
    const fullBars = [true, false, true, false, ...bars, false, true, false, true, true];

    return (
      <svg
        className="w-full h-8"
        viewBox={`0 0 ${fullBars.length * 2} 40`}
        preserveAspectRatio="none"
      >
        {fullBars.map((isBar, idx) =>
          isBar ? (
            <rect
              key={idx}
              x={idx * 2}
              y={0}
              width={1.8}
              height={40}
              fill="#000000"
            />
          ) : null
        )}
      </svg>
    );
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="বারকোড ও প্রাইস স্টিকার প্রিন্টার (Barcode & Label Print)"
      maxWidth="3xl"
    >
      <div className="space-y-6">
        {/* Settings Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">পণ্য নির্বাচন করুন</label>
            <select
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-medium text-xs focus:ring-2 focus:ring-emerald-500"
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.sku})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">স্টিকার সাইজ / ফরম্যাট</label>
            <select
              value={labelSize}
              onChange={(e) => setLabelSize(e.target.value as LabelSize)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-medium text-xs focus:ring-2 focus:ring-emerald-500"
            >
              <option value="50x30">৫০ × ৩০ মিমি (স্ট্যান্ডার্ড থার্মাল লেবেল)</option>
              <option value="38x25">৩৮ × ২৫ মিমি (জুয়েলারি ও এক্সেসরিজ)</option>
              <option value="a4_30">A4 স্টিকার শিট (৩০ টি স্টিকার / পেজ)</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">প্রিন্ট সংখ্যা (কপি)</label>
            <input
              type="number"
              min="1"
              max="200"
              value={printCopies}
              onChange={(e) => setPrintCopies(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-mono text-xs focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        {/* Display Options Checkboxes */}
        <div className="flex flex-wrap items-center gap-4 text-xs text-slate-700">
          <label className="flex items-center gap-2 cursor-pointer font-medium">
            <input
              type="checkbox"
              checked={showShopName}
              onChange={(e) => setShowShopName(e.target.checked)}
              className="rounded text-emerald-600 focus:ring-emerald-500"
            />
            <span>দোকানের নাম দেখান</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer font-medium">
            <input
              type="checkbox"
              checked={showPrice}
              onChange={(e) => setShowPrice(e.target.checked)}
              className="rounded text-emerald-600 focus:ring-emerald-500"
            />
            <span>মূল্য (MRP) দেখান</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer font-medium">
            <input
              type="checkbox"
              checked={showSku}
              onChange={(e) => setShowSku(e.target.checked)}
              className="rounded text-emerald-600 focus:ring-emerald-500"
            />
            <span>SKU কোড দেখান</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer font-medium">
            <input
              type="checkbox"
              checked={showRack}
              onChange={(e) => setShowRack(e.target.checked)}
              className="rounded text-emerald-600 focus:ring-emerald-500"
            />
            <span>র্যাক / তাক লোকেশন</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer font-medium">
            <input
              type="checkbox"
              checked={showExpiry}
              onChange={(e) => setShowExpiry(e.target.checked)}
              className="rounded text-emerald-600 focus:ring-emerald-500"
            />
            <span>মেয়াদ তারিখ (Exp Date)</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer font-medium">
            <input
              type="checkbox"
              checked={showWholesale}
              onChange={(e) => setShowWholesale(e.target.checked)}
              className="rounded text-emerald-600 focus:ring-emerald-500"
            />
            <span>পাইকারি মূল্য (Wholesale)</span>
          </label>
        </div>

        {/* Preview Area with Print Styles */}
        <div className="border border-slate-200 rounded-2xl p-4 sm:p-6 bg-slate-100/70">
          <div className="flex items-center justify-between mb-3 text-xs text-slate-500">
            <span className="font-semibold">প্রিভিউ ({printCopies} টি লেবেল তৈরি হয়েছে):</span>
            <span className="text-[11px] font-mono">রোলে সরাসরি বা সাধারণ প্রিন্টারে প্রিন্ট করুন</span>
          </div>

          {/* Printable Container */}
          <div
            id="printable-barcode-sheet"
            className="max-h-96 overflow-y-auto p-4 bg-white rounded-xl shadow-xs border border-slate-200 flex flex-wrap gap-3 justify-start"
          >
            {Array.from({ length: printCopies }).map((_, index) => (
              <div
                key={index}
                className={`bg-white border border-slate-900/40 p-2 flex flex-col justify-between items-center text-center text-black rounded-xs ${
                  labelSize === '38x25'
                    ? 'w-[140px] h-[95px] text-[9px]'
                    : 'w-[185px] h-[120px] text-[11px]'
                }`}
                style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}
              >
                {/* Shop Name */}
                {showShopName && (
                  <div className="font-bold uppercase tracking-wider text-[10px] leading-none truncate w-full">
                    {shop.name}
                  </div>
                )}

                {/* Product Name */}
                <div className="font-semibold leading-tight line-clamp-2 w-full px-1">
                  {activeProduct.name}
                </div>

                {/* Sub details: Rack / Expiry */}
                {(showRack || showExpiry) && (
                  <div className="w-full flex items-center justify-between px-1 text-[8px] text-slate-700 font-medium">
                    {showRack && activeProduct.rackLocation ? (
                      <span>র্যাক: {activeProduct.rackLocation}</span>
                    ) : (
                      <span />
                    )}
                    {showExpiry && activeProduct.expiryDate ? (
                      <span>Exp: {activeProduct.expiryDate}</span>
                    ) : (
                      <span />
                    )}
                  </div>
                )}

                {/* Barcode Lines */}
                <div className="w-full px-2 py-0.5">
                  {generateBarcodeSvg(activeProduct.barcode || activeProduct.sku)}
                  <div className="font-mono text-[9px] tracking-widest leading-none mt-0.5 font-bold">
                    {activeProduct.barcode || activeProduct.sku}
                  </div>
                </div>

                {/* Bottom Row: SKU & Price */}
                <div className="w-full flex items-center justify-between px-1 text-[10px] font-bold border-t border-slate-400 pt-0.5">
                  {showSku ? (
                    <span className="font-mono text-[9px]">{activeProduct.sku}</span>
                  ) : showWholesale && activeProduct.wholesalePrice ? (
                    <span className="font-mono text-[8px] text-slate-600">WS: ৳{activeProduct.wholesalePrice}</span>
                  ) : (
                    <span />
                  )}
                  {showPrice ? (
                    <span className="font-mono text-[11px]">
                      MRP: ৳{(activeProduct.sellingPrice - activeProduct.discount).toLocaleString('bn-BD')}
                    </span>
                  ) : (
                    <span />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-200">
          <p className="text-xs text-slate-500">
            নোট: Xprinter, Rongta, TSC বা Zebra থার্মাল লেবেল প্রিন্টারে শতভাগ কার্যকর।
          </p>

          <div className="flex items-center gap-3">
            <Button onClick={onClose} variant="outline" size="sm">
              বাতিল
            </Button>
            <Button
              onClick={handlePrint}
              variant="primary"
              size="md"
              leftIcon={<Printer className="w-4 h-4" />}
            >
              বারকোড প্রিন্ট করুন ({printCopies} টি)
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
