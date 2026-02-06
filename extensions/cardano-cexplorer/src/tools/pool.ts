import { Type } from "@sinclair/typebox";
import type { CexplorerClient } from "../client.js";

function jsonResult(data: unknown) {
  return [{ type: "text", text: JSON.stringify(data, null, 2) }];
}
function readStringParam(p: Record<string, unknown>, k: string) {
  const v = p[k];
  return typeof v === "string" ? v : undefined;
}

export function createPoolTool(client: CexplorerClient) {
  return {
    label: "Cexplorer Get Pool",
    name: "cexplorer_get_pool",
    description: "Get stake pool information including margin, stake, and delegators.",
    parameters: Type.Object({
      pool_id: Type.String({ description: "The pool ID (bech32 or hex)" }),
    }),
    execute: async (_id: string, args: unknown) => {
      const params = args as Record<string, unknown>;
      const poolId = readStringParam(params, "pool_id");
      if (!poolId) return jsonResult({ error: "pool_id is required" });
      const result = await client.getPool(poolId);
      if (!result.ok) return jsonResult({ error: `Cexplorer API: ${result.error}` });
      return jsonResult(result.data);
    },
  };
}
