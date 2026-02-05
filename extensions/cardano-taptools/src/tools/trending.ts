/**
 * Trending tokens/NFTs tool.
 */

import { Type } from "@sinclair/typebox";
import type { TapToolsClient } from "../client.js";
import type { TrendingTokens, TrendingNfts } from "../types.js";

export interface AgentTool {
  label: string;
  name: string;
  description: string;
  parameters: unknown;
  execute: (toolCallId: string, args: unknown) => Promise<Array<{ type: string; text?: string }>>;
}

function jsonResult(data: unknown): Array<{ type: string; text: string }> {
  return [{ type: "text", text: JSON.stringify(data, null, 2) }];
}

function readStringParam(params: Record<string, unknown>, key: string): string | undefined {
  const val = params[key];
  return typeof val === "string" ? val : undefined;
}

function readNumberParam(params: Record<string, unknown>, key: string): number | undefined {
  const val = params[key];
  return typeof val === "number" ? val : undefined;
}

export function createTrendingTool(client: TapToolsClient): AgentTool {
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
      const type = (readStringParam(params, "type") || "tokens") as "tokens" | "nfts";
      const limit = readNumberParam(params, "limit") ?? 10;

      const result = await client.getTrending(type, limit);
      if (!result.ok) {
        return jsonResult({ error: `TapTools API: ${result.error}` });
      }

      if (type === "nfts") {
        return jsonResult({ nfts: (result.data as TrendingNfts).nfts });
      }
      return jsonResult({ tokens: (result.data as TrendingTokens).tokens });
    },
  };
}
