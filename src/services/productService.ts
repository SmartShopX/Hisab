import { Product } from '../types';
import { DataStore } from './dataStorage';

export const productService = {
  async getProducts(params?: { search?: string; category?: string; status?: string }): Promise<Product[]> {
    // API endpoint: GET /api/v1/products
    await new Promise((resolve) => setTimeout(resolve, 250));
    let list = DataStore.getProducts();

    if (params?.search) {
      const q = params.search.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q) ||
          p.barcode.toLowerCase().includes(q) ||
          p.brand.toLowerCase().includes(q)
      );
    }

    if (params?.category && params.category !== 'all') {
      list = list.filter((p) => p.category === params.category);
    }

    if (params?.status) {
      if (params.status === 'active') list = list.filter((p) => p.isActive);
      if (params.status === 'inactive') list = list.filter((p) => !p.isActive);
      if (params.status === 'low_stock') list = list.filter((p) => p.stock > 0 && p.stock <= p.minStock);
      if (params.status === 'out_of_stock') list = list.filter((p) => p.stock === 0);
    }

    return list;
  },

  async addProduct(productData: Omit<Product, 'id' | 'createdAt'>): Promise<Product> {
    // API endpoint: POST /api/v1/products
    await new Promise((resolve) => setTimeout(resolve, 350));
    const products = DataStore.getProducts();
    const newProduct: Product = {
      ...productData,
      id: `prod_${Date.now()}`,
      createdAt: new Date().toISOString().split('T')[0],
    };
    const updated = [newProduct, ...products];
    DataStore.setProducts(updated);

    // Record stock in movement
    if (newProduct.stock > 0) {
      const movements = DataStore.getStockMovements();
      DataStore.setStockMovements([
        {
          id: `sm_${Date.now()}`,
          productId: newProduct.id,
          productName: newProduct.name,
          type: 'IN',
          quantity: newProduct.stock,
          previousStock: 0,
          newStock: newProduct.stock,
          reason: 'নতুন পণ্য যোগ ও প্রারম্ভিক স্টক',
          createdAt: new Date().toLocaleString('en-US'),
        },
        ...movements,
      ]);
    }

    return newProduct;
  },

  async updateProduct(id: string, updates: Partial<Product>): Promise<Product> {
    // API endpoint: PUT /api/v1/products/:id
    await new Promise((resolve) => setTimeout(resolve, 300));
    const products = DataStore.getProducts();
    const index = products.findIndex((p) => p.id === id);
    if (index === -1) throw new Error('পণ্যটি খুঁজে পাওয়া যায়নি');

    const updatedProduct = { ...products[index], ...updates };
    products[index] = updatedProduct;
    DataStore.setProducts([...products]);
    return updatedProduct;
  },

  async deleteProduct(id: string): Promise<boolean> {
    // API endpoint: DELETE /api/v1/products/:id
    await new Promise((resolve) => setTimeout(resolve, 300));
    const products = DataStore.getProducts();
    const filtered = products.filter((p) => p.id !== id);
    DataStore.setProducts(filtered);
    return true;
  },

  async toggleOnlineVisibility(id: string, onlineStoreVisible: boolean): Promise<Product> {
    const products = DataStore.getProducts();
    const index = products.findIndex((p) => p.id === id);
    if (index === -1) throw new Error('পণ্যটি খুঁজে পাওয়া যায়নি');
    const updated = { ...products[index], onlineStoreVisible };
    products[index] = updated;
    DataStore.setProducts([...products]);
    return updated;
  },
};
