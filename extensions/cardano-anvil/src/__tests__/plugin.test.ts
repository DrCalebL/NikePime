import { describe, it, expect, vi, beforeEach } from "vitest";
import { createAnvilPlugin } from "../index.js";

describe("cardano-anvil plugin", () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
  });

  it("has correct id", () => {
    expect(createAnvilPlugin().id).toBe("cardano-anvil");
  });
  it("has correct name", () => {
    expect(createAnvilPlugin().name).toBe("ADA Anvil Minting");
  });

  it("registers all 4 tools", () => {
    const tools: string[] = [];
    createAnvilPlugin().register({
      registerTool: vi.fn((f, o) => tools.push(o.name)),
      pluginConfig: {},
    } as any);
    expect(tools).toHaveLength(4);
    expect(tools).toContain("anvil_mint_token");
    expect(tools).toContain("anvil_burn_token");
    expect(tools).toContain("anvil_create_collection");
    expect(tools).toContain("anvil_get_mints");
  });

  it("uses env var when no config apiKey", () => {
    vi.stubEnv("ADA_ANVIL_API_KEY", "env-key");
    const mockApi = { registerTool: vi.fn(), pluginConfig: {} };
    createAnvilPlugin().register(mockApi as any);
    expect(mockApi.registerTool).toHaveBeenCalledTimes(4);
  });

  it("respects enabled=false", () => {
    const mockApi = { registerTool: vi.fn(), pluginConfig: { enabled: false } };
    createAnvilPlugin().register(mockApi as any);
    expect(mockApi.registerTool).not.toHaveBeenCalled();
  });
});
