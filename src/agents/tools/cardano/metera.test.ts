/**
 * Tests for Metera Protocol index tokens integration.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  createMeteraGetIndicesTool,
  createMeteraGetCompositionTool,
  createMeteraGetPerformanceTool,
  createMeteraTools,
} from "./metera.js";

describe("metera", () => {
  let originalFetch: typeof global.fetch;

  beforeEach(() => {
    originalFetch = global.fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  describe("metera_get_indices", () => {
    it("returns list of index tokens", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            indices: [
              {
                index_id: "defi-10",
                name: "DeFi Top 10",
                policy_id: "abc123",
                price: "1.25",
                market_cap: "5000000",
              },
              {
                index_id: "nft-blue-chip",
                name: "NFT Blue Chip",
                policy_id: "def456",
                price: "2.50",
                market_cap: "8000000",
              },
            ],
          }),
      });

      const tool = createMeteraGetIndicesTool();
      const result = await tool.execute("test-id", {});

      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.indices).toHaveLength(2);
      expect(parsed.indices[0].name).toBe("DeFi Top 10");
    });

    it("filters by category", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            indices: [{ index_id: "defi-10", name: "DeFi Top 10" }],
          }),
      });

      const tool = createMeteraGetIndicesTool();
      await tool.execute("test-id", {
        category: "defi",
      });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("category=defi"),
        expect.any(Object),
      );
    });
  });

  describe("metera_get_composition", () => {
    it("returns index token composition", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            index_id: "defi-10",
            name: "DeFi Top 10",
            components: [
              { token: "MIN", policy_id: "min123", weight: 15.5 },
              { token: "SNEK", policy_id: "snek456", weight: 12.3 },
              { token: "SUNDAE", policy_id: "sundae789", weight: 10.8 },
            ],
            last_rebalance: "2025-01-15T00:00:00Z",
          }),
      });

      const tool = createMeteraGetCompositionTool();
      const result = await tool.execute("test-id", {
        index_id: "defi-10",
      });

      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.components).toHaveLength(3);
      expect(parsed.components[0].weight).toBe(15.5);
    });

    it("requires index_id parameter", async () => {
      const tool = createMeteraGetCompositionTool();
      const result = await tool.execute("test-id", {});

      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.error).toContain("index_id");
    });

    it("handles index not found", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        statusText: "Not Found",
        text: () => Promise.resolve("Index not found"),
      });

      const tool = createMeteraGetCompositionTool();
      const result = await tool.execute("test-id", {
        index_id: "nonexistent",
      });

      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.error).toBeDefined();
    });
  });

  describe("metera_get_performance", () => {
    it("returns index performance metrics", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            index_id: "defi-10",
            name: "DeFi Top 10",
            price: "1.25",
            change_24h: "5.2",
            change_7d: "12.5",
            change_30d: "25.8",
            all_time_high: "2.00",
            all_time_low: "0.50",
          }),
      });

      const tool = createMeteraGetPerformanceTool();
      const result = await tool.execute("test-id", {
        index_id: "defi-10",
      });

      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.change_24h).toBe("5.2");
      expect(parsed.change_7d).toBe("12.5");
    });

    it("supports timeframe parameter", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            index_id: "defi-10",
            price: "1.25",
          }),
      });

      const tool = createMeteraGetPerformanceTool();
      await tool.execute("test-id", {
        index_id: "defi-10",
        timeframe: "30d",
      });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("timeframe=30d"),
        expect.any(Object),
      );
    });

    it("requires index_id parameter", async () => {
      const tool = createMeteraGetPerformanceTool();
      const result = await tool.execute("test-id", {});

      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.error).toContain("index_id");
    });
  });

  describe("createMeteraTools", () => {
    it("returns all 3 Metera tools", () => {
      const tools = createMeteraTools();
      expect(tools).toHaveLength(3);

      const names = tools.map((t) => t.name);
      expect(names).toContain("metera_get_indices");
      expect(names).toContain("metera_get_composition");
      expect(names).toContain("metera_get_performance");
    });

    it("all tools have required properties", () => {
      const tools = createMeteraTools();
      tools.forEach((tool) => {
        expect(tool.name).toBeDefined();
        expect(tool.description).toBeDefined();
        expect(tool.parameters).toBeDefined();
        expect(tool.execute).toBeInstanceOf(Function);
      });
    });
  });
});
