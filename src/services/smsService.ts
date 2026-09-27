import { Order, SmsGatewayConfig, SmsTriggerConfig, SmsLogRecord, Shop } from '../types';
import { DataStore } from './dataStorage';

const SMS_GATEWAY_KEY = 'smartshopx_sms_gateway_config';
const SMS_TRIGGERS_KEY = 'smartshopx_sms_triggers_config';
const SMS_LOGS_KEY = 'smartshopx_sms_logs';

const defaultGatewayConfig: SmsGatewayConfig = {
  provider: 'Greenweb',
  apiKey: 'gw_live_a899bc3210492fd',
  senderId: 'SMARTSHOP',
  isConnected: true,
  balance: 385,
};

const defaultTriggers: SmsTriggerConfig = {
  onOrderConfirm: true,
  orderConfirmTpl:
    'প্রিয় {customer_name}, {shop_name} এ আপনার অর্ডার {order_no} নিশ্চিত হয়েছে। মোট মূল্য ৳{amount}। ধন্যবাদ।',
  onCourierDispatch: true,
  courierDispatchTpl:
    'প্রিয় {customer_name}, আপনার পার্সেল {order_no} কুরিয়ার ({courier_name}) এ বুক করা হয়েছে। ট্র্যাকিং নং: {tracking_id}',
  onOrderDelivered: true,
  orderDeliveredTpl:
    'প্রিয় {customer_name}, আপনার অর্ডার {order_no} সফলভাবে ডেলিভার হয়েছে। {shop_name} এর সাথে থাকার জন্য ধন্যবাদ।',
  onPosSale: false,
  posSaleTpl:
    'প্রিয় {customer_name}, {shop_name} থেকে ৳{amount} টাকার পণ্য ক্রয়ের ক্যাশমেমো নং {order_no}। আবার আসবেন!',
  onDueReminder: true,
  dueReminderTpl:
    'সম্মানিত গ্রাহক {customer_name}, {shop_name} এ আপনার বকেয়া ৳{due_amount} পরিশোধের অনুরোধ রইল। ধন্যবাদ।',
};

const initialLogs: SmsLogRecord[] = [
  {
    id: 'sms_log_1',
    recipient: '01812345678',
    message: 'আপনার অর্ডার SX-8821 ডেলিভারির জন্য Steadfast কুরিয়ারে হস্তান্তর করা হয়েছে। ট্র্যাকিং নং: ST-882190',
    templateType: 'কুরিয়ার বুকিং (Courier Dispatch)',
    provider: 'Greenweb',
    status: 'Delivered',
    sentAt: new Date(Date.now() - 3600000 * 3).toISOString(),
  },
  {
    id: 'sms_log_2',
    recipient: '01912345678',
    message: 'প্রিয় হাসান মাহমুদ, SmartShopX এ আপনার বকেয়া ৳১,৫০০ পরিশোধের অনুরোধ রইল। ধন্যবাদ।',
    templateType: 'বকেয়া তাগাদা (Due Reminder)',
    provider: 'Greenweb',
    status: 'Delivered',
    sentAt: new Date(Date.now() - 3600000 * 24).toISOString(),
  },
];

export const smsService = {
  getGatewayConfig(): SmsGatewayConfig {
    try {
      const data = localStorage.getItem(SMS_GATEWAY_KEY);
      return data ? JSON.parse(data) : defaultGatewayConfig;
    } catch {
      return defaultGatewayConfig;
    }
  },

  saveGatewayConfig(config: SmsGatewayConfig): void {
    localStorage.setItem(SMS_GATEWAY_KEY, JSON.stringify(config));
  },

  getTriggerConfig(): SmsTriggerConfig {
    try {
      const data = localStorage.getItem(SMS_TRIGGERS_KEY);
      return data ? JSON.parse(data) : defaultTriggers;
    } catch {
      return defaultTriggers;
    }
  },

  saveTriggerConfig(triggers: SmsTriggerConfig): void {
    localStorage.setItem(SMS_TRIGGERS_KEY, JSON.stringify(triggers));
  },

  getLogs(): SmsLogRecord[] {
    try {
      const data = localStorage.getItem(SMS_LOGS_KEY);
      return data ? JSON.parse(data) : initialLogs;
    } catch {
      return initialLogs;
    }
  },

  saveLogs(logs: SmsLogRecord[]): void {
    localStorage.setItem(SMS_LOGS_KEY, JSON.stringify(logs));
  },

  /**
   * Send a direct SMS or record an automated trigger dispatch
   */
  sendSms(
    recipient: string,
    message: string,
    templateType = 'Custom'
  ): { success: boolean; error?: string } {
    const config = this.getGatewayConfig();

    if (!recipient || !recipient.trim()) {
      return { success: false, error: 'মোবাইল নম্বর প্রদান করুন' };
    }

    if (config.balance <= 0) {
      return { success: false, error: 'এসএমএস ব্যালেন্স শেষ! রিচার্জ করুন।' };
    }

    // Deduct 1 SMS credit
    config.balance -= 1;
    this.saveGatewayConfig(config);

    // Append to logs
    const newLog: SmsLogRecord = {
      id: `sms_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      recipient: recipient.trim(),
      message: message.trim(),
      templateType,
      provider: config.provider,
      status: 'Delivered',
      sentAt: new Date().toISOString(),
    };

    const currentLogs = this.getLogs();
    this.saveLogs([newLog, ...currentLogs]);

    return { success: true };
  },

  /**
   * Process automated SMS trigger for orders
   */
  triggerOrderSms(
    order: Order,
    event: 'CONFIRM' | 'DISPATCH' | 'DELIVERED' | 'POS_SALE',
    extra?: { courierName?: string; trackingId?: string }
  ): boolean {
    const triggers = this.getTriggerConfig();
    const shop: Shop = DataStore.getShop();

    let shouldSend = false;
    let template = '';
    let eventName = '';

    switch (event) {
      case 'CONFIRM':
        shouldSend = triggers.onOrderConfirm;
        template = triggers.orderConfirmTpl;
        eventName = 'অর্ডার নিশ্চিতকরণ';
        break;
      case 'DISPATCH':
        shouldSend = triggers.onCourierDispatch;
        template = triggers.courierDispatchTpl;
        eventName = 'কুরিয়ার বুকিং';
        break;
      case 'DELIVERED':
        shouldSend = triggers.onOrderDelivered;
        template = triggers.orderDeliveredTpl;
        eventName = 'ডেলিভারি সম্পন্ন';
        break;
      case 'POS_SALE':
        shouldSend = triggers.onPosSale;
        template = triggers.posSaleTpl;
        eventName = 'পিওএস মেমো';
        break;
    }

    if (!shouldSend || !template || !order.customerMobile) {
      return false;
    }

    // Replace dynamic tags
    const renderedMessage = template
      .replace(/{customer_name}/g, order.customerName || 'গ্রাহক')
      .replace(/{order_no}/g, order.orderNumber)
      .replace(/{amount}/g, order.totalAmount.toLocaleString('bn-BD'))
      .replace(/{due_amount}/g, (order.dueAmount || 0).toLocaleString('bn-BD'))
      .replace(/{shop_name}/g, shop.name || 'SmartShopX')
      .replace(/{courier_name}/g, extra?.courierName || 'কুরিয়ার')
      .replace(/{tracking_id}/g, extra?.trackingId || order.orderNumber);

    const result = this.sendSms(order.customerMobile, renderedMessage, eventName);
    return result.success;
  },

  /**
   * Send due reminder SMS
   */
  sendDueReminder(customerName: string, customerMobile: string, dueAmount: number): boolean {
    const triggers = this.getTriggerConfig();
    const shop: Shop = DataStore.getShop();

    if (!triggers.onDueReminder || !customerMobile) return false;

    const message = triggers.dueReminderTpl
      .replace(/{customer_name}/g, customerName)
      .replace(/{due_amount}/g, dueAmount.toLocaleString('bn-BD'))
      .replace(/{shop_name}/g, shop.name || 'SmartShopX');

    return this.sendSms(customerMobile, message, 'বকেয়া তাগাদা').success;
  },
};
