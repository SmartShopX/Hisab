/**
 * SmartShopX API Client
 * Configured to connect to centralized Laravel REST API Backend via VITE_API_BASE_URL.
 * Handles JWT bearer tokens, unified error parsing, and request typing.
 */

const BASE_URL =
  (import.meta as unknown as { env?: Record<string, string> }).env?.VITE_API_BASE_URL ||
  '/api/v1';

export class ApiError extends Error {
  status: number;
  data: unknown;

  constructor(message: string, status: number, data?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

class ApiClient {
  private getAuthToken(): string | null {
    try {
      return localStorage.getItem('smartshopx_auth_token');
    } catch {
      return null;
    }
  }

  /**
   * Retrieves the active business/store context for multi-tenant requests.
   * Personal account mode strictly yields null so personal endpoints never inherit store headers.
   */
  public getActiveStoreId(): string | null {
    try {
      const mode = localStorage.getItem('smartshopx_active_account_mode');
      if (mode === 'personal') {
        return null;
      }
      return localStorage.getItem('smartshopx_active_business_id') || 'shop_101';
    } catch {
      return null;
    }
  }

  private getHeaders(customHeaders?: HeadersInit): HeadersInit {
    const token = this.getAuthToken();
    const activeStoreId = this.getActiveStoreId();

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    // Server-side tenant isolation: X-Store-Id is attached for business requests
    if (activeStoreId) {
      headers['X-Store-Id'] = activeStoreId;
    }

    if (customHeaders) {
      if (customHeaders instanceof Headers) {
        customHeaders.forEach((val, key) => {
          headers[key] = val;
        });
      } else if (Array.isArray(customHeaders)) {
        customHeaders.forEach(([key, val]) => {
          headers[key] = val;
        });
      } else {
        Object.assign(headers, customHeaders);
      }
    }

    return headers;
  }

  async get<T>(endpoint: string, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  async post<T>(endpoint: string, data?: unknown, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T>(endpoint: string, data?: unknown, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async patch<T>(endpoint: string, data?: unknown, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(endpoint: string, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }

  private async request<T>(endpoint: string, options: RequestInit): Promise<T> {
    const url = `${BASE_URL.replace(/\/$/, '')}/${endpoint.replace(/^\//, '')}`;

    try {
      const response = await fetch(url, {
        ...options,
        headers: this.getHeaders(options.headers),
      });

      if (response.status === 401) {
        // Token expired / Unauthorized - trigger logout if needed
        try {
          localStorage.removeItem('smartshopx_auth_token');
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('smartshopx_auth_unauthorized'));
          }
        } catch {}
        const errorBody = await response.json().catch(() => ({}));
        throw new ApiError(
          errorBody.message || 'অননুমোদিত অ্যাক্সেস বা সেশন শেষ হয়ে গেছে, দয়া করে পুনরায় লগইন করুন (401 Unauthorized)',
          401,
          errorBody
        );
      }

      if (response.status === 403) {
        const errorBody = await response.json().catch(() => ({}));
        const code = errorBody.code || '';
        const msg =
          code === 'STORE_ACCESS_DENIED'
            ? 'দোকানের তথ্যে প্রবেশের অনুমতি নেই (STORE_ACCESS_DENIED)'
            : errorBody.message || 'আপনার এই তথ্য দেখার বা পরিবর্তন করার অনুমতি নেই (403 Forbidden)';
        throw new ApiError(msg, 403, errorBody);
      }

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        let defaultMsg = `সার্ভার রিকোয়েস্ট ব্যর্থ হয়েছে (${response.status})`;
        if (response.status === 404) {
          defaultMsg = 'অনুরোধকৃত তথ্য সার্ভারে খুঁজে পাওয়া যায়নি (404 Not Found)';
        } else if (response.status === 409) {
          defaultMsg = 'তথ্যের দ্বন্দ্ব বা পূর্বেই বিদ্যমান রয়েছে (409 Conflict)';
        } else if (response.status === 422) {
          defaultMsg = 'প্রদত্ত তথ্য যাচাইকরণে ত্রুটি হয়েছে (422 Validation Error)';
        } else if (response.status === 429) {
          defaultMsg = 'খুব বেশি রিকোয়েস্ট পাঠানো হয়েছে, অনুগ্রহ করে কিছুক্ষণ পর আবার চেষ্টা করুন (429 Rate Limited)';
        } else if (response.status >= 500) {
          defaultMsg = 'সার্ভারের অভ্যন্তরীণ ত্রুটি দেখা দিয়েছে, কিছুক্ষণ পর আবার চেষ্টা করুন (500 Server Error)';
        }

        throw new ApiError(errorBody.message || defaultMsg, response.status, errorBody);
      }

      return (await response.json()) as T;
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        throw err;
      }
      throw new ApiError(
        (err as Error).message || 'সার্ভার বা ইন্টারনেটের সাথে সংযোগ স্থাপন করা সম্ভব হয়নি (Network/Offline)',
        0
      );
    }
  }
}

export const apiClient = new ApiClient();
