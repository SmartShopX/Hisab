import React from 'react';
import { Product } from '../../types';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { formatCurrency } from '../../utils/formatters';
import { getExpiryStatus } from '../../utils/pharmacyHelper';
import { Pill, CheckCircle2, AlertTriangle, ArrowRight, Layers, MapPin, Plus } from 'lucide-react';

interface MedicineSubstituteModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  substitutes: Product[];
  onSelectSubstitute?: (product: Product) => void;
}

export const MedicineSubstituteModal: React.FC<MedicineSubstituteModalProps> = ({
  isOpen,
  onClose,
  product,
  substitutes,
  onSelectSubstitute,
}) => {
  if (!product) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="বিকল্প ওষুধ খুঁজুন (Generic Medicine Substitutes)"
      size="lg"
    >
      <div className="space-y-5">
        {/* Selected Product Banner */}
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-emerald-100 text-emerald-800">
                <Pill className="w-4 h-4" />
              </span>
              <h3 className="font-black text-slate-900 text-base">{product.name}</h3>
              {product.requiresPrescription && (
                <span className="text-[10px] bg-rose-100 text-rose-700 font-bold px-2 py-0.5 rounded-md border border-rose-200">
                  Rx প্রেসক্রিপশন
                </span>
              )}
            </div>
            <p className="text-xs text-slate-600 font-medium">
              <strong className="text-slate-700">জেনেরিক উপাদান:</strong>{' '}
              <span className="text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                {product.genericName || 'জেনেরিক নাম সেট করা নেই'}
              </span>
            </p>
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 pt-1">
              <span>কোম্পানি: {product.brand || product.manufacturer || 'N/A'}</span>
              <span>•</span>
              <span className="flex items-center gap-1 text-slate-700 font-semibold">
                <MapPin className="w-3.5 h-3.5 text-blue-600" />
                {product.rackLocation || 'র‌্যাক নির্দিষ্ট নেই'}
              </span>
            </div>
          </div>

          <div className="text-right sm:border-l sm:border-slate-200 sm:pl-4">
            <p className="text-xs text-slate-500">বর্তমান স্টক</p>
            <p
              className={`text-lg font-black font-mono ${
                product.stock <= 0
                  ? 'text-rose-600'
                  : product.stock <= product.minStock
                  ? 'text-amber-600'
                  : 'text-emerald-600'
              }`}
            >
              {product.stock} {product.unit || 'পিস'}
            </p>
            <p className="text-xs font-bold text-slate-700 font-mono">
              {formatCurrency(product.sellingPrice)}
            </p>
          </div>
        </div>

        {/* Substitute Recommendations List */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-emerald-600" />
              <span>একই জেনেরিকের বিকল্প ব্র্যান্ডসমূহ ({substitutes.length}টি পাওয়া গেছে)</span>
            </h4>
            <span className="text-[11px] text-slate-500">
              ডোজ ও সক্রিয় উপাদান শতভাগ এক
            </span>
          </div>

          {substitutes.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-2">
              <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto" />
              <p className="text-xs font-bold text-slate-700">
                এই জেনেরিকের অন্য কোনো বিকল্প ওষুধ স্টকে খুঁজে পাওয়া যায়নি।
              </p>
              <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                পণ্য তালিকায় একই জেনেরিক নাম ({product.genericName}) দিয়ে অন্য কোম্পানির ওষুধ যোগ করলে এখানে স্বয়ংক্রিয়ভাবে দেখাবে।
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 max-h-80 overflow-y-auto pr-1">
              {substitutes.map((sub) => {
                const exp = getExpiryStatus(sub.expiryDate);
                const isOutOfStock = sub.stock <= 0;

                return (
                  <div
                    key={sub.id}
                    className="p-3.5 rounded-2xl border border-slate-200 hover:border-emerald-500 bg-white hover:bg-emerald-50/20 transition-all flex items-center justify-between gap-3 shadow-xs"
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-black text-xs text-slate-900 truncate">
                          {sub.name}
                        </span>
                        <span className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md font-medium">
                          {sub.brand || sub.manufacturer}
                        </span>
                        {exp.isNearExpiry && (
                          <span className={`text-[10px] px-2 py-0.5 rounded-md border ${exp.badgeClass}`}>
                            {exp.formattedText}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3 text-[11px] text-slate-500 flex-wrap">
                        <span className="flex items-center gap-1 text-slate-700 font-semibold">
                          <MapPin className="w-3 h-3 text-blue-600" />
                          {sub.rackLocation || 'র‌্যাক নির্দিষ্ট নেই'}
                        </span>
                        <span>•</span>
                        <span>ব্যাচ: {sub.batchNumber || 'N/A'}</span>
                        {sub.dosageForm && (
                          <>
                            <span>•</span>
                            <span>ফর্ম: {sub.dosageForm}</span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-4 shrink-0 text-right">
                      <div>
                        <span className="text-sm font-black text-emerald-700 font-mono block">
                          {formatCurrency(sub.sellingPrice)}
                        </span>
                        <span
                          className={`text-[10px] font-mono font-bold block ${
                            isOutOfStock ? 'text-rose-600' : 'text-slate-600'
                          }`}
                        >
                          স্টক: {sub.stock} {sub.unit || 'পিস'}
                        </span>
                      </div>

                      {onSelectSubstitute && (
                        <Button
                          disabled={isOutOfStock}
                          onClick={() => {
                            onSelectSubstitute(sub);
                            onClose();
                          }}
                          variant="primary"
                          size="sm"
                          className="text-xs shrink-0 flex items-center gap-1 cursor-pointer bg-emerald-600 hover:bg-emerald-700 text-white"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>কার্টে যোগ</span>
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Pharmacist Tip Footer */}
        <div className="bg-blue-50 border border-blue-200 p-3 rounded-xl flex items-start gap-2 text-xs text-blue-800">
          <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
          <p>
            <strong>ফার্মাসিস্ট টিপস:</strong> মূল ওষুধ আউট অফ স্টক থাকলে প্রেসক্রিপশনের অনুমোদিত নিয়মে একই জেনেরিক ও সমমানের পাওয়ারের বিকল্প প্রদান করলে কাস্টমার খালি হাতে ফিরে যায় না।
          </p>
        </div>
      </div>
    </Modal>
  );
};
