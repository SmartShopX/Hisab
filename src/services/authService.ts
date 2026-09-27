import { User, Shop, BusinessCategory } from '../types';
import { DataStore } from './dataStorage';

export interface LoginPayload {
  mobile: string;
  password?: string;
  otp?: string;
}

export interface RegisterPayload {
  ownerName: string;
  mobile: string;
  email?: string;
  password: string;
}

export const authService = {
  async login(payload: LoginPayload): Promise<{ user: User; shop: Shop; token: string }> {
    // API endpoint: POST /api/v1/auth/login
    await new Promise((resolve) => setTimeout(resolve, 350));
    
    // Check if demo or existing user
    let user = DataStore.getUser();
    const shop = DataStore.getShop();
    
    if (!user) {
      user = {
        id: `usr_${Date.now()}`,
        name: 'তানভীর আহমেদ',
        mobile: payload.mobile || '01711002233',
        role: 'owner',
        shopId: shop.id,
        permissions: {
          canViewSales: true,
          canCreateSale: true,
          canManageProducts: true,
          canManageCustomers: true,
          canManageOrders: true,
          canViewReports: true,
          canManagePayments: true,
        },
      };
      DataStore.setUser(user);
    }
    
    const fakeToken = `sx_token_${Date.now()}`;
    localStorage.setItem('smartshopx_auth_token', fakeToken);
    return { user, shop, token: fakeToken };
  },

  async register(payload: RegisterPayload): Promise<{ tempId: string; mobile: string }> {
    // API endpoint: POST /api/v1/auth/register
    await new Promise((resolve) => setTimeout(resolve, 400));
    
    const tempId = `reg_${Date.now()}`;
    // Save pending registration details
    sessionStorage.setItem(
      'pending_registration',
      JSON.stringify({ ...payload, tempId })
    );
    return { tempId, mobile: payload.mobile };
  },

  async verifyOtp(mobile: string, otp: string): Promise<{ success: boolean }> {
    // API endpoint: POST /api/v1/auth/verify-otp
    await new Promise((resolve) => setTimeout(resolve, 300));
    if (otp.length !== 4 && otp.length !== 6) {
      throw new Error('অনুগ্রহ করে সঠিক ওটিপি (OTP) কোড দিন');
    }
    return { success: true };
  },

  async completeBusinessSetup(category: BusinessCategory, customCategory?: string, shopName?: string): Promise<Shop> {
    // API endpoint: POST /api/v1/business/setup
    await new Promise((resolve) => setTimeout(resolve, 400));
    
    const currentShop = DataStore.getShop();
    const updatedShop: Shop = {
      ...currentShop,
      name: shopName || currentShop.name || 'আমার ব্যবসা প্রতিষ্ঠান',
      category,
      customCategory: customCategory || undefined,
    };
    DataStore.setShop(updatedShop);

    // Finalize user from pending registration if available
    const pending = sessionStorage.getItem('pending_registration');
    if (pending) {
      try {
        const reg = JSON.parse(pending);
        const newUser: User = {
          id: `usr_${Date.now()}`,
          name: reg.ownerName,
          mobile: reg.mobile,
          email: reg.email,
          role: 'owner',
          shopId: updatedShop.id,
        };
        DataStore.setUser(newUser);
        sessionStorage.removeItem('pending_registration');
      } catch (e) {
        console.error(e);
      }
    }

    return updatedShop;
  },

  async logout(): Promise<void> {
    // API endpoint: POST /api/v1/auth/logout
    localStorage.removeItem('smartshopx_auth_token');
  },

  getCurrentUser(): User | null {
    return DataStore.getUser();
  },

  getCurrentShop(): Shop {
    return DataStore.getShop();
  },
};
