import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createMeteraClient } from "../client.js";

describe("Metera client", () => {
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
    await createMeteraClient({}).getIndices();
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("https://api.metera.io/v1"),
      expect.anything(),
    );
  });

  it("adds x-api-key header", async () => {
    mockFetch.mockResolvedValue(mockJson([]));
    await createMeteraClient({ apiKey: "key123" }).getIndices();
    expect(mockFetch.mock.calls[0][1].headers["x-api-key"]).toBe("key123");
  });

  it("filters by category", async () => {
    mockFetch.mockResolvedValue(mockJson([]));
    await createMeteraClient({}).getIndices("defi");
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("category=defi"),
      expect.anything(),
    );
  });

  it("returns composition data", async () => {
    mockFetch.mockResolvedValue(
      mockJson({ index_id: "idx1", components: [{ token: "ADA", weight: "50" }] }),
    );
    const result = await createMeteraClient({}).getComposition("idx1");
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data.components[0].token).toBe("ADA");
  });

  it("returns performance with timeframe", async () => {
    mockFetch.mockResolvedValue(
      mockJson({ index_id: "idx1", return_percentage: "5.2", ath: "100", atl: "80" }),
    );
    await createMeteraClient({}).getPerformance("idx1", "7d");
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("timeframe=7d"),
      expect.anything(),
    );
  });

  it("handles errors", async () => {
    mockFetch.mockRejectedValue(new Error("Network error"));
    const result = await createMeteraClient({}).getIndices();
    expect(result.ok).toBe(false);
  });
});
