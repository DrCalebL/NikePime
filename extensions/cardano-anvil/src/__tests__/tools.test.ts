import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createAnvilClient } from "../client.js";
import {
  createMintTokenTool,
  createBurnTokenTool,
  createCollectionTool,
  createGetMintsTool,
} from "../tools/index.js";

describe("Anvil tools", () => {
  const mockFetch = vi.fn();
  const orig = global.fetch;
  beforeEach(() => {
    global.fetch = mockFetch;
    mockFetch.mockReset();
  });
  afterEach(() => {
    global.fetch = orig;
  });

  function mockJson(data: unknown) {
    return {
      ok: true,
      status: 200,
      json: () => Promise.resolve(data),
      text: () => Promise.resolve(""),
    };
  }

  describe("anvil_mint_token", () => {
    it("has correct name", () => {
      expect(createMintTokenTool(createAnvilClient({})).name).toBe("anvil_mint_token");
    });

    it("creates mint request", async () => {
      mockFetch.mockResolvedValue(mockJson({ mint_id: "m1", policy_id: "abc", status: "pending" }));
      const result = await createMintTokenTool(createAnvilClient({})).execute("c1", {
        name: "Test",
        quantity: 100,
        recipient_address: "addr1...",
      });
      const data = JSON.parse((result[0] as any).text);
      expect(data.mint_id).toBe("m1");
      expect(data.status).toBe("pending");
    });

    it("includes metadata", async () => {
      mockFetch.mockResolvedValue(mockJson({ mint_id: "m1" }));
      await createMintTokenTool(createAnvilClient({})).execute("c1", {
        name: "Test",
        quantity: 1,
        recipient_address: "addr1...",
        metadata: { foo: "bar" },
      });
      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.metadata.foo).toBe("bar");
    });

    it("validates required params", async () => {
      const tool = createMintTokenTool(createAnvilClient({}));
      let result = await tool.execute("c1", {});
      expect(JSON.parse((result[0] as any).text).error).toContain("name");

      result = await tool.execute("c1", { name: "Test" });
      expect(JSON.parse((result[0] as any).text).error).toContain("quantity");

      result = await tool.execute("c1", { name: "Test", quantity: 1 });
      expect(JSON.parse((result[0] as any).text).error).toContain("recipient_address");
    });
  });

  describe("anvil_burn_token", () => {
    it("has correct name", () => {
      expect(createBurnTokenTool(createAnvilClient({})).name).toBe("anvil_burn_token");
    });

    it("creates burn request", async () => {
      mockFetch.mockResolvedValue(mockJson({ burn_id: "b1", status: "pending" }));
      const result = await createBurnTokenTool(createAnvilClient({})).execute("c1", {
        policy_id: "abc",
        asset_name: "def",
        quantity: 10,
      });
      const data = JSON.parse((result[0] as any).text);
      expect(data.burn_id).toBe("b1");
    });
  });

  describe("anvil_create_collection", () => {
    it("has correct name", () => {
      expect(createCollectionTool(createAnvilClient({})).name).toBe("anvil_create_collection");
    });

    it("includes royalties", async () => {
      mockFetch.mockResolvedValue(mockJson({ collection_id: "c1", policy_id: "abc" }));
      await createCollectionTool(createAnvilClient({})).execute("c1", {
        name: "Test",
        description: "Desc",
        royalty_percentage: 5,
        royalty_address: "addr1...",
      });
      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.royalty_percentage).toBe(5);
    });

    it("validates royalty percentage", async () => {
      const tool = createCollectionTool(createAnvilClient({}));
      const result = await tool.execute("c1", {
        name: "Test",
        description: "Desc",
        royalty_percentage: 150,
        royalty_address: "addr1...",
      });
      const data = JSON.parse((result[0] as any).text);
      expect(data.error).toContain("0-100");
    });
  });

  describe("anvil_get_mints", () => {
    it("has correct name", () => {
      expect(createGetMintsTool(createAnvilClient({})).name).toBe("anvil_get_mints");
    });

    it("returns mint history", async () => {
      mockFetch.mockResolvedValue(
        mockJson([{ mint_id: "m1", policy_id: "abc", status: "completed" }]),
      );
      const result = await createGetMintsTool(createAnvilClient({})).execute("c1", {});
      const data = JSON.parse((result[0] as any).text);
      expect(data.mints).toHaveLength(1);
    });

    it("filters by policy_id", async () => {
      mockFetch.mockResolvedValue(mockJson([]));
      await createGetMintsTool(createAnvilClient({})).execute("c1", { policy_id: "abc123" });
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("policy_id=abc123"),
        expect.anything(),
      );
    });

    it("filters by status", async () => {
      mockFetch.mockResolvedValue(mockJson([]));
      await createGetMintsTool(createAnvilClient({})).execute("c1", { status: "failed" });
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("status=failed"),
        expect.anything(),
      );
    });
  });
});
