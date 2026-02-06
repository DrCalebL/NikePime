/**
 * Tests for Ada Handle identity resolution integration.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  createHandleResolveTool,
  createHandleReverseLookupTool,
  createHandleMetadataTool,
  createHandleCheckAvailabilityTool,
  createAdaHandleTools,
} from "./ada-handle.js";

describe("ada-handle", () => {
  let originalFetch: typeof global.fetch;

  beforeEach(() => {
    originalFetch = global.fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  describe("handle_resolve", () => {
    it("resolves $handle to correct address", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            handle: "charles",
            address:
              "addr1qy8ac7qqy0vtulyl7wntmsxc6wex80gvcyjy33qffrhm7sh927ysx5sftuw0dlft05dz3c7revpf7jx0xnlcjz3g69mq4afdhv",
            policy_id: "f0ff48bbb7bbe9d59a40f1ce90e9e9d0ff5002ec48f232b49ca0fb9a",
          }),
      });

      const tool = createHandleResolveTool();
      const result = await tool.execute("test-id", {
        handle: "charles",
      });

      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.handle).toBe("charles");
      expect(parsed.address).toMatch(/^addr1/);
    });

    it("handles case insensitivity", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            handle: "charles",
            address: "addr1qy...",
            policy_id: "f0ff48bbb7bbe9d59a40f1ce90e9e9d0ff5002ec48f232b49ca0fb9a",
          }),
      });

      const tool = createHandleResolveTool();
      await tool.execute("test-id", {
        handle: "CHARLES",
      });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("charles"),
        expect.any(Object),
      );
    });

    it("returns null for non-existent handle", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        statusText: "Not Found",
        text: () => Promise.resolve("Handle not found"),
      });

      const tool = createHandleResolveTool();
      const result = await tool.execute("test-id", {
        handle: "nonexistent12345",
      });

      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.error).toBeDefined();
    });

    it("strips $ prefix from handle", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            handle: "alice",
            address: "addr1...",
          }),
      });

      const tool = createHandleResolveTool();
      await tool.execute("test-id", {
        handle: "$alice",
      });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.not.stringContaining("%24"),
        expect.any(Object),
      );
    });

    it("requires handle parameter", async () => {
      const tool = createHandleResolveTool();
      const result = await tool.execute("test-id", {});

      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.error).toContain("handle");
    });
  });

  describe("handle_reverse_lookup", () => {
    it("returns primary handle for address", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            address: "addr1qy...",
            handles: [
              { handle: "primary", is_primary: true },
              { handle: "secondary", is_primary: false },
            ],
          }),
      });

      const tool = createHandleReverseLookupTool();
      const result = await tool.execute("test-id", {
        address: "addr1qy...",
      });

      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.primary_handle).toBe("primary");
      expect(parsed.handles).toHaveLength(2);
    });

    it("handles addresses with multiple handles", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            address: "addr1qy...",
            handles: [
              { handle: "handle1", is_primary: true },
              { handle: "handle2", is_primary: false },
              { handle: "handle3", is_primary: false },
            ],
          }),
      });

      const tool = createHandleReverseLookupTool();
      const result = await tool.execute("test-id", {
        address: "addr1qy...",
      });

      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.handles).toHaveLength(3);
    });

    it("returns empty for address with no handles", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            address: "addr1qy...",
            handles: [],
          }),
      });

      const tool = createHandleReverseLookupTool();
      const result = await tool.execute("test-id", {
        address: "addr1qy...",
      });

      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.handles).toHaveLength(0);
      expect(parsed.primary_handle).toBeUndefined();
    });

    it("requires address parameter", async () => {
      const tool = createHandleReverseLookupTool();
      const result = await tool.execute("test-id", {});

      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.error).toContain("address");
    });
  });

  describe("handle_get_metadata", () => {
    it("returns handle NFT metadata", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            handle: "charles",
            policy_id: "f0ff48bbb7bbe9d59a40f1ce90e9e9d0ff5002ec48f232b49ca0fb9a",
            asset_name: "636861726c6573",
            rarity: "legendary",
            length: 7,
            characters: "letters",
            created_slot: 12345678,
            updated_slot: 12345678,
            image: "ipfs://...",
          }),
      });

      const tool = createHandleMetadataTool();
      const result = await tool.execute("test-id", {
        handle: "charles",
      });

      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.handle).toBe("charles");
      expect(parsed.rarity).toBe("legendary");
      expect(parsed.length).toBe(7);
    });

    it("includes custom data if present", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            handle: "test",
            rarity: "common",
            custom_data: {
              profile_pic: "ipfs://...",
              socials: { twitter: "@test" },
            },
          }),
      });

      const tool = createHandleMetadataTool();
      const result = await tool.execute("test-id", {
        handle: "test",
      });

      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.custom_data).toBeDefined();
      expect(parsed.custom_data.socials).toBeDefined();
    });

    it("requires handle parameter", async () => {
      const tool = createHandleMetadataTool();
      const result = await tool.execute("test-id", {});

      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.error).toContain("handle");
    });
  });

  describe("handle_check_availability", () => {
    it("returns available for unregistered handle", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            handle: "newhandle123",
            available: true,
            price: "10000000",
          }),
      });

      const tool = createHandleCheckAvailabilityTool();
      const result = await tool.execute("test-id", {
        handle: "newhandle123",
      });

      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.available).toBe(true);
      expect(parsed.price).toBe("10000000");
    });

    it("returns unavailable for registered handle", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            handle: "charles",
            available: false,
            owner: "addr1qy...",
          }),
      });

      const tool = createHandleCheckAvailabilityTool();
      const result = await tool.execute("test-id", {
        handle: "charles",
      });

      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.available).toBe(false);
      expect(parsed.owner).toBeDefined();
    });

    it("returns price tiers for available handles", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            handle: "ab",
            available: true,
            price: "500000000",
            price_tier: "ultra_rare",
          }),
      });

      const tool = createHandleCheckAvailabilityTool();
      const result = await tool.execute("test-id", {
        handle: "ab",
      });

      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.price_tier).toBe("ultra_rare");
    });

    it("requires handle parameter", async () => {
      const tool = createHandleCheckAvailabilityTool();
      const result = await tool.execute("test-id", {});

      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.error).toContain("handle");
    });
  });

  describe("createAdaHandleTools", () => {
    it("returns all 4 Ada Handle tools", () => {
      const tools = createAdaHandleTools();
      expect(tools).toHaveLength(4);

      const names = tools.map((t) => t.name);
      expect(names).toContain("handle_resolve");
      expect(names).toContain("handle_reverse_lookup");
      expect(names).toContain("handle_get_metadata");
      expect(names).toContain("handle_check_availability");
    });

    it("all tools have required properties", () => {
      const tools = createAdaHandleTools();
      tools.forEach((tool) => {
        expect(tool.name).toBeDefined();
        expect(tool.description).toBeDefined();
        expect(tool.parameters).toBeDefined();
        expect(tool.execute).toBeInstanceOf(Function);
      });
    });
  });
});
