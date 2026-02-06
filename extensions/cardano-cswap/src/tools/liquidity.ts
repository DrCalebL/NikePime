import { Type } from "@sinclair/typebox";
import type { CswapClient } from "../client.js";

function jsonResult(data: unknown) {
  return [{ type: "text", text: JSON.stringify(data, null, 2) }];
}
function readStringParam(p: Record<string, unknown>, k: string) {
  const v = p[k];
  return typeof v === "string" ? v : undefined;
}

export function createLiquidityTool(client: CswapClient) {
  return {
    label: "CSWAP Get Liquidity",
    name: "cswap_get_liquidity",
    description: "Get liquidity info for a pool including TVL and volume.",
    parameters: Type.Object({ pool_id: Type.String({ description: "The pool ID" }) }),
    execute: async (_id: string, args: unknown) => {
      const params = args as Record<string, unknown>;
      const poolId = readStringParam(params, "pool_id");
      if (!poolId) return jsonResult({ error: "pool_id is required" });
      const result = await client.getLiquidity(poolId);
      if (!result.ok) return jsonResult({ error: `CSWAP API: ${result.error}` });
      return jsonResult(result.data);
    },
  };
}
