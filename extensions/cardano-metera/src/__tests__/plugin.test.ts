import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMeteraPlugin } from "../index.js";

describe("cardano-metera plugin", () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
  });

  it("has correct id", () => {
    expect(createMeteraPlugin().id).toBe("cardano-metera");
  });
  it("has correct name", () => {
    expect(createMeteraPlugin().name).toBe("Metera Index Tokens");
  });

  it("registers all 3 tools", () => {
    const plugin = createMeteraPlugin();
    const tools: string[] = [];
    plugin.register({ registerTool: vi.fn((f, o) => tools.push(o.name)), pluginConfig: {} } as any);
    expect(tools).toHaveLength(3);
    expect(tools).toContain("metera_get_indices");
    expect(tools).toContain("metera_get_composition");
    expect(tools).toContain("metera_get_performance");
  });

  it("uses env var when no config apiKey", () => {
    vi.stubEnv("METERA_API_KEY", "env-key");
    const mockApi = { registerTool: vi.fn(), pluginConfig: {} };
    createMeteraPlugin().register(mockApi as any);
    expect(mockApi.registerTool).toHaveBeenCalledTimes(3);
  });

  it("respects enabled=false", () => {
    const mockApi = { registerTool: vi.fn(), pluginConfig: { enabled: false } };
    createMeteraPlugin().register(mockApi as any);
    expect(mockApi.registerTool).not.toHaveBeenCalled();
  });
});
