import { Type } from "@sinclair/typebox";
import type { GovCircleClient } from "../client.js";

function jsonResult(data: unknown) {
  return [{ type: "text", text: JSON.stringify(data, null, 2) }];
}
function readStringParam(p: Record<string, unknown>, k: string) {
  const v = p[k];
  return typeof v === "string" ? v : undefined;
}

export function createProposalsTool(client: GovCircleClient) {
  return {
    label: "GovCircle Get Proposals",
    name: "govcircle_get_proposals",
    description: "Get proposals for a governance circle.",
    parameters: Type.Object({
      circle_id: Type.String({ description: "The circle ID" }),
      status: Type.Optional(
        Type.String({ description: "Filter by status (active, passed, rejected)" }),
      ),
    }),
    execute: async (_id: string, args: unknown) => {
      const params = args as Record<string, unknown>;
      const circleId = readStringParam(params, "circle_id");
      if (!circleId) return jsonResult({ error: "circle_id is required" });
      const result = await client.getProposals(circleId, readStringParam(params, "status"));
      if (!result.ok) return jsonResult({ error: `GovCircle API: ${result.error}` });
      return jsonResult({ proposals: result.data });
    },
  };
}
