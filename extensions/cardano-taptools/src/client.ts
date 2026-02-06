/**
 * TapTools API client.
 */

import type {
  TokenPrice,
  TokenHolders,
  NftCollection,
  DexVolume,
  TrendingTokens,
  TrendingNfts,
} from "./types.js";

export type Result<T> = { ok: true; data: T } | { ok: false; error: string };

export interface TapToolsClientConfig {
  apiKey?: string;
  timeout?: number;
}

export interface TapToolsClient {
  getTokenPrice(policyId: string, assetName?: string): Promise<Result<TokenPrice>>;
  getTokenHolders(policyId: string, limit?: number): Promise<Result<TokenHolders>>;
  getNftCollection(policyId: string): Promise<Result<NftCollection>>;
  getDexVolume(timeframe?: string): Promise<Result<DexVolume>>;
  getTrending(
    type?: "tokens" | "nfts",
    limit?: number,
  ): Promise<Result<TrendingTokens | TrendingNfts>>;
}

const BASE_URL = "https://openapi.taptools.io/api/v1";
const DEFAULT_TIMEOUT = 30000;

export function createTapToolsClient(config: TapToolsClientConfig): TapToolsClient {
  const timeout = config.timeout ?? DEFAULT_TIMEOUT;

  async function request<T>(endpoint: string): Promise<Result<T>> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);

    try {
      const headers: Record<string, string> = { Accept: "application/json" };
      if (config.apiKey) {
        headers["x-api-key"] = config.apiKey;
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
    async getTokenPrice(policyId: string, assetName?: string): Promise<Result<TokenPrice>> {
      const unit = assetName ? `${policyId}.${assetName}` : policyId;
      return request<TokenPrice>(`/token/price?unit=${encodeURIComponent(unit)}`);
    },

    async getTokenHolders(policyId: string, limit = 10): Promise<Result<TokenHolders>> {
      return request<TokenHolders>(
        `/token/holders?policy_id=${encodeURIComponent(policyId)}&limit=${limit}`,
      );
    },

    async getNftCollection(policyId: string): Promise<Result<NftCollection>> {
      return request<NftCollection>(`/nft/collection?policy_id=${encodeURIComponent(policyId)}`);
    },

    async getDexVolume(timeframe = "24h"): Promise<Result<DexVolume>> {
      return request<DexVolume>(`/dex/volume?timeframe=${encodeURIComponent(timeframe)}`);
    },

    async getTrending(
      type: "tokens" | "nfts" = "tokens",
      limit = 10,
    ): Promise<Result<TrendingTokens | TrendingNfts>> {
      const endpoint = type === "nfts" ? "/nft/trending" : "/token/trending";
      return request(`${endpoint}?type=${type}&limit=${limit}`);
    },
  };
}
