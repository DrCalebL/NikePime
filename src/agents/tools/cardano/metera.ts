/**
 * Metera Protocol index tokens integration.
 *
 * Metera provides index tokens on Cardano that track baskets of assets.
 * API Documentation: https://metera-protocol.gitbook.io/documentation
 */

import { Type } from "@sinclair/typebox";
import type { OpenClawConfig } from "../../../config/types.js";
import type { AnyAgentTool } from "../common.js";
import { jsonResult, readStringParam } from "../common.js";

const METERA_API = "https://api.metera.io/v1";
const TIMEOUT_MS = 30_000;

type Result<T> = { ok: true; data: T } | { ok: false; error: string };

function getMeteraApiKey(cfg?: OpenClawConfig): string | undefined {
  const tools = cfg?.tools as Record<string, unknown> | undefined;
  const metera = tools?.metera as Record<string, unknown> | undefined;
  return (metera?.apiKey as string) || process.env.METERA_API_KEY;
}

async function fetchMetera<T>(endpoint: string, apiKey?: string): Promise<Result<T>> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const headers: Record<string, string> = { Accept: "application/json" };
    if (apiKey) {
      headers["x-api-key"] = apiKey;
    }
    const res = await fetch(`${METERA_API}${endpoint}`, {
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

interface IndexInfo {
  index_id: string;
  name: string;
  policy_id?: string;
  price?: string;
  market_cap?: string;
}

interface IndicesResponse {
  indices: IndexInfo[];
}

interface IndexComponent {
  token: string;
  policy_id: string;
  weight: number;
}

interface CompositionResponse {
  index_id: string;
  name: string;
  components: IndexComponent[];
  last_rebalance?: string;
}

interface PerformanceResponse {
  index_id: string;
  name?: string;
  price: string;
  change_24h?: string;
  change_7d?: string;
  change_30d?: string;
  all_time_high?: string;
  all_time_low?: string;
}

export function createMeteraGetIndicesTool(cfg?: OpenClawConfig): AnyAgentTool {
  const apiKey = getMeteraApiKey(cfg);
  return {
    label: "Metera Indices",
    name: "metera_get_indices",
    description: "List available index tokens on Metera Protocol.",
    parameters: Type.Object({
      category: Type.Optional(
        Type.String({ description: "Filter by category: defi, nft, gaming" }),
      ),
    }),
    execute: async (_toolCallId, args) => {
      const params = args as Record<string, unknown>;
      const category = readStringParam(params, "category");

      let endpoint = "/indices";
      if (category) {
        endpoint += `?category=${encodeURIComponent(category)}`;
      }

      const result = await fetchMetera<IndicesResponse>(endpoint, apiKey);
      if (!result.ok) {
        return jsonResult({ error: `Metera API: ${result.error}` });
      }

      return jsonResult({
        indices: result.data.indices,
      });
    },
  };
}

export function createMeteraGetCompositionTool(cfg?: OpenClawConfig): AnyAgentTool {
  const apiKey = getMeteraApiKey(cfg);
  return {
    label: "Metera Composition",
    name: "metera_get_composition",
    description: "Get the composition of a Metera index token.",
    parameters: Type.Object({
      index_id: Type.String({ description: "Index identifier" }),
    }),
    execute: async (_toolCallId, args) => {
      const params = args as Record<string, unknown>;
      const indexId = readStringParam(params, "index_id");
      if (!indexId) {
        return jsonResult({ error: "index_id is required" });
      }

      const result = await fetchMetera<CompositionResponse>(
        `/indices/${encodeURIComponent(indexId)}/composition`,
        apiKey,
      );
      if (!result.ok) {
        return jsonResult({ error: `Metera API: ${result.error}` });
      }

      return jsonResult({
        index_id: result.data.index_id,
        name: result.data.name,
        components: result.data.components,
        last_rebalance: result.data.last_rebalance,
      });
    },
  };
}

export function createMeteraGetPerformanceTool(cfg?: OpenClawConfig): AnyAgentTool {
  const apiKey = getMeteraApiKey(cfg);
  return {
    label: "Metera Performance",
    name: "metera_get_performance",
    description: "Get performance metrics for a Metera index token.",
    parameters: Type.Object({
      index_id: Type.String({ description: "Index identifier" }),
      timeframe: Type.Optional(Type.String({ description: "Timeframe: 24h, 7d, 30d, 1y" })),
    }),
    execute: async (_toolCallId, args) => {
      const params = args as Record<string, unknown>;
      const indexId = readStringParam(params, "index_id");
      if (!indexId) {
        return jsonResult({ error: "index_id is required" });
      }
      const timeframe = readStringParam(params, "timeframe");

      let endpoint = `/indices/${encodeURIComponent(indexId)}/performance`;
      if (timeframe) {
        endpoint += `?timeframe=${encodeURIComponent(timeframe)}`;
      }

      const result = await fetchMetera<PerformanceResponse>(endpoint, apiKey);
      if (!result.ok) {
        return jsonResult({ error: `Metera API: ${result.error}` });
      }

      return jsonResult({
        index_id: result.data.index_id,
        name: result.data.name,
        price: result.data.price,
        change_24h: result.data.change_24h,
        change_7d: result.data.change_7d,
        change_30d: result.data.change_30d,
        all_time_high: result.data.all_time_high,
        all_time_low: result.data.all_time_low,
      });
    },
  };
}

export function createMeteraTools(cfg?: OpenClawConfig): AnyAgentTool[] {
  return [
    createMeteraGetIndicesTool(cfg),
    createMeteraGetCompositionTool(cfg),
    createMeteraGetPerformanceTool(cfg),
  ];
}
