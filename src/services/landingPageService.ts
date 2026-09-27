import { LandingPage } from '../types';
import { DataStore } from './dataStorage';

export const landingPageService = {
  async getPages(): Promise<LandingPage[]> {
    return DataStore.getLandingPages();
  },

  async getPageBySlug(slug: string): Promise<LandingPage | undefined> {
    const pages = DataStore.getLandingPages();
    return pages.find((p) => p.slug === slug);
  },

  async createPage(pageData: Omit<LandingPage, 'id' | 'createdAt'>): Promise<LandingPage> {
    const newPage: LandingPage = {
      ...pageData,
      id: `lp_${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    const current = DataStore.getLandingPages();
    DataStore.setLandingPages([newPage, ...current]);
    return newPage;
  },

  async updatePage(id: string, updates: Partial<LandingPage>): Promise<LandingPage> {
    const current = DataStore.getLandingPages();
    const updated = current.map((p) => (p.id === id ? { ...p, ...updates } : p));
    DataStore.setLandingPages(updated);
    const saved = updated.find((p) => p.id === id);
    if (!saved) throw new Error('Landing page not found');
    return saved;
  },

  async deletePage(id: string): Promise<void> {
    const current = DataStore.getLandingPages();
    DataStore.setLandingPages(current.filter((p) => p.id !== id));
  },
};
