import { createNabuClient, type NabuClient } from "./client.js";
import { createNodesTool, createNodeStatsTool, createStatusTool } from "./tools/index.js";

export interface NabuPluginConfig {
  apiKey?: string;
  enabled?: boolean;
  timeout?: number;
}
export interface OpenClawPluginApi {
  registerTool: (factory: () => unknown, options: { name: string }) => void;
  pluginConfig?: NabuPluginConfig;
}

function validateApiKey(key: string | undefined, name: string): string | undefined {
  if (!key) return undefined;
  if (key.length < 16) {
    console.warn(`[${name}] API key appears too short (${key.length} chars), may be invalid`);
  }
  return key;
}

export function createNabuPlugin() {
  return {
    id: "cardano-nabu",
    name: "NABU VPN",
    register(api: OpenClawPluginApi) {
      const config = api.pluginConfig ?? {};
      if (config.enabled === false) return;

      const apiKey = validateApiKey(config.apiKey || process.env.NABU_VPN_API_KEY, "cardano-nabu");
      const client: NabuClient = createNabuClient({ apiKey, timeout: config.timeout });

      api.registerTool(() => createNodesTool(client), { name: "nabu_get_nodes" });
      api.registerTool(() => createNodeStatsTool(client), { name: "nabu_get_node_stats" });
      api.registerTool(() => createStatusTool(client), { name: "nabu_check_status" });
    },
  };
}

export { createNabuClient, type NabuClient } from "./client.js";
export * from "./types.js";
