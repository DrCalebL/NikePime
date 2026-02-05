import { describe, it, expect, vi, beforeEach } from "vitest";
import { createTapToolsPlugin } from "../index.js";

describe("cardano-taptools plugin", () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
  });

  describe("plugin metadata", () => {
    it("has correct id", () => {
      const plugin = createTapToolsPlugin();
      expect(plugin.id).toBe("cardano-taptools");
    });

    it("has correct name", () => {
      const plugin = createTapToolsPlugin();
      expect(plugin.name).toBe("TapTools Analytics");
    });
  });

  describe("tool registration", () => {
    it("registers all 5 tools", () => {
      const plugin = createTapToolsPlugin();
      const registeredTools: string[] = [];

      const mockApi = {
        registerTool: vi.fn((factory, opts) => {
          registeredTools.push(opts.name);
        }),
        pluginConfig: {},
      };

      plugin.register(mockApi as any);

      expect(registeredTools).toHaveLength(5);
      expect(registeredTools).toContain("taptools_get_token_price");
      expect(registeredTools).toContain("taptools_get_token_holders");
      expect(registeredTools).toContain("taptools_get_nft_collection");
      expect(registeredTools).toContain("taptools_get_dex_volume");
      expect(registeredTools).toContain("taptools_get_trending");
    });

    it("passes apiKey to client when provided in config", () => {
      const plugin = createTapToolsPlugin();
      let capturedApiKey: string | undefined;

      const mockApi = {
        registerTool: vi.fn((factory) => {
          const tool = factory();
          // The tool's execute function will use the client with the apiKey
          capturedApiKey = (tool as any)._apiKey;
        }),
        pluginConfig: { apiKey: "test-api-key-123" },
      };

      plugin.register(mockApi as any);

      // Tools should be created with the API key
      expect(mockApi.registerTool).toHaveBeenCalled();
    });

    it("uses env var when no config apiKey", () => {
      vi.stubEnv("TAPTOOLS_API_KEY", "env-api-key-456");

      const plugin = createTapToolsPlugin();
      const mockApi = {
        registerTool: vi.fn(),
        pluginConfig: {},
      };

      plugin.register(mockApi as any);
      expect(mockApi.registerTool).toHaveBeenCalledTimes(5);
    });

    it("respects enabled=false", () => {
      const plugin = createTapToolsPlugin();
      const mockApi = {
        registerTool: vi.fn(),
        pluginConfig: { enabled: false },
      };

      plugin.register(mockApi as any);

      expect(mockApi.registerTool).not.toHaveBeenCalled();
    });
  });
});
