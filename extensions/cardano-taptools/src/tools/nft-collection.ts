/**
 * NFT collection tool.
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

export function createNftCollectionTool(client: TapToolsClient): AgentTool {
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

      const result = await client.getNftCollection(policyId);
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
