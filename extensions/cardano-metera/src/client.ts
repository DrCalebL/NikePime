import type { IndexToken, IndexComposition, IndexPerformance } from "./types.js";

export type Result<T> = { ok: true; data: T } | { ok: false; error: string };

export interface MeteraClientConfig {
  apiKey?: string;
  timeout?: number;
}

export interface MeteraClient {
  getIndices(category?: string): Promise<Result<IndexToken[]>>;
  getComposition(indexId: string): Promise<Result<IndexComposition>>;
  getPerformance(indexId: string, timeframe?: string): Promise<Result<IndexPerformance>>;
}

const BASE_URL = "https://api.metera.io/v1";

export function createMeteraClient(config: MeteraClientConfig): MeteraClient {
  const timeout = config.timeout ?? 30000;

  async function request<T>(endpoint: string): Promise<Result<T>> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);
    try {
      const headers: Record<string, string> = { Accept: "application/json" };
      if (config.apiKey) headers["x-api-key"] = config.apiKey;
      const res = await fetch(`${BASE_URL}${endpoint}`, { headers, signal: controller.signal });
      clearTimeout(timer);
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        const safeError = text.length > 200 ? `${text.slice(0, 200)}...` : text;
        return { ok: false, error: `${res.status}: ${safeError || res.statusText}` };
      }
      return { ok: true, data: (await res.json()) as T };
    } catch (e) {
      clearTimeout(timer);
      if (e instanceof Error && e.name === "AbortError")
        return { ok: false, error: "Request timeout" };
      return { ok: false, error: e instanceof Error ? e.message : "Unknown error" };
    }
  }

  return {
    async getIndices(category?: string) {
      const query = category ? `?category=${encodeURIComponent(category)}` : "";
      return request<IndexToken[]>(`/indices${query}`);
    },
    async getComposition(indexId: string) {
      return request<IndexComposition>(`/indices/${encodeURIComponent(indexId)}/composition`);
    },
    async getPerformance(indexId: string, timeframe = "24h") {
      return request<IndexPerformance>(
        `/indices/${encodeURIComponent(indexId)}/performance?timeframe=${timeframe}`,
      );
    },
  };
}
