import { createMeteraClient, type MeteraClient } from "./client.js";
import { createIndicesTool, createCompositionTool, createPerformanceTool } from "./tools/index.js";

export interface MeteraPluginConfig {
  apiKey?: string;
  enabled?: boolean;
  timeout?: number;
}
export interface OpenClawPluginApi {
  registerTool: (factory: () => unknown, options: { name: string }) => void;
  pluginConfig?: MeteraPluginConfig;
}

function validateApiKey(key: string | undefined, name: string): string | undefined {
  if (!key) return undefined;
  if (key.length < 16) {
    console.warn(`[${name}] API key appears too short (${key.length} chars), may be invalid`);
  }
  return key;
}

export function createMeteraPlugin() {
  return {
    id: "cardano-metera",
    name: "Metera Index Tokens",
    register(api: OpenClawPluginApi) {
      const config = api.pluginConfig ?? {};
      if (config.enabled === false) return;
      const apiKey = validateApiKey(config.apiKey || process.env.METERA_API_KEY, "cardano-metera");
      const client: MeteraClient = createMeteraClient({ apiKey, timeout: config.timeout });
      api.registerTool(() => createIndicesTool(client), { name: "metera_get_indices" });
      api.registerTool(() => createCompositionTool(client), { name: "metera_get_composition" });
      api.registerTool(() => createPerformanceTool(client), { name: "metera_get_performance" });
    },
  };
}

export { createMeteraClient, type MeteraClient } from "./client.js";
export * from "./types.js";
