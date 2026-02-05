/**
 * CSWAP DEX integration.
 *
 * CSWAP is a decentralized exchange on Cardano providing liquidity pools
 * and token swaps.
 * API Documentation: https://docs.cswap.fi/
 */

import { Type } from "@sinclair/typebox";
import type { OpenClawConfig } from "../../../config/types.js";
import type { AnyAgentTool } from "../common.js";
import { jsonResult, readStringParam, readNumberParam } from "../common.js";

const CSWAP_API = "https://api.cswap.fi/v1";
const TIMEOUT_MS = 30_000;

type Result<T> = { ok: true; data: T } | { ok: false; error: string };

function getCswapApiKey(cfg?: OpenClawConfig): string | undefined {
  const tools = cfg?.tools as Record<string, unknown> | undefined;
  const cswap = tools?.cswap as Record<string, unknown> | undefined;
  return (cswap?.apiKey as string) || process.env.CSWAP_API_KEY;
}

async function fetchCswap<T>(endpoint: string, apiKey?: string): Promise<Result<T>> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const headers: Record<string, string> = { Accept: "application/json" };
    if (apiKey) {
      headers["x-api-key"] = apiKey;
    }
    const res = await fetch(`${CSWAP_API}${endpoint}`, {
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

interface TokenInfo {
  policy_id: string;
  name?: string;
  amount?: string;
}

interface Pool {
  pool_id: string;
  token_a: TokenInfo;
  token_b: TokenInfo;
  liquidity: string;
  volume_24h?: string;
}

interface PoolsResponse {
  pools: Pool[];
}

interface PriceResponse {
  token: string;
  price_ada: string;
  price_usd?: string;
  change_24h?: string;
}

interface SwapEstimate {
  input_token: string;
  input_amount: string;
  output_token: string;
  output_amount: string;
  price_impact?: string;
  fee?: string;
  route: string[];
}

interface LiquidityInfo {
  pool_id: string;
  token_a: TokenInfo;
  token_b: TokenInfo;
  total_liquidity: string;
  lp_tokens?: string;
  apy?: string;
}

export function createCswapGetPoolsTool(cfg?: OpenClawConfig): AnyAgentTool {
  const apiKey = getCswapApiKey(cfg);
  return {
    label: "CSWAP Pools",
    name: "cswap_get_pools",
    description: "List available liquidity pools on CSWAP DEX.",
    parameters: Type.Object({
      token: Type.Optional(Type.String({ description: "Filter by token policy ID" })),
      limit: Type.Optional(Type.Number({ description: "Max pools to return (default 20)" })),
    }),
    execute: async (_toolCallId, args) => {
      const params = args as Record<string, unknown>;
      const token = readStringParam(params, "token");
      const limit = readNumberParam(params, "limit") ?? 20;

      let endpoint = `/pools?limit=${limit}`;
      if (token) {
        endpoint += `&token=${encodeURIComponent(token)}`;
      }

      const result = await fetchCswap<PoolsResponse>(endpoint, apiKey);
      if (!result.ok) {
        return jsonResult({ error: `CSWAP API: ${result.error}` });
      }

      return jsonResult({
        pools: result.data.pools,
      });
    },
  };
}

export function createCswapGetPriceTool(cfg?: OpenClawConfig): AnyAgentTool {
  const apiKey = getCswapApiKey(cfg);
  return {
    label: "CSWAP Price",
    name: "cswap_get_price",
    description: "Get current token price from CSWAP pools.",
    parameters: Type.Object({
      token: Type.String({ description: "Token policy ID" }),
    }),
    execute: async (_toolCallId, args) => {
      const params = args as Record<string, unknown>;
      const token = readStringParam(params, "token");
      if (!token) {
        return jsonResult({ error: "token is required" });
      }

      const result = await fetchCswap<PriceResponse>(`/price/${encodeURIComponent(token)}`, apiKey);
      if (!result.ok) {
        return jsonResult({ error: `CSWAP API: ${result.error}` });
      }

      return jsonResult({
        token: result.data.token,
        price_ada: result.data.price_ada,
        price_usd: result.data.price_usd,
        change_24h: result.data.change_24h,
      });
    },
  };
}

export function createCswapEstimateSwapTool(cfg?: OpenClawConfig): AnyAgentTool {
  const apiKey = getCswapApiKey(cfg);
  return {
    label: "CSWAP Estimate Swap",
    name: "cswap_estimate_swap",
    description: "Estimate swap output, price impact, and fees.",
    parameters: Type.Object({
      input_token: Type.String({ description: "Input token policy ID (use 'ada' for ADA)" }),
      output_token: Type.String({ description: "Output token policy ID" }),
      amount: Type.String({ description: "Input amount in lovelace/smallest unit" }),
    }),
    execute: async (_toolCallId, args) => {
      const params = args as Record<string, unknown>;
      const inputToken = readStringParam(params, "input_token");
      const outputToken = readStringParam(params, "output_token");
      const amount = readStringParam(params, "amount");

      if (!inputToken || !outputToken || !amount) {
        return jsonResult({ error: "input_token, output_token, and amount are required" });
      }

      const endpoint = `/swap/estimate?input=${encodeURIComponent(inputToken)}&output=${encodeURIComponent(outputToken)}&amount=${encodeURIComponent(amount)}`;

      const result = await fetchCswap<SwapEstimate>(endpoint, apiKey);
      if (!result.ok) {
        return jsonResult({ error: `CSWAP API: ${result.error}` });
      }

      return jsonResult({
        input_token: result.data.input_token,
        input_amount: result.data.input_amount,
        output_token: result.data.output_token,
        output_amount: result.data.output_amount,
        price_impact: result.data.price_impact,
        fee: result.data.fee,
        route: result.data.route,
      });
    },
  };
}

export function createCswapGetLiquidityTool(cfg?: OpenClawConfig): AnyAgentTool {
  const apiKey = getCswapApiKey(cfg);
  return {
    label: "CSWAP Liquidity",
    name: "cswap_get_liquidity",
    description: "Get liquidity statistics for a CSWAP pool.",
    parameters: Type.Object({
      pool_id: Type.String({ description: "Pool ID" }),
    }),
    execute: async (_toolCallId, args) => {
      const params = args as Record<string, unknown>;
      const poolId = readStringParam(params, "pool_id");
      if (!poolId) {
        return jsonResult({ error: "pool_id is required" });
      }

      const result = await fetchCswap<LiquidityInfo>(
        `/pools/${encodeURIComponent(poolId)}/liquidity`,
        apiKey,
      );
      if (!result.ok) {
        return jsonResult({ error: `CSWAP API: ${result.error}` });
      }

      return jsonResult({
        pool_id: result.data.pool_id,
        token_a: result.data.token_a,
        token_b: result.data.token_b,
        total_liquidity: result.data.total_liquidity,
        lp_tokens: result.data.lp_tokens,
        apy: result.data.apy,
      });
    },
  };
}

export function createCswapTools(cfg?: OpenClawConfig): AnyAgentTool[] {
  return [
    createCswapGetPoolsTool(cfg),
    createCswapGetPriceTool(cfg),
    createCswapEstimateSwapTool(cfg),
    createCswapGetLiquidityTool(cfg),
  ];
}
