import { Type } from "@sinclair/typebox";
import type { AnvilClient } from "../client.js";

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

export function createGetMintsTool(client: AnvilClient) {
  return {
    label: "Anvil Get Mints",
    name: "anvil_get_mints",
    description: "Get minting history with optional filtering.",
    parameters: Type.Object({
      policy_id: Type.Optional(Type.String({ description: "Filter by policy ID" })),
      status: Type.Optional(
        Type.String({ description: "Filter by status (pending, completed, failed)" }),
      ),
      limit: Type.Optional(Type.Number({ description: "Max results (default 10)" })),
    }),
    execute: async (_id: string, args: unknown) => {
      const params = args as Record<string, unknown>;
      const policyId = readStringParam(params, "policy_id");
      const status = readStringParam(params, "status");
      const limit = readNumberParam(params, "limit") ?? 10;

      const result = await client.getMints(policyId, status, limit);
      if (!result.ok) return jsonResult({ error: `Anvil API: ${result.error}` });
      return jsonResult({ mints: result.data });
    },
  };
}
