import { Type } from "@sinclair/typebox";
import type { NabuClient } from "../client.js";

function jsonResult(data: unknown) {
  return [{ type: "text", text: JSON.stringify(data, null, 2) }];
}

export function createStatusTool(client: NabuClient) {
  return {
    label: "NABU Check Status",
    name: "nabu_check_status",
    description: "Check overall NABU VPN service health and status.",
    parameters: Type.Object({}),
    execute: async () => {
      const result = await client.checkStatus();
      if (!result.ok) return jsonResult({ error: `NABU API: ${result.error}` });
      return jsonResult(result.data);
    },
  };
}
