import React, { useState, useRef } from 'react';
import { Customer } from '../../types';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { csvHelper } from '../../utils/csvHelper';
import { useToast } from '../../context/ToastContext';
import { UploadCloud, Download, CheckCircle2, AlertCircle, Trash2 } from 'lucide-react';

interface BulkCustomerImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete: (newCustomers: Customer[]) => void;
}

interface ParsedCustomerRow {
  name: string;
  mobile: string;
  address: string;
  notes: string;
  isValid: boolean;
  error?: string;
}

export const BulkCustomerImportModal: React.FC<BulkCustomerImportModalProps> = ({
  isOpen,
  onClose,
  onImportComplete,
}) => {
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [parsedRows, setParsedRows] = useState<ParsedCustomerRow[]>([]);
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
          showToast('ফাইলে কোনো গ্রাহকের তথ্য পাওয়া যায়নি', 'warning');
          return;
        }

        const dataRows = rows.slice(1);
        const parsed: ParsedCustomerRow[] = dataRows.map((r) => {
          const name = r[0]?.trim() || '';
          const mobile = r[1]?.trim() || '';
          const address = r[2]?.trim() || '';
          const notes = r[3]?.trim() || '';

          const isValid = Boolean(name && mobile && mobile.length >= 8);
          const error = !name
            ? 'নাম প্রদান করুন'
            : !mobile
            ? 'মোবাইল নম্বর অনুপস্থিত'
            : mobile.length < 8
            ? 'সঠিক মোবাইল নম্বর নয়'
            : undefined;

          return {
            name,
            mobile,
            address,
            notes,
            isValid,
            error,
          };
        });

        setParsedRows(parsed);
        showToast(`${parsed.length} জন গ্রাহক প্রসেস হয়েছে`, 'info');
      } catch {
        showToast('CSV ফাইল পড়তে সমস্যা হয়েছে', 'error');
      }
    };

    reader.readAsText(file);
  };

  const handleImportSubmit = () => {
    const validRows = parsedRows.filter((r) => r.isValid);
    if (validRows.length === 0) {
      showToast('কোনো সঠিক গ্রাহকের তথ্য পাওয়া যায়নি', 'warning');
      return;
    }

    setIsProcessing(true);

    const newCustomers: Customer[] = validRows.map((r, idx) => ({
      id: `cust_imp_${Date.now()}_${idx}`,
      name: r.name,
      mobile: r.mobile,
      address: r.address,
      notes: r.notes || undefined,
      totalPurchases: 0,
      totalSpent: 0,
      dueBalance: 0,
      ordersCount: 0,
      riskLevel: 'Low',
      deliverySuccessRate: 100,
      ordersDelivered: 0,
      ordersCancelled: 0,
      ordersReturned: 0,
      createdAt: new Date().toISOString().split('T')[0],
    }));

    onImportComplete(newCustomers);
    setIsProcessing(false);
    showToast(`${newCustomers.length} জন নতুন গ্রাহক সফলভাবে ইম্পোর্ট করা হয়েছে!`, 'success');
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
      title="বাল্ক গ্রাহক ইম্পোর্ট (Bulk Customer Import)"
      maxWidth="3xl"
    >
      <div className="space-y-5">
        {/* Top Header & Sample CSV */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-emerald-50 border border-emerald-200 p-4 rounded-2xl text-xs text-emerald-900">
          <div>
            <p className="font-bold text-sm">এক সাথে বহু গ্রাহকের পরিচিতি ও নম্বর যুক্ত করুন</p>
            <p className="text-emerald-700 mt-0.5">
              এসএমএস ক্যাম্পেইন ও দ্রুত অর্ডার কাটতে এক্সেল থেকে গ্রাহকের তালিকা আপলোড করুন।
            </p>
          </div>
          <Button
            onClick={() => csvHelper.downloadCustomerSample()}
            variant="outline"
            size="sm"
            leftIcon={<Download className="w-4 h-4" />}
            className="bg-white border-emerald-300 text-emerald-800 hover:bg-emerald-100/50 shrink-0"
          >
            নমুনা গ্রাহক CSV
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
            <p className="text-sm font-bold text-slate-800">CSV ফাইল ড্র্যাগ করুন অথবা ক্লিক করুন</p>
            <p className="text-xs text-slate-500 mt-1">কলাম: নাম, মোবাইল, ঠিকানা, নোট</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
              <div className="flex items-center gap-3">
                <span className="font-semibold text-slate-700">{fileName}</span>
                <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md font-semibold">
                  সঠিক: {validCount} জন
                </span>
                {invalidCount > 0 && (
                  <span className="bg-rose-100 text-rose-800 px-2 py-0.5 rounded-md font-semibold">
                    ত্রুটি: {invalidCount} জন
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

            <div className="max-h-72 overflow-y-auto border border-slate-200 rounded-xl overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold sticky top-0">
                    <th className="py-2.5 px-3">স্ট্যাটাস</th>
                    <th className="py-2.5 px-3">গ্রাহকের নাম</th>
                    <th className="py-2.5 px-3">মোবাইল নম্বর</th>
                    <th className="py-2.5 px-3">ঠিকানা</th>
                    <th className="py-2.5 px-3">নোট</th>
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
                      <td className="py-2 px-3 font-mono">{row.mobile}</td>
                      <td className="py-2 px-3 text-slate-600">{row.address || '—'}</td>
                      <td className="py-2 px-3 text-slate-500">{row.notes || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

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
            {isProcessing ? 'ইম্পোর্ট হচ্ছে...' : `${validCount} জন গ্রাহক সংরক্ষণ করুন`}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
