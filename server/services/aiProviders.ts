import { GoogleGenAI } from '@google/genai';
import { aiUsageRepo, AiVideoJob } from './aiUsageRepository.js';

export interface GeneratedCatalogInfo {
  productName: string;
  category: string;
  subcategory: string;
  shortDescription: string;
  detailedDescription: string;
  keywords: string[];
  tags: string[];
  suggestedPriceRange: {
    min: number;
    max: number;
    currency: string;
  };
}

export interface AIProvider {
  name: string;
  status: 'configured' | 'mock' | 'unavailable';
  generateProductInfo(params: {
    imageUrl?: string;
    productName?: string;
    category?: string;
    targetLanguage?: 'bn' | 'en' | 'both';
  }): Promise<GeneratedCatalogInfo>;
}

export interface VideoGenerationProvider {
  name: string;
  type: 'demo-showcase' | 'ai-generative' | 'mock';
  status: 'configured' | 'mock' | 'unavailable';
  createJob(params: {
    jobId: string;
    userId: string;
    storeId: string;
    productName: string;
    sourceImageUrl: string;
    price?: number;
  }): Promise<void>;
  getJobStatus(jobId: string): Promise<AiVideoJob | null>;
  cancelJob(jobId: string): Promise<boolean>;
}

// ----------------------------------------------------
// 1. Google Gemini AI Provider
// ----------------------------------------------------
export class GeminiAIProvider implements AIProvider {
  public name = 'Google Gemini';
  public status: 'configured' | 'mock' | 'unavailable' = 'unavailable';
  private aiClient: GoogleGenAI | null = null;
  private modelName: string;

  constructor() {
    this.modelName = process.env.GEMINI_MODEL || 'gemini-flash-latest';
    if (process.env.GEMINI_API_KEY) {
      this.status = 'configured';
    }
  }

  private getClient(): GoogleGenAI | null {
    if (!this.aiClient && process.env.GEMINI_API_KEY) {
      this.aiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      this.status = 'configured';
    }
    return this.aiClient;
  }

  public async generateProductInfo(params: {
    imageUrl?: string;
    productName?: string;
    category?: string;
  }): Promise<GeneratedCatalogInfo> {
    const client = this.getClient();
    if (!client) {
      throw new Error('GEMINI_API_KEY is not configured on the server');
    }

    const prompt = `You are a Bangladeshi eCommerce catalog expert. Generate structured metadata for this product:
Product Hint: "${params.productName || 'eCommerce Product'}"
Category: "${params.category || 'General Store'}"

Respond ONLY with valid JSON matching this exact schema:
{
  "productName": "Catchy Bengali name with English brand/model in parentheses",
  "category": "Standard Bangladeshi category (e.g. পোশাক, গ্যাজেট, মুদি, প্রসাধন)",
  "subcategory": "Subcategory name",
  "shortDescription": "1-2 sentence Bengali marketing hook for Facebook/SMS",
  "detailedDescription": "Key bullet points of features, build quality, warranty and authenticity guarantee in Bengali",
  "keywords": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5"],
  "tags": ["#Tag1", "#Tag2", "#Tag3"],
  "suggestedPriceRange": {
    "min": 100,
    "max": 500,
    "currency": "BDT"
  }
}`;

    // Execute with a 7-second timeout to prevent UI hanging
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('AI Provider request timed out')), 7000)
    );

    const apiPromise = client.models.generateContent({
      model: this.modelName,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const response = await Promise.race([apiPromise, timeoutPromise]);
    const text = response.text || '';
    const cleanJson = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    return JSON.parse(cleanJson);
  }
}

// ----------------------------------------------------
// 2. Localized Heuristic Fallback Provider
// ----------------------------------------------------
export class HeuristicCatalogProvider implements AIProvider {
  public name = 'SmartShopX Heuristic Catalog Engine';
  public status: 'configured' = 'configured';

  public async generateProductInfo(params: {
    productName?: string;
    category?: string;
  }): Promise<GeneratedCatalogInfo> {
    const rawName = params.productName || 'প্রিমিয়াম প্রোডাক্ট';
    const category = params.category || 'সাধারণ পণ্য';

    let subcat = 'ডেইলি ইউজ';
    let basePrice = 1200;

    if (category.includes('পোশাক') || category.includes('Fashion')) {
      subcat = 'কটন ফেব্রিক';
      basePrice = 950;
    } else if (category.includes('গ্যাজেট') || category.includes('Electronics')) {
      subcat = 'স্মার্ট এক্সেসরিজ';
      basePrice = 1850;
    } else if (category.includes('মুদি') || category.includes('Grocery')) {
      subcat = 'খাদ্যসামগ্রী';
      basePrice = 350;
    }

    return {
      productName: `${rawName} - হাই কোয়ালিটি গ্যারান্টি`,
      category: category,
      subcategory: subcat,
      shortDescription: `${rawName} আপনার দৈনন্দিন প্রয়োজনে সেরা মান ও স্থায়িত্ব নিশ্চিত করবে। এখনই অর্ডার করুন।`,
      detailedDescription: `• ১০০% খাঁটি ও প্রিমিয়াম ফিনিশিং\n• দীর্ঘস্থায়ী ও পরিবেশবান্ধব ম্যাটেরিয়াল\n• ক্যাশ অন ডেলিভারি এবং দ্রুত হোম ডেলিভারি সুবিধা\n• ৭ দিনের সহজ রিটার্ন ও রিপ্লেসমেন্ট পলিসি`,
      keywords: [rawName, category, 'অনলাইন শপ', 'সেরা দাম', 'বাংলাদেশ ডেলিভারি'],
      tags: ['#SmartShopX', '#eCommerceBD', '#QualityProduct', '#BestDeal'],
      suggestedPriceRange: {
        min: Math.round(basePrice * 0.85),
        max: Math.round(basePrice * 1.35),
        currency: 'BDT',
      },
    };
  }
}

// ----------------------------------------------------
// 3. Video Showcase Provider (Demo / SVG Animator)
// ----------------------------------------------------
export class ShowcaseSvgVideoProvider implements VideoGenerationProvider {
  public name = 'SmartShopX Showcase Video Engine';
  public type: 'demo-showcase' = 'demo-showcase';
  public status: 'configured' = 'configured';

  public async createJob(params: {
    jobId: string;
    userId: string;
    storeId: string;
    productName: string;
    sourceImageUrl: string;
    price?: number;
  }): Promise<void> {
    const { jobId, productName, sourceImageUrl, price = 1500 } = params;

    // Simulate progressive rendering stages asynchronously (non-blocking)
    setTimeout(async () => {
      await aiUsageRepo.updateVideoJob(jobId, { status: 'processing', progress: 45 });
    }, 1200);

    setTimeout(async () => {
      await aiUsageRepo.updateVideoJob(jobId, { status: 'processing', progress: 85 });
    }, 2500);

    setTimeout(async () => {
      // Build animated showcase player SVG data URL
      const svgVideo = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 720 720" width="100%" height="100%">
        <defs>
          <radialGradient id="stageGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stop-color="#3b82f6" stop-opacity="0.25"/>
            <stop offset="100%" stop-color="#0f172a" stop-opacity="1"/>
          </radialGradient>
          <filter id="cinematicGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="15" result="blur"/>
            <feComposite in="SourceGraphic" in2="blur" operator="over"/>
          </filter>
        </defs>
        <rect width="720" height="720" fill="url(#stageGlow)"/>
        
        <!-- Animated Background Rings -->
        <circle cx="360" cy="360" r="280" fill="none" stroke="#10b981" stroke-width="2" stroke-dasharray="15 10" opacity="0.3">
          <animateTransform attributeName="transform" type="rotate" from="0 360 360" to="360 360 360" dur="25s" repeatCount="indefinite"/>
        </circle>
        <circle cx="360" cy="360" r="230" fill="none" stroke="#6366f1" stroke-width="1.5" stroke-dasharray="8 6" opacity="0.4">
          <animateTransform attributeName="transform" type="rotate" from="360 360 360" to="0 360 360" dur="18s" repeatCount="indefinite"/>
        </circle>

        <!-- Product Image Showcase with Smooth Pan & Zoom -->
        <g>
          <animateTransform attributeName="transform" type="scale" values="1; 1.07; 1" dur="7s" repeatCount="indefinite" transform-origin="360 360"/>
          <clipPath id="circleClip">
            <circle cx="360" cy="320" r="180"/>
          </clipPath>
          <circle cx="360" cy="320" r="186" fill="none" stroke="#38bdf8" stroke-width="3" filter="url(#cinematicGlow)"/>
          <image href="${sourceImageUrl}" x="170" y="130" width="380" height="380" preserveAspectRatio="xMidYMid slice" clip-path="url(#circleClip)"/>
        </g>

        <!-- Dynamic Hologram Lighting Ripple -->
        <ellipse cx="360" cy="515" rx="190" ry="24" fill="#000000" opacity="0.45"/>
        <ellipse cx="360" cy="515" rx="150" ry="18" fill="none" stroke="#38bdf8" stroke-width="2" opacity="0.6">
          <animate attributeName="rx" values="140; 180; 140" dur="3s" repeatCount="indefinite"/>
          <animate attributeName="opacity" values="0.7; 0.2; 0.7" dur="3s" repeatCount="indefinite"/>
        </ellipse>

        <!-- Lower Third Title & Badge -->
        <rect x="70" y="555" width="580" height="110" rx="20" fill="#0f172ae6" stroke="#334155" stroke-width="1.5"/>
        
        <text x="360" y="598" font-family="'Plus Jakarta Sans', sans-serif" font-size="24" font-weight="bold" fill="#f8fafc" text-anchor="middle">
          ${productName.slice(0, 36)}
        </text>

        <g transform="translate(190, 615)">
          <rect x="0" y="0" width="150" height="34" rx="8" fill="#10b981"/>
          <text x="75" y="23" font-family="sans-serif" font-size="16" font-weight="bold" fill="#ffffff" text-anchor="middle">
            ৳ ${price.toLocaleString('en-BD')}
          </text>
        </g>

        <g transform="translate(365, 615)">
          <rect x="0" y="0" width="165" height="34" rx="8" fill="#4f46e5"/>
          <text x="82" y="23" font-family="sans-serif" font-size="14" font-weight="bold" fill="#ffffff" text-anchor="middle">
            ✨ AI SHOWCASE
          </text>
        </g>
      </svg>`;

      const resultUrl = `data:image/svg+xml;utf8,${encodeURIComponent(svgVideo)}`;
      await aiUsageRepo.updateVideoJob(jobId, {
        status: 'completed',
        progress: 100,
        resultUrl,
      });
    }, 4000);
  }

  public async getJobStatus(jobId: string): Promise<AiVideoJob | null> {
    return aiUsageRepo.getVideoJob(jobId);
  }

  public async cancelJob(jobId: string): Promise<boolean> {
    const updated = await aiUsageRepo.updateVideoJob(jobId, {
      status: 'cancelled',
      errorMessage: 'Cancelled by merchant',
    });
    return !!updated;
  }
}

// ----------------------------------------------------
// AI Provider Registries
// ----------------------------------------------------
export const geminiProvider = new GeminiAIProvider();
export const heuristicProvider = new HeuristicCatalogProvider();
export const showcaseVideoProvider = new ShowcaseSvgVideoProvider();
