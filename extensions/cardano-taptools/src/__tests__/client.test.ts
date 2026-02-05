import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createTapToolsClient } from "../client.js";

describe("TapTools client", () => {
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

  describe("configuration", () => {
    it("uses default base URL", async () => {
      mockFetch.mockResolvedValue(mockJsonResponse({}));

      const client = createTapToolsClient({});
      await client.getTokenPrice("policy123");

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("https://openapi.taptools.io/api/v1"),
        expect.anything(),
      );
    });

    it("adds x-api-key header when apiKey provided", async () => {
      mockFetch.mockResolvedValue(mockJsonResponse({}));

      const client = createTapToolsClient({ apiKey: "my-secret-key" });
      await client.getTokenPrice("policy123");

      const headers = mockFetch.mock.calls[0][1].headers;
      expect(headers["x-api-key"]).toBe("my-secret-key");
    });

    it("omits x-api-key header when no apiKey", async () => {
      mockFetch.mockResolvedValue(mockJsonResponse({}));

      const client = createTapToolsClient({});
      await client.getTokenPrice("policy123");

      const headers = mockFetch.mock.calls[0][1].headers;
      expect(headers["x-api-key"]).toBeUndefined();
    });

    it("uses custom timeout", async () => {
      mockFetch.mockResolvedValue(mockJsonResponse({}));

      const client = createTapToolsClient({ timeout: 5000 });
      await client.getTokenPrice("policy123");

      // Verify request was made with abort signal
      expect(mockFetch.mock.calls[0][1].signal).toBeDefined();
    });
  });

  describe("getTokenPrice", () => {
    it("builds correct URL for policy ID only", async () => {
      mockFetch.mockResolvedValue(
        mockJsonResponse({
          price: "0.0025",
          price_24h_change: "5.2",
          volume_24h: "125000",
          market_cap: "2500000",
        }),
      );

      const client = createTapToolsClient({});
      await client.getTokenPrice("abc123");

      expect(mockFetch).toHaveBeenCalledWith(
        "https://openapi.taptools.io/api/v1/token/price?unit=abc123",
        expect.anything(),
      );
    });

    it("builds correct URL with asset name", async () => {
      mockFetch.mockResolvedValue(mockJsonResponse({}));

      const client = createTapToolsClient({});
      await client.getTokenPrice("abc123", "534e454b");

      expect(mockFetch).toHaveBeenCalledWith(
        "https://openapi.taptools.io/api/v1/token/price?unit=abc123.534e454b",
        expect.anything(),
      );
    });

    it("returns price data on success", async () => {
      mockFetch.mockResolvedValue(
        mockJsonResponse({
          price: "0.0025",
          price_24h_change: "5.2",
          volume_24h: "125000",
          market_cap: "2500000",
        }),
      );

      const client = createTapToolsClient({});
      const result = await client.getTokenPrice("abc123");

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data.price).toBe("0.0025");
        expect(result.data.price_24h_change).toBe("5.2");
      }
    });

    it("returns error on API failure", async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 404,
        statusText: "Not Found",
        text: () => Promise.resolve("Token not found"),
      });

      const client = createTapToolsClient({});
      const result = await client.getTokenPrice("nonexistent");

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toContain("404");
      }
    });
  });

  describe("getTokenHolders", () => {
    it("builds correct URL with limit", async () => {
      mockFetch.mockResolvedValue(
        mockJsonResponse({
          total_holders: 50000,
          top_holders: [],
        }),
      );

      const client = createTapToolsClient({});
      await client.getTokenHolders("abc123", 20);

      expect(mockFetch).toHaveBeenCalledWith(
        "https://openapi.taptools.io/api/v1/token/holders?policy_id=abc123&limit=20",
        expect.anything(),
      );
    });

    it("uses default limit of 10", async () => {
      mockFetch.mockResolvedValue(
        mockJsonResponse({
          total_holders: 50000,
          top_holders: [],
        }),
      );

      const client = createTapToolsClient({});
      await client.getTokenHolders("abc123");

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("limit=10"),
        expect.anything(),
      );
    });
  });

  describe("getNftCollection", () => {
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
      const result = await client.getNftCollection("abc123");

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data.name).toBe("SpaceBudz");
        expect(result.data.floor_price).toBe("500");
      }
    });
  });

  describe("getDexVolume", () => {
    it("uses default timeframe of 24h", async () => {
      mockFetch.mockResolvedValue(
        mockJsonResponse({
          total_volume_24h: "1000000",
          protocols: [],
        }),
      );

      const client = createTapToolsClient({});
      await client.getDexVolume();

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("timeframe=24h"),
        expect.anything(),
      );
    });

    it("supports custom timeframe", async () => {
      mockFetch.mockResolvedValue(
        mockJsonResponse({
          total_volume_24h: "1000000",
          protocols: [],
        }),
      );

      const client = createTapToolsClient({});
      await client.getDexVolume("7d");

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("timeframe=7d"),
        expect.anything(),
      );
    });
  });

  describe("getTrending", () => {
    it("fetches trending tokens by default", async () => {
      mockFetch.mockResolvedValue(
        mockJsonResponse({
          tokens: [{ name: "SNEK", policy_id: "abc", price_change: "10", volume: "1000" }],
        }),
      );

      const client = createTapToolsClient({});
      await client.getTrending();

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/token/trending"),
        expect.anything(),
      );
    });

    it("fetches trending NFTs when type=nfts", async () => {
      mockFetch.mockResolvedValue(
        mockJsonResponse({
          nfts: [{ name: "SpaceBudz", policy_id: "abc", floor_change: "10", volume: "1000" }],
        }),
      );

      const client = createTapToolsClient({});
      await client.getTrending("nfts");

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/nft/trending"),
        expect.anything(),
      );
    });
  });
});
