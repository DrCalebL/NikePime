import { Type } from "@sinclair/typebox";
import type { CexplorerClient } from "../client.js";

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

export function createSearchTool(client: CexplorerClient) {
  return {
    label: "Cexplorer Search",
    name: "cexplorer_search",
    description: "Search for addresses, transactions, pools, or tokens.",
    parameters: Type.Object({
      query: Type.String({ description: "Search query" }),
      type: Type.Optional(
        Type.String({ description: "Filter by type (address, tx, pool, token)" }),
      ),
      limit: Type.Optional(Type.Number({ description: "Max results (default 10)" })),
    }),
    execute: async (_id: string, args: unknown) => {
      const params = args as Record<string, unknown>;
      const query = readStringParam(params, "query");
      if (!query) return jsonResult({ error: "query is required" });
      const type = readStringParam(params, "type");
      const limit = readNumberParam(params, "limit") ?? 10;
      const result = await client.search(query, type, limit);
      if (!result.ok) return jsonResult({ error: `Cexplorer API: ${result.error}` });
      return jsonResult({ results: result.data });
    },
  };
}
