/**
 * CSV / Excel Import / Export Utilities for Products, Orders, Customers, Dues, and Expenses
 */

export interface CsvProductRow {
  name: string;
  category: string;
  sku: string;
  barcode: string;
  purchasePrice: number;
  sellingPrice: number;
  stock: number;
  unit: string;
  brand?: string;
  description?: string;
}

export interface CsvCustomerRow {
  name: string;
  mobile: string;
  address: string;
  notes?: string;
}

export const csvHelper = {
  /**
   * Export an array of objects to a downloaded CSV file with UTF-8 BOM for Bengali in Excel
   */
  exportToCsv<T extends Record<string, any>>(
    fileName: string,
    rows: T[],
    columnMapping: { key: keyof T; header: string }[]
  ): void {
    if (!rows || rows.length === 0) return;

    // Build Header row
    const headerLine = columnMapping.map((c) => `"${c.header}"`).join(',');

    // Build Data rows
    const dataLines = rows.map((row) => {
      return columnMapping
        .map((col) => {
          const val = row[col.key];
          if (val === undefined || val === null) return '""';
          const str = String(val).replace(/"/g, '""');
          return `"${str}"`;
        })
        .join(',');
    });

    const csvContent = '\uFEFF' + [headerLine, ...dataLines].join('\n'); // Add UTF-8 BOM for Bengali & Excel support
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${fileName}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },

  /**
   * Quick 1-Click Excel Exporter for Sales Orders
   */
  exportSalesToExcel(orders: any[]): void {
    const mapping = [
      { key: 'orderNumber', header: 'মেমো / অর্ডার নং' },
      { key: 'customerName', header: 'গ্রাহকের নাম' },
      { key: 'customerMobile', header: 'মোবাইল নম্বর' },
      { key: 'totalAmount', header: 'মোট টাকা (৳)' },
      { key: 'paidAmount', header: 'পরিশোধ (৳)' },
      { key: 'dueAmount', header: 'বকেয়া (৳)' },
      { key: 'paymentMethod', header: 'পেমেন্ট মাধ্যম' },
      { key: 'status', header: 'স্ট্যাটাস' },
      { key: 'createdAt', header: 'বিক্রয় তারিখ ও সময়' },
    ];
    this.exportToCsv(`SmartShopX_Sales_Report_${new Date().toISOString().split('T')[0]}`, orders, mapping as any);
  },

  /**
   * Quick 1-Click Excel Exporter for Inventory Stock Products
   */
  exportProductsToExcel(products: any[]): void {
    const mapping = [
      { key: 'name', header: 'পণ্যের নাম' },
      { key: 'category', header: 'ক্যাটাগরি' },
      { key: 'sku', header: 'SKU / কোড' },
      { key: 'barcode', header: 'বারকোড' },
      { key: 'purchasePrice', header: 'ক্রয় মূল্য (৳)' },
      { key: 'sellingPrice', header: 'বিক্রয় মূল্য (৳)' },
      { key: 'stock', header: 'বর্তমান স্টক' },
      { key: 'unit', header: 'একক' },
      { key: 'batchNumber', header: 'ব্যাচ নং' },
      { key: 'expiryDate', header: 'মেয়াদোত্তীর্ণ তারিখ' },
      { key: 'shelfLocation', header: 'রেক / সেলফ' },
    ];
    this.exportToCsv(`SmartShopX_Inventory_Stock_${new Date().toISOString().split('T')[0]}`, products, mapping as any);
  },

  /**
   * Quick 1-Click Excel Exporter for All Customers
   */
  exportCustomersToExcel(customers: any[]): void {
    const mapping = [
      { key: 'name', header: 'গ্রাহকের নাম' },
      { key: 'mobile', header: 'মোবাইল নম্বর' },
      { key: 'totalPurchase', header: 'মোট ক্রয় (৳)' },
      { key: 'totalPaid', header: 'মোট পরিশোধ (৳)' },
      { key: 'totalDue', header: 'মোট বকেয়া (৳)' },
      { key: 'loyaltyPoints', header: 'লয়ালটি পয়েন্ট' },
      { key: 'address', header: 'ঠিকানা' },
    ];
    this.exportToCsv(`SmartShopX_Customers_${new Date().toISOString().split('T')[0]}`, customers, mapping as any);
  },

  /**
   * Quick 1-Click Excel Exporter for Suppliers
   */
  exportSuppliersToExcel(suppliers: any[]): void {
    const mapping = [
      { key: 'name', header: 'সাপ্লায়ার নাম' },
      { key: 'companyName', header: 'কোম্পানি' },
      { key: 'mobile', header: 'মোবাইল নম্বর' },
      { key: 'totalPurchase', header: 'মোট ক্রয় (৳)' },
      { key: 'totalPaid', header: 'মোট পরিশোধ (৳)' },
      { key: 'totalPayable', header: 'বর্তমান দেনা (৳)' },
      { key: 'address', header: 'ঠিকানা' },
    ];
    this.exportToCsv(`SmartShopX_Suppliers_${new Date().toISOString().split('T')[0]}`, suppliers, mapping as any);
  },

  /**
   * Quick 1-Click Excel Exporter for Due Customers
   */
  exportDueCustomersToExcel(customers: any[]): void {
    const dueOnly = (customers || []).filter((c) => (c.totalDue || 0) > 0);
    const mapping = [
      { key: 'name', header: 'গ্রাহকের নাম' },
      { key: 'mobile', header: 'মোবাইল নম্বর' },
      { key: 'totalDue', header: 'মোট বকেয়া (৳)' },
      { key: 'oldestDueDays', header: 'বকেয়ার দিন' },
      { key: 'promiseDate', header: 'প্রতিশ্রুত পরিশোধের তারিখ' },
      { key: 'address', header: 'ঠিকানা' },
    ];
    this.exportToCsv(`SmartShopX_Due_Customers_${new Date().toISOString().split('T')[0]}`, dueOnly, mapping as any);
  },

  /**
   * Quick 1-Click Excel Exporter for Expenses
   */
  exportExpensesToExcel(expenses: any[]): void {
    const mapping = [
      { key: 'title', header: 'খরচের বিবরণ' },
      { key: 'category', header: 'ক্যাটাগরি' },
      { key: 'amount', header: 'টাকার পরিমাণ (৳)' },
      { key: 'paymentMethod', header: 'পেমেন্ট মাধ্যম' },
      { key: 'date', header: 'তারিখ' },
      { key: 'note', header: 'নোট' },
    ];
    this.exportToCsv(`SmartShopX_Expenses_Report_${new Date().toISOString().split('T')[0]}`, expenses, mapping as any);
  },

  /**
   * Parse a CSV text file into array of rows
   */
  parseCsv(text: string): string[][] {
    const lines = text.split(/\r\n|\n/);
    const result: string[][] = [];

    for (const line of lines) {
      if (!line.trim()) continue;
      const row: string[] = [];
      let inQuotes = false;
      let curVal = '';

      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
          if (inQuotes && line[i + 1] === '"') {
            curVal += '"';
            i++;
          } else {
            inQuotes = !inQuotes;
          }
        } else if (char === ',' && !inQuotes) {
          row.push(curVal.trim());
          curVal = '';
        } else {
          curVal += char;
        }
      }
      row.push(curVal.trim());
      result.push(row);
    }
    return result;
  },

  /**
   * Generate and download sample CSV for bulk product upload
   */
  downloadProductSample(): void {
    const headers = 'পণ্যের নাম (Product Name),ক্যাটাগরি (Category),SKU,বারকোড (Barcode),ক্রয় মূল্য (Purchase Price),বিক্রয় মূল্য (Selling Price),স্টক সংখ্যা (Stock),একক (Unit),ব্র্যান্ড (Brand),বিবরণ (Description)';
    const sample1 = 'প্রিমিয়াম সুতি পাঞ্জাবি,পাঞ্জাবি,PJB-101,8901001,850,1450,25,Pcs,SmartShop,১০০% কটন সুতি পাঞ্জাবি';
    const sample2 = 'লেদার ওয়ালেট ও বেল্ট কম্বো,এক্সেসরিজ,ACC-202,8901002,400,850,50,Set,SmartLeather,খাঁটি চামড়ার প্রিমিয়াম উপহার বক্স';
    const sample3 = 'অর্গানিক সুন্দরবন মধু ৫০০ গ্রাম,ফুড ও গ্রোসারি,HON-303,8901003,380,550,40,Jar,Sundarban,প্রাকৃতিক খাঁটি মধু';

    const content = '\uFEFF' + [headers, sample1, sample2, sample3].join('\n');
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'SmartShopX_Products_Sample.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  },

  /**
   * Generate and download sample CSV for bulk customer upload
   */
  downloadCustomerSample(): void {
    const headers = 'গ্রাহকের নাম (Customer Name),মোবাইল নম্বর (Mobile),ঠিকানা (Address),নোট (Notes)';
    const sample1 = 'তানভীর আহমেদ,01711223344,মিরপুর ১০ ঢাকা,নিয়মিত পাইকারি ক্রেতা';
    const sample2 = 'নাসরিন আক্তার,01822334455,জিইসি মোড় চট্টগ্রাম,অনলাইন ফেসবুক পেজ ক্রেতা';
    const sample3 = 'রফিকুল ইসলাম,01933445566,জিরো পয়েন্ট রাজশাহী,কুরিয়ার হোম ডেলিভারি';

    const content = '\uFEFF' + [headers, sample1, sample2, sample3].join('\n');
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'SmartShopX_Customers_Sample.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  },
};
