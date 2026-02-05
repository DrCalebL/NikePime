/**
 * DEX volume tool.
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

export function createDexVolumeTool(client: TapToolsClient): AgentTool {
  return {
    label: "TapTools DEX Volume",
    name: "taptools_get_dex_volume",
    description: "Get DEX trading volume across Cardano protocols.",
    parameters: Type.Object({
      timeframe: Type.Optional(
        Type.String({ description: "Timeframe: 24h, 7d, 30d (default 24h)" }),
      ),
    }),
    execute: async (_toolCallId, args) => {
      const params = args as Record<string, unknown>;
      const timeframe = readStringParam(params, "timeframe") || "24h";

      const result = await client.getDexVolume(timeframe);
      if (!result.ok) {
        return jsonResult({ error: `TapTools API: ${result.error}` });
      }

      return jsonResult({
        timeframe,
        total_volume_24h: result.data.total_volume_24h,
        protocols: result.data.protocols,
      });
    },
  };
}
