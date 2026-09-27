import { Customer, VoiceCallCampaign, VoiceCallLog, VoiceGatewayConfig } from '../types';
import { DataStore } from './dataStorage';

const VOICE_CAMPAIGNS_KEY = 'smartshop_voice_campaigns';
const VOICE_LOGS_KEY = 'smartshop_voice_logs';
const VOICE_GATEWAY_KEY = 'smartshop_voice_gateway_config';

export const DEFAULT_SCRIPTS = {
  due_friendly:
    'আসসালামু আলাইকুম {{customer_name}} সাহেব। {{shop_name}} থেকে বিনীতভাবে জানাচ্ছি, আপনার বকেয়া {{due_amount}} টাকা আজ পরিশোধের কথা ছিল। অনুরোধ রইলো আজকের মধ্যেই হিসাবটি ক্লিয়ার করার। বিকাশ বা নগদে পরিশোধের তথ্য পেতে ১ চাপুন, আরও ৩ দিন সময় বাড়াতে ২ চাপুন, অথবা দোকানে কথা বলতে ৩ চাপুন। ধন্যবাদ।',

  due_urgent:
    'জরুরি নোটিশ! আসসালামু আলাইকুম {{customer_name}}। {{shop_name}} থেকে বলছি। আপনার মোট বকেয়া {{due_amount}} টাকা পরিশোধের সময়সীমা অতিক্রম করেছে। আপনার বাকি হিসাব সচল রাখতে অতি দ্রুত বকেয়া পরিশোধ করুন। বিকাশ মার্চেন্ট নম্বর পেতে ১ চাপুন, সরাসরি কথা বলতে ৩ চাপুন।',

  marketing_offer:
    'আসসালামু আলাইকুম {{customer_name}}! {{shop_name}}-এ এলো আকর্ষণীয় ধামাকা অফার। আমাদের দোকানে নতুন প্রডাক্টের ফ্রেশ স্টক এসেছে এবং নির্বাচিত পণ্যে চলছে বিশেষ মূল্যছাড়। অফারটি পেতে আজই দোকানে চলে আসুন। শুভকামনা!',

  welcome_greeting:
    'আসসালামু আলাইকুম {{customer_name}}! {{shop_name}}-এ কেনাকাটা করার জন্য আপনাকে আন্তরিক ধন্যবাদ। আপনার সন্তুষ্টিই আমাদের কাম্য। যেকোনো প্রয়োজনে আমাদের সাথে যোগাযোগ করুন। ভালো থাকবেন।',
};

const DEFAULT_GATEWAY_CONFIG: VoiceGatewayConfig = {
  provider: 'browser_ai',
  callerId: '01700-000000',
  autoCallDailyHour: 10,
  autoCallEnabled: true,
  retryOnBusy: true,
  maxRetries: 2,
  bKashMerchantNumber: '01812-345678',
  nagadMerchantNumber: '01912-345678',
};

const INITIAL_CAMPAIGNS: VoiceCallCampaign[] = [
  {
    id: 'camp-1',
    title: 'দৈনিক স্বয়ংক্রিয় বকেয়া তাগাদা (Auto Promise Due Call)',
    campaignType: 'due_reminder',
    targetAudience: 'due_customers_today',
    scheduledDate: new Date().toISOString().split('T')[0],
    callTime: '10:30 AM',
    autoTriggerOnPromiseDate: true,
    scriptBangla: DEFAULT_SCRIPTS.due_friendly,
    voiceGender: 'female',
    voiceTone: 'friendly',
    ivrOptionsEnabled: true,
    status: 'active',
    totalTargets: 5,
    completedCalls: 4,
    answeredCalls: 3,
    failedCalls: 1,
    ivrResponses: {
      key1Count: 2,
      key2Count: 1,
      key3Count: 0,
    },
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: 'camp-2',
    title: 'ঈদ স্পেশাল মেম্বারশিপ অফার ভয়েস ব্রডকাস্ট',
    campaignType: 'marketing_offer',
    targetAudience: 'all_customers',
    scheduledDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    callTime: '04:00 PM',
    autoTriggerOnPromiseDate: false,
    scriptBangla: DEFAULT_SCRIPTS.marketing_offer,
    voiceGender: 'female',
    voiceTone: 'friendly',
    ivrOptionsEnabled: false,
    status: 'scheduled',
    totalTargets: 18,
    completedCalls: 0,
    answeredCalls: 0,
    failedCalls: 0,
    createdAt: new Date().toISOString(),
  },
];

const INITIAL_LOGS: VoiceCallLog[] = [
  {
    id: 'vlog-1',
    campaignId: 'camp-1',
    customerId: 'cust-1',
    customerName: 'সোহেল রানা',
    customerMobile: '01711223344',
    callType: 'due_reminder',
    dueAmount: 4500,
    promiseDate: new Date().toISOString().split('T')[0],
    durationSeconds: 38,
    status: 'answered',
    ivrKeyPressed: '1',
    ivrResponseText: 'বিকাশ পেমেন্ট লিংক চেয়েছে (Key 1)',
    notes: 'কল সম্পন্ন হয়েছে, বিকাশ নম্বর পাঠানো হয়েছে',
    timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
  {
    id: 'vlog-2',
    campaignId: 'camp-1',
    customerId: 'cust-2',
    customerName: 'কামরুল হাসান',
    customerMobile: '01819223344',
    callType: 'due_reminder',
    dueAmount: 2200,
    promiseDate: new Date().toISOString().split('T')[0],
    durationSeconds: 42,
    status: 'answered',
    ivrKeyPressed: '2',
    ivrResponseText: '৩ দিন অতিরিক্ত সময় বর্ধিত করেছে (Key 2)',
    notes: 'নতুন প্রতিশ্রুতি তারিখ স্বয়ংক্রিয়ভাবে ৩ দিন পেছানো হয়েছে',
    timestamp: new Date(Date.now() - 3600000 * 3).toISOString(),
  },
  {
    id: 'vlog-3',
    campaignId: 'camp-1',
    customerId: 'cust-3',
    customerName: 'তানভীর আহমেদ',
    customerMobile: '01911998877',
    callType: 'due_reminder',
    dueAmount: 8500,
    promiseDate: new Date().toISOString().split('T')[0],
    durationSeconds: 0,
    status: 'busy',
    notes: 'লাইন ব্যস্ত ছিল (User Busy)',
    timestamp: new Date(Date.now() - 3600000 * 4).toISOString(),
  },
];

class VoiceCallService {
  // 1. Text-to-Speech Bangla Playback
  speakBangla(
    text: string,
    onEnd?: () => void,
    options?: { pitch?: number; rate?: number; gender?: 'female' | 'male' }
  ) {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      console.warn('SpeechSynthesis is not supported on this browser.');
      if (onEnd) onEnd();
      return;
    }

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'bn-BD';
    utterance.rate = options?.rate || 0.92;
    utterance.pitch = options?.pitch || (options?.gender === 'female' ? 1.15 : 0.95);

    const voices = window.speechSynthesis.getVoices();
    const bnVoice = voices.find(
      (v) => v.lang.includes('bn') || v.lang.includes('Bangla') || v.name.includes('Bangla')
    );
    if (bnVoice) {
      utterance.voice = bnVoice;
    }

    utterance.onend = () => {
      if (onEnd) onEnd();
    };

    utterance.onerror = () => {
      if (onEnd) onEnd();
    };

    window.speechSynthesis.speak(utterance);
  }

  stopSpeaking() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }

  // 2. Dynamic Variable Replacement
  interpolateScript(
    template: string,
    data: {
      customerName?: string;
      dueAmount?: number;
      shopName?: string;
      promiseDate?: string;
      paymentNumber?: string;
    }
  ): string {
    const shop = DataStore.getShop();
    const shopName = data.shopName || shop.name || 'স্মার্টশপ';
    const customerName = data.customerName || 'সম্মানিত গ্রাহক';
    const dueAmount = data.dueAmount ? `${data.dueAmount.toLocaleString('bn-BD')} টাকা` : 'বকেয়া টাকা';
    const promiseDate = data.promiseDate || 'আজ';
    const paymentNumber = data.paymentNumber || shop.mobile || '০১৭১১-০০০০০০';

    return template
      .replace(/\{\{customer_name\}\}/g, customerName)
      .replace(/\{\{due_amount\}\}/g, dueAmount)
      .replace(/\{\{shop_name\}\}/g, shopName)
      .replace(/\{\{promise_date\}\}/g, promiseDate)
      .replace(/\{\{payment_number\}\}/g, paymentNumber);
  }

  // 3. Campaigns
  getCampaigns(): VoiceCallCampaign[] {
    try {
      const stored = localStorage.getItem(VOICE_CAMPAIGNS_KEY);
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.error(e);
    }
    localStorage.setItem(VOICE_CAMPAIGNS_KEY, JSON.stringify(INITIAL_CAMPAIGNS));
    return INITIAL_CAMPAIGNS;
  }

  saveCampaign(campaign: Omit<VoiceCallCampaign, 'id' | 'createdAt'>): VoiceCallCampaign {
    const campaigns = this.getCampaigns();
    const newCamp: VoiceCallCampaign = {
      ...campaign,
      id: `camp-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    const updated = [newCamp, ...campaigns];
    localStorage.setItem(VOICE_CAMPAIGNS_KEY, JSON.stringify(updated));
    return newCamp;
  }

  updateCampaign(id: string, updates: Partial<VoiceCallCampaign>): VoiceCallCampaign | null {
    const campaigns = this.getCampaigns();
    const idx = campaigns.findIndex((c) => c.id === id);
    if (idx === -1) return null;

    campaigns[idx] = { ...campaigns[idx], ...updates };
    localStorage.setItem(VOICE_CAMPAIGNS_KEY, JSON.stringify(campaigns));
    return campaigns[idx];
  }

  deleteCampaign(id: string) {
    const campaigns = this.getCampaigns().filter((c) => c.id !== id);
    localStorage.setItem(VOICE_CAMPAIGNS_KEY, JSON.stringify(campaigns));
  }

  // 4. Call Logs
  getLogs(): VoiceCallLog[] {
    try {
      const stored = localStorage.getItem(VOICE_LOGS_KEY);
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.error(e);
    }
    localStorage.setItem(VOICE_LOGS_KEY, JSON.stringify(INITIAL_LOGS));
    return INITIAL_LOGS;
  }

  addLog(log: Omit<VoiceCallLog, 'id' | 'timestamp'>): VoiceCallLog {
    const logs = this.getLogs();
    const newLog: VoiceCallLog = {
      ...log,
      id: `vlog-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      timestamp: new Date().toISOString(),
    };
    const updated = [newLog, ...logs];
    localStorage.setItem(VOICE_LOGS_KEY, JSON.stringify(updated));
    return newLog;
  }

  // 5. Gateway Config
  getGatewayConfig(): VoiceGatewayConfig {
    try {
      const stored = localStorage.getItem(VOICE_GATEWAY_KEY);
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.error(e);
    }
    return DEFAULT_GATEWAY_CONFIG;
  }

  saveGatewayConfig(config: VoiceGatewayConfig) {
    localStorage.setItem(VOICE_GATEWAY_KEY, JSON.stringify(config));
  }

  // 6. Find Customers who have promise date today or are overdue
  getCustomersDueToday(customers: Customer[]): Customer[] {
    const todayStr = new Date().toISOString().split('T')[0];

    return customers.filter((c) => {
      if (c.totalDue <= 0) return false;
      // If promise date matches today, or no promise date but has due > 0 and flagged
      if (c.promiseDate === todayStr) return true;
      // Also include if due date has passed
      if (c.promiseDate && c.promiseDate < todayStr) return true;
      // Also include customers with long aging dues
      if (!c.promiseDate && (c.oldestDueDays || 0) >= 15) return true;
      return false;
    });
  }

  // 7. Process IVR Key Press
  handleIVRKeyPress(
    customerId: string,
    key: '1' | '2' | '3'
  ): { actionMessage: string; newPromiseDate?: string } {
    const customers = DataStore.getCustomers();
    const custIndex = customers.findIndex((c) => c.id === customerId);

    if (key === '1') {
      return {
        actionMessage: 'বিকাশ/নগদ পেমেন্ট মার্চেন্ট নম্বর এসএমএস-এ পাঠানো হয়েছে।',
      };
    } else if (key === '2') {
      // Extend promise date by 3 days automatically
      const nextDate = new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0];
      if (custIndex !== -1) {
        customers[custIndex].promiseDate = nextDate;
        customers[custIndex].reminderNotes = 'গ্রাহক ভয়েস কলে ২ চেপে ৩ দিন সময় বাড়িয়েছেন';
        DataStore.setCustomers(customers);
      }
      return {
        actionMessage: `গ্রাহকের আবেদনের প্রেক্ষিতে স্বয়ংক্রিয়ভাবে পরিশোধের তারিখ ${nextDate} পর্যন্ত বাড়ানো হলো।`,
        newPromiseDate: nextDate,
      };
    } else {
      return {
        actionMessage: 'গ্রাহক দোকানে সরাসরি কথা বলতে অনুরোধ করেছেন (অপারেটর কানেকশন শিডিউল্ড)।',
      };
    }
  }
}

export const voiceCallService = new VoiceCallService();
