import type { Pool, TokenPrice, SwapEstimate, LiquidityInfo } from "./types.js";

export type Result<T> = { ok: true; data: T } | { ok: false; error: string };

export interface CswapClientConfig {
  apiKey?: string;
  timeout?: number;
}

export interface CswapClient {
  getPools(token?: string, limit?: number): Promise<Result<Pool[]>>;
  getPrice(token: string): Promise<Result<TokenPrice>>;
  estimateSwap(
    inputToken: string,
    outputToken: string,
    amount: string,
  ): Promise<Result<SwapEstimate>>;
  getLiquidity(poolId: string): Promise<Result<LiquidityInfo>>;
}

const BASE_URL = "https://api.cswap.fi/v1";

export function createCswapClient(config: CswapClientConfig): CswapClient {
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
    async getPools(token?: string, limit = 10) {
      const params = new URLSearchParams({ limit: String(limit) });
      if (token) params.set("token", token);
      return request<Pool[]>(`/pools?${params}`);
    },
    async getPrice(token: string) {
      return request<TokenPrice>(`/price/${encodeURIComponent(token)}`);
    },
    async estimateSwap(inputToken: string, outputToken: string, amount: string) {
      const params = new URLSearchParams({ input: inputToken, output: outputToken, amount });
      return request<SwapEstimate>(`/estimate?${params}`);
    },
    async getLiquidity(poolId: string) {
      return request<LiquidityInfo>(`/pools/${encodeURIComponent(poolId)}/liquidity`);
    },
  };
}
