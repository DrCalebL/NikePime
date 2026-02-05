import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createHandleClient } from "../client.js";
import { createAvailabilityTool } from "../tools/availability.js";
import { createMetadataTool } from "../tools/metadata.js";
import { createResolveTool } from "../tools/resolve.js";
import { createReverseLookupTool } from "../tools/reverse-lookup.js";

describe("Handle tools", () => {
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

  describe("handle_resolve", () => {
    it("has correct metadata", () => {
      const client = createHandleClient({});
      const tool = createResolveTool(client);

      expect(tool.name).toBe("handle_resolve");
      expect(tool.label).toBe("Handle Resolve");
    });

    it("returns address for valid handle", async () => {
      mockFetch.mockResolvedValue(
        mockJsonResponse({
          handle: "charles",
          address: "addr1qy8ac7qqy...",
          policy_id: "f0ff48...",
        }),
      );

      const client = createHandleClient({});
      const tool = createResolveTool(client);
      const result = await tool.execute("call-1", { handle: "charles" });

      const textResult = result.find((r) => r.type === "text");
      const data = JSON.parse((textResult as any).text);
      expect(data.address).toBe("addr1qy8ac7qqy...");
    });

    it("handles not found", async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 404,
        statusText: "Not Found",
        text: () => Promise.resolve("Handle not found"),
      });

      const client = createHandleClient({});
      const tool = createResolveTool(client);
      const result = await tool.execute("call-1", { handle: "nonexistent" });

      const textResult = result.find((r) => r.type === "text");
      const data = JSON.parse((textResult as any).text);
      expect(data.error).toContain("404");
    });

    it("strips $ prefix", async () => {
      mockFetch.mockResolvedValue(
        mockJsonResponse({ handle: "charles", address: "addr1...", policy_id: "f0ff..." }),
      );

      const client = createHandleClient({});
      const tool = createResolveTool(client);
      await tool.execute("call-1", { handle: "$charles" });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/handles/charles"),
        expect.anything(),
      );
    });

    it("requires handle parameter", async () => {
      const client = createHandleClient({});
      const tool = createResolveTool(client);
      const result = await tool.execute("call-1", {});

      const textResult = result.find((r) => r.type === "text");
      const data = JSON.parse((textResult as any).text);
      expect(data.error).toContain("handle");
    });
  });

  describe("handle_reverse_lookup", () => {
    it("has correct metadata", () => {
      const client = createHandleClient({});
      const tool = createReverseLookupTool(client);

      expect(tool.name).toBe("handle_reverse_lookup");
    });

    it("returns handles array", async () => {
      mockFetch.mockResolvedValue(
        mockJsonResponse({
          handles: [
            { handle: "charles", is_primary: true },
            { handle: "chuck", is_primary: false },
          ],
          primary_handle: "charles",
        }),
      );

      const client = createHandleClient({});
      const tool = createReverseLookupTool(client);
      const result = await tool.execute("call-1", { address: "addr1..." });

      const textResult = result.find((r) => r.type === "text");
      const data = JSON.parse((textResult as any).text);
      expect(data.handles).toHaveLength(2);
    });

    it("identifies primary handle", async () => {
      mockFetch.mockResolvedValue(
        mockJsonResponse({
          handles: [{ handle: "charles", is_primary: true }],
          primary_handle: "charles",
        }),
      );

      const client = createHandleClient({});
      const tool = createReverseLookupTool(client);
      const result = await tool.execute("call-1", { address: "addr1..." });

      const textResult = result.find((r) => r.type === "text");
      const data = JSON.parse((textResult as any).text);
      expect(data.primary_handle).toBe("charles");
    });
  });

  describe("handle_get_metadata", () => {
    it("has correct metadata", () => {
      const client = createHandleClient({});
      const tool = createMetadataTool(client);

      expect(tool.name).toBe("handle_get_metadata");
    });

    it("returns rarity info", async () => {
      mockFetch.mockResolvedValue(
        mockJsonResponse({
          handle: "charles",
          rarity: "common",
          length: 7,
          og: false,
          characters: "letters",
          image: "ipfs://...",
          custom_data: {},
        }),
      );

      const client = createHandleClient({});
      const tool = createMetadataTool(client);
      const result = await tool.execute("call-1", { handle: "charles" });

      const textResult = result.find((r) => r.type === "text");
      const data = JSON.parse((textResult as any).text);
      expect(data.rarity).toBe("common");
      expect(data.length).toBe(7);
    });
  });

  describe("handle_check_availability", () => {
    it("has correct metadata", () => {
      const client = createHandleClient({});
      const tool = createAvailabilityTool(client);

      expect(tool.name).toBe("handle_check_availability");
    });

    it("returns available=true with price", async () => {
      mockFetch.mockResolvedValue(
        mockJsonResponse({
          handle: "newhandle",
          available: true,
          price: "10000000",
          price_tier: "common",
        }),
      );

      const client = createHandleClient({});
      const tool = createAvailabilityTool(client);
      const result = await tool.execute("call-1", { handle: "newhandle" });

      const textResult = result.find((r) => r.type === "text");
      const data = JSON.parse((textResult as any).text);
      expect(data.available).toBe(true);
      expect(data.price_tier).toBe("common");
    });

    it("returns available=false with owner", async () => {
      mockFetch.mockResolvedValue(
        mockJsonResponse({
          handle: "charles",
          available: false,
          owner: "addr1...",
        }),
      );

      const client = createHandleClient({});
      const tool = createAvailabilityTool(client);
      const result = await tool.execute("call-1", { handle: "charles" });

      const textResult = result.find((r) => r.type === "text");
      const data = JSON.parse((textResult as any).text);
      expect(data.available).toBe(false);
      expect(data.owner).toBe("addr1...");
    });
  });
});
