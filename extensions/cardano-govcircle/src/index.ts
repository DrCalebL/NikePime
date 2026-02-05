import { createGovCircleClient, type GovCircleClient } from "./client.js";
import { createCirclesTool, createProposalsTool, createVotesTool } from "./tools/index.js";

export interface GovCirclePluginConfig {
  apiKey?: string;
  enabled?: boolean;
  timeout?: number;
}
export interface OpenClawPluginApi {
  registerTool: (factory: () => unknown, options: { name: string }) => void;
  pluginConfig?: GovCirclePluginConfig;
}

function validateApiKey(key: string | undefined, name: string): string | undefined {
  if (!key) return undefined;
  if (key.length < 16) {
    console.warn(`[${name}] API key appears too short (${key.length} chars), may be invalid`);
  }
  return key;
}

export function createGovCirclePlugin() {
  return {
    id: "cardano-govcircle",
    name: "GovCircle Governance",
    register(api: OpenClawPluginApi) {
      const config = api.pluginConfig ?? {};
      if (config.enabled === false) return;
      const apiKey = validateApiKey(
        config.apiKey || process.env.GOVCIRCLE_API_KEY,
        "cardano-govcircle",
      );
      const client: GovCircleClient = createGovCircleClient({ apiKey, timeout: config.timeout });
      api.registerTool(() => createCirclesTool(client), { name: "govcircle_get_circles" });
      api.registerTool(() => createProposalsTool(client), { name: "govcircle_get_proposals" });
      api.registerTool(() => createVotesTool(client), { name: "govcircle_get_votes" });
    },
  };
}

export { createGovCircleClient, type GovCircleClient } from "./client.js";
export * from "./types.js";
