import { describe, it, expect, vi, beforeEach } from "vitest";
import { createCswapPlugin } from "../index.js";

describe("cardano-cswap plugin", () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
  });

  it("has correct id", () => {
    expect(createCswapPlugin().id).toBe("cardano-cswap");
  });
  it("has correct name", () => {
    expect(createCswapPlugin().name).toBe("CSWAP DEX");
  });

  it("registers all 4 tools", () => {
    const tools: string[] = [];
    createCswapPlugin().register({
      registerTool: vi.fn((f, o) => tools.push(o.name)),
      pluginConfig: {},
    } as any);
    expect(tools).toHaveLength(4);
    expect(tools).toContain("cswap_get_pools");
    expect(tools).toContain("cswap_get_price");
    expect(tools).toContain("cswap_estimate_swap");
    expect(tools).toContain("cswap_get_liquidity");
  });

  it("uses env var when no config apiKey", () => {
    vi.stubEnv("CSWAP_API_KEY", "env-key");
    const mockApi = { registerTool: vi.fn(), pluginConfig: {} };
    createCswapPlugin().register(mockApi as any);
    expect(mockApi.registerTool).toHaveBeenCalledTimes(4);
  });

  it("respects enabled=false", () => {
    const mockApi = { registerTool: vi.fn(), pluginConfig: { enabled: false } };
    createCswapPlugin().register(mockApi as any);
    expect(mockApi.registerTool).not.toHaveBeenCalled();
  });
});
