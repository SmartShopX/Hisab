import React, { useState, useRef } from 'react';
import { Product } from '../../types';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { csvHelper } from '../../utils/csvHelper';
import { useToast } from '../../context/ToastContext';
import { UploadCloud, FileSpreadsheet, Download, CheckCircle2, AlertCircle, Trash2 } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';

interface BulkProductImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete: (newProducts: Product[]) => void;
}

interface ParsedProductRow {
  name: string;
  category: string;
  sku: string;
  barcode: string;
  purchasePrice: number;
  sellingPrice: number;
  stock: number;
  unit: string;
  brand: string;
  description: string;
  isValid: boolean;
  error?: string;
}

export const BulkProductImportModal: React.FC<BulkProductImportModalProps> = ({
  isOpen,
  onClose,
  onImportComplete,
}) => {
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [parsedRows, setParsedRows] = useState<ParsedProductRow[]>([]);
  const [fileName, setFileName] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processFile(file);
  };

  const processFile = (file: File) => {
    setFileName(file.name);
    const reader = new FileReader();

    reader.onload = (evt) => {
      try {
        const text = evt.target?.result as string;
        const rows = csvHelper.parseCsv(text);
        if (rows.length < 2) {
          showToast('ফাইলে কোনো পণ্যের তথ্য পাওয়া যায়নি', 'warning');
          return;
        }

        // Header is row 0; data starts at row 1
        const dataRows = rows.slice(1);
        const parsed: ParsedProductRow[] = dataRows.map((r) => {
          const name = r[0]?.trim() || '';
          const category = r[1]?.trim() || 'সাধারণ';
          const sku = r[2]?.trim() || `SKU-${Math.floor(1000 + Math.random() * 9000)}`;
          const barcode = r[3]?.trim() || sku;
          const purchasePrice = parseFloat(r[4]) || 0;
          const sellingPrice = parseFloat(r[5]) || 0;
          const stock = parseInt(r[6], 10) || 0;
          const unit = r[7]?.trim() || 'Pcs';
          const brand = r[8]?.trim() || '';
          const description = r[9]?.trim() || '';

          const isValid = Boolean(name && sellingPrice > 0);
          const error = !name
            ? 'পণ্যের নাম অনুপস্থিত'
            : sellingPrice <= 0
            ? 'বিক্রয় মূল্য সঠিক নয়'
            : undefined;

          return {
            name,
            category,
            sku,
            barcode,
            purchasePrice,
            sellingPrice,
            stock,
            unit,
            brand,
            description,
            isValid,
            error,
          };
        });

        setParsedRows(parsed);
        showToast(`${parsed.length} টি পণ্যের সারি প্রসেস হয়েছে`, 'info');
      } catch {
        showToast('CSV ফাইল পড়তে সমস্যা হয়েছে। সঠিক ফরম্যাট যাচাই করুন।', 'error');
      }
    };

    reader.readAsText(file);
  };

  const handleImportSubmit = () => {
    const validRows = parsedRows.filter((r) => r.isValid);
    if (validRows.length === 0) {
      showToast('ইম্পোর্ট করার মতো কোনো সঠিক পণ্য পাওয়া যায়নি', 'warning');
      return;
    }

    setIsProcessing(true);

    const newProducts: Product[] = validRows.map((r, idx) => ({
      id: `prod_imp_${Date.now()}_${idx}`,
      name: r.name,
      category: r.category,
      sku: r.sku,
      barcode: r.barcode,
      purchasePrice: r.purchasePrice,
      sellingPrice: r.sellingPrice,
      stock: r.stock,
      unit: r.unit,
      brand: r.brand || undefined,
      description: r.description || undefined,
      images: ['https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&auto=format&fit=crop&q=60'],
      isActive: true,
      showInLandingPage: false,
      discount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));

    onImportComplete(newProducts);
    setIsProcessing(false);
    showToast(`${newProducts.length} টি নতুন পণ্য সফলভাবে ইম্পোর্ট করা হয়েছে!`, 'success');
    handleReset();
    onClose();
  };

  const handleReset = () => {
    setParsedRows([]);
    setFileName('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const validCount = parsedRows.filter((r) => r.isValid).length;
  const invalidCount = parsedRows.length - validCount;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="বাল্ক পণ্য ইম্পোর্ট (Bulk CSV Product Entry)"
      maxWidth="3xl"
    >
      <div className="space-y-5">
        {/* Top guide & sample download */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-emerald-50 border border-emerald-200 p-4 rounded-2xl text-xs text-emerald-900">
          <div>
            <p className="font-bold text-sm">এক ক্লিকে শত শত পণ্য ডাটাবেজে যুক্ত করুন</p>
            <p className="text-emerald-700 mt-0.5">
              এক্সেল বা গুগল শিট থেকে .CSV ফাইলে রূপান্তর করে খুব সহজেই একবারে আপলোড করুন।
            </p>
          </div>
          <Button
            onClick={() => csvHelper.downloadProductSample()}
            variant="outline"
            size="sm"
            leftIcon={<Download className="w-4 h-4" />}
            className="bg-white border-emerald-300 text-emerald-800 hover:bg-emerald-100/50 shrink-0"
          >
            নমুনা CSV টেমপ্লেট
          </Button>
        </div>

        {/* File Dropzone */}
        {parsedRows.length === 0 ? (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-300 hover:border-emerald-500 hover:bg-emerald-50/20 p-8 rounded-2xl flex flex-col items-center justify-center text-center cursor-pointer transition-colors"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,text/csv"
              onChange={handleFileChange}
              className="hidden"
            />
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-3">
              <UploadCloud className="w-6 h-6" />
            </div>
            <p className="text-sm font-bold text-slate-800">CSV ফাইল ড্র্যাগ করুন অথবা ক্লিক করে নির্বাচন করুন</p>
            <p className="text-xs text-slate-500 mt-1">UTF-8 ফরম্যাটে সংরক্ষিত .CSV ফাইল সমর্থিত</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Summary Bar */}
            <div className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
              <div className="flex items-center gap-3">
                <span className="font-semibold text-slate-700">{fileName}</span>
                <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md font-semibold">
                  সঠিক: {validCount} টি
                </span>
                {invalidCount > 0 && (
                  <span className="bg-rose-100 text-rose-800 px-2 py-0.5 rounded-md font-semibold">
                    ত্রুটি: {invalidCount} টি
                  </span>
                )}
              </div>
              <button
                onClick={handleReset}
                className="text-rose-600 hover:text-rose-700 text-xs font-semibold flex items-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                ফাইল সরান
              </button>
            </div>

            {/* Preview Table */}
            <div className="max-h-72 overflow-y-auto border border-slate-200 rounded-xl overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold sticky top-0">
                    <th className="py-2.5 px-3">স্ট্যাটাস</th>
                    <th className="py-2.5 px-3">পণ্যের নাম</th>
                    <th className="py-2.5 px-3">ক্যাটাগরি</th>
                    <th className="py-2.5 px-3">SKU</th>
                    <th className="py-2.5 px-3 text-right">ক্রয় মূল্য</th>
                    <th className="py-2.5 px-3 text-right">বিক্রয় মূল্য</th>
                    <th className="py-2.5 px-3 text-center">স্টক</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {parsedRows.map((row, i) => (
                    <tr
                      key={i}
                      className={row.isValid ? 'hover:bg-slate-50' : 'bg-rose-50/50 text-rose-900'}
                    >
                      <td className="py-2 px-3">
                        {row.isValid ? (
                          <span className="text-emerald-600 flex items-center gap-1">
                            <CheckCircle2 className="w-4 h-4" />
                            ঠিক আছে
                          </span>
                        ) : (
                          <span className="text-rose-600 flex items-center gap-1 font-medium">
                            <AlertCircle className="w-4 h-4" />
                            {row.error}
                          </span>
                        )}
                      </td>
                      <td className="py-2 px-3 font-semibold">{row.name}</td>
                      <td className="py-2 px-3">{row.category}</td>
                      <td className="py-2 px-3 font-mono">{row.sku}</td>
                      <td className="py-2 px-3 text-right font-mono">
                        {formatCurrency(row.purchasePrice)}
                      </td>
                      <td className="py-2 px-3 text-right font-mono font-bold">
                        {formatCurrency(row.sellingPrice)}
                      </td>
                      <td className="py-2 px-3 text-center font-mono font-semibold">
                        {row.stock} {row.unit}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Bottom Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-200">
          <Button onClick={onClose} variant="outline" size="sm">
            বাতিল
          </Button>

          <Button
            onClick={handleImportSubmit}
            variant="primary"
            size="md"
            disabled={isProcessing || validCount === 0}
            leftIcon={<CheckCircle2 className="w-4 h-4" />}
          >
            {isProcessing ? 'ইম্পোর্ট হচ্ছে...' : `${validCount} টি পণ্য ইম্পোর্ট নিশ্চিত করুন`}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
