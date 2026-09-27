import React, { useState } from 'react';
import { LandingPage, Product } from '../../types';
import { DataStore } from '../../services/dataStorage';
import { landingPageService } from '../../services/landingPageService';
import { formatCurrency } from '../../utils/formatters';
import { useToast } from '../../context/ToastContext';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import {
  Compass,
  Plus,
  ExternalLink,
  Copy,
  Edit2,
  Trash2,
  CheckCircle2,
  Video,
  Truck,
  Sparkles,
  Search,
} from 'lucide-react';

export const LandingPagesPage: React.FC = () => {
  const { showToast } = useToast();
  const [pages, setPages] = useState<LandingPage[]>(() => DataStore.getLandingPages());
  const [products] = useState<Product[]>(() => DataStore.getProducts());

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activePage, setActivePage] = useState<LandingPage | null>(null);

  // Form State
  const initialForm = {
    title: '',
    slug: '',
    productId: products[0]?.id || '',
    headline: '',
    subheadline: '',
    videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    offerPrice: 1250,
    regularPrice: 1650,
    deliveryChargeInsideDhaka: 60,
    deliveryChargeOutsideDhaka: 120,
    features: ['১০০% অরিজিনাল গ্যাজেট', '৭ দিনের রিপ্লেসমেন্ট গ্যারান্টি', 'সরাসরি ক্যাশ অন ডেলিভারি'],
    isPublished: true,
  };
  const [formData, setFormData] = useState(initialForm);

  const handleCopyLink = (slug: string) => {
    const url = `${window.location.origin}/#/landing/${slug}`;
    navigator.clipboard.writeText(url);
    showToast('ল্যান্ডিং পেজের ডিরেক্ট অর্ডার লিংক কপি করা হয়েছে', 'success');
  };

  const handleOpenCreate = () => {
    setActivePage(null);
    setFormData(initialForm);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (page: LandingPage) => {
    setActivePage(page);
    setFormData({
      title: page.title,
      slug: page.slug,
      productId: page.productId,
      headline: page.headline,
      subheadline: page.subheadline,
      videoUrl: page.videoUrl || '',
      offerPrice: page.offerPrice,
      regularPrice: page.regularPrice,
      deliveryChargeInsideDhaka: page.deliveryChargeInsideDhaka,
      deliveryChargeOutsideDhaka: page.deliveryChargeOutsideDhaka,
      features: page.features,
      isPublished: page.isPublished,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.slug.trim()) {
      showToast('শিরোনাম ও স্লাগ আবশ্যক', 'warning');
      return;
    }

    try {
      if (activePage) {
        await landingPageService.updatePage(activePage.id, formData);
        showToast('ল্যান্ডিং পেজ সফলভাবে আপডেট হয়েছে', 'success');
      } else {
        await landingPageService.createPage(formData);
        showToast('নতুন ল্যান্ডিং পেজ সফলভাবে তৈরি হয়েছে', 'success');
      }
      setPages(DataStore.getLandingPages());
      setIsModalOpen(false);
    } catch {
      showToast('ল্যান্ডিং পেজ সংরক্ষণে সমস্যা হয়েছে', 'error');
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900">
            ল্যান্ডিং পেজ বিল্ডার (Landing Page Builder)
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            নির্দিষ্ট পণ্যের জন্য হাই-কনভার্টিং সিঙ্গেল প্রোডাক্ট সেলস ফানেল ও চেকআউট পেজ তৈরি করুন
          </p>
        </div>

        <Button
          onClick={handleOpenCreate}
          variant="primary"
          size="md"
          leftIcon={<Plus className="w-4 h-4" />}
        >
          নতুন ল্যান্ডিং পেজ তৈরি
        </Button>
      </div>

      {/* Pages Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {pages.map((p) => {
          const publicUrl = `${window.location.origin}/#/landing/${p.slug}`;
          return (
            <div
              key={p.id}
              className="bg-white rounded-3xl border border-slate-200 shadow-xs hover:border-emerald-300 transition-all p-5 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span
                    className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${
                      p.isPublished
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-slate-100 text-slate-600 border-slate-200'
                    }`}
                  >
                    {p.isPublished ? '● পাবলিশড (Live)' : '○ আনপাবলিশড (Draft)'}
                  </span>

                  <span className="font-mono text-xs text-slate-400">/{p.slug}</span>
                </div>

                <h3 className="text-base font-bold text-slate-900 line-clamp-1">{p.title}</h3>
                <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                  {p.headline}
                </p>

                <div className="my-4 p-3 rounded-2xl bg-slate-50 border border-slate-100 text-xs space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-slate-500">অফার মূল্য:</span>
                    <span className="font-mono font-bold text-emerald-700">
                      {formatCurrency(p.offerPrice)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">রেগুলার মূল্য:</span>
                    <span className="font-mono text-slate-400 line-through">
                      {formatCurrency(p.regularPrice)}
                    </span>
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-200">
                    <span>ডেলিভারি চার্জ:</span>
                    <span>ঢাকা ৳{p.deliveryChargeInsideDhaka} / বাইরে ৳{p.deliveryChargeOutsideDhaka}</span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                <Button
                  onClick={() => handleCopyLink(p.slug)}
                  variant="outline"
                  size="sm"
                  leftIcon={<Copy className="w-3.5 h-3.5" />}
                >
                  লিংক
                </Button>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleOpenEdit(p)}
                    className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                    title="সম্পাদনা"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <Button
                    onClick={() => window.open(publicUrl, '_blank')}
                    variant="ghost"
                    size="sm"
                    leftIcon={<ExternalLink className="w-3.5 h-3.5" />}
                  >
                    লাইভ দেখুন
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Create / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={activePage ? 'ল্যান্ডিং পেজ সম্পাদনা' : 'নতুন ল্যান্ডিং পেজ তৈরি'}
        maxWidth="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                পেজ শিরোনাম (Internal Title) *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="যেমন: স্মার্ট ওয়াচ প্রো হট সেল অফার"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                ইউআরএল স্লাগ (URL Slug) *
              </label>
              <input
                type="text"
                value={formData.slug}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
                  })
                }
                placeholder="smart-watch-offer"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                সংযুক্ত পণ্য (Featured Product) *
              </label>
              <select
                value={formData.productId}
                onChange={(e) => setFormData({ ...formData, productId: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
              >
                {products.map((pr) => (
                  <option key={pr.id} value={pr.id}>
                    {pr.name} ({formatCurrency(pr.sellingPrice)})
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                প্রধান হেডলাইন (Catchy Headline) *
              </label>
              <input
                type="text"
                value={formData.headline}
                onChange={(e) => setFormData({ ...formData, headline: e.target.value })}
                placeholder="যেমন: আকর্ষণীয় প্রিমিয়াম ব্লুটুথ ইয়ারবাডস এখন বিশেষ ছাড়ের সাথে!"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                সাবহেডলাইন / বিবরণ
              </label>
              <textarea
                rows={2}
                value={formData.subheadline}
                onChange={(e) => setFormData({ ...formData, subheadline: e.target.value })}
                placeholder="পণ্যের কার্যকারিতা ও বিশেষ আকর্ষণ..."
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                ইউটিউব ভিডিও প্রিভিউ লিংক (YouTube Video Link)
              </label>
              <input
                type="url"
                value={formData.videoUrl}
                onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
                placeholder="https://youtube.com/watch?v=..."
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                অফার মূল্য (৳) *
              </label>
              <input
                type="number"
                min={0}
                value={formData.offerPrice}
                onChange={(e) =>
                  setFormData({ ...formData, offerPrice: Number(e.target.value) || 0 })
                }
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm font-mono font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                রেগুলার মূল্য (৳)
              </label>
              <input
                type="number"
                min={0}
                value={formData.regularPrice}
                onChange={(e) =>
                  setFormData({ ...formData, regularPrice: Number(e.target.value) || 0 })
                }
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                ঢাকার ভেতর ডেলিভারি চার্জ (৳)
              </label>
              <input
                type="number"
                min={0}
                value={formData.deliveryChargeInsideDhaka}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    deliveryChargeInsideDhaka: Number(e.target.value) || 0,
                  })
                }
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                ঢাকার বাইরে ডেলিভারি চার্জ (৳)
              </label>
              <input
                type="number"
                min={0}
                value={formData.deliveryChargeOutsideDhaka}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    deliveryChargeOutsideDhaka: Number(e.target.value) || 0,
                  })
                }
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="isPublishedCheck"
              checked={formData.isPublished}
              onChange={(e) => setFormData({ ...formData, isPublished: e.target.checked })}
              className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
            />
            <label htmlFor="isPublishedCheck" className="text-xs font-semibold text-slate-700 cursor-pointer">
              ল্যান্ডিং পেজটি সরাসরি লাইভ পাবলিশ রাখুন
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsModalOpen(false)}
            >
              বাতিল
            </Button>
            <Button type="submit" variant="primary" size="sm">
              সংরক্ষণ করুন
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
