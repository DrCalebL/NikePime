import { Type } from "@sinclair/typebox";
import type { CexplorerClient } from "../client.js";

function jsonResult(data: unknown) {
  return [{ type: "text", text: JSON.stringify(data, null, 2) }];
}
function readNumberParam(p: Record<string, unknown>, k: string) {
  const v = p[k];
  return typeof v === "number" ? v : undefined;
}

export function createEpochTool(client: CexplorerClient) {
  return {
    label: "Cexplorer Get Epoch",
    name: "cexplorer_get_epoch",
    description: "Get epoch statistics. Returns current epoch if no epoch number specified.",
    parameters: Type.Object({
      epoch: Type.Optional(Type.Number({ description: "Epoch number (default: current)" })),
    }),
    execute: async (_id: string, args: unknown) => {
      const params = args as Record<string, unknown>;
      const epoch = readNumberParam(params, "epoch");
      const result = await client.getEpoch(epoch);
      if (!result.ok) return jsonResult({ error: `Cexplorer API: ${result.error}` });
      return jsonResult(result.data);
    },
  };
}
