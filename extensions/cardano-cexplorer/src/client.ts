import type {
  AddressInfo,
  TransactionDetails,
  PoolInfo,
  EpochInfo,
  SearchResult,
} from "./types.js";

export type Result<T> = { ok: true; data: T } | { ok: false; error: string };

export interface CexplorerClientConfig {
  apiKey?: string;
  timeout?: number;
}

export interface CexplorerClient {
  getAddress(address: string, includeTxs?: boolean): Promise<Result<AddressInfo>>;
  getTransaction(txHash: string): Promise<Result<TransactionDetails>>;
  getPool(poolId: string): Promise<Result<PoolInfo>>;
  getEpoch(epoch?: number): Promise<Result<EpochInfo>>;
  search(query: string, type?: string, limit?: number): Promise<Result<SearchResult[]>>;
}

const BASE_URL = "https://api.cexplorer.io/v1";

export function createCexplorerClient(config: CexplorerClientConfig): CexplorerClient {
  const timeout = config.timeout ?? 30000;

  async function request<T>(endpoint: string): Promise<Result<T>> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);
    try {
      const headers: Record<string, string> = { Accept: "application/json" };
      if (config.apiKey) headers["Authorization"] = `Bearer ${config.apiKey}`;
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
    async getAddress(address: string, includeTxs = false) {
      const query = includeTxs ? "?include_txs=true" : "";
      return request<AddressInfo>(`/addresses/${encodeURIComponent(address)}${query}`);
    },
    async getTransaction(txHash: string) {
      return request<TransactionDetails>(`/transactions/${encodeURIComponent(txHash)}`);
    },
    async getPool(poolId: string) {
      return request<PoolInfo>(`/pools/${encodeURIComponent(poolId)}`);
    },
    async getEpoch(epoch?: number) {
      const path = epoch !== undefined ? `/epochs/${epoch}` : "/epochs/current";
      return request<EpochInfo>(path);
    },
    async search(query: string, type?: string, limit = 10) {
      const params = new URLSearchParams({ q: query, limit: String(limit) });
      if (type) params.set("type", type);
      return request<SearchResult[]>(`/search?${params}`);
    },
  };
}
