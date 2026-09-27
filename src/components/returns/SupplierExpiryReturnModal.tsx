import React, { useState, useMemo } from 'react';
import { Product, Supplier } from '../../types';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { DataStore } from '../../services/dataStorage';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import {
  PackageX,
  Printer,
  Share2,
  Calendar,
  Building2,
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet,
  Trash2,
  Plus,
  Send,
  Download,
} from 'lucide-react';

interface ReturnItemRow {
  productId: string;
  name: string;
  batchNumber: string;
  expiryDate: string;
  quantity: number;
  maxStock: number;
  unitPrice: number;
  total: number;
}

interface SupplierExpiryReturnModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialProduct?: Product | null;
  onSuccess?: () => void;
}

export const SupplierExpiryReturnModal: React.FC<SupplierExpiryReturnModalProps> = ({
  isOpen,
  onClose,
  initialProduct,
  onSuccess,
}) => {
  const { shop } = useAuth();
  const { showToast } = useToast();

  const products = useMemo(() => DataStore.getProducts(), [isOpen]);
  const suppliers = useMemo(() => DataStore.getSuppliers(), [isOpen]);

  const [selectedSupplierId, setSelectedSupplierId] = useState<string>(
    suppliers[0]?.id || ''
  );
  const [returnChallanNumber] = useState(
    () => `RET-${new Date().getFullYear()}${Math.floor(1000 + Math.random() * 9000)}`
  );
  const [returnDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [returnReason, setReturnReason] = useState('মেয়াদোত্তীর্ণ / আসন্ন মেয়াদ শেষ জনিত রিটার্ন');
  const [notes, setNotes] = useState('');

  // Rows of products to return
  const [items, setItems] = useState<ReturnItemRow[]>(() => {
    if (initialProduct) {
      return [
        {
          productId: initialProduct.id,
          name: initialProduct.name,
          batchNumber: initialProduct.batchNumber || 'N/A',
          expiryDate: initialProduct.expiryDate || '',
          quantity: Math.min(Number(initialProduct.stock) || 1, 5),
          maxStock: Number(initialProduct.stock) || 0,
          unitPrice: Number(initialProduct.purchasePrice || initialProduct.sellingPrice) || 0,
          total:
            (Math.min(Number(initialProduct.stock) || 1, 5)) *
            (Number(initialProduct.purchasePrice || initialProduct.sellingPrice) || 0),
        },
      ];
    }
    return [];
  });

  const [showPreviewChallan, setShowPreviewChallan] = useState(false);

  // Selected supplier details
  const selectedSupplier = useMemo(() => {
    return suppliers.find((s) => s.id === selectedSupplierId) || suppliers[0];
  }, [suppliers, selectedSupplierId]);

  const grandTotal = useMemo(() => {
    return items.reduce((sum, it) => sum + it.total, 0);
  }, [items]);

  const handleAddProduct = (prodId: string) => {
    const prod = products.find((p) => p.id === prodId);
    if (!prod) return;

    if (items.some((it) => it.productId === prod.id)) {
      showToast('পণ্যটি ইতোমধ্যে লিস্টে যোগ করা হয়েছে', 'info');
      return;
    }

    const qty = Math.min(Number(prod.stock) || 1, 5);
    const price = Number(prod.purchasePrice || prod.sellingPrice) || 0;
    setItems([
      ...items,
      {
        productId: prod.id,
        name: prod.name,
        batchNumber: prod.batchNumber || 'N/A',
        expiryDate: prod.expiryDate || '',
        quantity: qty,
        maxStock: Number(prod.stock) || 0,
        unitPrice: price,
        total: qty * price,
      },
    ]);
  };

  const handleUpdateQty = (index: number, newQty: number) => {
    const updated = [...items];
    const item = updated[index];
    const qty = Math.max(1, Math.min(newQty, item.maxStock || 999));
    item.quantity = qty;
    item.total = qty * item.unitPrice;
    setItems(updated);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleCompleteReturn = () => {
    if (items.length === 0) {
      showToast('অনুগ্রহ করে অন্তত একটি পণ্য রিটার্ন তালিকায় যোগ করুন', 'warning');
      return;
    }

    // Deduct inventory stock from DataStore
    const allProds = DataStore.getProducts();
    const updatedProducts = allProds.map((p) => {
      const returnedRow = items.find((it) => it.productId === p.id);
      if (returnedRow) {
        return {
          ...p,
          stock: Math.max(0, (Number(p.stock) || 0) - returnedRow.quantity),
        };
      }
      return p;
    });

    DataStore.setProducts(updatedProducts);
    window.dispatchEvent(new CustomEvent('smartshopx_products_updated'));

    showToast(
      `চালান #${returnChallanNumber} সফলভাবে তৈরি ও স্টক অ্যাডজাস্ট সম্পন্ন হয়েছে!`,
      'success'
    );
    setShowPreviewChallan(true);
    if (onSuccess) onSuccess();
  };

  const handlePrint = () => {
    window.print();
  };

  const handleShareWhatsApp = () => {
    if (!selectedSupplier) return;
    const phone = selectedSupplier.mobile.replace(/[^0-9]/g, '');
    const itemsList = items
      .map(
        (it) =>
          `• ${it.name} [ব্যাচ: ${it.batchNumber}, মেয়াদ: ${it.expiryDate || 'N/A'}] - ${it.quantity} টি × ৳${it.unitPrice} = ৳${it.total}`
      )
      .join('\n');

    const msg =
      `*${shop.name} - সাপ্লায়ার এক্সপায়ারি/ড্যামেজ রিটার্ন চালান*\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `চালান নং: #${returnChallanNumber}\n` +
      `তারিখ: ${formatDate(returnDate)}\n` +
      `সাপ্লায়ার: ${selectedSupplier.companyName || selectedSupplier.name}\n` +
      `\n📦 *ফেরত পণ্যের তালিকা:*\n${itemsList}\n` +
      `\n💰 *মোট রিটার্ন মূল্য: ৳${grandTotal.toLocaleString('bn-BD')}*\n` +
      `কারণ: ${returnReason}\n` +
      (notes ? `নোট: ${notes}\n` : '') +
      `\nদোকানের ঠিকানা: ${shop.address}\n` +
      `মোবাইল: ${shop.mobile}`;

    const encoded = encodeURIComponent(msg);
    const waUrl = phone.startsWith('880')
      ? `https://api.whatsapp.com/send?phone=${phone}&text=${encoded}`
      : `https://api.whatsapp.com/send?phone=880${phone.substring(1)}&text=${encoded}`;

    window.open(waUrl, '_blank');
  };

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={showPreviewChallan ? 'সাপ্লায়ার রিটার্ন চালান মেমো' : 'ড্যামেজ ও মেয়াদোত্তীর্ণ পণ্য রিটার্ন চালান'}
      maxWidth="3xl"
    >
      {!showPreviewChallan ? (
        <div className="space-y-4">
          {/* Top Form Header */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-200 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                সাপ্লায়ার নির্বাচন করুন:
              </label>
              <select
                value={selectedSupplierId}
                onChange={(e) => setSelectedSupplierId(e.target.value)}
                className="w-full px-3 py-2 bg-white rounded-xl border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-emerald-500"
              >
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.companyName || s.name} ({s.mobile})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                চালান রেফারেন্স ও তারিখ:
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={returnChallanNumber}
                  className="w-1/2 px-3 py-2 bg-slate-100 rounded-xl border border-slate-200 text-xs font-mono font-bold text-slate-700"
                />
                <input
                  type="text"
                  readOnly
                  value={formatDate(returnDate)}
                  className="w-1/2 px-3 py-2 bg-slate-100 rounded-xl border border-slate-200 text-xs text-slate-700 font-medium"
                />
              </div>
            </div>
          </div>

          {/* Quick Product Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              রিটার্ন তালিকায় পণ্য যোগ করুন:
            </label>
            <select
              onChange={(e) => {
                if (e.target.value) {
                  handleAddProduct(e.target.value);
                  e.target.value = '';
                }
              }}
              className="w-full px-3 py-2 bg-white rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">+ তালিকা থেকে পণ্য নির্বাচন করুন...</option>
              {products
                .filter((p) => Number(p.stock) > 0)
                .map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} (মজুদ: {p.stock} {p.unit || 'টি'} | মেয়াদ: {p.expiryDate || 'N/A'})
                  </option>
                ))}
            </select>
          </div>

          {/* Items Table */}
          <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                <tr>
                  <th className="p-2.5">পণ্যের নাম</th>
                  <th className="p-2.5">ব্যাচ / মেয়াদ</th>
                  <th className="p-2.5 w-24">পরিমাণ</th>
                  <th className="p-2.5 text-right">কেনা দর</th>
                  <th className="p-2.5 text-right">মোট মূল্য</th>
                  <th className="p-2.5 text-center w-10">অ্যাকশন</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-6 text-center text-slate-400">
                      কোনো পণ্য এখনো যোগ করা হয়নি। উপরের ড্রপডাউন থেকে পণ্য নির্বাচন করুন।
                    </td>
                  </tr>
                ) : (
                  items.map((it, idx) => (
                    <tr key={it.productId} className="hover:bg-slate-50/70">
                      <td className="p-2.5 font-bold text-slate-800">{it.name}</td>
                      <td className="p-2.5 text-slate-500 font-mono text-[11px]">
                        {it.batchNumber} / {it.expiryDate || 'N/A'}
                      </td>
                      <td className="p-2.5">
                        <input
                          type="number"
                          min={1}
                          max={it.maxStock || 999}
                          value={it.quantity}
                          onChange={(e) => handleUpdateQty(idx, parseInt(e.target.value) || 1)}
                          className="w-16 px-2 py-1 bg-white border border-slate-300 rounded-lg text-center font-bold"
                        />
                      </td>
                      <td className="p-2.5 text-right font-mono text-slate-700">
                        ৳{it.unitPrice.toLocaleString('bn-BD')}
                      </td>
                      <td className="p-2.5 text-right font-mono font-bold text-slate-900">
                        ৳{it.total.toLocaleString('bn-BD')}
                      </td>
                      <td className="p-2.5 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(idx)}
                          className="text-rose-500 hover:text-rose-700 p-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Reason and Grand Total */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 bg-rose-50/60 rounded-2xl border border-rose-200">
            <div className="w-full sm:w-2/3">
              <label className="block text-[11px] font-bold text-rose-900 mb-1">
                রিটার্ন করার কারণ / মন্তব্য:
              </label>
              <input
                type="text"
                value={returnReason}
                onChange={(e) => setReturnReason(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-white border border-rose-300 rounded-xl text-xs focus:ring-1 focus:ring-rose-500"
              />
            </div>
            <div className="text-right w-full sm:w-auto">
              <span className="text-[11px] text-slate-500 block">মোট ফেরত মূল্য (Credit Claim)</span>
              <span className="text-base font-black text-rose-700 font-mono">
                ৳ {grandTotal.toLocaleString('bn-BD')}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-100">
            <Button variant="outline" size="sm" onClick={onClose}>
              বাতিল
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleCompleteReturn}
              leftIcon={<FileSpreadsheet className="w-4 h-4" />}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              রিটার্ন চালান সম্পন্ন করুন ও মেমো দেখুন
            </Button>
          </div>
        </div>
      ) : (
        /* Printable Challan Preview */
        <div className="space-y-4">
          <div className="p-6 bg-white border border-slate-300 rounded-2xl shadow-sm text-slate-800 space-y-4 font-sans print:border-none print:shadow-none print:p-0">
            {/* Header */}
            <div className="flex items-start justify-between border-b border-slate-200 pb-3">
              <div>
                <h2 className="text-lg font-black text-slate-900">{shop.name}</h2>
                <p className="text-xs text-slate-500">{shop.address}</p>
                <p className="text-xs text-slate-500">ফোন: {shop.mobile}</p>
              </div>
              <div className="text-right">
                <span className="inline-block bg-rose-100 text-rose-800 px-2.5 py-1 rounded-full text-xs font-black">
                  সাপ্লায়ার রিটার্ন চালান (Challan)
                </span>
                <p className="text-xs font-mono font-bold mt-1 text-slate-700">#{returnChallanNumber}</p>
                <p className="text-xs text-slate-500">{formatDate(returnDate)}</p>
              </div>
            </div>

            {/* Supplier Meta */}
            <div className="p-3 bg-slate-50 rounded-xl text-xs space-y-1">
              <p><strong>প্রাপক / কোম্পানি:</strong> {selectedSupplier?.companyName || selectedSupplier?.name}</p>
              <p><strong>মোবাইল:</strong> {selectedSupplier?.mobile}</p>
              <p><strong>কারণ:</strong> {returnReason}</p>
            </div>

            {/* Table */}
            <table className="w-full text-xs text-left border-collapse border border-slate-200">
              <thead className="bg-slate-100 font-bold">
                <tr>
                  <th className="border p-2">ক্রম</th>
                  <th className="border p-2">পণ্যের বিবরণ</th>
                  <th className="border p-2">ব্যাচ নং</th>
                  <th className="border p-2 text-center">পরিমাণ</th>
                  <th className="border p-2 text-right">কেনা দর</th>
                  <th className="border p-2 text-right">মোট</th>
                </tr>
              </thead>
              <tbody>
                {items.map((it, i) => (
                  <tr key={i}>
                    <td className="border p-2 text-center">{i + 1}</td>
                    <td className="border p-2 font-bold">{it.name}</td>
                    <td className="border p-2 font-mono">{it.batchNumber}</td>
                    <td className="border p-2 text-center font-bold">{it.quantity} টি</td>
                    <td className="border p-2 text-right font-mono">৳{it.unitPrice}</td>
                    <td className="border p-2 text-right font-mono font-bold">৳{it.total}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-slate-50 font-bold">
                  <td colSpan={5} className="border p-2 text-right">সর্বমোট রিটার্ন ভাউচার মূল্য:</td>
                  <td className="border p-2 text-right font-mono text-sm text-rose-700">
                    ৳{grandTotal.toLocaleString('bn-BD')}
                  </td>
                </tr>
              </tfoot>
            </table>

            {/* Signatures */}
            <div className="flex items-center justify-between pt-10 text-xs text-slate-500">
              <div className="text-center border-t border-slate-300 pt-1 w-32">
                দোকানদারের স্বাক্ষর
              </div>
              <div className="text-center border-t border-slate-300 pt-1 w-32">
                সাপ্লায়ার প্রতিনিধির স্বাক্ষর
              </div>
            </div>
          </div>

          {/* Action Footer */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-100">
            <Button variant="outline" size="sm" onClick={() => setShowPreviewChallan(false)}>
              পূর্ববর্তী পেজ
            </Button>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleShareWhatsApp}
                leftIcon={<Share2 className="w-4 h-4 text-emerald-600" />}
                className="border-emerald-300 text-emerald-800"
              >
                WhatsApp চালান
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handlePrint}
                leftIcon={<Printer className="w-4 h-4" />}
              >
                চালান প্রিন্ট করুন
              </Button>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
};
