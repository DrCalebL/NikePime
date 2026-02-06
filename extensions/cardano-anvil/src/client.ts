import type {
  MintRequest,
  MintResponse,
  BurnRequest,
  BurnResponse,
  CollectionRequest,
  CollectionResponse,
  MintHistory,
} from "./types.js";

export type Result<T> = { ok: true; data: T } | { ok: false; error: string };

export interface AnvilClientConfig {
  apiKey?: string;
  timeout?: number;
}

export interface AnvilClient {
  mintToken(request: MintRequest): Promise<Result<MintResponse>>;
  burnToken(request: BurnRequest): Promise<Result<BurnResponse>>;
  createCollection(request: CollectionRequest): Promise<Result<CollectionResponse>>;
  getMints(policyId?: string, status?: string, limit?: number): Promise<Result<MintHistory[]>>;
}

const BASE_URL = "https://api.ada-anvil.io/v1";

export function createAnvilClient(config: AnvilClientConfig): AnvilClient {
  const timeout = config.timeout ?? 30000;

  async function request<T>(method: string, endpoint: string, body?: unknown): Promise<Result<T>> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);
    try {
      const headers: Record<string, string> = { Accept: "application/json" };
      if (config.apiKey) headers["x-api-key"] = config.apiKey;
      if (body) headers["Content-Type"] = "application/json";

      const res = await fetch(`${BASE_URL}${endpoint}`, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
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
      if (e instanceof Error && e.name === "AbortError")
        return { ok: false, error: "Request timeout" };
      return { ok: false, error: e instanceof Error ? e.message : "Unknown error" };
    }
  }

  return {
    async mintToken(req: MintRequest) {
      return request<MintResponse>("POST", "/mint", req);
    },
    async burnToken(req: BurnRequest) {
      return request<BurnResponse>("POST", "/burn", req);
    },
    async createCollection(req: CollectionRequest) {
      return request<CollectionResponse>("POST", "/collections", req);
    },
    async getMints(policyId?: string, status?: string, limit = 10) {
      const params = new URLSearchParams({ limit: String(limit) });
      if (policyId) params.set("policy_id", policyId);
      if (status) params.set("status", status);
      return request<MintHistory[]>("GET", `/mints?${params}`);
    },
  };
}
