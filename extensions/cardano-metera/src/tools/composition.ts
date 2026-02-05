import { Type } from "@sinclair/typebox";
import type { MeteraClient } from "../client.js";

function jsonResult(data: unknown) {
  return [{ type: "text", text: JSON.stringify(data, null, 2) }];
}
function readStringParam(p: Record<string, unknown>, k: string) {
  const v = p[k];
  return typeof v === "string" ? v : undefined;
}

export function createCompositionTool(client: MeteraClient) {
  return {
    label: "Metera Get Composition",
    name: "metera_get_composition",
    description: "Get the component tokens and weights for an index.",
    parameters: Type.Object({ index_id: Type.String({ description: "The index ID" }) }),
    execute: async (_id: string, args: unknown) => {
      const params = args as Record<string, unknown>;
      const indexId = readStringParam(params, "index_id");
      if (!indexId) return jsonResult({ error: "index_id is required" });
      const result = await client.getComposition(indexId);
      if (!result.ok) return jsonResult({ error: `Metera API: ${result.error}` });
      return jsonResult(result.data);
    },
  };
}
