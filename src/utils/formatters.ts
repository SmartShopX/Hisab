export const formatCurrency = (amount: number | undefined | null): string => {
  if (amount === undefined || amount === null || isNaN(amount)) return '৳ ০';
  return `৳ ${Math.round(amount).toLocaleString('en-US')}`;
};

export const formatNumber = (num: number): string => {
  if (isNaN(num)) return '০';
  return num.toLocaleString('en-US');
};

export const formatDate = (dateStr: string): string => {
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('bn-BD', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return dateStr;
  }
};

export const formatDateTime = (dateStr: string): string => {
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('bn-BD', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateStr;
  }
};

export const getOrderStatusText = (status: string): string => {
  const map: Record<string, string> = {
    New: 'নতুন অর্ডার',
    Pending: 'অপেক্ষমাণ (Pending)',
    Confirmed: 'নিশ্চিতকৃত (Confirmed)',
    Processing: 'প্রক্রিয়াধীন',
    Packed: 'প্যাকেট সম্পন্ন',
    'Courier Assigned': 'কুরিয়ারে অর্পণ',
    Shipped: 'পাঠানো হয়েছে',
    Delivered: 'ডেলিভার্ড',
    Cancelled: 'বাতিলকৃত',
    Returned: 'রিটার্নড',
    Failed: 'ব্যর্থ',
  };
  return map[status] || status;
};

export const getPaymentStatusText = (status: string): string => {
  const map: Record<string, string> = {
    Paid: 'পরিশোধিত',
    Pending: 'অপেক্ষমাণ',
    'Partially Paid': 'আংশিক পরিশোধ',
    Failed: 'ব্যর্থ',
    Refunded: 'রিফান্ড করা হয়েছে',
  };
  return map[status] || status;
};
