import { Type } from "@sinclair/typebox";
import type { HandleClient } from "../client.js";

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

export function createReverseLookupTool(client: HandleClient): AgentTool {
  return {
    label: "Handle Reverse Lookup",
    name: "handle_reverse_lookup",
    description: "Find all handles associated with a Cardano address.",
    parameters: Type.Object({
      address: Type.String({ description: "The Cardano address to look up" }),
    }),
    execute: async (_toolCallId, args) => {
      const params = args as Record<string, unknown>;
      const address = readStringParam(params, "address");
      if (!address) {
        return jsonResult({ error: "address is required" });
      }

      const result = await client.reverseLookup(address);
      if (!result.ok) {
        return jsonResult({ error: `Handle API: ${result.error}` });
      }

      return jsonResult({
        handles: result.data.handles,
        primary_handle: result.data.primary_handle,
      });
    },
  };
}
