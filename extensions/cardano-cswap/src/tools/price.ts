import { Type } from "@sinclair/typebox";
import type { CswapClient } from "../client.js";

function jsonResult(data: unknown) {
  return [{ type: "text", text: JSON.stringify(data, null, 2) }];
}
function readStringParam(p: Record<string, unknown>, k: string) {
  const v = p[k];
  return typeof v === "string" ? v : undefined;
}

export function createPriceTool(client: CswapClient) {
  return {
    label: "CSWAP Get Price",
    name: "cswap_get_price",
    description: "Get token price in ADA and USD.",
    parameters: Type.Object({
      token: Type.String({ description: "Token policy ID (or 'ada' for ADA)" }),
    }),
    execute: async (_id: string, args: unknown) => {
      const params = args as Record<string, unknown>;
      const token = readStringParam(params, "token");
      if (!token) return jsonResult({ error: "token is required" });
      const result = await client.getPrice(token);
      if (!result.ok) return jsonResult({ error: `CSWAP API: ${result.error}` });
      return jsonResult(result.data);
    },
  };
}
