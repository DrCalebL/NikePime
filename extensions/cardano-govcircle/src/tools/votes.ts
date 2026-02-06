import { Type } from "@sinclair/typebox";
import type { GovCircleClient } from "../client.js";

function jsonResult(data: unknown) {
  return [{ type: "text", text: JSON.stringify(data, null, 2) }];
}
function readStringParam(p: Record<string, unknown>, k: string) {
  const v = p[k];
  return typeof v === "string" ? v : undefined;
}

export function createVotesTool(client: GovCircleClient) {
  return {
    label: "GovCircle Get Votes",
    name: "govcircle_get_votes",
    description: "Get vote breakdown for a proposal.",
    parameters: Type.Object({ proposal_id: Type.String({ description: "The proposal ID" }) }),
    execute: async (_id: string, args: unknown) => {
      const params = args as Record<string, unknown>;
      const proposalId = readStringParam(params, "proposal_id");
      if (!proposalId) return jsonResult({ error: "proposal_id is required" });
      const result = await client.getVotes(proposalId);
      if (!result.ok) return jsonResult({ error: `GovCircle API: ${result.error}` });
      return jsonResult(result.data);
    },
  };
}
