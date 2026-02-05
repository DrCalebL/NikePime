/**
 * Tests for ADA Anvil minting API integration.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  createAnvilMintTokenTool,
  createAnvilBurnTokenTool,
  createAnvilCreateCollectionTool,
  createAnvilGetMintsTool,
  createAdaAnvilTools,
} from "./ada-anvil.js";

describe("ada-anvil", () => {
  let originalFetch: typeof global.fetch;

  beforeEach(() => {
    originalFetch = global.fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  describe("anvil_mint_token", () => {
    it("creates mint request with token metadata", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            mint_id: "mint123",
            policy_id: "abc123def456",
            asset_name: "TestToken",
            status: "pending",
            tx_hash: null,
          }),
      });

      const tool = createAnvilMintTokenTool();
      const result = await tool.execute("test-id", {
        name: "TestToken",
        quantity: 1000,
        metadata: { description: "A test token" },
      });

      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.mint_id).toBe("mint123");
      expect(parsed.status).toBe("pending");
    });

    it("supports custom policy ID", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            mint_id: "mint456",
            policy_id: "custom_policy_123",
            asset_name: "CustomToken",
            status: "pending",
          }),
      });

      const tool = createAnvilMintTokenTool();
      await tool.execute("test-id", {
        name: "CustomToken",
        quantity: 1,
        policy_id: "custom_policy_123",
      });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: expect.stringContaining("custom_policy_123"),
        }),
      );
    });

    it("requires name and quantity", async () => {
      const tool = createAnvilMintTokenTool();
      const result = await tool.execute("test-id", {
        name: "OnlyName",
      });

      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.error).toBeDefined();
    });

    it("handles API errors", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        statusText: "Bad Request",
        text: () => Promise.resolve("Invalid metadata format"),
      });

      const tool = createAnvilMintTokenTool();
      const result = await tool.execute("test-id", {
        name: "BadToken",
        quantity: 1,
      });

      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.error).toBeDefined();
    });
  });

  describe("anvil_burn_token", () => {
    it("creates burn request", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            burn_id: "burn123",
            policy_id: "abc123",
            asset_name: "BurnMe",
            quantity: 500,
            status: "pending",
          }),
      });

      const tool = createAnvilBurnTokenTool();
      const result = await tool.execute("test-id", {
        policy_id: "abc123",
        asset_name: "BurnMe",
        quantity: 500,
      });

      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.burn_id).toBe("burn123");
      expect(parsed.quantity).toBe(500);
    });

    it("requires all parameters", async () => {
      const tool = createAnvilBurnTokenTool();
      const result = await tool.execute("test-id", {
        policy_id: "abc123",
      });

      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.error).toBeDefined();
    });

    it("handles insufficient balance", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        statusText: "Bad Request",
        text: () => Promise.resolve("Insufficient token balance"),
      });

      const tool = createAnvilBurnTokenTool();
      const result = await tool.execute("test-id", {
        policy_id: "abc123",
        asset_name: "Token",
        quantity: 999999,
      });

      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.error).toBeDefined();
    });
  });

  describe("anvil_create_collection", () => {
    it("creates NFT collection", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            collection_id: "col123",
            policy_id: "newpolicy456",
            name: "My Collection",
            max_supply: 10000,
            status: "created",
          }),
      });

      const tool = createAnvilCreateCollectionTool();
      const result = await tool.execute("test-id", {
        name: "My Collection",
        max_supply: 10000,
      });

      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.collection_id).toBe("col123");
      expect(parsed.policy_id).toBe("newpolicy456");
    });

    it("supports royalty configuration", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            collection_id: "col456",
            policy_id: "policy789",
            name: "Royalty Collection",
            royalty_percentage: 5,
            royalty_address: "addr1...",
          }),
      });

      const tool = createAnvilCreateCollectionTool();
      const result = await tool.execute("test-id", {
        name: "Royalty Collection",
        royalty_percentage: 5,
        royalty_address: "addr1...",
      });

      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.royalty_percentage).toBe(5);
    });

    it("requires name parameter", async () => {
      const tool = createAnvilCreateCollectionTool();
      const result = await tool.execute("test-id", {});

      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.error).toContain("name");
    });
  });

  describe("anvil_get_mints", () => {
    it("returns minting history", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            mints: [
              {
                mint_id: "mint1",
                policy_id: "pol1",
                asset_name: "Token1",
                quantity: 100,
                status: "completed",
                tx_hash: "txabc...",
              },
              {
                mint_id: "mint2",
                policy_id: "pol2",
                asset_name: "Token2",
                quantity: 50,
                status: "pending",
                tx_hash: null,
              },
            ],
            total: 2,
          }),
      });

      const tool = createAnvilGetMintsTool();
      const result = await tool.execute("test-id", {});

      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.mints).toHaveLength(2);
      expect(parsed.total).toBe(2);
    });

    it("filters by policy ID", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            mints: [{ mint_id: "mint1", policy_id: "specific_policy" }],
            total: 1,
          }),
      });

      const tool = createAnvilGetMintsTool();
      await tool.execute("test-id", {
        policy_id: "specific_policy",
      });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("policy_id=specific_policy"),
        expect.any(Object),
      );
    });

    it("filters by status", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            mints: [],
            total: 0,
          }),
      });

      const tool = createAnvilGetMintsTool();
      await tool.execute("test-id", {
        status: "completed",
      });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("status=completed"),
        expect.any(Object),
      );
    });

    it("supports pagination", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            mints: [],
            total: 100,
          }),
      });

      const tool = createAnvilGetMintsTool();
      await tool.execute("test-id", {
        limit: 10,
        offset: 20,
      });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("limit=10"),
        expect.any(Object),
      );
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("offset=20"),
        expect.any(Object),
      );
    });
  });

  describe("createAdaAnvilTools", () => {
    it("returns all 4 ADA Anvil tools", () => {
      const tools = createAdaAnvilTools();
      expect(tools).toHaveLength(4);

      const names = tools.map((t) => t.name);
      expect(names).toContain("anvil_mint_token");
      expect(names).toContain("anvil_burn_token");
      expect(names).toContain("anvil_create_collection");
      expect(names).toContain("anvil_get_mints");
    });

    it("all tools have required properties", () => {
      const tools = createAdaAnvilTools();
      tools.forEach((tool) => {
        expect(tool.name).toBeDefined();
        expect(tool.description).toBeDefined();
        expect(tool.parameters).toBeDefined();
        expect(tool.execute).toBeInstanceOf(Function);
      });
    });
  });

  describe("error handling", () => {
    it("handles authentication errors", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        statusText: "Unauthorized",
        text: () => Promise.resolve("Invalid API key"),
      });

      const tool = createAnvilMintTokenTool();
      const result = await tool.execute("test-id", {
        name: "Test",
        quantity: 1,
      });

      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.error).toBeDefined();
    });

    it("handles network timeout", async () => {
      global.fetch = vi.fn().mockImplementation(
        () =>
          new Promise((_, reject) => {
            setTimeout(() => reject(new Error("Timeout")), 100);
          }),
      );

      const tool = createAnvilMintTokenTool();
      const result = await tool.execute("test-id", {
        name: "Test",
        quantity: 1,
      });

      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.error).toBeDefined();
    });
  });
});
