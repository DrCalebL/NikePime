import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createNabuClient } from "../client.js";

describe("Nabu client", () => {
  const mockFetch = vi.fn();
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = mockFetch;
    mockFetch.mockReset();
  });
  afterEach(() => {
    global.fetch = originalFetch;
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
    const client = createNabuClient({});
    await client.getNodes();
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("https://api.b7s.services/v1"),
      expect.anything(),
    );
  });

  it("adds x-api-key header when configured", async () => {
    mockFetch.mockResolvedValue(mockJson([]));
    const client = createNabuClient({ apiKey: "secret" });
    await client.getNodes();
    expect(mockFetch.mock.calls[0][1].headers["x-api-key"]).toBe("secret");
  });

  it("filters by region", async () => {
    mockFetch.mockResolvedValue(mockJson([]));
    const client = createNabuClient({});
    await client.getNodes("europe");
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("region=europe"),
      expect.anything(),
    );
  });

  it("filters by country", async () => {
    mockFetch.mockResolvedValue(mockJson([]));
    const client = createNabuClient({});
    await client.getNodes(undefined, "DE");
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("country=DE"),
      expect.anything(),
    );
  });

  it("returns node stats", async () => {
    mockFetch.mockResolvedValue(
      mockJson({ node_id: "n1", uptime_percentage: 99.5, bandwidth_mbps: 100 }),
    );
    const client = createNabuClient({});
    const result = await client.getNodeStats("n1");
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data.uptime_percentage).toBe(99.5);
  });

  it("returns service status", async () => {
    mockFetch.mockResolvedValue(
      mockJson({ status: "healthy", total_nodes: 50, active_nodes: 48, issues: [] }),
    );
    const client = createNabuClient({});
    const result = await client.checkStatus();
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data.status).toBe("healthy");
  });

  it("handles network errors", async () => {
    mockFetch.mockRejectedValue(new Error("Network error"));
    const client = createNabuClient({});
    const result = await client.getNodes();
    expect(result.ok).toBe(false);
  });
});
