import { Type } from "@sinclair/typebox";
import type { NabuClient } from "../client.js";

function jsonResult(data: unknown) {
  return [{ type: "text", text: JSON.stringify(data, null, 2) }];
}
function readStringParam(params: Record<string, unknown>, key: string): string | undefined {
  const val = params[key];
  return typeof val === "string" ? val : undefined;
}

export function createNodesTool(client: NabuClient) {
  return {
    label: "NABU Get Nodes",
    name: "nabu_get_nodes",
    description: "List available VPN nodes with optional filtering by region or country.",
    parameters: Type.Object({
      region: Type.Optional(Type.String({ description: "Filter by region" })),
      country: Type.Optional(Type.String({ description: "Filter by country code" })),
    }),
    execute: async (_toolCallId: string, args: unknown) => {
      const params = args as Record<string, unknown>;
      const region = readStringParam(params, "region");
      const country = readStringParam(params, "country");

      const result = await client.getNodes(region, country);
      if (!result.ok) return jsonResult({ error: `NABU API: ${result.error}` });
      return jsonResult({ nodes: result.data });
    },
  };
}
