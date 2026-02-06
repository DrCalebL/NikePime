import { Type } from "@sinclair/typebox";
import type { AnvilClient } from "../client.js";

function jsonResult(data: unknown) {
  return [{ type: "text", text: JSON.stringify(data, null, 2) }];
}
function readStringParam(p: Record<string, unknown>, k: string) {
  const v = p[k];
  return typeof v === "string" ? v : undefined;
}
function readNumberParam(p: Record<string, unknown>, k: string) {
  const v = p[k];
  return typeof v === "number" ? v : undefined;
}

export function createBurnTokenTool(client: AnvilClient) {
  return {
    label: "Anvil Burn Token",
    name: "anvil_burn_token",
    description: "Burn tokens on Cardano.",
    parameters: Type.Object({
      policy_id: Type.String({ description: "Token policy ID" }),
      asset_name: Type.String({ description: "Asset name (hex encoded)" }),
      quantity: Type.Number({ description: "Number of tokens to burn" }),
    }),
    execute: async (_id: string, args: unknown) => {
      const params = args as Record<string, unknown>;
      const policyId = readStringParam(params, "policy_id");
      const assetName = readStringParam(params, "asset_name");
      const quantity = readNumberParam(params, "quantity");

      if (!policyId) return jsonResult({ error: "policy_id is required" });
      if (!assetName) return jsonResult({ error: "asset_name is required" });
      if (quantity === undefined) return jsonResult({ error: "quantity is required" });

      const result = await client.burnToken({
        policy_id: policyId,
        asset_name: assetName,
        quantity,
      });
      if (!result.ok) return jsonResult({ error: `Anvil API: ${result.error}` });
      return jsonResult(result.data);
    },
  };
}
