/**
 * Ada Handle API client.
 */

import type { ResolvedHandle, ReverseResult, HandleMetadata, AvailabilityResult } from "./types.js";

export type Result<T> = { ok: true; data: T } | { ok: false; error: string };

export interface HandleClientConfig {
  apiKey?: string;
  timeout?: number;
}

export interface HandleClient {
  resolve(handle: string): Promise<Result<ResolvedHandle>>;
  reverseLookup(address: string): Promise<Result<ReverseResult>>;
  getMetadata(handle: string): Promise<Result<HandleMetadata>>;
  checkAvailability(handle: string): Promise<Result<AvailabilityResult>>;
}

const BASE_URL = "https://api.handle.me";
const DEFAULT_TIMEOUT = 30000;

function normalizeHandle(handle: string): string {
  return handle.replace(/^\$/, "").toLowerCase();
}

export function createHandleClient(config: HandleClientConfig): HandleClient {
  const timeout = config.timeout ?? DEFAULT_TIMEOUT;

  async function request<T>(endpoint: string): Promise<Result<T>> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);

    try {
      const headers: Record<string, string> = { Accept: "application/json" };
      if (config.apiKey) {
        headers["Authorization"] = `Bearer ${config.apiKey}`;
      }

      const res = await fetch(`${BASE_URL}${endpoint}`, {
        headers,
        signal: controller.signal,
      });

      clearTimeout(timer);

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        const safeError = text.length > 200 ? `${text.slice(0, 200)}...` : text;
        return { ok: false, error: `${res.status}: ${safeError || res.statusText}` };
      }

      return { ok: true, data: (await res.json()) as T };
    } catch (e) {
      clearTimeout(timer);
      if (e instanceof Error && e.name === "AbortError") {
        return { ok: false, error: "Request timeout" };
      }
      return { ok: false, error: e instanceof Error ? e.message : "Unknown error" };
    }
  }

  return {
    async resolve(handle: string): Promise<Result<ResolvedHandle>> {
      const normalized = normalizeHandle(handle);
      return request<ResolvedHandle>(`/handles/${encodeURIComponent(normalized)}`);
    },

    async reverseLookup(address: string): Promise<Result<ReverseResult>> {
      return request<ReverseResult>(`/addresses/${encodeURIComponent(address)}/handles`);
    },

    async getMetadata(handle: string): Promise<Result<HandleMetadata>> {
      const normalized = normalizeHandle(handle);
      return request<HandleMetadata>(`/handles/${encodeURIComponent(normalized)}/metadata`);
    },

    async checkAvailability(handle: string): Promise<Result<AvailabilityResult>> {
      const normalized = normalizeHandle(handle);
      return request<AvailabilityResult>(`/handles/${encodeURIComponent(normalized)}/availability`);
    },
  };
}
