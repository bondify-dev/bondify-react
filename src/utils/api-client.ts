// ============================================================
//  @bondify/react — API Client
//  Typed HTTP client for the Bondify Public API
// ============================================================

import type {
  GenerateResponse,
  VerifyResponse,
  BondifyError,
  BondifyErrorCode,
} from '../types';

export class BondifyAPIClient {
  private readonly apiUrl: string;
  private readonly projectId: string;

  constructor(apiUrl: string, projectId: string) {
    this.apiUrl = apiUrl.replace(/\/$/, '');
    this.projectId = projectId;
  }

  // ── Session generation ──────────────────────────────────────────────────
  async generateSession(): Promise<GenerateResponse> {
    const res = await this.request<GenerateResponse>(
      'POST',
      '/api/v1/generate/public',
      { project_id: this.projectId }
    );
    return res;
  }

  // ── Session status verification ─────────────────────────────────────────
  async verifySession(sessionToken: string): Promise<VerifyResponse> {
    const res = await this.request<VerifyResponse>(
      'POST',
      '/api/v1/verify/public',
      { project_id: this.projectId, session_token: sessionToken }
    );
    return res;
  }

  // ── Shared typed fetch ───────────────────────────────────────────────────
  private async request<T>(
    method: string,
    path: string,
    body?: Record<string, unknown>
  ): Promise<T> {
    const url = `${this.apiUrl}${path}`;

    let response: Response;
    try {
      response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: body ? JSON.stringify(body) : undefined,
        cache: 'no-store',
      });
    } catch (e) {
      throw this.buildError('NETWORK_ERROR', 'Network error while calling the Bondify API', e);
    }

    let data: unknown;
    try {
      data = await response.json();
    } catch {
      throw this.buildError('UNKNOWN_ERROR', `Invalid JSON response from the server (${response.status})`);
    }

    if (!response.ok) {
      const errData = data as { error?: string };
      throw this.buildError(
        this.mapHttpCode(response.status),
        errData?.error ?? `HTTP ${response.status}`,
        data
      );
    }

    return data as T;
  }

  private mapHttpCode(status: number): BondifyErrorCode {
    const map: Record<number, BondifyErrorCode> = {
      404: 'PROJECT_NOT_FOUND',
      403: 'PUBLIC_ACCESS_DISABLED',
      429: 'RATE_LIMITED',
    };
    return map[status] ?? 'UNKNOWN_ERROR';
  }

  private buildError(
    code: BondifyErrorCode,
    message: string,
    details?: unknown
  ): BondifyError {
    return { code, message, details };
  }
}
