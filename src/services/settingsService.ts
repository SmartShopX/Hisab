import { LandingPage, BlockedEntity, NotificationSettings, FacebookPixelSettings, Shop } from '../types';
import { DataStore } from './dataStorage';

export const landingPageService = {
  async getLandingPages(): Promise<LandingPage[]> {
    // API endpoint: GET /api/v1/landing-pages
    await new Promise((resolve) => setTimeout(resolve, 250));
    return DataStore.getLandingPages();
  },

  async createLandingPage(page: Omit<LandingPage, 'id' | 'createdAt' | 'viewsCount' | 'ordersCount'>): Promise<LandingPage> {
    // API endpoint: POST /api/v1/landing-pages
    await new Promise((resolve) => setTimeout(resolve, 300));
    const list = DataStore.getLandingPages();
    const newPage: LandingPage = {
      ...page,
      id: `lp_${Date.now()}`,
      viewsCount: 0,
      ordersCount: 0,
      createdAt: new Date().toISOString().split('T')[0],
    };
    DataStore.setLandingPages([newPage, ...list]);
    return newPage;
  },

  async updateLandingPage(id: string, updates: Partial<LandingPage>): Promise<LandingPage> {
    // API endpoint: PUT /api/v1/landing-pages/:id
    await new Promise((resolve) => setTimeout(resolve, 250));
    const list = DataStore.getLandingPages();
    const idx = list.findIndex((p) => p.id === id);
    if (idx === -1) throw new Error('ল্যান্ডিং পেজ পাওয়া যায়নি');
    list[idx] = { ...list[idx], ...updates };
    DataStore.setLandingPages([...list]);
    return list[idx];
  },

  async duplicateLandingPage(id: string): Promise<LandingPage> {
    // API endpoint: POST /api/v1/landing-pages/:id/duplicate
    await new Promise((resolve) => setTimeout(resolve, 300));
    const list = DataStore.getLandingPages();
    const target = list.find((p) => p.id === id);
    if (!target) throw new Error('ল্যান্ডিং পেজ পাওয়া যায়নি');

    const duplicate: LandingPage = {
      ...target,
      id: `lp_${Date.now()}`,
      title: `${target.title} (কপি)`,
      slug: `${target.slug}-copy-${Math.floor(Math.random() * 1000)}`,
      viewsCount: 0,
      ordersCount: 0,
      isPublished: false,
      createdAt: new Date().toISOString().split('T')[0],
    };
    DataStore.setLandingPages([duplicate, ...list]);
    return duplicate;
  },

  async deleteLandingPage(id: string): Promise<boolean> {
    // API endpoint: DELETE /api/v1/landing-pages/:id
    await new Promise((resolve) => setTimeout(resolve, 250));
    const list = DataStore.getLandingPages();
    DataStore.setLandingPages(list.filter((p) => p.id !== id));
    return true;
  },
};

export const settingsService = {
  async getShop(): Promise<Shop> {
    await new Promise((resolve) => setTimeout(resolve, 150));
    return DataStore.getShop();
  },

  async updateShop(updates: Partial<Shop>): Promise<Shop> {
    // API endpoint: PUT /api/v1/business/profile
    await new Promise((resolve) => setTimeout(resolve, 300));
    const shop = DataStore.getShop();
    const updated = { ...shop, ...updates };
    DataStore.setShop(updated);
    return updated;
  },

  async getNotificationSettings(): Promise<NotificationSettings> {
    // API endpoint: GET /api/v1/settings/notifications
    await new Promise((resolve) => setTimeout(resolve, 150));
    return DataStore.getNotificationSettings();
  },

  async updateNotificationSettings(settings: NotificationSettings): Promise<NotificationSettings> {
    // API endpoint: PUT /api/v1/settings/notifications
    await new Promise((resolve) => setTimeout(resolve, 250));
    DataStore.setNotificationSettings(settings);
    return settings;
  },

  async getFacebookSettings(): Promise<FacebookPixelSettings> {
    // API endpoint: GET /api/v1/settings/facebook
    await new Promise((resolve) => setTimeout(resolve, 150));
    return DataStore.getFacebookSettings();
  },

  async updateFacebookSettings(settings: FacebookPixelSettings): Promise<FacebookPixelSettings> {
    // API endpoint: PUT /api/v1/settings/facebook
    await new Promise((resolve) => setTimeout(resolve, 250));
    DataStore.setFacebookSettings(settings);
    return settings;
  },

  async getBlockedEntities(): Promise<BlockedEntity[]> {
    // API endpoint: GET /api/v1/security/blocks
    await new Promise((resolve) => setTimeout(resolve, 150));
    return DataStore.getBlockedEntities();
  },

  async addBlockedEntity(entity: Omit<BlockedEntity, 'id' | 'createdAt'>): Promise<BlockedEntity> {
    // API endpoint: POST /api/v1/security/blocks
    await new Promise((resolve) => setTimeout(resolve, 250));
    const list = DataStore.getBlockedEntities();
    const newEntity: BlockedEntity = {
      ...entity,
      id: `blk_${Date.now()}`,
      createdAt: new Date().toISOString().split('T')[0],
    };
    DataStore.setBlockedEntities([newEntity, ...list]);
    return newEntity;
  },

  async removeBlockedEntity(id: string): Promise<boolean> {
    // API endpoint: DELETE /api/v1/security/blocks/:id
    await new Promise((resolve) => setTimeout(resolve, 200));
    const list = DataStore.getBlockedEntities();
    DataStore.setBlockedEntities(list.filter((b) => b.id !== id));
    return true;
  },
};
