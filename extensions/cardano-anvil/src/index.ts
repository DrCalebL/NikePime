import { createAnvilClient, type AnvilClient } from "./client.js";
import {
  createMintTokenTool,
  createBurnTokenTool,
  createCollectionTool,
  createGetMintsTool,
} from "./tools/index.js";

export interface AnvilPluginConfig {
  apiKey?: string;
  enabled?: boolean;
  timeout?: number;
}
export interface OpenClawPluginApi {
  registerTool: (factory: () => unknown, options: { name: string }) => void;
  pluginConfig?: AnvilPluginConfig;
}

function validateApiKey(key: string | undefined, name: string): string | undefined {
  if (!key) return undefined;
  if (key.length < 16) {
    console.warn(`[${name}] API key appears too short (${key.length} chars), may be invalid`);
  }
  return key;
}

export function createAnvilPlugin() {
  return {
    id: "cardano-anvil",
    name: "ADA Anvil Minting",
    register(api: OpenClawPluginApi) {
      const config = api.pluginConfig ?? {};
      if (config.enabled === false) return;
      const apiKey = validateApiKey(
        config.apiKey || process.env.ADA_ANVIL_API_KEY,
        "cardano-anvil",
      );
      const client: AnvilClient = createAnvilClient({ apiKey, timeout: config.timeout });
      api.registerTool(() => createMintTokenTool(client), { name: "anvil_mint_token" });
      api.registerTool(() => createBurnTokenTool(client), { name: "anvil_burn_token" });
      api.registerTool(() => createCollectionTool(client), { name: "anvil_create_collection" });
      api.registerTool(() => createGetMintsTool(client), { name: "anvil_get_mints" });
    },
  };
}

export { createAnvilClient, type AnvilClient } from "./client.js";
export * from "./types.js";
