import { Type } from "@sinclair/typebox";
import type { CexplorerClient } from "../client.js";

function jsonResult(data: unknown) {
  return [{ type: "text", text: JSON.stringify(data, null, 2) }];
}
function readStringParam(p: Record<string, unknown>, k: string) {
  const v = p[k];
  return typeof v === "string" ? v : undefined;
}
function readBoolParam(p: Record<string, unknown>, k: string) {
  const v = p[k];
  return typeof v === "boolean" ? v : undefined;
}

export function createAddressTool(client: CexplorerClient) {
  return {
    label: "Cexplorer Get Address",
    name: "cexplorer_get_address",
    description: "Get balance, transaction count, and stake info for a Cardano address.",
    parameters: Type.Object({
      address: Type.String({ description: "The Cardano address" }),
      include_txs: Type.Optional(
        Type.Boolean({ description: "Include recent transactions (default false)" }),
      ),
    }),
    execute: async (_id: string, args: unknown) => {
      const params = args as Record<string, unknown>;
      const address = readStringParam(params, "address");
      if (!address) return jsonResult({ error: "address is required" });
      const includeTxs = readBoolParam(params, "include_txs") ?? false;
      const result = await client.getAddress(address, includeTxs);
      if (!result.ok) return jsonResult({ error: `Cexplorer API: ${result.error}` });
      return jsonResult(result.data);
    },
  };
}
