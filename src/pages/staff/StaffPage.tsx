import React, { useState, useEffect } from 'react';
import { StaffUser, StaffRole } from '../../types';
import { DataStore } from '../../services/dataStorage';
import { useToast } from '../../context/ToastContext';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { formatDate } from '../../utils/formatters';
import {
  UserCheck,
  UserPlus,
  Shield,
  Check,
  X,
  Edit2,
  Trash2,
  Lock,
  Eye,
  ShoppingBag,
  Package,
  Truck,
  BarChart3,
  DollarSign,
} from 'lucide-react';

export const StaffPage: React.FC = () => {
  const { showToast } = useToast();

  const [staffList, setStaffList] = useState<StaffUser[]>(() => DataStore.getStaff());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffUser | null>(null);

  const initialForm = {
    name: '',
    mobile: '',
    role: 'Salesman' as StaffRole,
    permissions: {
      canMakeSale: true,
      canViewProfit: false,
      canEditProduct: false,
      canDeleteOrder: false,
      canViewReports: false,
      canManageCourier: false,
      canManageExpenses: false,
    },
    isActive: true,
  };

  const [formData, setFormData] = useState(initialForm);

  const applyRolePresets = (role: StaffRole) => {
    switch (role) {
      case 'Admin':
        setFormData((prev) => ({
          ...prev,
          role,
          permissions: {
            canMakeSale: true,
            canViewProfit: true,
            canEditProduct: true,
            canDeleteOrder: true,
            canViewReports: true,
            canManageCourier: true,
            canManageExpenses: true,
          },
        }));
        break;
      case 'Manager':
        setFormData((prev) => ({
          ...prev,
          role,
          permissions: {
            canMakeSale: true,
            canViewProfit: true,
            canEditProduct: true,
            canDeleteOrder: false,
            canViewReports: true,
            canManageCourier: true,
            canManageExpenses: true,
          },
        }));
        break;
      case 'Stock Manager':
        setFormData((prev) => ({
          ...prev,
          role,
          permissions: {
            canMakeSale: false,
            canViewProfit: false,
            canEditProduct: true,
            canDeleteOrder: false,
            canViewReports: false,
            canManageCourier: true,
            canManageExpenses: false,
          },
        }));
        break;
      case 'Salesman':
      default:
        setFormData((prev) => ({
          ...prev,
          role,
          permissions: {
            canMakeSale: true,
            canViewProfit: false,
            canEditProduct: false,
            canDeleteOrder: false,
            canViewReports: false,
            canManageCourier: false,
            canManageExpenses: false,
          },
        }));
        break;
    }
  };

  const handleOpenAdd = () => {
    setEditingStaff(null);
    setFormData(initialForm);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (staff: StaffUser) => {
    setEditingStaff(staff);
    setFormData({
      name: staff.name,
      mobile: staff.mobile,
      role: staff.role,
      permissions: {
        canMakeSale: staff.permissions.canMakeSale ?? true,
        canViewProfit: staff.permissions.canViewProfit ?? false,
        canEditProduct: staff.permissions.canEditProduct ?? false,
        canDeleteOrder: staff.permissions.canDeleteOrder ?? false,
        canViewReports: staff.permissions.canViewReports ?? false,
        canManageCourier: staff.permissions.canManageCourier ?? false,
        canManageExpenses: staff.permissions.canManageExpenses ?? false,
      },
      isActive: staff.isActive,
    });
    setIsModalOpen(true);
  };

  const handleSaveStaff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.mobile.trim()) {
      showToast('নাম ও মোবাইল নম্বর পূরণ করুন', 'warning');
      return;
    }

    let updated: StaffUser[];
    if (editingStaff) {
      updated = staffList.map((s) =>
        s.id === editingStaff.id ? { ...s, ...formData } : s
      );
      showToast('স্টাফের তথ্য হালনাগাদ করা হয়েছে', 'success');
    } else {
      const newStaff: StaffUser = {
        id: `staff_${Date.now()}`,
        ...formData,
        createdAt: new Date().toISOString().split('T')[0],
      };
      updated = [newStaff, ...staffList];
      showToast('নতুন স্টাফ সফলভাবে যোগ করা হয়েছে', 'success');
    }
    setStaffList(updated);
    DataStore.setStaff(updated);
    setIsModalOpen(false);
  };

  const handleToggleActive = (staffId: string) => {
    const updated = staffList.map((s) =>
      s.id === staffId ? { ...s, isActive: !s.isActive } : s
    );
    setStaffList(updated);
    DataStore.setStaff(updated);
    showToast('স্টাফের স্ট্যাটাস পরিবর্তন করা হয়েছে', 'info');
  };

  const handleDeleteStaff = (staffId: string) => {
    if (!confirm('আপনি কি এই স্টাফ অ্যাকাউন্ট মুছে ফেলতে চান?')) return;
    const updated = staffList.filter((s) => s.id !== staffId);
    setStaffList(updated);
    DataStore.setStaff(updated);
    showToast('স্টাফ অ্যাকাউন্ট মুছে ফেলা হয়েছে', 'info');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900">
            স্টাফ ও ইউজার এক্সেস ম্যানেজমেন্ট
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            কর্মচারীদের রোল ও নির্দিষ্ট ফিচারের অনুমতি (Permissions) নিয়ন্ত্রণ করুন
          </p>
        </div>

        <Button
          onClick={handleOpenAdd}
          variant="primary"
          size="md"
          leftIcon={<UserPlus className="w-4 h-4" />}
        >
          নতুন স্টাফ যোগ করুন
        </Button>
      </div>

      {/* Staff Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/70 text-slate-500 font-semibold">
                <th className="py-3 px-4">কর্মচারীর নাম ও যোগাযোগ</th>
                <th className="py-3 px-4">রোল (Role)</th>
                <th className="py-3 px-4">অনুমতিসমূহ (Permissions)</th>
                <th className="py-3 px-4">যুক্ত হওয়ার তারিখ</th>
                <th className="py-3 px-4 text-center">স্ট্যাটাস</th>
                <th className="py-3 px-4 text-right">অ্যাকশন</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {staffList.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-3.5 px-4">
                    <span className="font-bold text-slate-900 block">{s.name}</span>
                    <span className="text-[11px] text-slate-400 font-mono">{s.mobile}</span>
                  </td>

                  <td className="py-3.5 px-4">
                    <span
                      className={`inline-block font-semibold px-2.5 py-1 rounded-full text-xs ${
                        s.role === 'Admin'
                          ? 'bg-purple-100 text-purple-800'
                          : s.role === 'Manager'
                          ? 'bg-blue-100 text-blue-800'
                          : s.role === 'Stock Manager'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {s.role}
                    </span>
                  </td>

                  <td className="py-3.5 px-4">
                    <div className="flex flex-wrap gap-1 max-w-sm">
                      {s.permissions.canMakeSale && (
                        <span className="text-[10px] bg-emerald-50 text-emerald-700 font-medium px-2 py-0.5 rounded-md border border-emerald-100">
                          বিক্রয়
                        </span>
                      )}
                      {s.permissions.canEditProduct && (
                        <span className="text-[10px] bg-blue-50 text-blue-700 font-medium px-2 py-0.5 rounded-md border border-blue-100">
                          পণ্য এডিট
                        </span>
                      )}
                      {s.permissions.canViewProfit && (
                        <span className="text-[10px] bg-purple-50 text-purple-700 font-medium px-2 py-0.5 rounded-md border border-purple-100">
                          লাভ দেখা
                        </span>
                      )}
                      {s.permissions.canViewReports && (
                        <span className="text-[10px] bg-amber-50 text-amber-700 font-medium px-2 py-0.5 rounded-md border border-amber-100">
                          রিপোর্ট
                        </span>
                      )}
                      {s.permissions.canManageCourier && (
                        <span className="text-[10px] bg-sky-50 text-sky-700 font-medium px-2 py-0.5 rounded-md border border-sky-100">
                          কুরিয়ার
                        </span>
                      )}
                      {s.permissions.canManageExpenses && (
                        <span className="text-[10px] bg-rose-50 text-rose-700 font-medium px-2 py-0.5 rounded-md border border-rose-100">
                          খরচ
                        </span>
                      )}
                    </div>
                  </td>

                  <td className="py-3.5 px-4 font-mono text-slate-500">{formatDate(s.createdAt)}</td>

                  <td className="py-3.5 px-4 text-center">
                    <button
                      onClick={() => handleToggleActive(s.id)}
                      className={`px-2.5 py-1 rounded-full text-xs font-semibold cursor-pointer ${
                        s.isActive
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}
                    >
                      {s.isActive ? 'সক্রিয়' : 'নিষ্ক্রিয়'}
                    </button>
                  </td>

                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => handleOpenEdit(s)}
                        className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                        title="সম্পাদনা"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteStaff(s.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
                        title="মুছে ফেলুন"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Staff Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingStaff ? 'স্টাফের তথ্য ও পারমিশন হালনাগাদ' : 'নতুন স্টাফ যুক্ত করুন'}
        maxWidth="md"
      >
        <form onSubmit={handleSaveStaff} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              কর্মচারীর নাম *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="যেমন: সোহেল আহমেদ"
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                মোবাইল নম্বর (লগইন) *
              </label>
              <input
                type="tel"
                value={formData.mobile}
                onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                placeholder="017XXXXXXXX"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm font-mono focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">পদবী / রোল</label>
              <select
                value={formData.role}
                onChange={(e) => applyRolePresets(e.target.value as StaffRole)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-emerald-500 bg-white"
              >
                <option value="Admin">অ্যাডমিন (Admin - সম্পূর্ণ এক্সেস)</option>
                <option value="Manager">ম্যানেজার (Manager - বিক্রয় ও স্টক)</option>
                <option value="Salesman">বিক্রয়কর্মী (Salesman / Cashier)</option>
                <option value="Stock Manager">স্টক ম্যানেজার (Inventory Only)</option>
              </select>
            </div>
          </div>

          {/* Permissions Matrix */}
          <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50 space-y-3">
            <label className="block text-xs font-bold text-slate-800">
              অনুমতি নিয়ন্ত্রণ (Granular Permissions)
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <label className="flex items-center gap-2 p-2 bg-white rounded-xl border border-slate-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.permissions.canMakeSale}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      permissions: { ...formData.permissions, canMakeSale: e.target.checked },
                    })
                  }
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
                <span className="font-medium text-slate-800">বিক্রয় ও পিওএস (POS) চালান</span>
              </label>

              <label className="flex items-center gap-2 p-2 bg-white rounded-xl border border-slate-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.permissions.canEditProduct}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      permissions: { ...formData.permissions, canEditProduct: e.target.checked },
                    })
                  }
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
                <span className="font-medium text-slate-800">পণ্য যোগ ও স্টক এডিট</span>
              </label>

              <label className="flex items-center gap-2 p-2 bg-white rounded-xl border border-slate-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.permissions.canViewProfit}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      permissions: { ...formData.permissions, canViewProfit: e.target.checked },
                    })
                  }
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
                <span className="font-medium text-slate-800">লাভ-ক্ষতি ও ক্রয়মূল্য দেখা</span>
              </label>

              <label className="flex items-center gap-2 p-2 bg-white rounded-xl border border-slate-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.permissions.canViewReports}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      permissions: { ...formData.permissions, canViewReports: e.target.checked },
                    })
                  }
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
                <span className="font-medium text-slate-800">ব্যবসায়িক রিপোর্ট ও হিসাব দেখা</span>
              </label>

              <label className="flex items-center gap-2 p-2 bg-white rounded-xl border border-slate-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.permissions.canManageCourier}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      permissions: {
                        ...formData.permissions,
                        canManageCourier: e.target.checked,
                      },
                    })
                  }
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
                <span className="font-medium text-slate-800">কুরিয়ার বুকিং ও ট্র্যাকিং</span>
              </label>

              <label className="flex items-center gap-2 p-2 bg-white rounded-xl border border-slate-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.permissions.canManageExpenses}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      permissions: {
                        ...formData.permissions,
                        canManageExpenses: e.target.checked,
                      },
                    })
                  }
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
                <span className="font-medium text-slate-800">দোকানের খরচ এন্ট্রি</span>
              </label>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="staffActive"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="rounded text-emerald-600 focus:ring-emerald-500"
            />
            <label htmlFor="staffActive" className="text-xs font-semibold text-slate-700">
              অ্যাকাউন্ট সক্রিয় রাখুন
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsModalOpen(false)}
            >
              বাতিল
            </Button>
            <Button type="submit" variant="primary" size="sm">
              সংরক্ষণ করুন
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
