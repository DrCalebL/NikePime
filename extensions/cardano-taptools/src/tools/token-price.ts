/**
 * Token price tool.
 */

import { Type } from "@sinclair/typebox";
import type { TapToolsClient } from "../client.js";

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

export function createTokenPriceTool(client: TapToolsClient): AgentTool {
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
      const assetName = readStringParam(params, "asset_name");

      const result = await client.getTokenPrice(policyId, assetName);
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
