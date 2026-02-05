import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createAnvilClient } from "../client.js";

describe("Anvil client", () => {
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
    await createAnvilClient({}).getMints();
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("https://api.ada-anvil.io/v1"),
      expect.anything(),
    );
  });

  it("adds x-api-key header", async () => {
    mockFetch.mockResolvedValue(mockJson([]));
    await createAnvilClient({ apiKey: "secret" }).getMints();
    expect(mockFetch.mock.calls[0][1].headers["x-api-key"]).toBe("secret");
  });

  describe("POST requests", () => {
    it("sends POST for mintToken", async () => {
      mockFetch.mockResolvedValue(mockJson({ mint_id: "m1", status: "pending" }));
      await createAnvilClient({}).mintToken({
        name: "Test",
        quantity: 100,
        recipient_address: "addr1...",
      });
      expect(mockFetch.mock.calls[0][1].method).toBe("POST");
    });

    it("includes body in POST", async () => {
      mockFetch.mockResolvedValue(mockJson({ mint_id: "m1" }));
      await createAnvilClient({}).mintToken({
        name: "Test",
        quantity: 100,
        recipient_address: "addr1...",
      });
      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.name).toBe("Test");
      expect(body.quantity).toBe(100);
    });

    it("sets Content-Type for POST", async () => {
      mockFetch.mockResolvedValue(mockJson({ mint_id: "m1" }));
      await createAnvilClient({}).mintToken({
        name: "Test",
        quantity: 1,
        recipient_address: "addr1...",
      });
      expect(mockFetch.mock.calls[0][1].headers["Content-Type"]).toBe("application/json");
    });

    it("sends POST for burnToken", async () => {
      mockFetch.mockResolvedValue(mockJson({ burn_id: "b1" }));
      await createAnvilClient({}).burnToken({ policy_id: "abc", asset_name: "def", quantity: 10 });
      expect(mockFetch.mock.calls[0][1].method).toBe("POST");
    });

    it("sends POST for createCollection", async () => {
      mockFetch.mockResolvedValue(mockJson({ collection_id: "c1" }));
      await createAnvilClient({}).createCollection({
        name: "Test",
        description: "Desc",
        royalty_percentage: 5,
        royalty_address: "addr1...",
      });
      expect(mockFetch.mock.calls[0][1].method).toBe("POST");
    });
  });

  describe("getMints", () => {
    it("sends GET request", async () => {
      mockFetch.mockResolvedValue(mockJson([]));
      await createAnvilClient({}).getMints();
      expect(mockFetch.mock.calls[0][1].method).toBe("GET");
    });

    it("filters by policy_id", async () => {
      mockFetch.mockResolvedValue(mockJson([]));
      await createAnvilClient({}).getMints("abc123");
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("policy_id=abc123"),
        expect.anything(),
      );
    });

    it("filters by status", async () => {
      mockFetch.mockResolvedValue(mockJson([]));
      await createAnvilClient({}).getMints(undefined, "completed");
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("status=completed"),
        expect.anything(),
      );
    });
  });

  it("handles errors", async () => {
    mockFetch.mockRejectedValue(new Error("Network error"));
    const result = await createAnvilClient({}).getMints();
    expect(result.ok).toBe(false);
  });
});
