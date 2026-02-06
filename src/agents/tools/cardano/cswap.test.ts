/**
 * Tests for CSWAP DEX integration.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  createCswapGetPoolsTool,
  createCswapGetPriceTool,
  createCswapEstimateSwapTool,
  createCswapGetLiquidityTool,
  createCswapTools,
} from "./cswap.js";

describe("cswap", () => {
  let originalFetch: typeof global.fetch;

  beforeEach(() => {
    originalFetch = global.fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  describe("cswap_get_pools", () => {
    it("returns list of liquidity pools", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            pools: [
              {
                pool_id: "pool1abc",
                token_a: { policy_id: "ada", name: "ADA" },
                token_b: { policy_id: "def123", name: "SNEK" },
                liquidity: "5000000000000",
                volume_24h: "250000000000",
              },
              {
                pool_id: "pool2xyz",
                token_a: { policy_id: "ada", name: "ADA" },
                token_b: { policy_id: "ghi456", name: "MIN" },
                liquidity: "8000000000000",
                volume_24h: "400000000000",
              },
            ],
          }),
      });

      const tool = createCswapGetPoolsTool();
      const result = await tool.execute("test-id", {});

      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.pools).toHaveLength(2);
      expect(parsed.pools[0].pool_id).toBe("pool1abc");
    });

    it("filters pools by token", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            pools: [
              {
                pool_id: "pool1abc",
                token_a: { policy_id: "ada", name: "ADA" },
                token_b: { policy_id: "snek123", name: "SNEK" },
                liquidity: "5000000000000",
              },
            ],
          }),
      });

      const tool = createCswapGetPoolsTool();
      await tool.execute("test-id", {
        token: "snek123",
      });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("token=snek123"),
        expect.any(Object),
      );
    });

    it("supports pagination with limit", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            pools: [{ pool_id: "pool1", liquidity: "1000000" }],
          }),
      });

      const tool = createCswapGetPoolsTool();
      await tool.execute("test-id", {
        limit: 5,
      });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("limit=5"),
        expect.any(Object),
      );
    });
  });

  describe("cswap_get_price", () => {
    it("returns token price from pools", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            token: "snek123",
            price_ada: "0.00025",
            price_usd: "0.00015",
            change_24h: "5.2",
          }),
      });

      const tool = createCswapGetPriceTool();
      const result = await tool.execute("test-id", {
        token: "snek123",
      });

      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.price_ada).toBe("0.00025");
      expect(parsed.change_24h).toBe("5.2");
    });

    it("handles token not found", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        statusText: "Not Found",
        text: () => Promise.resolve("Token not found"),
      });

      const tool = createCswapGetPriceTool();
      const result = await tool.execute("test-id", {
        token: "nonexistent",
      });

      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.error).toBeDefined();
    });

    it("requires token parameter", async () => {
      const tool = createCswapGetPriceTool();
      const result = await tool.execute("test-id", {});

      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.error).toContain("token");
    });
  });

  describe("cswap_estimate_swap", () => {
    it("estimates swap output and fees", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            input_token: "ada",
            input_amount: "1000000000",
            output_token: "snek123",
            output_amount: "4000000000",
            price_impact: "0.15",
            fee: "3000000",
            route: ["ada", "snek123"],
          }),
      });

      const tool = createCswapEstimateSwapTool();
      const result = await tool.execute("test-id", {
        input_token: "ada",
        output_token: "snek123",
        amount: "1000000000",
      });

      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.output_amount).toBe("4000000000");
      expect(parsed.price_impact).toBe("0.15");
      expect(parsed.fee).toBe("3000000");
    });

    it("calculates multi-hop routes", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            input_token: "token_a",
            input_amount: "1000000",
            output_token: "token_c",
            output_amount: "950000",
            route: ["token_a", "ada", "token_c"],
          }),
      });

      const tool = createCswapEstimateSwapTool();
      const result = await tool.execute("test-id", {
        input_token: "token_a",
        output_token: "token_c",
        amount: "1000000",
      });

      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.route).toHaveLength(3);
    });

    it("requires all parameters", async () => {
      const tool = createCswapEstimateSwapTool();
      const result = await tool.execute("test-id", {
        input_token: "ada",
      });

      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.error).toBeDefined();
    });

    it("handles insufficient liquidity", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        statusText: "Bad Request",
        text: () => Promise.resolve("Insufficient liquidity for swap"),
      });

      const tool = createCswapEstimateSwapTool();
      const result = await tool.execute("test-id", {
        input_token: "ada",
        output_token: "rare_token",
        amount: "999999999999999",
      });

      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.error).toBeDefined();
    });
  });

  describe("cswap_get_liquidity", () => {
    it("returns pool liquidity statistics", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            pool_id: "pool1abc",
            token_a: { policy_id: "ada", amount: "2500000000000" },
            token_b: { policy_id: "snek123", amount: "10000000000000" },
            total_liquidity: "5000000000000",
            lp_tokens: "1000000000",
            apy: "12.5",
          }),
      });

      const tool = createCswapGetLiquidityTool();
      const result = await tool.execute("test-id", {
        pool_id: "pool1abc",
      });

      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.total_liquidity).toBe("5000000000000");
      expect(parsed.apy).toBe("12.5");
    });

    it("handles pool not found", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        statusText: "Not Found",
        text: () => Promise.resolve("Pool not found"),
      });

      const tool = createCswapGetLiquidityTool();
      const result = await tool.execute("test-id", {
        pool_id: "nonexistent",
      });

      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.error).toBeDefined();
    });

    it("requires pool_id parameter", async () => {
      const tool = createCswapGetLiquidityTool();
      const result = await tool.execute("test-id", {});

      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.error).toContain("pool_id");
    });
  });

  describe("createCswapTools", () => {
    it("returns all 4 CSWAP tools", () => {
      const tools = createCswapTools();
      expect(tools).toHaveLength(4);

      const names = tools.map((t) => t.name);
      expect(names).toContain("cswap_get_pools");
      expect(names).toContain("cswap_get_price");
      expect(names).toContain("cswap_estimate_swap");
      expect(names).toContain("cswap_get_liquidity");
    });

    it("all tools have required properties", () => {
      const tools = createCswapTools();
      tools.forEach((tool) => {
        expect(tool.name).toBeDefined();
        expect(tool.description).toBeDefined();
        expect(tool.parameters).toBeDefined();
        expect(tool.execute).toBeInstanceOf(Function);
      });
    });
  });

  describe("error handling", () => {
    it("handles API timeout", async () => {
      global.fetch = vi.fn().mockImplementation(
        () =>
          new Promise((_, reject) => {
            setTimeout(() => reject(new Error("Timeout")), 100);
          }),
      );

      const tool = createCswapGetPoolsTool();
      const result = await tool.execute("test-id", {});

      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.error).toBeDefined();
    });

    it("handles malformed JSON response", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.reject(new Error("Invalid JSON")),
      });

      const tool = createCswapGetPoolsTool();
      const result = await tool.execute("test-id", {});

      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.error).toBeDefined();
    });
  });
});
