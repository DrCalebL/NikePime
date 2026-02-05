import type { VpnNode, NodeStats, ServiceStatus } from "./types.js";

export type Result<T> = { ok: true; data: T } | { ok: false; error: string };

export interface NabuClientConfig {
  apiKey?: string;
  timeout?: number;
}

export interface NabuClient {
  getNodes(region?: string, country?: string): Promise<Result<VpnNode[]>>;
  getNodeStats(nodeId: string): Promise<Result<NodeStats>>;
  checkStatus(): Promise<Result<ServiceStatus>>;
}

const BASE_URL = "https://api.b7s.services/v1";
const DEFAULT_TIMEOUT = 30000;

export function createNabuClient(config: NabuClientConfig): NabuClient {
  const timeout = config.timeout ?? DEFAULT_TIMEOUT;

  async function request<T>(endpoint: string): Promise<Result<T>> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);

    try {
      const headers: Record<string, string> = { Accept: "application/json" };
      if (config.apiKey) {
        headers["x-api-key"] = config.apiKey;
      }

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
      if (e instanceof Error && e.name === "AbortError") {
        return { ok: false, error: "Request timeout" };
      }
      return { ok: false, error: e instanceof Error ? e.message : "Unknown error" };
    }
  }

  return {
    async getNodes(region?: string, country?: string): Promise<Result<VpnNode[]>> {
      const params = new URLSearchParams();
      if (region) params.set("region", region);
      if (country) params.set("country", country);
      const query = params.toString();
      return request<VpnNode[]>(`/nodes${query ? `?${query}` : ""}`);
    },

    async getNodeStats(nodeId: string): Promise<Result<NodeStats>> {
      return request<NodeStats>(`/nodes/${encodeURIComponent(nodeId)}/stats`);
    },

    async checkStatus(): Promise<Result<ServiceStatus>> {
      return request<ServiceStatus>("/status");
    },
  };
}
