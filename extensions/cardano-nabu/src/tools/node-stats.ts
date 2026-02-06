import { Type } from "@sinclair/typebox";
import type { NabuClient } from "../client.js";

function jsonResult(data: unknown) {
  return [{ type: "text", text: JSON.stringify(data, null, 2) }];
}
function readStringParam(params: Record<string, unknown>, key: string): string | undefined {
  const val = params[key];
  return typeof val === "string" ? val : undefined;
}

export function createNodeStatsTool(client: NabuClient) {
  return {
    label: "NABU Node Stats",
    name: "nabu_get_node_stats",
    description: "Get performance statistics for a specific VPN node.",
    parameters: Type.Object({
      node_id: Type.String({ description: "The node ID to get stats for" }),
    }),
    execute: async (_toolCallId: string, args: unknown) => {
      const params = args as Record<string, unknown>;
      const nodeId = readStringParam(params, "node_id");
      if (!nodeId) return jsonResult({ error: "node_id is required" });

      const result = await client.getNodeStats(nodeId);
      if (!result.ok) return jsonResult({ error: `NABU API: ${result.error}` });
      return jsonResult(result.data);
    },
  };
}
