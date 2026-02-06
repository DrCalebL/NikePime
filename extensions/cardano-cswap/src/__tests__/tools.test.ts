import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createCswapClient } from "../client.js";
import {
  createPoolsTool,
  createPriceTool,
  createEstimateSwapTool,
  createLiquidityTool,
} from "../tools/index.js";

describe("CSWAP tools", () => {
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

  describe("cswap_get_pools", () => {
    it("has correct name", () => {
      expect(createPoolsTool(createCswapClient({})).name).toBe("cswap_get_pools");
    });

    it("returns pool list", async () => {
      mockFetch.mockResolvedValue(mockJson([{ pool_id: "p1", tvl: "1000000" }]));
      const result = await createPoolsTool(createCswapClient({})).execute("c1", {});
      const data = JSON.parse((result[0] as any).text);
      expect(data.pools).toHaveLength(1);
    });

    it("filters by token", async () => {
      mockFetch.mockResolvedValue(mockJson([]));
      await createPoolsTool(createCswapClient({})).execute("c1", { token: "abc123" });
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("token=abc123"),
        expect.anything(),
      );
    });
  });

  describe("cswap_get_price", () => {
    it("has correct name", () => {
      expect(createPriceTool(createCswapClient({})).name).toBe("cswap_get_price");
    });

    it("returns ADA price", async () => {
      mockFetch.mockResolvedValue(mockJson({ price_ada: "0.0025", price_usd: "0.001" }));
      const result = await createPriceTool(createCswapClient({})).execute("c1", { token: "snek" });
      const data = JSON.parse((result[0] as any).text);
      expect(data.price_ada).toBe("0.0025");
    });

    it("requires token", async () => {
      const result = await createPriceTool(createCswapClient({})).execute("c1", {});
      const data = JSON.parse((result[0] as any).text);
      expect(data.error).toContain("token");
    });
  });

  describe("cswap_estimate_swap", () => {
    it("has correct name", () => {
      expect(createEstimateSwapTool(createCswapClient({})).name).toBe("cswap_estimate_swap");
    });

    it("calculates output amount", async () => {
      mockFetch.mockResolvedValue(mockJson({ output_amount: "4000000000" }));
      const result = await createEstimateSwapTool(createCswapClient({})).execute("c1", {
        input_token: "ada",
        output_token: "snek",
        amount: "1000000000",
      });
      const data = JSON.parse((result[0] as any).text);
      expect(data.output_amount).toBe("4000000000");
    });

    it("includes price impact", async () => {
      mockFetch.mockResolvedValue(mockJson({ price_impact: "0.15" }));
      const result = await createEstimateSwapTool(createCswapClient({})).execute("c1", {
        input_token: "ada",
        output_token: "snek",
        amount: "1000000000",
      });
      const data = JSON.parse((result[0] as any).text);
      expect(data.price_impact).toBe("0.15");
    });

    it("includes fee", async () => {
      mockFetch.mockResolvedValue(mockJson({ fee: "3000000" }));
      const result = await createEstimateSwapTool(createCswapClient({})).execute("c1", {
        input_token: "ada",
        output_token: "snek",
        amount: "1000000000",
      });
      const data = JSON.parse((result[0] as any).text);
      expect(data.fee).toBe("3000000");
    });

    it("returns route", async () => {
      mockFetch.mockResolvedValue(mockJson({ route: ["ada", "snek"] }));
      const result = await createEstimateSwapTool(createCswapClient({})).execute("c1", {
        input_token: "ada",
        output_token: "snek",
        amount: "1000",
      });
      const data = JSON.parse((result[0] as any).text);
      expect(data.route).toContain("snek");
    });
  });

  describe("cswap_get_liquidity", () => {
    it("has correct name", () => {
      expect(createLiquidityTool(createCswapClient({})).name).toBe("cswap_get_liquidity");
    });

    it("returns TVL", async () => {
      mockFetch.mockResolvedValue(mockJson({ tvl: "5000000000" }));
      const result = await createLiquidityTool(createCswapClient({})).execute("c1", {
        pool_id: "p1",
      });
      const data = JSON.parse((result[0] as any).text);
      expect(data.tvl).toBe("5000000000");
    });

    it("requires pool_id", async () => {
      const result = await createLiquidityTool(createCswapClient({})).execute("c1", {});
      const data = JSON.parse((result[0] as any).text);
      expect(data.error).toContain("pool_id");
    });
  });
});
