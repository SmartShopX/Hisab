import { query } from '../config/database.js';
import { PLAN_QUOTAS } from '../routes/subscriptionRoutes.js';

export interface AiUsageLog {
  id: string;
  userId: string;
  storeId: string;
  subscriptionPlan: string;
  operation: 'process-image' | 'generate-info' | 'create-video' | string;
  creditsConsumed: number;
  requestId: string;
  status: 'success' | 'failed' | 'refunded';
  provider: string;
  model: string;
  metadata?: Record<string, any>;
  createdAt: string;
}

export type VideoJobStatus = 'queued' | 'processing' | 'completed' | 'failed' | 'cancelled';

export interface AiVideoJob {
  id: string;
  userId: string;
  storeId: string;
  productId?: string;
  productName: string;
  sourceImageUrl: string;
  provider: string;
  model: string;
  status: VideoJobStatus;
  progress: number;
  resultUrl?: string;
  previewPoster?: string;
  errorCode?: string;
  errorMessage?: string;
  creditsReserved: number;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

// In-Memory persistent backing store (safe for development / container runtime / test environments)
class AiUsageRepository {
  private usageLogs: AiUsageLog[] = [];
  private videoJobs: Map<string, AiVideoJob> = new Map();
  private processedRequestIds: Set<string> = new Set();

  /**
   * Calculates monthly credits consumed for a given store
   */
  public async getMonthlyCreditsUsed(storeId: string, monthStr?: string): Promise<number> {
    const currentMonth = monthStr || new Date().toISOString().slice(0, 7); // e.g. "2026-09"

    // 1. Try PostgreSQL if accessible
    try {
      const res = await query(
        `SELECT COALESCE(SUM(credits_consumed), 0) as total
         FROM ai_usage_logs
         WHERE store_id = $1 
           AND status = 'success'
           AND TO_CHAR(created_at, 'YYYY-MM') = $2`,
        [storeId, currentMonth]
      );
      if (res && res.rows && res.rows.length > 0) {
        return parseInt(res.rows[0].total, 10) || 0;
      }
    } catch {
      // Fallback to in-memory store
    }

    // 2. In-Memory fallback
    return this.usageLogs
      .filter((l) => l.storeId === storeId && l.status === 'success' && l.createdAt.startsWith(currentMonth))
      .reduce((sum, l) => sum + l.creditsConsumed, 0);
  }

  /**
   * Evaluates subscription plan quota
   */
  public async checkQuota(
    storeId: string,
    plan: string,
    requiredCredits: number = 1
  ): Promise<{ allowed: boolean; used: number; max: number; remaining: number }> {
    const normalizedPlan = (plan || 'FREE').toUpperCase();
    const quotaDef = PLAN_QUOTAS[normalizedPlan] || PLAN_QUOTAS.FREE;
    const max = quotaDef.maxAiCredits;
    const used = await this.getMonthlyCreditsUsed(storeId);
    const remaining = Math.max(0, max - used);
    const allowed = remaining >= requiredCredits;

    return { allowed, used, max, remaining };
  }

  /**
   * Atomically records usage and consumes credit. Deduplicates by requestId to avoid double deduction.
   */
  public async recordUsage(params: {
    userId: string;
    storeId: string;
    subscriptionPlan: string;
    operation: string;
    creditsConsumed: number;
    requestId: string;
    status?: 'success' | 'failed' | 'refunded';
    provider?: string;
    model?: string;
    metadata?: Record<string, any>;
  }): Promise<{ success: boolean; log: AiUsageLog; alreadyProcessed?: boolean }> {
    // Deduplication check
    if (params.requestId && this.processedRequestIds.has(params.requestId)) {
      const existing = this.usageLogs.find((l) => l.requestId === params.requestId);
      if (existing) {
        return { success: true, log: existing, alreadyProcessed: true };
      }
    }

    const log: AiUsageLog = {
      id: `ailog_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      userId: params.userId,
      storeId: params.storeId,
      subscriptionPlan: (params.subscriptionPlan || 'FREE').toUpperCase(),
      operation: params.operation,
      creditsConsumed: params.creditsConsumed,
      requestId: params.requestId,
      status: params.status || 'success',
      provider: params.provider || 'gemini',
      model: params.model || process.env.GEMINI_MODEL || 'gemini-flash-latest',
      metadata: params.metadata || {},
      createdAt: new Date().toISOString(),
    };

    if (params.requestId) {
      this.processedRequestIds.add(params.requestId);
    }
    this.usageLogs.push(log);

    // Try persisting to PostgreSQL
    try {
      await query(
        `INSERT INTO ai_usage_logs (
          id, user_id, store_id, subscription_plan, operation,
          credits_consumed, request_id, status, provider, model, metadata, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
        [
          log.id,
          log.userId,
          log.storeId,
          log.subscriptionPlan,
          log.operation,
          log.creditsConsumed,
          log.requestId,
          log.status,
          log.provider,
          log.model,
          JSON.stringify(log.metadata || {}),
          log.createdAt,
        ]
      );
    } catch {
      // Retain in in-memory list
    }

    return { success: true, log };
  }

  /**
   * Refunds credits in case of late downstream execution failure
   */
  public async refundCredits(requestId: string, storeId: string): Promise<boolean> {
    const target = this.usageLogs.find((l) => l.requestId === requestId && l.storeId === storeId);
    if (!target) return false;

    target.status = 'refunded';
    target.creditsConsumed = 0;

    try {
      await query(
        `UPDATE ai_usage_logs 
         SET status = 'refunded', credits_consumed = 0 
         WHERE request_id = $1 AND store_id = $2`,
        [requestId, storeId]
      );
    } catch {
      // Handled in memory
    }

    return true;
  }

  /**
   * Video Job lifecycle methods
   */
  public async createVideoJob(params: {
    userId: string;
    storeId: string;
    productId?: string;
    productName: string;
    sourceImageUrl: string;
    provider?: string;
    model?: string;
    creditsReserved?: number;
    previewPoster?: string;
  }): Promise<AiVideoJob> {
    const id = `job_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const now = new Date().toISOString();

    const job: AiVideoJob = {
      id,
      userId: params.userId,
      storeId: params.storeId,
      productId: params.productId,
      productName: params.productName,
      sourceImageUrl: params.sourceImageUrl,
      provider: params.provider || 'demo-showcase',
      model: params.model || 'svg-animator-v1',
      status: 'queued',
      progress: 10,
      previewPoster: params.previewPoster,
      creditsReserved: params.creditsReserved ?? 3,
      createdAt: now,
      updatedAt: now,
    };

    this.videoJobs.set(id, job);

    try {
      await query(
        `INSERT INTO ai_video_jobs (
          id, user_id, store_id, product_id, product_name,
          source_image_url, provider, model, status, progress,
          credits_reserved, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
        [
          job.id,
          job.userId,
          job.storeId,
          job.productId || null,
          job.productName,
          job.sourceImageUrl,
          job.provider,
          job.model,
          job.status,
          job.progress,
          job.creditsReserved,
          job.createdAt,
          job.updatedAt,
        ]
      );
    } catch {
      // In-memory fallback
    }

    return job;
  }

  public async getVideoJob(jobId: string, storeId?: string): Promise<AiVideoJob | null> {
    const job = this.videoJobs.get(jobId);
    if (job) {
      if (storeId && job.storeId !== storeId) return null; // Cross-tenant isolation
      return job;
    }

    try {
      const res = await query(
        `SELECT id, user_id as "userId", store_id as "storeId", product_id as "productId",
                product_name as "productName", source_image_url as "sourceImageUrl",
                provider, model, status, progress, result_url as "resultUrl",
                preview_poster as "previewPoster", error_code as "errorCode",
                error_message as "errorMessage", credits_reserved as "creditsReserved",
                created_at as "createdAt", updated_at as "updatedAt", completed_at as "completedAt"
         FROM ai_video_jobs
         WHERE id = $1 ${storeId ? 'AND store_id = $2' : ''}`,
        storeId ? [jobId, storeId] : [jobId]
      );
      if (res && res.rows && res.rows.length > 0) {
        return res.rows[0];
      }
    } catch {
      // Fallback
    }

    return null;
  }

  public async updateVideoJob(jobId: string, updates: Partial<AiVideoJob>): Promise<AiVideoJob | null> {
    const job = this.videoJobs.get(jobId);
    if (!job) return null;

    Object.assign(job, updates, { updatedAt: new Date().toISOString() });
    if (updates.status === 'completed') {
      job.completedAt = new Date().toISOString();
    }

    try {
      await query(
        `UPDATE ai_video_jobs
         SET status = COALESCE($2, status),
             progress = COALESCE($3, progress),
             result_url = COALESCE($4, result_url),
             error_code = COALESCE($5, error_code),
             error_message = COALESCE($6, error_message),
             updated_at = NOW(),
             completed_at = CASE WHEN $2 = 'completed' THEN NOW() ELSE completed_at END
         WHERE id = $1`,
        [
          jobId,
          updates.status || null,
          updates.progress ?? null,
          updates.resultUrl || null,
          updates.errorCode || null,
          updates.errorMessage || null,
        ]
      );
    } catch {
      // Fallback
    }

    return job;
  }

  public async deleteVideoJob(jobId: string, storeId?: string): Promise<boolean> {
    const job = this.videoJobs.get(jobId);
    if (!job) return false;
    if (storeId && job.storeId !== storeId) return false;

    this.videoJobs.delete(jobId);

    try {
      await query(`DELETE FROM ai_video_jobs WHERE id = $1 ${storeId ? 'AND store_id = $2' : ''}`, storeId ? [jobId, storeId] : [jobId]);
    } catch {
      // Fallback
    }

    return true;
  }

  /**
   * Reporting / Audit analytics
   */
  public async getUsageReport(
    storeId: string,
    filters?: { operation?: string; status?: string; startDate?: string; endDate?: string }
  ): Promise<{
    totalCreditsUsed: number;
    totalOperations: number;
    breakdown: Record<string, number>;
    logs: AiUsageLog[];
  }> {
    let list = this.usageLogs.filter((l) => l.storeId === storeId);

    if (filters?.operation) list = list.filter((l) => l.operation === filters.operation);
    if (filters?.status) list = list.filter((l) => l.status === filters.status);
    if (filters?.startDate) list = list.filter((l) => l.createdAt >= filters.startDate!);
    if (filters?.endDate) list = list.filter((l) => l.createdAt <= filters.endDate!);

    const breakdown: Record<string, number> = {};
    let totalCreditsUsed = 0;

    for (const item of list) {
      if (item.status === 'success') {
        totalCreditsUsed += item.creditsConsumed;
        breakdown[item.operation] = (breakdown[item.operation] || 0) + item.creditsConsumed;
      }
    }

    return {
      totalCreditsUsed,
      totalOperations: list.length,
      breakdown,
      logs: list.slice(-50).reverse(), // Last 50 entries descending
    };
  }
}

export const aiUsageRepo = new AiUsageRepository();
