import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createCexplorerClient } from "../client.js";

describe("Cexplorer client", () => {
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
    mockFetch.mockResolvedValue(mockJson({}));
    await createCexplorerClient({}).getAddress("addr1...");
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("https://api.cexplorer.io/v1"),
      expect.anything(),
    );
  });

  it("adds Bearer token when configured", async () => {
    mockFetch.mockResolvedValue(mockJson({}));
    await createCexplorerClient({ apiKey: "token123" }).getAddress("addr1...");
    expect(mockFetch.mock.calls[0][1].headers["Authorization"]).toBe("Bearer token123");
  });

  it("includes txs when requested", async () => {
    mockFetch.mockResolvedValue(mockJson({ balance: "5000000" }));
    await createCexplorerClient({}).getAddress("addr1...", true);
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("include_txs=true"),
      expect.anything(),
    );
  });

  it("gets transaction details", async () => {
    mockFetch.mockResolvedValue(
      mockJson({ tx_hash: "abc123", fee: "200000", inputs: [], outputs: [] }),
    );
    const result = await createCexplorerClient({}).getTransaction("abc123");
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data.fee).toBe("200000");
  });

  it("gets pool info", async () => {
    mockFetch.mockResolvedValue(
      mockJson({ pool_id: "pool1...", ticker: "TEST", saturation: 0.75 }),
    );
    const result = await createCexplorerClient({}).getPool("pool1...");
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data.saturation).toBe(0.75);
  });

  it("gets current epoch by default", async () => {
    mockFetch.mockResolvedValue(mockJson({ epoch: 500 }));
    await createCexplorerClient({}).getEpoch();
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("/epochs/current"),
      expect.anything(),
    );
  });

  it("gets specific epoch", async () => {
    mockFetch.mockResolvedValue(mockJson({ epoch: 400 }));
    await createCexplorerClient({}).getEpoch(400);
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("/epochs/400"),
      expect.anything(),
    );
  });

  it("searches with query", async () => {
    mockFetch.mockResolvedValue(mockJson([{ type: "address", id: "addr1..." }]));
    await createCexplorerClient({}).search("addr1");
    expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining("q=addr1"), expect.anything());
  });

  it("filters search by type", async () => {
    mockFetch.mockResolvedValue(mockJson([]));
    await createCexplorerClient({}).search("test", "pool");
    expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining("type=pool"), expect.anything());
  });

  it("handles errors", async () => {
    mockFetch.mockRejectedValue(new Error("Network error"));
    const result = await createCexplorerClient({}).getAddress("addr1...");
    expect(result.ok).toBe(false);
  });
});
