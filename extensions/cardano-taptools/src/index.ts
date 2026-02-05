/**
 * TapTools plugin for OpenClaw.
 *
 * Provides Cardano token analytics, NFT data, and DEX volume tracking.
 */

import { createTapToolsClient, type TapToolsClient } from "./client.js";
import {
  createTokenPriceTool,
  createTokenHoldersTool,
  createNftCollectionTool,
  createDexVolumeTool,
  createTrendingTool,
} from "./tools/index.js";

export interface TapToolsPluginConfig {
  apiKey?: string;
  enabled?: boolean;
  timeout?: number;
}

export interface OpenClawPluginApi {
  registerTool: (factory: () => unknown, options: { name: string }) => void;
  pluginConfig?: TapToolsPluginConfig;
}

export interface TapToolsPlugin {
  id: string;
  name: string;
  register: (api: OpenClawPluginApi) => void;
}

function validateApiKey(key: string | undefined, name: string): string | undefined {
  if (!key) return undefined;
  if (key.length < 16) {
    console.warn(`[${name}] API key appears too short (${key.length} chars), may be invalid`);
  }
  return key;
}

export function createTapToolsPlugin(): TapToolsPlugin {
  return {
    id: "cardano-taptools",
    name: "TapTools Analytics",

    register(api: OpenClawPluginApi) {
      const config = api.pluginConfig ?? {};

      // Skip registration if explicitly disabled
      if (config.enabled === false) {
        return;
      }

      // Get API key from config or env
      const apiKey = validateApiKey(
        config.apiKey || process.env.TAPTOOLS_API_KEY,
        "cardano-taptools",
      );

      // Create client
      const client: TapToolsClient = createTapToolsClient({
        apiKey,
        timeout: config.timeout,
      });

      // Register all tools
      api.registerTool(() => createTokenPriceTool(client), {
        name: "taptools_get_token_price",
      });

      api.registerTool(() => createTokenHoldersTool(client), {
        name: "taptools_get_token_holders",
      });

      api.registerTool(() => createNftCollectionTool(client), {
        name: "taptools_get_nft_collection",
      });

      api.registerTool(() => createDexVolumeTool(client), {
        name: "taptools_get_dex_volume",
      });

      api.registerTool(() => createTrendingTool(client), {
        name: "taptools_get_trending",
      });
    },
  };
}

// Re-export types and client for consumers
export { createTapToolsClient, type TapToolsClient } from "./client.js";
export type { Result } from "./client.js";
export * from "./types.js";
