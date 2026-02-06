import { Type } from "@sinclair/typebox";
import type { CexplorerClient } from "../client.js";

function jsonResult(data: unknown) {
  return [{ type: "text", text: JSON.stringify(data, null, 2) }];
}
function readStringParam(p: Record<string, unknown>, k: string) {
  const v = p[k];
  return typeof v === "string" ? v : undefined;
}

export function createTransactionTool(client: CexplorerClient) {
  return {
    label: "Cexplorer Get Transaction",
    name: "cexplorer_get_transaction",
    description: "Get transaction details including inputs, outputs, and metadata.",
    parameters: Type.Object({ tx_hash: Type.String({ description: "The transaction hash" }) }),
    execute: async (_id: string, args: unknown) => {
      const params = args as Record<string, unknown>;
      const txHash = readStringParam(params, "tx_hash");
      if (!txHash) return jsonResult({ error: "tx_hash is required" });
      const result = await client.getTransaction(txHash);
      if (!result.ok) return jsonResult({ error: `Cexplorer API: ${result.error}` });
      return jsonResult(result.data);
    },
  };
}
