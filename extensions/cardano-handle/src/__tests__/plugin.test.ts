import { describe, it, expect, vi, beforeEach } from "vitest";
import { createHandlePlugin } from "../index.js";

describe("cardano-handle plugin", () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
  });

  describe("plugin metadata", () => {
    it("has correct id", () => {
      const plugin = createHandlePlugin();
      expect(plugin.id).toBe("cardano-handle");
    });

    it("has correct name", () => {
      const plugin = createHandlePlugin();
      expect(plugin.name).toBe("Ada Handle");
    });
  });

  describe("tool registration", () => {
    it("registers all 4 tools", () => {
      const plugin = createHandlePlugin();
      const registeredTools: string[] = [];

      const mockApi = {
        registerTool: vi.fn((factory, opts) => {
          registeredTools.push(opts.name);
        }),
        pluginConfig: {},
      };

      plugin.register(mockApi as any);

      expect(registeredTools).toHaveLength(4);
      expect(registeredTools).toContain("handle_resolve");
      expect(registeredTools).toContain("handle_reverse_lookup");
      expect(registeredTools).toContain("handle_get_metadata");
      expect(registeredTools).toContain("handle_check_availability");
    });

    it("uses env var when no config apiKey", () => {
      vi.stubEnv("ADA_HANDLE_API_KEY", "env-api-key");

      const plugin = createHandlePlugin();
      const mockApi = {
        registerTool: vi.fn(),
        pluginConfig: {},
      };

      plugin.register(mockApi as any);
      expect(mockApi.registerTool).toHaveBeenCalledTimes(4);
    });

    it("respects enabled=false", () => {
      const plugin = createHandlePlugin();
      const mockApi = {
        registerTool: vi.fn(),
        pluginConfig: { enabled: false },
      };

      plugin.register(mockApi as any);
      expect(mockApi.registerTool).not.toHaveBeenCalled();
    });
  });
});
