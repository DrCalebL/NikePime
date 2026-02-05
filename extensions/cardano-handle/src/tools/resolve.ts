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

export function createResolveTool(client: HandleClient): AgentTool {
  return {
    label: "Handle Resolve",
    name: "handle_resolve",
    description: "Resolve an Ada handle to a Cardano address.",
    parameters: Type.Object({
      handle: Type.String({ description: "The handle to resolve (with or without $ prefix)" }),
    }),
    execute: async (_toolCallId, args) => {
      const params = args as Record<string, unknown>;
      const handle = readStringParam(params, "handle");
      if (!handle) {
        return jsonResult({ error: "handle is required" });
      }

      const result = await client.resolve(handle);
      if (!result.ok) {
        return jsonResult({ error: `Handle API: ${result.error}` });
      }

      return jsonResult({
        handle: result.data.handle,
        address: result.data.address,
        policy_id: result.data.policy_id,
      });
    },
  };
}
