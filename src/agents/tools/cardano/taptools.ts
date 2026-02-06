/**
 * TapTools Cardano analytics integration.
 *
 * TapTools provides comprehensive analytics for Cardano tokens, NFTs, and DEX activity.
 * API Documentation: https://openapi.taptools.io
 */

import { Type } from "@sinclair/typebox";
import type { OpenClawConfig } from "../../../config/types.js";
import type { AnyAgentTool } from "../common.js";
import { jsonResult, readStringParam, readNumberParam } from "../common.js";

const TAPTOOLS_API = "https://openapi.taptools.io/api/v1";
const TIMEOUT_MS = 30_000;

type Result<T> = { ok: true; data: T } | { ok: false; error: string };

function getTapToolsApiKey(cfg?: OpenClawConfig): string | undefined {
  const tools = cfg?.tools as Record<string, unknown> | undefined;
  const taptools = tools?.taptools as Record<string, unknown> | undefined;
  return (taptools?.apiKey as string) || process.env.TAPTOOLS_API_KEY;
}

async function fetchTapTools<T>(endpoint: string, apiKey?: string): Promise<Result<T>> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const headers: Record<string, string> = { Accept: "application/json" };
    if (apiKey) {
      headers["x-api-key"] = apiKey;
    }
    const res = await fetch(`${TAPTOOLS_API}${endpoint}`, {
      headers,
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      return { ok: false, error: `${res.status}: ${text || res.statusText}` };
    }
    return { ok: true, data: (await res.json()) as T };
  } catch (e) {
    clearTimeout(timer);
    return { ok: false, error: e instanceof Error ? e.message : "Unknown error" };
  }
}

interface TokenPrice {
  price: string;
  price_24h_change: string;
  volume_24h: string;
  market_cap: string;
}

interface TokenHolders {
  total_holders: number;
  top_holders: Array<{
    address: string;
    balance: string;
    percentage: string;
  }>;
}

interface NftCollection {
  name: string;
  policy_id: string;
  floor_price: string;
  volume_24h: string;
  volume_7d: string;
  total_supply: number;
  listed_count: number;
}

interface DexVolume {
  total_volume_24h: string;
  protocols: Array<{
    name: string;
    volume_24h: string;
    percentage: string;
  }>;
}

interface TrendingTokens {
  tokens: Array<{
    name: string;
    policy_id: string;
    price_change: string;
    volume: string;
  }>;
}

interface TrendingNfts {
  nfts: Array<{
    name: string;
    policy_id: string;
    floor_change: string;
    volume: string;
  }>;
}

export function createTapToolsTokenPriceTool(cfg?: OpenClawConfig): AnyAgentTool {
  const apiKey = getTapToolsApiKey(cfg);
  return {
    label: "TapTools Token Price",
    name: "taptools_get_token_price",
    description: "Get current price, 24h change, and volume for a Cardano token.",
    parameters: Type.Object({
      policy_id: Type.String({ description: "Token policy ID" }),
      asset_name: Type.Optional(Type.String({ description: "Asset name (hex encoded)" })),
    }),
    execute: async (_toolCallId, args) => {
      const params = args as Record<string, unknown>;
      const policyId = readStringParam(params, "policy_id");
      if (!policyId) {
        return jsonResult({ error: "policy_id is required" });
      }
      const assetName = readStringParam(params, "asset_name") || "";
      const unit = assetName ? `${policyId}.${assetName}` : policyId;

      const result = await fetchTapTools<TokenPrice>(
        `/token/price?unit=${encodeURIComponent(unit)}`,
        apiKey,
      );
      if (!result.ok) {
        return jsonResult({ error: `TapTools API: ${result.error}` });
      }

      return jsonResult({
        policy_id: policyId,
        price: result.data.price,
        change_24h: result.data.price_24h_change,
        volume_24h: result.data.volume_24h,
        market_cap: result.data.market_cap,
      });
    },
  };
}

export function createTapToolsTokenHoldersTool(cfg?: OpenClawConfig): AnyAgentTool {
  const apiKey = getTapToolsApiKey(cfg);
  return {
    label: "TapTools Token Holders",
    name: "taptools_get_token_holders",
    description: "Get holder distribution for a Cardano token.",
    parameters: Type.Object({
      policy_id: Type.String({ description: "Token policy ID" }),
      limit: Type.Optional(Type.Number({ description: "Max holders to return (default 10)" })),
    }),
    execute: async (_toolCallId, args) => {
      const params = args as Record<string, unknown>;
      const policyId = readStringParam(params, "policy_id");
      if (!policyId) {
        return jsonResult({ error: "policy_id is required" });
      }
      const limit = readNumberParam(params, "limit") ?? 10;

      const result = await fetchTapTools<TokenHolders>(
        `/token/holders?policy_id=${encodeURIComponent(policyId)}&limit=${limit}`,
        apiKey,
      );
      if (!result.ok) {
        return jsonResult({ error: `TapTools API: ${result.error}` });
      }

      return jsonResult({
        policy_id: policyId,
        total_holders: result.data.total_holders,
        top_holders: result.data.top_holders,
      });
    },
  };
}

export function createTapToolsNftCollectionTool(cfg?: OpenClawConfig): AnyAgentTool {
  const apiKey = getTapToolsApiKey(cfg);
  return {
    label: "TapTools NFT Collection",
    name: "taptools_get_nft_collection",
    description: "Get NFT collection stats including floor price and volume.",
    parameters: Type.Object({
      policy_id: Type.String({ description: "Collection policy ID" }),
    }),
    execute: async (_toolCallId, args) => {
      const params = args as Record<string, unknown>;
      const policyId = readStringParam(params, "policy_id");
      if (!policyId) {
        return jsonResult({ error: "policy_id is required" });
      }

      const result = await fetchTapTools<NftCollection>(
        `/nft/collection?policy_id=${encodeURIComponent(policyId)}`,
        apiKey,
      );
      if (!result.ok) {
        return jsonResult({ error: `TapTools API: ${result.error}` });
      }

      return jsonResult({
        name: result.data.name,
        policy_id: result.data.policy_id,
        floor_price: result.data.floor_price,
        volume_24h: result.data.volume_24h,
        volume_7d: result.data.volume_7d,
        total_supply: result.data.total_supply,
        listed_count: result.data.listed_count,
      });
    },
  };
}

export function createTapToolsDexVolumeTool(cfg?: OpenClawConfig): AnyAgentTool {
  const apiKey = getTapToolsApiKey(cfg);
  return {
    label: "TapTools DEX Volume",
    name: "taptools_get_dex_volume",
    description: "Get DEX trading volume across Cardano protocols.",
    parameters: Type.Object({
      timeframe: Type.Optional(
        Type.String({ description: "Timeframe: 24h, 7d, 30d (default 24h)" }),
      ),
    }),
    execute: async (_toolCallId, args) => {
      const params = args as Record<string, unknown>;
      const timeframe = readStringParam(params, "timeframe") || "24h";

      const result = await fetchTapTools<DexVolume>(
        `/dex/volume?timeframe=${encodeURIComponent(timeframe)}`,
        apiKey,
      );
      if (!result.ok) {
        return jsonResult({ error: `TapTools API: ${result.error}` });
      }

      return jsonResult({
        timeframe,
        total_volume_24h: result.data.total_volume_24h,
        protocols: result.data.protocols,
      });
    },
  };
}

export function createTapToolsTrendingTool(cfg?: OpenClawConfig): AnyAgentTool {
  const apiKey = getTapToolsApiKey(cfg);
  return {
    label: "TapTools Trending",
    name: "taptools_get_trending",
    description: "Get trending tokens or NFTs on Cardano.",
    parameters: Type.Object({
      type: Type.Optional(Type.String({ description: "Type: tokens or nfts (default tokens)" })),
      limit: Type.Optional(Type.Number({ description: "Max items (default 10)" })),
    }),
    execute: async (_toolCallId, args) => {
      const params = args as Record<string, unknown>;
      const type = readStringParam(params, "type") || "tokens";
      const limit = readNumberParam(params, "limit") ?? 10;

      if (type === "nfts") {
        const result = await fetchTapTools<TrendingNfts>(
          `/nft/trending?type=${type}&limit=${limit}`,
          apiKey,
        );
        if (!result.ok) {
          return jsonResult({ error: `TapTools API: ${result.error}` });
        }
        return jsonResult({ nfts: result.data.nfts });
      }

      const result = await fetchTapTools<TrendingTokens>(
        `/token/trending?type=${type}&limit=${limit}`,
        apiKey,
      );
      if (!result.ok) {
        return jsonResult({ error: `TapTools API: ${result.error}` });
      }
      return jsonResult({ tokens: result.data.tokens });
    },
  };
}

export function createTapToolsTools(cfg?: OpenClawConfig): AnyAgentTool[] {
  return [
    createTapToolsTokenPriceTool(cfg),
    createTapToolsTokenHoldersTool(cfg),
    createTapToolsNftCollectionTool(cfg),
    createTapToolsDexVolumeTool(cfg),
    createTapToolsTrendingTool(cfg),
  ];
}
