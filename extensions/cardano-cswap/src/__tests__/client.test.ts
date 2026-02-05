import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createCswapClient } from "../client.js";

describe("CSWAP client", () => {
  const mockFetch = vi.fn();
  const orig = global.fetch;
  beforeEach(() => {
    global.fetch = mockFetch;
    mockFetch.mockReset();
  });
  afterEach(() => {
    global.fetch = orig;
  });

  function mockJson(data: unknown, status = 200) {
    return {
      ok: status >= 200 && status < 300,
      status,
      json: () => Promise.resolve(data),
      text: () => Promise.resolve(""),
    };
  }

  it("uses correct base URL", async () => {
    mockFetch.mockResolvedValue(mockJson([]));
    await createCswapClient({}).getPools();
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("https://api.cswap.fi/v1"),
      expect.anything(),
    );
  });

  it("adds x-api-key header", async () => {
    mockFetch.mockResolvedValue(mockJson([]));
    await createCswapClient({ apiKey: "secret" }).getPools();
    expect(mockFetch.mock.calls[0][1].headers["x-api-key"]).toBe("secret");
  });

  it("filters pools by token", async () => {
    mockFetch.mockResolvedValue(mockJson([]));
    await createCswapClient({}).getPools("abc123");
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("token=abc123"),
      expect.anything(),
    );
  });

  it("gets token price", async () => {
    mockFetch.mockResolvedValue(
      mockJson({ token: "snek", price_ada: "0.0025", price_usd: "0.001" }),
    );
    const result = await createCswapClient({}).getPrice("snek");
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data.price_ada).toBe("0.0025");
  });

  it("estimates swap", async () => {
    mockFetch.mockResolvedValue(
      mockJson({
        output_amount: "4000000000",
        price_impact: "0.15",
        fee: "3000000",
        route: ["ada", "snek"],
      }),
    );
    const result = await createCswapClient({}).estimateSwap("ada", "snek", "1000000000");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.output_amount).toBe("4000000000");
      expect(result.data.route).toContain("snek");
    }
  });

  it("gets liquidity info", async () => {
    mockFetch.mockResolvedValue(mockJson({ pool_id: "p1", tvl: "1000000" }));
    const result = await createCswapClient({}).getLiquidity("p1");
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data.tvl).toBe("1000000");
  });

  it("handles errors", async () => {
    mockFetch.mockRejectedValue(new Error("Network error"));
    const result = await createCswapClient({}).getPools();
    expect(result.ok).toBe(false);
  });
});
