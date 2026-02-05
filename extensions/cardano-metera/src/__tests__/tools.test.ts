import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createMeteraClient } from "../client.js";
import { createIndicesTool, createCompositionTool, createPerformanceTool } from "../tools/index.js";

describe("Metera tools", () => {
  const mockFetch = vi.fn();
  const orig = global.fetch;
  beforeEach(() => {
    global.fetch = mockFetch;
    mockFetch.mockReset();
  });
  afterEach(() => {
    global.fetch = orig;
  });

  function mockJson(data: unknown) {
    return {
      ok: true,
      status: 200,
      json: () => Promise.resolve(data),
      text: () => Promise.resolve(""),
    };
  }

  describe("metera_get_indices", () => {
    it("has correct name", () => {
      expect(createIndicesTool(createMeteraClient({})).name).toBe("metera_get_indices");
    });

    it("returns index list", async () => {
      mockFetch.mockResolvedValue(mockJson([{ id: "idx1", name: "DeFi Index", symbol: "DEFI" }]));
      const result = await createIndicesTool(createMeteraClient({})).execute("c1", {});
      const data = JSON.parse((result[0] as any).text);
      expect(data.indices).toHaveLength(1);
    });

    it("filters by category", async () => {
      mockFetch.mockResolvedValue(mockJson([]));
      await createIndicesTool(createMeteraClient({})).execute("c1", { category: "nft" });
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("category=nft"),
        expect.anything(),
      );
    });
  });

  describe("metera_get_composition", () => {
    it("has correct name", () => {
      expect(createCompositionTool(createMeteraClient({})).name).toBe("metera_get_composition");
    });

    it("returns component weights", async () => {
      mockFetch.mockResolvedValue(
        mockJson({ index_id: "idx1", components: [{ token: "ADA", weight: "40" }] }),
      );
      const result = await createCompositionTool(createMeteraClient({})).execute("c1", {
        index_id: "idx1",
      });
      const data = JSON.parse((result[0] as any).text);
      expect(data.components[0].weight).toBe("40");
    });

    it("requires index_id", async () => {
      const result = await createCompositionTool(createMeteraClient({})).execute("c1", {});
      const data = JSON.parse((result[0] as any).text);
      expect(data.error).toContain("index_id");
    });
  });

  describe("metera_get_performance", () => {
    it("has correct name", () => {
      expect(createPerformanceTool(createMeteraClient({})).name).toBe("metera_get_performance");
    });

    it("supports timeframes", async () => {
      mockFetch.mockResolvedValue(mockJson({ return_percentage: "10.5" }));
      await createPerformanceTool(createMeteraClient({})).execute("c1", {
        index_id: "idx1",
        timeframe: "30d",
      });
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("timeframe=30d"),
        expect.anything(),
      );
    });

    it("includes ATH/ATL", async () => {
      mockFetch.mockResolvedValue(mockJson({ ath: "150", atl: "80" }));
      const result = await createPerformanceTool(createMeteraClient({})).execute("c1", {
        index_id: "idx1",
      });
      const data = JSON.parse((result[0] as any).text);
      expect(data.ath).toBe("150");
      expect(data.atl).toBe("80");
    });
  });
});
