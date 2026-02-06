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

export function createMetadataTool(client: HandleClient): AgentTool {
  return {
    label: "Handle Metadata",
    name: "handle_get_metadata",
    description: "Get metadata for an Ada handle including rarity and custom data.",
    parameters: Type.Object({
      handle: Type.String({ description: "The handle to get metadata for" }),
    }),
    execute: async (_toolCallId, args) => {
      const params = args as Record<string, unknown>;
      const handle = readStringParam(params, "handle");
      if (!handle) {
        return jsonResult({ error: "handle is required" });
      }

      const result = await client.getMetadata(handle);
      if (!result.ok) {
        return jsonResult({ error: `Handle API: ${result.error}` });
      }

      return jsonResult({
        handle: result.data.handle,
        rarity: result.data.rarity,
        length: result.data.length,
        og: result.data.og,
        characters: result.data.characters,
        image: result.data.image,
        custom_data: result.data.custom_data,
      });
    },
  };
}
