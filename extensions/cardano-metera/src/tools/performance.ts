import { Type } from "@sinclair/typebox";
import type { MeteraClient } from "../client.js";

function jsonResult(data: unknown) {
  return [{ type: "text", text: JSON.stringify(data, null, 2) }];
}
function readStringParam(p: Record<string, unknown>, k: string) {
  const v = p[k];
  return typeof v === "string" ? v : undefined;
}

export function createPerformanceTool(client: MeteraClient) {
  return {
    label: "Metera Get Performance",
    name: "metera_get_performance",
    description: "Get performance metrics for an index over a timeframe.",
    parameters: Type.Object({
      index_id: Type.String({ description: "The index ID" }),
      timeframe: Type.Optional(
        Type.String({ description: "Timeframe: 24h, 7d, 30d, 1y (default 24h)" }),
      ),
    }),
    execute: async (_id: string, args: unknown) => {
      const params = args as Record<string, unknown>;
      const indexId = readStringParam(params, "index_id");
      if (!indexId) return jsonResult({ error: "index_id is required" });
      const timeframe = readStringParam(params, "timeframe") || "24h";
      const result = await client.getPerformance(indexId, timeframe);
      if (!result.ok) return jsonResult({ error: `Metera API: ${result.error}` });
      return jsonResult(result.data);
    },
  };
}
