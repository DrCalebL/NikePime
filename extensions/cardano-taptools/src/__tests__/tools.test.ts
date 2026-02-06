import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createTapToolsClient } from "../client.js";
import { createDexVolumeTool } from "../tools/dex-volume.js";
import { createNftCollectionTool } from "../tools/nft-collection.js";
import { createTokenHoldersTool } from "../tools/token-holders.js";
import { createTokenPriceTool } from "../tools/token-price.js";
import { createTrendingTool } from "../tools/trending.js";

describe("TapTools tools", () => {
  const mockFetch = vi.fn();
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = mockFetch;
    mockFetch.mockReset();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  function mockJsonResponse(data: unknown, status = 200) {
    return {
      ok: status >= 200 && status < 300,
      status,
      statusText: status === 200 ? "OK" : "Error",
      json: () => Promise.resolve(data),
      text: () => Promise.resolve(JSON.stringify(data)),
    };
  }

  describe("taptools_get_token_price", () => {
    it("has correct metadata", () => {
      const client = createTapToolsClient({});
      const tool = createTokenPriceTool(client);

      expect(tool.name).toBe("taptools_get_token_price");
      expect(tool.label).toBe("TapTools Token Price");
    });

    it("returns price data for valid policy ID", async () => {
      mockFetch.mockResolvedValue(
        mockJsonResponse({
          price: "0.0025",
          price_24h_change: "5.2",
          volume_24h: "125000",
          market_cap: "2500000",
        }),
      );

      const client = createTapToolsClient({});
      const tool = createTokenPriceTool(client);
      const result = await tool.execute("call-1", { policy_id: "abc123" });

      expect(result).toContainEqual(
        expect.objectContaining({
          type: "text",
        }),
      );
      const textResult = result.find((r) => r.type === "text");
      const data = JSON.parse((textResult as any).text);
      expect(data.price).toBe("0.0025");
    });

    it("handles token not found", async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 404,
        statusText: "Not Found",
        text: () => Promise.resolve("Token not found"),
      });

      const client = createTapToolsClient({});
      const tool = createTokenPriceTool(client);
      const result = await tool.execute("call-1", { policy_id: "nonexistent" });

      const textResult = result.find((r) => r.type === "text");
      const data = JSON.parse((textResult as any).text);
      expect(data.error).toContain("404");
    });

    it("requires policy_id parameter", async () => {
      const client = createTapToolsClient({});
      const tool = createTokenPriceTool(client);
      const result = await tool.execute("call-1", {});

      const textResult = result.find((r) => r.type === "text");
      const data = JSON.parse((textResult as any).text);
      expect(data.error).toContain("policy_id");
    });
  });

  describe("taptools_get_token_holders", () => {
    it("has correct metadata", () => {
      const client = createTapToolsClient({});
      const tool = createTokenHoldersTool(client);

      expect(tool.name).toBe("taptools_get_token_holders");
    });

    it("returns holder data", async () => {
      mockFetch.mockResolvedValue(
        mockJsonResponse({
          total_holders: 50000,
          top_holders: [{ address: "addr1...", balance: "1000000", percentage: "10.5" }],
        }),
      );

      const client = createTapToolsClient({});
      const tool = createTokenHoldersTool(client);
      const result = await tool.execute("call-1", { policy_id: "abc123" });

      const textResult = result.find((r) => r.type === "text");
      const data = JSON.parse((textResult as any).text);
      expect(data.total_holders).toBe(50000);
    });

    it("respects limit parameter", async () => {
      mockFetch.mockResolvedValue(mockJsonResponse({ total_holders: 50000, top_holders: [] }));

      const client = createTapToolsClient({});
      const tool = createTokenHoldersTool(client);
      await tool.execute("call-1", { policy_id: "abc123", limit: 5 });

      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining("limit=5"), expect.anything());
    });
  });

  describe("taptools_get_nft_collection", () => {
    it("has correct metadata", () => {
      const client = createTapToolsClient({});
      const tool = createNftCollectionTool(client);

      expect(tool.name).toBe("taptools_get_nft_collection");
    });

    it("returns collection data", async () => {
      mockFetch.mockResolvedValue(
        mockJsonResponse({
          name: "SpaceBudz",
          policy_id: "abc123",
          floor_price: "500",
          volume_24h: "10000",
          volume_7d: "50000",
          total_supply: 10000,
          listed_count: 500,
        }),
      );

      const client = createTapToolsClient({});
      const tool = createNftCollectionTool(client);
      const result = await tool.execute("call-1", { policy_id: "abc123" });

      const textResult = result.find((r) => r.type === "text");
      const data = JSON.parse((textResult as any).text);
      expect(data.name).toBe("SpaceBudz");
      expect(data.floor_price).toBe("500");
    });
  });

  describe("taptools_get_dex_volume", () => {
    it("has correct metadata", () => {
      const client = createTapToolsClient({});
      const tool = createDexVolumeTool(client);

      expect(tool.name).toBe("taptools_get_dex_volume");
    });

    it("returns volume data", async () => {
      mockFetch.mockResolvedValue(
        mockJsonResponse({
          total_volume_24h: "1000000",
          protocols: [{ name: "Minswap", volume_24h: "500000", percentage: "50" }],
        }),
      );

      const client = createTapToolsClient({});
      const tool = createDexVolumeTool(client);
      const result = await tool.execute("call-1", {});

      const textResult = result.find((r) => r.type === "text");
      const data = JSON.parse((textResult as any).text);
      expect(data.total_volume_24h).toBe("1000000");
    });
  });

  describe("taptools_get_trending", () => {
    it("has correct metadata", () => {
      const client = createTapToolsClient({});
      const tool = createTrendingTool(client);

      expect(tool.name).toBe("taptools_get_trending");
    });

    it("returns trending tokens by default", async () => {
      mockFetch.mockResolvedValue(
        mockJsonResponse({
          tokens: [{ name: "SNEK", policy_id: "abc", price_change: "10", volume: "1000" }],
        }),
      );

      const client = createTapToolsClient({});
      const tool = createTrendingTool(client);
      const result = await tool.execute("call-1", {});

      const textResult = result.find((r) => r.type === "text");
      const data = JSON.parse((textResult as any).text);
      expect(data.tokens).toHaveLength(1);
    });

    it("returns trending NFTs when type=nfts", async () => {
      mockFetch.mockResolvedValue(
        mockJsonResponse({
          nfts: [{ name: "SpaceBudz", policy_id: "abc", floor_change: "10", volume: "1000" }],
        }),
      );

      const client = createTapToolsClient({});
      const tool = createTrendingTool(client);
      const result = await tool.execute("call-1", { type: "nfts" });

      const textResult = result.find((r) => r.type === "text");
      const data = JSON.parse((textResult as any).text);
      expect(data.nfts).toHaveLength(1);
    });
  });
});
