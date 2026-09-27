import React, { useState } from 'react';
import { Product } from '../../types';
import { aiProductStudioService } from '../../services/aiProductStudioService';
import { MessageSquare, X, Send, Sparkles, Bot, ShoppingCart, Truck, ShieldCheck, AlertCircle } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';

interface AiCustomerAssistantProps {
  products: Product[];
  storeName: string;
  onAddToCart: (product: Product) => void;
  orderContext?: any;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  suggestedProducts?: any[];
  timestamp: string;
}

export const AiCustomerAssistant: React.FC<AiCustomerAssistantProps> = ({
  products,
  storeName,
  onAddToCart,
  orderContext,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      text: `আসসালামু আলাইকুম! আমি ${storeName}-এর AI শপিং অ্যাসিস্ট্যান্ট। পণ্যের স্টক, মূল্য, ডেলিভারি চার্জ অথবা অর্ডার ট্র্যাকিং সংক্রান্ত যেকোনো প্রশ্ন করতে পারেন।`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const quickPrompts = [
    'ডেলিভারি চার্জ কত?',
    'ক্যাশ অন ডেলিভারি আছে?',
    'অর্ডার ট্র্যাকিং',
    'রিটার্ন পলিসি কী?',
  ];

  const handleSend = async (queryText?: string) => {
    const textToSend = (queryText || input).trim();
    if (!textToSend || loading) return;

    const userMsg: ChatMessage = {
      id: `usr_${Date.now()}`,
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await aiProductStudioService.askCustomerAssistant({
        query: textToSend,
        products,
        storeName,
        orderContext,
      });

      const assistantMsg: ChatMessage = {
        id: `ai_${Date.now()}`,
        sender: 'assistant',
        text: res.answer,
        suggestedProducts: res.suggestedProducts,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `ai_${Date.now()}`,
          sender: 'assistant',
          text: 'দুঃখিত, সংযোগে কিছুটা বিলম্ব হচ্ছে। অনুগ্রহ করে আবার চেষ্টা করুন বা সরাসরি আমাদের ফোনে যোগাযোগ করুন।',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating Action Trigger Button */}
      <button
        type="button"
        id="btn-open-customer-ai-assistant"
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-40 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full p-4 shadow-xl hover:shadow-2xl transition-all flex items-center gap-2 group cursor-pointer border-2 border-white/20"
        aria-label="AI শপিং সহকারী চালু করুন"
      >
        <Sparkles className="w-5 h-5 animate-pulse" />
        <span className="text-xs font-bold hidden sm:inline">AI শপিং সহকারী</span>
      </button>

      {/* Chat Drawer / Modal */}
      {isOpen && (
        <div
          id="customer-ai-assistant-drawer"
          className="fixed bottom-20 right-4 sm:right-6 w-[92vw] sm:w-[380px] max-h-[550px] h-[80vh] bg-white rounded-3xl shadow-2xl border border-slate-200 z-50 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-200"
        >
          {/* Header */}
          <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm leading-tight flex items-center gap-1.5">
                  AI শপিং সহকারী
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                </h3>
                <p className="text-[11px] text-slate-400">{storeName} লাইভ ক্যাটালগ</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Quick Prompts */}
          <div className="px-4 py-2 bg-slate-50 border-b border-slate-100 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {quickPrompts.map((prompt) => (
              <button
                key={prompt}
                type="button"
                onClick={() => handleSend(prompt)}
                className="whitespace-nowrap text-[11px] bg-white hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 border border-slate-200 hover:border-emerald-200 px-2.5 py-1 rounded-full transition-colors cursor-pointer"
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Messages Area */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3.5 text-xs">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl p-3 leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-emerald-600 text-white rounded-br-xs'
                      : 'bg-slate-100 text-slate-800 rounded-bl-xs border border-slate-200/60'
                  }`}
                >
                  <p className="whitespace-pre-line">{msg.text}</p>

                  {/* Suggested Products (Safe Recommendation with user confirmation) */}
                  {msg.suggestedProducts && msg.suggestedProducts.length > 0 && (
                    <div className="mt-3 space-y-2 pt-2 border-t border-slate-200/60">
                      <p className="font-bold text-[11px] text-slate-900">প্রস্তাবিত পণ্য:</p>
                      {msg.suggestedProducts.map((sp: any) => {
                        const originalProd = products.find((p) => p.id === sp.id);
                        return (
                          <div
                            key={sp.id}
                            className="bg-white p-2.5 rounded-xl border border-slate-200 flex items-center justify-between gap-2 shadow-2xs"
                          >
                            <div className="min-w-0">
                              <p className="font-semibold text-slate-900 truncate text-[11px]">
                                {sp.name}
                              </p>
                              <p className="text-emerald-600 font-bold text-xs">
                                {formatCurrency(sp.price)}
                              </p>
                            </div>
                            {originalProd && (
                              <button
                                type="button"
                                onClick={() => onAddToCart(originalProd)}
                                className="shrink-0 bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                              >
                                <ShoppingCart className="w-3 h-3" />
                                কার্টে যোগ
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
                <span className="text-[10px] text-slate-400 mt-1 px-1">{msg.timestamp}</span>
              </div>
            ))}

            {loading && (
              <div className="flex items-center gap-2 text-slate-500 text-xs">
                <div className="w-6 h-6 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600 animate-spin" />
                </div>
                <span>সহকারী উত্তর তৈরি করছে...</span>
              </div>
            )}
          </div>

          {/* Disclaimer Footer (Strict Safety Constraint) */}
          <div className="px-4 py-1.5 bg-slate-50 border-t border-slate-100 text-[10px] text-slate-500 flex items-center gap-1 justify-center">
            <ShieldCheck className="w-3 h-3 text-emerald-600" />
            <span>চূড়ান্ত অর্ডার ও পেমেন্ট কেবল আপনার অনুমোদনেই কার্যকর হবে।</span>
          </div>

          {/* Input Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="p-3 bg-white border-t border-slate-200 flex items-center gap-2"
          >
            <input
              type="text"
              id="input-customer-assistant-query"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="পণ্যের নাম, দাম বা প্রশ্ন লিখুন..."
              className="flex-1 text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 outline-none focus:border-emerald-500 focus:bg-white transition-colors"
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white p-2.5 rounded-xl cursor-pointer transition-colors"
              aria-label="বার্তা পাঠান"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </>
  );
};
