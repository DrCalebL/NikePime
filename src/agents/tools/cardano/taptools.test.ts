/**
 * Tests for TapTools Cardano analytics integration.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  createTapToolsTokenPriceTool,
  createTapToolsTokenHoldersTool,
  createTapToolsNftCollectionTool,
  createTapToolsDexVolumeTool,
  createTapToolsTrendingTool,
  createTapToolsTools,
} from "./taptools.js";

describe("taptools", () => {
  let originalFetch: typeof global.fetch;

  beforeEach(() => {
    originalFetch = global.fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  describe("taptools_get_token_price", () => {
    it("returns price data for valid policy ID", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            price: "0.0025",
            price_24h_change: "5.25",
            volume_24h: "125000",
            market_cap: "2500000",
          }),
      });

      const tool = createTapToolsTokenPriceTool();
      const result = await tool.execute("test-id", {
        policy_id: "abc123def456",
      });

      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.price).toBe("0.0025");
      expect(parsed.change_24h).toBe("5.25");
      expect(parsed.volume_24h).toBe("125000");
    });

    it("handles token not found", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        statusText: "Not Found",
        text: () => Promise.resolve("Token not found"),
      });

      const tool = createTapToolsTokenPriceTool();
      const result = await tool.execute("test-id", {
        policy_id: "nonexistent",
      });

      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.error).toBeDefined();
    });

    it("includes 24h price change percentage", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            price: "1.50",
            price_24h_change: "-2.5",
            volume_24h: "50000",
            market_cap: "1000000",
          }),
      });

      const tool = createTapToolsTokenPriceTool();
      const result = await tool.execute("test-id", {
        policy_id: "abc123",
      });

      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.change_24h).toBe("-2.5");
    });

    it("requires policy_id parameter", async () => {
      const tool = createTapToolsTokenPriceTool();
      const result = await tool.execute("test-id", {});

      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.error).toContain("policy_id");
    });
  });

  describe("taptools_get_token_holders", () => {
    it("returns holder count and distribution", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            total_holders: 5000,
            top_holders: [
              { address: "addr1...", balance: "1000000", percentage: "10.5" },
              { address: "addr2...", balance: "500000", percentage: "5.2" },
            ],
          }),
      });

      const tool = createTapToolsTokenHoldersTool();
      const result = await tool.execute("test-id", {
        policy_id: "abc123",
      });

      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.total_holders).toBe(5000);
      expect(parsed.top_holders).toHaveLength(2);
    });

    it("handles pagination with limit parameter", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            total_holders: 5000,
            top_holders: [{ address: "addr1...", balance: "1000000", percentage: "10.5" }],
          }),
      });

      const tool = createTapToolsTokenHoldersTool();
      const result = await tool.execute("test-id", {
        policy_id: "abc123",
        limit: 1,
      });

      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.top_holders).toHaveLength(1);
    });

    it("returns empty array for token with no holders", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            total_holders: 0,
            top_holders: [],
          }),
      });

      const tool = createTapToolsTokenHoldersTool();
      const result = await tool.execute("test-id", {
        policy_id: "abc123",
      });

      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.total_holders).toBe(0);
      expect(parsed.top_holders).toEqual([]);
    });
  });

  describe("taptools_get_nft_collection", () => {
    it("returns floor price and volume", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            name: "SpaceBudz",
            policy_id: "abc123",
            floor_price: "500",
            volume_24h: "25000",
            volume_7d: "150000",
            total_supply: 10000,
            listed_count: 250,
          }),
      });

      const tool = createTapToolsNftCollectionTool();
      const result = await tool.execute("test-id", {
        policy_id: "abc123",
      });

      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.name).toBe("SpaceBudz");
      expect(parsed.floor_price).toBe("500");
      expect(parsed.volume_24h).toBe("25000");
    });

    it("handles invalid collection", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        statusText: "Not Found",
        text: () => Promise.resolve("Collection not found"),
      });

      const tool = createTapToolsNftCollectionTool();
      const result = await tool.execute("test-id", {
        policy_id: "invalid",
      });

      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.error).toBeDefined();
    });

    it("includes listing statistics", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            name: "TestNFT",
            policy_id: "xyz789",
            floor_price: "100",
            volume_24h: "5000",
            volume_7d: "30000",
            total_supply: 5000,
            listed_count: 100,
          }),
      });

      const tool = createTapToolsNftCollectionTool();
      const result = await tool.execute("test-id", {
        policy_id: "xyz789",
      });

      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.total_supply).toBe(5000);
      expect(parsed.listed_count).toBe(100);
    });
  });

  describe("taptools_get_dex_volume", () => {
    it("returns DEX trading volume across protocols", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            total_volume_24h: "5000000",
            protocols: [
              { name: "Minswap", volume_24h: "2000000", percentage: "40" },
              { name: "SundaeSwap", volume_24h: "1500000", percentage: "30" },
              { name: "WingRiders", volume_24h: "1000000", percentage: "20" },
            ],
          }),
      });

      const tool = createTapToolsDexVolumeTool();
      const result = await tool.execute("test-id", {});

      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.total_volume_24h).toBe("5000000");
      expect(parsed.protocols).toHaveLength(3);
    });

    it("allows filtering by timeframe", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            total_volume_24h: "35000000",
            protocols: [],
          }),
      });

      const tool = createTapToolsDexVolumeTool();
      const result = await tool.execute("test-id", {
        timeframe: "7d",
      });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("timeframe=7d"),
        expect.any(Object),
      );
    });
  });

  describe("taptools_get_trending", () => {
    it("returns trending tokens", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            tokens: [
              { name: "SNEK", policy_id: "abc", price_change: "25.5", volume: "100000" },
              { name: "MIN", policy_id: "def", price_change: "15.2", volume: "80000" },
            ],
          }),
      });

      const tool = createTapToolsTrendingTool();
      const result = await tool.execute("test-id", {
        type: "tokens",
      });

      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.tokens).toHaveLength(2);
      expect(parsed.tokens[0].name).toBe("SNEK");
    });

    it("returns trending NFTs", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            nfts: [{ name: "SpaceBudz", policy_id: "xyz", floor_change: "10.2", volume: "50000" }],
          }),
      });

      const tool = createTapToolsTrendingTool();
      const result = await tool.execute("test-id", {
        type: "nfts",
      });

      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.nfts).toHaveLength(1);
    });

    it("defaults to tokens when type not specified", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            tokens: [{ name: "TEST", policy_id: "test123", price_change: "5", volume: "1000" }],
          }),
      });

      const tool = createTapToolsTrendingTool();
      await tool.execute("test-id", {});

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("type=tokens"),
        expect.any(Object),
      );
    });
  });

  describe("createTapToolsTools", () => {
    it("returns all 5 TapTools tools", () => {
      const tools = createTapToolsTools();
      expect(tools).toHaveLength(5);

      const names = tools.map((t) => t.name);
      expect(names).toContain("taptools_get_token_price");
      expect(names).toContain("taptools_get_token_holders");
      expect(names).toContain("taptools_get_nft_collection");
      expect(names).toContain("taptools_get_dex_volume");
      expect(names).toContain("taptools_get_trending");
    });

    it("all tools have required properties", () => {
      const tools = createTapToolsTools();
      tools.forEach((tool) => {
        expect(tool.name).toBeDefined();
        expect(tool.description).toBeDefined();
        expect(tool.parameters).toBeDefined();
        expect(tool.execute).toBeInstanceOf(Function);
      });
    });
  });

  describe("error handling", () => {
    it("handles network timeout", async () => {
      global.fetch = vi.fn().mockImplementation(
        () =>
          new Promise((_, reject) => {
            setTimeout(() => reject(new Error("Timeout")), 100);
          }),
      );

      const tool = createTapToolsTokenPriceTool();
      const result = await tool.execute("test-id", {
        policy_id: "abc123",
      });

      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.error).toBeDefined();
    });

    it("handles malformed JSON response", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.reject(new Error("Invalid JSON")),
      });

      const tool = createTapToolsTokenPriceTool();
      const result = await tool.execute("test-id", {
        policy_id: "abc123",
      });

      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.error).toBeDefined();
    });
  });
});
