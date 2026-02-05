/**
 * Token holders tool.
 */

import { Type } from "@sinclair/typebox";
import type { TapToolsClient } from "../client.js";

export interface AgentTool {
  label: string;
  name: string;
  description: string;
  parameters: unknown;
  execute: (toolCallId: string, args: unknown) => Promise<Array<{ type: string; text?: string }>>;
}

function jsonResult(data: unknown): Array<{ type: string; text: string }> {
  return [{ type: "text", text: JSON.stringify(data, null, 2) }];
}

function readStringParam(params: Record<string, unknown>, key: string): string | undefined {
  const val = params[key];
  return typeof val === "string" ? val : undefined;
}

function readNumberParam(params: Record<string, unknown>, key: string): number | undefined {
  const val = params[key];
  return typeof val === "number" ? val : undefined;
}

export function createTokenHoldersTool(client: TapToolsClient): AgentTool {
  return {
    label: "TapTools Token Holders",
    name: "taptools_get_token_holders",
    description: "Get holder distribution for a Cardano token.",
    parameters: Type.Object({
      policy_id: Type.String({ description: "Token policy ID" }),
      limit: Type.Optional(Type.Number({ description: "Max holders to return (default 10)" })),
    }),
    execute: async (_toolCallId, args) => {
      const params = args as Record<string, unknown>;
      const policyId = readStringParam(params, "policy_id");
      if (!policyId) {
        return jsonResult({ error: "policy_id is required" });
      }
      const limit = readNumberParam(params, "limit") ?? 10;

      const result = await client.getTokenHolders(policyId, limit);
      if (!result.ok) {
        return jsonResult({ error: `TapTools API: ${result.error}` });
      }

      return jsonResult({
        policy_id: policyId,
        total_holders: result.data.total_holders,
        top_holders: result.data.top_holders,
      });
    },
  };
}
