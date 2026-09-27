import React, { useMemo } from 'react';
import { DataStore } from '../../services/dataStorage';
import { useAuth } from '../../context/AuthContext';
import { formatCurrency } from '../../utils/formatters';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import {
  Users,
  Award,
  TrendingUp,
  ShoppingBag,
  DollarSign,
  ShieldCheck,
  CheckCircle2,
  Printer,
} from 'lucide-react';

interface StaffPerformanceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const StaffPerformanceModal: React.FC<StaffPerformanceModalProps> = ({
  isOpen,
  onClose,
}) => {
  const staffList = useMemo(() => DataStore.getStaff(), [isOpen]);
  const orders = useMemo(() => DataStore.getOrders(), [isOpen]);

  // Calculate stats per staff
  const staffPerformance = useMemo(() => {
    return staffList.map((s) => {
      // Find orders served by this staff
      const staffOrders = orders.filter(
        (o) => o.servedByStaffId === s.id || o.servedByStaffName?.toLowerCase() === s.name.toLowerCase()
      );

      const totalSales = staffOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
      const ordersCount = staffOrders.length;
      const commissionRate = 1.5; // Default 1.5% incentive/commission
      const commissionEarned = (totalSales * commissionRate) / 100;

      return {
        staff: s,
        ordersCount,
        totalSales,
        commissionEarned,
      };
    });
  }, [staffList, orders]);

  if (!isOpen) return null;

  const totalStoreSales = orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="কর্মচারীদের বিক্রয় ও পারফরম্যান্স রিপোর্ট (Staff Performance & Commissions)"
      maxWidth="3xl"
    >
      <div className="space-y-4">
        {/* Top Overview Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3.5 bg-indigo-50 border border-indigo-200 rounded-2xl">
            <div className="flex items-center gap-2 mb-1 text-indigo-700 font-bold text-xs">
              <Users className="w-4 h-4" />
              <span>মোট বিক্রয়কর্মী</span>
            </div>
            <div className="text-xl font-black font-mono text-indigo-900">
              {staffList.length.toLocaleString('bn-BD')} জন
            </div>
            <p className="text-[10px] text-indigo-600 mt-0.5">অ্যাক্টিভ স্টাফ সদস্য</p>
          </div>

          <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl">
            <div className="flex items-center gap-2 mb-1 text-emerald-700 font-bold text-xs">
              <ShoppingBag className="w-4 h-4" />
              <span>মোট বিক্রয় মেমো</span>
            </div>
            <div className="text-xl font-black font-mono text-emerald-900">
              {orders.length.toLocaleString('bn-BD')} টি
            </div>
            <p className="text-[10px] text-emerald-600 mt-0.5">মোট মূল্য: {formatCurrency(totalStoreSales)}</p>
          </div>

          <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl">
            <div className="flex items-center gap-2 mb-1 text-amber-700 font-bold text-xs">
              <Award className="w-4 h-4" />
              <span>ইনসেন্টিভ / কমিশন পলিসি</span>
            </div>
            <div className="text-lg font-black text-amber-900 font-mono">
              ১.৫% বিক্রয় কমিশন
            </div>
            <p className="text-[10px] text-amber-600 mt-0.5">টার্গেটভিত্তিক বিক্রয় উৎসাহ</p>
          </div>
        </div>

        {/* Staff Table */}
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                <th className="py-2.5 px-3">কর্মচারীর নাম ও পদবী</th>
                <th className="py-2.5 px-3">মোবাইল</th>
                <th className="py-2.5 px-3 text-center">মেমো সংখ্যা</th>
                <th className="py-2.5 px-3 text-right">মোট বিক্রয় (৳)</th>
                <th className="py-2.5 px-3 text-right">অর্জিত কমিশন (৳)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {staffPerformance.map(({ staff, ordersCount, totalSales, commissionEarned }) => (
                <tr key={staff.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-2.5 px-3">
                    <div className="font-bold text-slate-800">{staff.name}</div>
                    <div className="text-[10px] text-slate-400 capitalize">{staff.role}</div>
                  </td>
                  <td className="py-2.5 px-3 font-mono text-slate-600">{staff.mobile}</td>
                  <td className="py-2.5 px-3 text-center font-bold font-mono">
                    {ordersCount > 0 ? (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                        {ordersCount} টি
                      </span>
                    ) : (
                      <span className="text-slate-400">০ টি</span>
                    )}
                  </td>
                  <td className="py-2.5 px-3 text-right font-black font-mono text-slate-900">
                    {formatCurrency(totalSales)}
                  </td>
                  <td className="py-2.5 px-3 text-right font-black font-mono text-emerald-700">
                    {formatCurrency(commissionEarned)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
          <Button variant="outline" size="sm" onClick={onClose}>
            বন্ধ করুন
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => window.print()}
            leftIcon={<Printer className="w-4 h-4" />}
          >
            রিপোর্ট প্রিন্ট করুন
          </Button>
        </div>
      </div>
    </Modal>
  );
};
