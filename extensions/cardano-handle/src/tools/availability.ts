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

export function createAvailabilityTool(client: HandleClient): AgentTool {
  return {
    label: "Handle Availability",
    name: "handle_check_availability",
    description: "Check if an Ada handle is available for registration.",
    parameters: Type.Object({
      handle: Type.String({ description: "The handle to check availability for" }),
    }),
    execute: async (_toolCallId, args) => {
      const params = args as Record<string, unknown>;
      const handle = readStringParam(params, "handle");
      if (!handle) {
        return jsonResult({ error: "handle is required" });
      }

      const result = await client.checkAvailability(handle);
      if (!result.ok) {
        return jsonResult({ error: `Handle API: ${result.error}` });
      }

      const response: Record<string, unknown> = {
        handle: result.data.handle,
        available: result.data.available,
      };

      if (result.data.available) {
        response.price = result.data.price;
        response.price_tier = result.data.price_tier;
      } else {
        response.owner = result.data.owner;
      }

      return jsonResult(response);
    },
  };
}
