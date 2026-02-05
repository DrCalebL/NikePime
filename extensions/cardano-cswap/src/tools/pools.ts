import { Type } from "@sinclair/typebox";
import type { CswapClient } from "../client.js";

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

export function createPoolsTool(client: CswapClient) {
  return {
    label: "CSWAP Get Pools",
    name: "cswap_get_pools",
    description: "List liquidity pools with optional token filter.",
    parameters: Type.Object({
      token: Type.Optional(Type.String({ description: "Filter by token policy ID" })),
      limit: Type.Optional(Type.Number({ description: "Max pools to return (default 10)" })),
    }),
    execute: async (_id: string, args: unknown) => {
      const params = args as Record<string, unknown>;
      const token = readStringParam(params, "token");
      const limit = readNumberParam(params, "limit") ?? 10;
      const result = await client.getPools(token, limit);
      if (!result.ok) return jsonResult({ error: `CSWAP API: ${result.error}` });
      return jsonResult({ pools: result.data });
    },
  };
}
