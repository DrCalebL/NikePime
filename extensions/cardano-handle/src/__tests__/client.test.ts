import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createHandleClient } from "../client.js";

describe("Handle client", () => {
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
    it("uses correct base URL", async () => {
      mockFetch.mockResolvedValue(mockJsonResponse({}));

      const client = createHandleClient({});
      await client.resolve("charles");

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("https://api.handle.me"),
        expect.anything(),
      );
    });

    it("adds Bearer token when apiKey provided", async () => {
      mockFetch.mockResolvedValue(mockJsonResponse({}));

      const client = createHandleClient({ apiKey: "my-token" });
      await client.resolve("charles");

      const headers = mockFetch.mock.calls[0][1].headers;
      expect(headers["Authorization"]).toBe("Bearer my-token");
    });

    it("omits Authorization header when no apiKey", async () => {
      mockFetch.mockResolvedValue(mockJsonResponse({}));

      const client = createHandleClient({});
      await client.resolve("charles");

      const headers = mockFetch.mock.calls[0][1].headers;
      expect(headers["Authorization"]).toBeUndefined();
    });
  });

  describe("handle normalization", () => {
    it("removes $ prefix from handle", async () => {
      mockFetch.mockResolvedValue(mockJsonResponse({}));

      const client = createHandleClient({});
      await client.resolve("$charles");

      expect(mockFetch).toHaveBeenCalledWith(
        "https://api.handle.me/handles/charles",
        expect.anything(),
      );
    });

    it("lowercases handle", async () => {
      mockFetch.mockResolvedValue(mockJsonResponse({}));

      const client = createHandleClient({});
      await client.resolve("CHARLES");

      expect(mockFetch).toHaveBeenCalledWith(
        "https://api.handle.me/handles/charles",
        expect.anything(),
      );
    });
  });

  describe("resolve", () => {
    it("returns resolved handle data", async () => {
      mockFetch.mockResolvedValue(
        mockJsonResponse({
          handle: "charles",
          address: "addr1qy8ac7qqy...",
          policy_id: "f0ff48...",
        }),
      );

      const client = createHandleClient({});
      const result = await client.resolve("charles");

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data.handle).toBe("charles");
        expect(result.data.address).toBe("addr1qy8ac7qqy...");
      }
    });

    it("returns error on 404", async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 404,
        statusText: "Not Found",
        text: () => Promise.resolve("Handle not found"),
      });

      const client = createHandleClient({});
      const result = await client.resolve("nonexistent");

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toContain("404");
      }
    });
  });

  describe("reverseLookup", () => {
    it("returns handles for address", async () => {
      mockFetch.mockResolvedValue(
        mockJsonResponse({
          handles: [{ handle: "charles", is_primary: true }],
          primary_handle: "charles",
        }),
      );

      const client = createHandleClient({});
      const result = await client.reverseLookup("addr1...");

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data.handles).toHaveLength(1);
        expect(result.data.primary_handle).toBe("charles");
      }
    });
  });

  describe("error handling", () => {
    it("handles network errors", async () => {
      mockFetch.mockRejectedValue(new Error("Network error"));

      const client = createHandleClient({});
      const result = await client.resolve("charles");

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBe("Network error");
      }
    });
  });
});
