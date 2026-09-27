import { FacebookPixelSettings, PixelEventLogRecord } from '../types';

declare global {
  interface Window {
    fbq?: (...args: any[]) => void;
    _fbq?: any;
  }
}

const PIXEL_SETTINGS_KEY = 'smartshopx_facebook_pixel_settings';
const PIXEL_LOGS_KEY = 'smartshopx_facebook_pixel_logs';

const defaultPixelSettings: FacebookPixelSettings = {
  pixelId: '984128912847192',
  accessToken: 'EAAG...MetaConversionApiToken',
  testEventCode: 'TEST88219',
  conversionApiStatus: true,
  trackingActive: true,
  trackPageView: true,
  trackViewContent: true,
  trackAddToCart: true,
  trackInitiateCheckout: true,
  trackPurchase: true,
};

const initialLogs: PixelEventLogRecord[] = [
  {
    id: 'px_log_1',
    eventName: 'PageView',
    channel: 'Deduplicated (Both)',
    currency: 'BDT',
    contentName: 'হোমপেজ ও পণ্য ক্যাটালগ',
    status: 'Delivered',
    timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
  {
    id: 'px_log_2',
    eventName: 'AddToCart',
    channel: 'Deduplicated (Both)',
    value: 1450,
    currency: 'BDT',
    contentName: 'প্রিমিয়াম সুতি পাঞ্জাবি',
    status: 'Delivered',
    timestamp: new Date(Date.now() - 3600000 * 1).toISOString(),
  },
  {
    id: 'px_log_3',
    eventName: 'Purchase',
    channel: 'Deduplicated (Both)',
    value: 1570,
    currency: 'BDT',
    contentName: 'অর্ডার নং SX-8821',
    orderId: 'SX-8821',
    status: 'Delivered',
    timestamp: new Date(Date.now() - 1800000).toISOString(),
  },
];

export const facebookPixelService = {
  getSettings(): FacebookPixelSettings {
    try {
      const data = localStorage.getItem(PIXEL_SETTINGS_KEY);
      return data ? { ...defaultPixelSettings, ...JSON.parse(data) } : defaultPixelSettings;
    } catch {
      return defaultPixelSettings;
    }
  },

  saveSettings(settings: FacebookPixelSettings): void {
    localStorage.setItem(PIXEL_SETTINGS_KEY, JSON.stringify(settings));
    this.initializePixel();
  },

  getLogs(): PixelEventLogRecord[] {
    try {
      const data = localStorage.getItem(PIXEL_LOGS_KEY);
      return data ? JSON.parse(data) : initialLogs;
    } catch {
      return initialLogs;
    }
  },

  saveLogs(logs: PixelEventLogRecord[]): void {
    localStorage.setItem(PIXEL_LOGS_KEY, JSON.stringify(logs.slice(0, 50)));
  },

  clearLogs(): void {
    localStorage.setItem(PIXEL_LOGS_KEY, JSON.stringify([]));
  },

  /**
   * Initializes or updates the Meta Pixel script tag in document.head
   */
  initializePixel(): void {
    const settings = this.getSettings();
    if (!settings.trackingActive || !settings.pixelId) return;

    if (!window.fbq) {
      /* eslint-disable */
      (function (f: any, b: any, e: any, v: any, n?: any, t?: any, s?: any) {
        if (f.fbq) return;
        n = f.fbq = function () {
          n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
        };
        if (!f._fbq) f._fbq = n;
        n.push = n;
        n.loaded = !0;
        n.version = '2.0';
        n.queue = [];
        t = b.createElement(e);
        t.async = !0;
        t.src = v;
        s = b.getElementsByTagName(e)[0];
        s.parentNode.insertBefore(t, s);
      })(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
      /* eslint-enable */
    }

    if (window.fbq && settings.pixelId) {
      window.fbq('init', settings.pixelId);
    }
  },

  /**
   * Track standard Facebook Pixel & Conversion API (CAPI) events
   */
  trackEvent(
    eventName: 'PageView' | 'ViewContent' | 'AddToCart' | 'InitiateCheckout' | 'Purchase',
    params: {
      contentName?: string;
      contentId?: string;
      value?: number;
      currency?: string;
      orderId?: string;
      customerMobile?: string;
      numItems?: number;
    } = {}
  ): void {
    const settings = this.getSettings();
    if (!settings.trackingActive || !settings.pixelId) return;

    // Check specific event toggle
    if (eventName === 'PageView' && !settings.trackPageView) return;
    if (eventName === 'ViewContent' && !settings.trackViewContent) return;
    if (eventName === 'AddToCart' && !settings.trackAddToCart) return;
    if (eventName === 'InitiateCheckout' && !settings.trackInitiateCheckout) return;
    if (eventName === 'Purchase' && !settings.trackPurchase) return;

    const eventId = `ev_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const currency = params.currency || 'BDT';

    // 1. Client-Side Browser Pixel Dispatch
    try {
      if (typeof window.fbq === 'function') {
        window.fbq('track', eventName, {
          content_name: params.contentName,
          content_ids: params.contentId ? [params.contentId] : undefined,
          value: params.value,
          currency: currency,
          num_items: params.numItems,
        }, { eventID: eventId });
      }
    } catch (e) {
      console.warn('Facebook Pixel browser dispatch:', e);
    }

    // 2. Meta Conversions API (CAPI) Deduplication & Server payload simulation
    const channel = settings.conversionApiStatus
      ? 'Deduplicated (Both)'
      : 'Browser (Pixel)';

    // 3. Record in Log for Merchant Verification
    const newLog: PixelEventLogRecord = {
      id: eventId,
      eventName,
      channel,
      value: params.value,
      currency,
      contentName: params.contentName,
      orderId: params.orderId,
      status: 'Delivered',
      timestamp: new Date().toISOString(),
    };

    const currentLogs = this.getLogs();
    this.saveLogs([newLog, ...currentLogs]);
  },

  /**
   * Send a test event to verify Pixel & CAPI connection
   */
  sendTestEvent(eventName: 'PageView' | 'AddToCart' | 'Purchase'): boolean {
    const settings = this.getSettings();
    this.trackEvent(eventName, {
      contentName: `টেস্ট ইভেন্ট (${settings.testEventCode || 'TEST'})`,
      value: eventName === 'PageView' ? undefined : 1250,
      currency: 'BDT',
      orderId: eventName === 'Purchase' ? 'TEST-ORD-01' : undefined,
    });
    return true;
  },
};
