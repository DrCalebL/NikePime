import { describe, it, expect, vi, beforeEach } from "vitest";
import { createCexplorerPlugin } from "../index.js";

describe("cardano-cexplorer plugin", () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
  });

  it("has correct id", () => {
    expect(createCexplorerPlugin().id).toBe("cardano-cexplorer");
  });
  it("has correct name", () => {
    expect(createCexplorerPlugin().name).toBe("Cexplorer Blockchain Explorer");
  });

  it("registers all 5 tools", () => {
    const tools: string[] = [];
    createCexplorerPlugin().register({
      registerTool: vi.fn((f, o) => tools.push(o.name)),
      pluginConfig: {},
    } as any);
    expect(tools).toHaveLength(5);
    expect(tools).toContain("cexplorer_get_address");
    expect(tools).toContain("cexplorer_get_transaction");
    expect(tools).toContain("cexplorer_get_pool");
    expect(tools).toContain("cexplorer_get_epoch");
    expect(tools).toContain("cexplorer_search");
  });

  it("uses env var when no config apiKey", () => {
    vi.stubEnv("CEXPLORER_API_KEY", "env-key");
    const mockApi = { registerTool: vi.fn(), pluginConfig: {} };
    createCexplorerPlugin().register(mockApi as any);
    expect(mockApi.registerTool).toHaveBeenCalledTimes(5);
  });

  it("respects enabled=false", () => {
    const mockApi = { registerTool: vi.fn(), pluginConfig: { enabled: false } };
    createCexplorerPlugin().register(mockApi as any);
    expect(mockApi.registerTool).not.toHaveBeenCalled();
  });
});
