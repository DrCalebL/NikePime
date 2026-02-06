import { describe, it, expect, vi, beforeEach } from "vitest";
import { createNabuPlugin } from "../index.js";

describe("cardano-nabu plugin", () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
  });

  it("has correct id", () => {
    expect(createNabuPlugin().id).toBe("cardano-nabu");
  });

  it("has correct name", () => {
    expect(createNabuPlugin().name).toBe("NABU VPN");
  });

  it("registers all 3 tools", () => {
    const plugin = createNabuPlugin();
    const tools: string[] = [];
    const mockApi = { registerTool: vi.fn((f, o) => tools.push(o.name)), pluginConfig: {} };
    plugin.register(mockApi as any);

    expect(tools).toHaveLength(3);
    expect(tools).toContain("nabu_get_nodes");
    expect(tools).toContain("nabu_get_node_stats");
    expect(tools).toContain("nabu_check_status");
  });

  it("uses env var when no config apiKey", () => {
    vi.stubEnv("NABU_VPN_API_KEY", "env-key");
    const plugin = createNabuPlugin();
    const mockApi = { registerTool: vi.fn(), pluginConfig: {} };
    plugin.register(mockApi as any);
    expect(mockApi.registerTool).toHaveBeenCalledTimes(3);
  });

  it("respects enabled=false", () => {
    const plugin = createNabuPlugin();
    const mockApi = { registerTool: vi.fn(), pluginConfig: { enabled: false } };
    plugin.register(mockApi as any);
    expect(mockApi.registerTool).not.toHaveBeenCalled();
  });
});
