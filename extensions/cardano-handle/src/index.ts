/**
 * Ada Handle plugin for OpenClaw.
 */

import { createHandleClient, type HandleClient } from "./client.js";
import {
  createResolveTool,
  createReverseLookupTool,
  createMetadataTool,
  createAvailabilityTool,
} from "./tools/index.js";

export interface HandlePluginConfig {
  apiKey?: string;
  enabled?: boolean;
  timeout?: number;
}

export interface OpenClawPluginApi {
  registerTool: (factory: () => unknown, options: { name: string }) => void;
  pluginConfig?: HandlePluginConfig;
}

export interface HandlePlugin {
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

export function createHandlePlugin(): HandlePlugin {
  return {
    id: "cardano-handle",
    name: "Ada Handle",

    register(api: OpenClawPluginApi) {
      const config = api.pluginConfig ?? {};

      if (config.enabled === false) {
        return;
      }

      const apiKey = validateApiKey(
        config.apiKey || process.env.ADA_HANDLE_API_KEY,
        "cardano-handle",
      );

      const client: HandleClient = createHandleClient({
        apiKey,
        timeout: config.timeout,
      });

      api.registerTool(() => createResolveTool(client), { name: "handle_resolve" });
      api.registerTool(() => createReverseLookupTool(client), { name: "handle_reverse_lookup" });
      api.registerTool(() => createMetadataTool(client), { name: "handle_get_metadata" });
      api.registerTool(() => createAvailabilityTool(client), { name: "handle_check_availability" });
    },
  };
}

export { createHandleClient, type HandleClient } from "./client.js";
export type { Result } from "./client.js";
export * from "./types.js";
