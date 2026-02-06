import { Type } from "@sinclair/typebox";
import type { GovCircleClient } from "../client.js";

function jsonResult(data: unknown) {
  return [{ type: "text", text: JSON.stringify(data, null, 2) }];
}
function readStringParam(p: Record<string, unknown>, k: string) {
  const v = p[k];
  return typeof v === "string" ? v : undefined;
}

export function createCirclesTool(client: GovCircleClient) {
  return {
    label: "GovCircle Get Circles",
    name: "govcircle_get_circles",
    description: "List governance circles with optional status filter.",
    parameters: Type.Object({
      status: Type.Optional(Type.String({ description: "Filter by status (active, archived)" })),
    }),
    execute: async (_id: string, args: unknown) => {
      const params = args as Record<string, unknown>;
      const result = await client.getCircles(readStringParam(params, "status"));
      if (!result.ok) return jsonResult({ error: `GovCircle API: ${result.error}` });
      return jsonResult({ circles: result.data });
    },
  };
}
