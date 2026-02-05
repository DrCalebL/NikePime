import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createGovCircleClient } from "../client.js";

describe("GovCircle client", () => {
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
    await createGovCircleClient({}).getCircles();
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("https://api.govcircle.io/v1"),
      expect.anything(),
    );
  });

  it("adds Bearer token when configured", async () => {
    mockFetch.mockResolvedValue(mockJson([]));
    await createGovCircleClient({ apiKey: "token123" }).getCircles();
    expect(mockFetch.mock.calls[0][1].headers["Authorization"]).toBe("Bearer token123");
  });

  it("filters circles by status", async () => {
    mockFetch.mockResolvedValue(mockJson([]));
    await createGovCircleClient({}).getCircles("active");
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("status=active"),
      expect.anything(),
    );
  });

  it("gets proposals for circle", async () => {
    mockFetch.mockResolvedValue(mockJson([{ id: "p1", title: "Proposal 1" }]));
    const result = await createGovCircleClient({}).getProposals("c1");
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data[0].id).toBe("p1");
  });

  it("filters proposals by status", async () => {
    mockFetch.mockResolvedValue(mockJson([]));
    await createGovCircleClient({}).getProposals("c1", "passed");
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("status=passed"),
      expect.anything(),
    );
  });

  it("gets votes for proposal", async () => {
    mockFetch.mockResolvedValue(
      mockJson({ proposal_id: "p1", votes: [{ voter_address: "addr1", vote: "for" }] }),
    );
    const result = await createGovCircleClient({}).getVotes("p1");
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data.votes[0].vote).toBe("for");
  });

  it("handles errors", async () => {
    mockFetch.mockRejectedValue(new Error("Network error"));
    const result = await createGovCircleClient({}).getCircles();
    expect(result.ok).toBe(false);
  });
});
