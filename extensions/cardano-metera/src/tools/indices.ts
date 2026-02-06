import { Type } from "@sinclair/typebox";
import type { MeteraClient } from "../client.js";

function jsonResult(data: unknown) {
  return [{ type: "text", text: JSON.stringify(data, null, 2) }];
}
function readStringParam(p: Record<string, unknown>, k: string) {
  const v = p[k];
  return typeof v === "string" ? v : undefined;
}

export function createIndicesTool(client: MeteraClient) {
  return {
    label: "Metera Get Indices",
    name: "metera_get_indices",
    description: "List available index tokens with optional category filter.",
    parameters: Type.Object({
      category: Type.Optional(
        Type.String({ description: "Filter by category (defi, nft, gaming)" }),
      ),
    }),
    execute: async (_id: string, args: unknown) => {
      const params = args as Record<string, unknown>;
      const result = await client.getIndices(readStringParam(params, "category"));
      if (!result.ok) return jsonResult({ error: `Metera API: ${result.error}` });
      return jsonResult({ indices: result.data });
    },
  };
}
