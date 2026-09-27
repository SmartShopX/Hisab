import React, { useState, useMemo } from 'react';
import { Product } from '../../types';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { formatCurrency } from '../../utils/formatters';
import { getExpiryStatus } from '../../utils/pharmacyHelper';
import {
  AlertTriangle,
  Printer,
  Calendar,
  Building2,
  MapPin,
  CheckCircle2,
  FileText,
} from 'lucide-react';

interface NearExpiryReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
}

export const NearExpiryReportModal: React.FC<NearExpiryReportModalProps> = ({
  isOpen,
  onClose,
  products,
}) => {
  const [filterRange, setFilterRange] = useState<30 | 60 | 90 | 180>(90);
  const [selectedCompany, setSelectedCompany] = useState<string>('all');

  const expiryList = useMemo(() => {
    return products
      .filter((p) => p.category === 'Pharmacy & Medicine' || p.expiryDate)
      .map((p) => {
        const exp = getExpiryStatus(p.expiryDate, filterRange);
        return {
          product: p,
          ...exp,
        };
      })
      .filter((item) => item.isExpired || item.daysRemaining <= filterRange)
      .sort((a, b) => a.daysRemaining - b.daysRemaining);
  }, [products, filterRange]);

  const companies = useMemo(() => {
    const list = Array.from(
      new Set(
        expiryList
          .map((item) => item.product.brand || item.product.manufacturer)
          .filter(Boolean) as string[]
      )
    );
    return ['all', ...list];
  }, [expiryList]);

  const filteredExpiryList = useMemo(() => {
    if (selectedCompany === 'all') return expiryList;
    return expiryList.filter(
      (item) =>
        (item.product.brand || item.product.manufacturer || '').toLowerCase() ===
        selectedCompany.toLowerCase()
    );
  }, [expiryList, selectedCompany]);

  const totalCostAtRisk = useMemo(() => {
    return filteredExpiryList.reduce(
      (sum, item) => sum + (item.product.purchasePrice || 0) * (item.product.stock || 0),
      0
    );
  }, [filteredExpiryList]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="ওষুধের মেয়াদোত্তীর্ণ ও কোম্পানি রিটার্ন রিপোর্ট (Near Expiry Alerts)"
      size="xl"
    >
      <div className="space-y-5 print:p-0">
        {/* Top Summary Banner */}
        <div className="bg-gradient-to-r from-amber-500/10 via-rose-500/10 to-amber-500/10 border border-amber-300/40 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900">
                মেয়াদোত্তীর্ণ আসন্ন ওষুধ: {filteredExpiryList.length} টি
              </h3>
              <p className="text-xs text-slate-600">
                ঝুঁকিতে থাকা মোট ক্রয়মূল্য: <strong className="text-rose-700 font-mono font-bold">{formatCurrency(totalCostAtRisk)}</strong>
              </p>
            </div>
          </div>

          {/* Quick Print Button */}
          <div className="flex items-center gap-2">
            <Button
              onClick={handlePrint}
              variant="outline"
              size="sm"
              className="text-xs flex items-center gap-1.5 cursor-pointer bg-white"
            >
              <Printer className="w-4 h-4 text-slate-700" />
              <span>কোম্পানি রিটার্ন স্লিপ প্রিন্ট</span>
            </Button>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-700 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              <span>মেয়াদের সময়সীমা:</span>
            </span>
            <div className="flex gap-1">
              {[
                { label: '৩০ দিন', value: 30 },
                { label: '৬০ দিন', value: 60 },
                { label: '৯০ দিন', value: 90 },
                { label: '৬ মাস', value: 180 },
              ].map((pill) => (
                <button
                  key={pill.value}
                  type="button"
                  onClick={() => setFilterRange(pill.value as any)}
                  className={`px-2.5 py-1 rounded-lg font-bold cursor-pointer transition-all ${
                    filterRange === pill.value
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {pill.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-700 flex items-center gap-1">
              <Building2 className="w-3.5 h-3.5" />
              <span>ফার্মা কোম্পানি:</span>
            </span>
            <select
              value={selectedCompany}
              onChange={(e) => setSelectedCompany(e.target.value)}
              className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs font-semibold focus:ring-1 focus:ring-emerald-500"
            >
              <option value="all">সকল কোম্পানি</option>
              {companies.filter((c) => c !== 'all').map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Table of Expiring Medicines */}
        <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto max-h-80">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100/80 text-slate-700 sticky top-0 border-b border-slate-200 uppercase font-black text-[10px] tracking-wider">
                <tr>
                  <th className="p-3">ওষুধের নাম ও জেনেরিক</th>
                  <th className="p-3">কোম্পানি</th>
                  <th className="p-3">র‌্যাক ও ব্যাচ</th>
                  <th className="p-3 text-center">মেয়াদোত্তীর্ণ তারিখ</th>
                  <th className="p-3 text-right">বর্তমান স্টক</th>
                  <th className="p-3 text-right">মোট ক্রয়মূল্য</th>
                  <th className="p-3 text-center">স্ট্যাটাস</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {filteredExpiryList.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-400 text-xs">
                      নির্বাচিত সময়সীমায় কোনো মেয়াদোত্তীর্ণ ওষুধ নেই। আলহামদুলিল্লাহ!
                    </td>
                  </tr>
                ) : (
                  filteredExpiryList.map((item) => (
                    <tr key={item.product.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-3">
                        <span className="font-bold text-slate-900 block text-xs">
                          {item.product.name}
                        </span>
                        <span className="text-[11px] text-emerald-700 block">
                          {item.product.genericName || 'N/A'}
                        </span>
                      </td>
                      <td className="p-3 text-slate-600 font-medium">
                        {item.product.brand || item.product.manufacturer || 'N/A'}
                      </td>
                      <td className="p-3">
                        <span className="text-slate-800 font-semibold flex items-center gap-1 text-[11px]">
                          <MapPin className="w-3 h-3 text-blue-600" />
                          {item.product.rackLocation || 'নির্দিষ্ট নেই'}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          ব্যাচ: {item.product.batchNumber || 'N/A'}
                        </span>
                      </td>
                      <td className="p-3 text-center font-mono font-bold text-slate-800">
                        {item.product.expiryDate || 'N/A'}
                      </td>
                      <td className="p-3 text-right font-mono font-bold text-slate-900">
                        {item.product.stock} {item.product.unit || 'পিস'}
                      </td>
                      <td className="p-3 text-right font-mono font-bold text-rose-700">
                        {formatCurrency((item.product.purchasePrice || 0) * item.product.stock)}
                      </td>
                      <td className="p-3 text-center">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full border ${item.badgeClass}`}>
                          {item.formattedText}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pharmacy Return Tip */}
        <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-xl flex items-start gap-2.5 text-xs text-emerald-900">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">কোম্পানি রিটার্ন টিপস:</p>
            <p className="text-[11px] text-emerald-800 leading-relaxed">
              মেয়াদ শেষ হওয়ার ৩০ থেকে ৬০ দিন আগে ওষুধের তালিকা প্রিন্ট করে সংশ্লিষ্ট কোম্পানির রিপ্রেজেনটেটিভ (MPO)-কে জমা দিন। ড্রাগ অ্যাক্ট অনুযায়ী কোম্পানির প্রতিনিধি মেয়াদোত্তীর্ণ হওয়ার আগেই সম্পূর্ণ মূল্যে প্রোডাক্ট রিপ্লেসমেন্ট প্রদান করতে বাধ্য।
            </p>
          </div>
        </div>
      </div>
    </Modal>
  );
};
