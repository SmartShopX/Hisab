import React from 'react';
import { getOrderStatusText, getPaymentStatusText } from '../../utils/formatters';

interface StatusBadgeProps {
  status: string;
  type?: 'order' | 'payment' | 'risk' | 'stock';
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  type = 'order',
  className = '',
}) => {
  let label = status;
  let colorStyle = 'bg-slate-100 text-slate-700 border-slate-200';

  if (type === 'order') {
    label = getOrderStatusText(status);
    switch (status) {
      case 'New':
        colorStyle = 'bg-indigo-50 text-indigo-700 border-indigo-200';
        break;
      case 'Pending':
        colorStyle = 'bg-amber-50 text-amber-700 border-amber-200';
        break;
      case 'Confirmed':
        colorStyle = 'bg-sky-50 text-sky-700 border-sky-200';
        break;
      case 'Processing':
      case 'Packed':
        colorStyle = 'bg-blue-50 text-blue-700 border-blue-200';
        break;
      case 'Courier Assigned':
      case 'Shipped':
        colorStyle = 'bg-purple-50 text-purple-700 border-purple-200';
        break;
      case 'Delivered':
        colorStyle = 'bg-emerald-50 text-emerald-700 border-emerald-200';
        break;
      case 'Cancelled':
      case 'Failed':
        colorStyle = 'bg-rose-50 text-rose-700 border-rose-200';
        break;
      case 'Returned':
        colorStyle = 'bg-orange-50 text-orange-700 border-orange-200';
        break;
    }
  } else if (type === 'payment') {
    label = getPaymentStatusText(status);
    switch (status) {
      case 'Paid':
        colorStyle = 'bg-emerald-50 text-emerald-700 border-emerald-200';
        break;
      case 'Pending':
        colorStyle = 'bg-amber-50 text-amber-700 border-amber-200';
        break;
      case 'Partially Paid':
        colorStyle = 'bg-blue-50 text-blue-700 border-blue-200';
        break;
      case 'Failed':
        colorStyle = 'bg-rose-50 text-rose-700 border-rose-200';
        break;
      case 'Refunded':
        colorStyle = 'bg-purple-50 text-purple-700 border-purple-200';
        break;
    }
  } else if (type === 'risk') {
    switch (status) {
      case 'Low':
        label = 'কম ঝুঁকি (নিরাপদ)';
        colorStyle = 'bg-emerald-50 text-emerald-700 border-emerald-200';
        break;
      case 'Medium':
        label = 'মাঝারি ঝুঁকি';
        colorStyle = 'bg-amber-50 text-amber-700 border-amber-200';
        break;
      case 'High':
        label = 'উচ্চ ঝুঁকি (সতর্কতা)';
        colorStyle = 'bg-rose-50 text-rose-700 border-rose-200 font-semibold';
        break;
    }
  } else if (type === 'stock') {
    switch (status) {
      case 'in_stock':
        label = 'মজুত আছে';
        colorStyle = 'bg-emerald-50 text-emerald-700 border-emerald-200';
        break;
      case 'low_stock':
        label = 'সীমিত স্টক';
        colorStyle = 'bg-amber-50 text-amber-700 border-amber-200 font-medium';
        break;
      case 'out_of_stock':
        label = 'স্টক আউট';
        colorStyle = 'bg-rose-50 text-rose-700 border-rose-200 font-semibold';
        break;
    }
  }

  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border whitespace-nowrap ${colorStyle} ${className}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5 opacity-80" />
      {label}
    </span>
  );
};
