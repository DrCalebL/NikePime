import { describe, it, expect, vi, beforeEach } from "vitest";
import { createGovCirclePlugin } from "../index.js";

describe("cardano-govcircle plugin", () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
  });

  it("has correct id", () => {
    expect(createGovCirclePlugin().id).toBe("cardano-govcircle");
  });
  it("has correct name", () => {
    expect(createGovCirclePlugin().name).toBe("GovCircle Governance");
  });

  it("registers all 3 tools", () => {
    const tools: string[] = [];
    createGovCirclePlugin().register({
      registerTool: vi.fn((f, o) => tools.push(o.name)),
      pluginConfig: {},
    } as any);
    expect(tools).toHaveLength(3);
    expect(tools).toContain("govcircle_get_circles");
    expect(tools).toContain("govcircle_get_proposals");
    expect(tools).toContain("govcircle_get_votes");
  });

  it("uses env var when no config apiKey", () => {
    vi.stubEnv("GOVCIRCLE_API_KEY", "env-key");
    const mockApi = { registerTool: vi.fn(), pluginConfig: {} };
    createGovCirclePlugin().register(mockApi as any);
    expect(mockApi.registerTool).toHaveBeenCalledTimes(3);
  });

  it("respects enabled=false", () => {
    const mockApi = { registerTool: vi.fn(), pluginConfig: { enabled: false } };
    createGovCirclePlugin().register(mockApi as any);
    expect(mockApi.registerTool).not.toHaveBeenCalled();
  });
});
