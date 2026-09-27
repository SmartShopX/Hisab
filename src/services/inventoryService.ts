import { StockMovement } from '../types';
import { DataStore } from './dataStorage';

export const inventoryService = {
  async getInventoryStats() {
    // API endpoint: GET /api/v1/inventory/stats
    await new Promise((resolve) => setTimeout(resolve, 200));
    const products = DataStore.getProducts();

    const totalStockQty = products.reduce((acc, p) => acc + p.stock, 0);
    const lowStockCount = products.filter((p) => p.stock > 0 && p.stock <= p.minStock).length;
    const outOfStockCount = products.filter((p) => p.stock === 0).length;
    const totalStockValue = products.reduce((acc, p) => acc + p.stock * p.purchasePrice, 0);
    const totalPotentialValue = products.reduce((acc, p) => acc + p.stock * p.sellingPrice, 0);

    return {
      totalProducts: products.length,
      totalStockQty,
      lowStockCount,
      outOfStockCount,
      totalStockValue,
      totalPotentialValue,
    };
  },

  async adjustStock(
    productId: string,
    quantityChange: number,
    type: 'IN' | 'OUT' | 'ADJUSTMENT',
    reason: string
  ): Promise<StockMovement> {
    // API endpoint: POST /api/v1/inventory/adjust
    await new Promise((resolve) => setTimeout(resolve, 300));
    const products = DataStore.getProducts();
    const movements = DataStore.getStockMovements();

    const idx = products.findIndex((p) => p.id === productId);
    if (idx === -1) throw new Error('পণ্য পাওয়া যায়নি');

    const prevStock = products[idx].stock;
    const newStock = Math.max(0, prevStock + quantityChange);
    products[idx].stock = newStock;
    DataStore.setProducts([...products]);

    const movement: StockMovement = {
      id: `sm_${Date.now()}`,
      productId,
      productName: products[idx].name,
      type,
      quantity: quantityChange,
      previousStock: prevStock,
      newStock,
      reason,
      createdAt: new Date().toLocaleString('en-US'),
    };
    DataStore.setStockMovements([movement, ...movements]);

    return movement;
  },

  async getMovements(): Promise<StockMovement[]> {
    // API endpoint: GET /api/v1/inventory/movements
    await new Promise((resolve) => setTimeout(resolve, 200));
    return DataStore.getStockMovements();
  },
};
