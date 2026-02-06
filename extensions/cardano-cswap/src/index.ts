import { createCswapClient, type CswapClient } from "./client.js";
import {
  createPoolsTool,
  createPriceTool,
  createEstimateSwapTool,
  createLiquidityTool,
} from "./tools/index.js";

export interface CswapPluginConfig {
  apiKey?: string;
  enabled?: boolean;
  timeout?: number;
}
export interface OpenClawPluginApi {
  registerTool: (factory: () => unknown, options: { name: string }) => void;
  pluginConfig?: CswapPluginConfig;
}

function validateApiKey(key: string | undefined, name: string): string | undefined {
  if (!key) return undefined;
  if (key.length < 16) {
    console.warn(`[${name}] API key appears too short (${key.length} chars), may be invalid`);
  }
  return key;
}

export function createCswapPlugin() {
  return {
    id: "cardano-cswap",
    name: "CSWAP DEX",
    register(api: OpenClawPluginApi) {
      const config = api.pluginConfig ?? {};
      if (config.enabled === false) return;
      const apiKey = validateApiKey(config.apiKey || process.env.CSWAP_API_KEY, "cardano-cswap");
      const client: CswapClient = createCswapClient({ apiKey, timeout: config.timeout });
      api.registerTool(() => createPoolsTool(client), { name: "cswap_get_pools" });
      api.registerTool(() => createPriceTool(client), { name: "cswap_get_price" });
      api.registerTool(() => createEstimateSwapTool(client), { name: "cswap_estimate_swap" });
      api.registerTool(() => createLiquidityTool(client), { name: "cswap_get_liquidity" });
    },
  };
}

export { createCswapClient, type CswapClient } from "./client.js";
export * from "./types.js";
