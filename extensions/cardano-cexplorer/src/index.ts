import { createCexplorerClient, type CexplorerClient } from "./client.js";
import {
  createAddressTool,
  createTransactionTool,
  createPoolTool,
  createEpochTool,
  createSearchTool,
} from "./tools/index.js";

export interface CexplorerPluginConfig {
  apiKey?: string;
  enabled?: boolean;
  timeout?: number;
}
export interface OpenClawPluginApi {
  registerTool: (factory: () => unknown, options: { name: string }) => void;
  pluginConfig?: CexplorerPluginConfig;
}

function validateApiKey(key: string | undefined, name: string): string | undefined {
  if (!key) return undefined;
  if (key.length < 16) {
    console.warn(`[${name}] API key appears too short (${key.length} chars), may be invalid`);
  }
  return key;
}

export function createCexplorerPlugin() {
  return {
    id: "cardano-cexplorer",
    name: "Cexplorer Blockchain Explorer",
    register(api: OpenClawPluginApi) {
      const config = api.pluginConfig ?? {};
      if (config.enabled === false) return;
      const apiKey = validateApiKey(
        config.apiKey || process.env.CEXPLORER_API_KEY,
        "cardano-cexplorer",
      );
      const client: CexplorerClient = createCexplorerClient({ apiKey, timeout: config.timeout });
      api.registerTool(() => createAddressTool(client), { name: "cexplorer_get_address" });
      api.registerTool(() => createTransactionTool(client), { name: "cexplorer_get_transaction" });
      api.registerTool(() => createPoolTool(client), { name: "cexplorer_get_pool" });
      api.registerTool(() => createEpochTool(client), { name: "cexplorer_get_epoch" });
      api.registerTool(() => createSearchTool(client), { name: "cexplorer_search" });
    },
  };
}

export { createCexplorerClient, type CexplorerClient } from "./client.js";
export * from "./types.js";
