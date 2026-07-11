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
      const errData = data as { error?: string; code?: string };
      throw this.buildError(
        this.resolveErrorCode(errData?.code, response.status),
        errData?.error ?? `HTTP ${response.status}`,
        data
      );
    }

    return data as T;
  }

  // The API returns a machine-readable `code` alongside most error bodies
  // (see the REST API reference's Errors section) — several distinct
  // failure reasons can share the same HTTP status (e.g. 403 covers both
  // `PUBLIC_ACCESS_DISABLED` and `PROJECT_INACTIVE`), so `code` is the
  // source of truth when present. The status-based mapping below is only a
  // fallback for the rare response that omits `code`.
  private static readonly KNOWN_CODES: ReadonlySet<BondifyErrorCode> = new Set([
    'SESSION_EXPIRED', 'SESSION_CANCELLED', 'NETWORK_ERROR', 'PROJECT_NOT_FOUND',
    'PROJECT_INACTIVE', 'PUBLIC_ACCESS_DISABLED', 'RATE_LIMITED', 'POLLING_TIMEOUT',
    'UNKNOWN_ERROR',
  ]);

  private resolveErrorCode(code: string | undefined, status: number): BondifyErrorCode {
    if (code && BondifyAPIClient.KNOWN_CODES.has(code as BondifyErrorCode)) {
      return code as BondifyErrorCode;
    }
    return this.mapHttpCode(status);
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
