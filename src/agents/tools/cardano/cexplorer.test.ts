/**
 * Tests for Cexplorer blockchain explorer integration.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  createCexplorerAddressTool,
  createCexplorerTransactionTool,
  createCexplorerPoolTool,
  createCexplorerEpochTool,
  createCexplorerSearchTool,
  createCexplorerTools,
} from "./cexplorer.js";

describe("cexplorer", () => {
  let originalFetch: typeof global.fetch;

  beforeEach(() => {
    originalFetch = global.fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  describe("cexplorer_get_address", () => {
    it("returns balance for valid address", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            address: "addr1qy...",
            balance: "5000000000",
            stake_address: "stake1u...",
            tx_count: 42,
            utxo_count: 3,
          }),
      });

      const tool = createCexplorerAddressTool();
      const result = await tool.execute("test-id", {
        address: "addr1qy...",
      });

      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.balance).toBe("5000000000");
      expect(parsed.tx_count).toBe(42);
    });

    it("returns transaction history", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            address: "addr1qy...",
            balance: "1000000",
            tx_count: 10,
            utxo_count: 1,
            recent_txs: [
              { tx_hash: "abc123", epoch: 450, slot: 12345 },
              { tx_hash: "def456", epoch: 449, slot: 12000 },
            ],
          }),
      });

      const tool = createCexplorerAddressTool();
      const result = await tool.execute("test-id", {
        address: "addr1qy...",
        include_txs: true,
      });

      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.recent_txs).toHaveLength(2);
    });

    it("handles stake address format", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            address: "stake1u...",
            balance: "2000000000",
            rewards_available: "50000000",
            pool_id: "pool1abc...",
          }),
      });

      const tool = createCexplorerAddressTool();
      const result = await tool.execute("test-id", {
        address: "stake1u...",
      });

      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.rewards_available).toBe("50000000");
    });

    it("requires address parameter", async () => {
      const tool = createCexplorerAddressTool();
      const result = await tool.execute("test-id", {});

      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.error).toContain("address");
    });

    it("handles address not found", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        statusText: "Not Found",
        text: () => Promise.resolve("Address not found"),
      });

      const tool = createCexplorerAddressTool();
      const result = await tool.execute("test-id", {
        address: "invalid",
      });

      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.error).toBeDefined();
    });
  });

  describe("cexplorer_get_transaction", () => {
    it("returns inputs and outputs", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            tx_hash: "abc123...",
            block_hash: "block456...",
            block_height: 9500000,
            epoch: 450,
            slot: 12345,
            fee: "200000",
            total_output: "5000000",
            inputs: [{ address: "addr1...", value: "5200000" }],
            outputs: [{ address: "addr2...", value: "5000000" }],
          }),
      });

      const tool = createCexplorerTransactionTool();
      const result = await tool.execute("test-id", {
        tx_hash: "abc123...",
      });

      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.inputs).toHaveLength(1);
      expect(parsed.outputs).toHaveLength(1);
      expect(parsed.fee).toBe("200000");
    });

    it("includes metadata if present", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            tx_hash: "abc123...",
            block_height: 9500000,
            fee: "200000",
            inputs: [],
            outputs: [],
            metadata: {
              "674": { msg: ["Hello", "World"] },
            },
          }),
      });

      const tool = createCexplorerTransactionTool();
      const result = await tool.execute("test-id", {
        tx_hash: "abc123...",
      });

      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.metadata).toBeDefined();
      expect(parsed.metadata["674"]).toBeDefined();
    });

    it("returns confirmations count", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            tx_hash: "abc123...",
            block_height: 9500000,
            confirmations: 150,
            inputs: [],
            outputs: [],
          }),
      });

      const tool = createCexplorerTransactionTool();
      const result = await tool.execute("test-id", {
        tx_hash: "abc123...",
      });

      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.confirmations).toBe(150);
    });

    it("requires tx_hash parameter", async () => {
      const tool = createCexplorerTransactionTool();
      const result = await tool.execute("test-id", {});

      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.error).toContain("tx_hash");
    });
  });

  describe("cexplorer_get_pool", () => {
    it("returns stake pool info", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            pool_id: "pool1abc...",
            ticker: "ALPHA",
            name: "Alpha Pool",
            margin: 0.02,
            fixed_cost: "340000000",
            pledge: "1000000000000",
            live_stake: "50000000000000",
            delegators: 1500,
            blocks_minted: 250,
            saturation: 0.75,
          }),
      });

      const tool = createCexplorerPoolTool();
      const result = await tool.execute("test-id", {
        pool_id: "pool1abc...",
      });

      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.ticker).toBe("ALPHA");
      expect(parsed.delegators).toBe(1500);
      expect(parsed.saturation).toBe(0.75);
    });

    it("includes lifetime rewards", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            pool_id: "pool1xyz...",
            ticker: "BETA",
            name: "Beta Pool",
            margin: 0.01,
            live_stake: "30000000000000",
            lifetime_rewards: "5000000000000",
            ros: 0.045,
          }),
      });

      const tool = createCexplorerPoolTool();
      const result = await tool.execute("test-id", {
        pool_id: "pool1xyz...",
      });

      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.lifetime_rewards).toBe("5000000000000");
      expect(parsed.ros).toBe(0.045);
    });

    it("requires pool_id parameter", async () => {
      const tool = createCexplorerPoolTool();
      const result = await tool.execute("test-id", {});

      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.error).toContain("pool_id");
    });
  });

  describe("cexplorer_get_epoch", () => {
    it("returns epoch statistics", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            epoch: 450,
            start_time: 1700000000,
            end_time: 1700432000,
            tx_count: 500000,
            blk_count: 21600,
            fees: "5000000000000",
            out_sum: "50000000000000000",
          }),
      });

      const tool = createCexplorerEpochTool();
      const result = await tool.execute("test-id", {
        epoch: 450,
      });

      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.epoch).toBe(450);
      expect(parsed.tx_count).toBe(500000);
    });

    it("returns current epoch when not specified", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            epoch: 455,
            start_time: 1702160000,
            tx_count: 350000,
            blk_count: 15000,
          }),
      });

      const tool = createCexplorerEpochTool();
      const result = await tool.execute("test-id", {});

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/epoch/current"),
        expect.any(Object),
      );
    });

    it("includes active stake info", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            epoch: 450,
            active_stake: "23000000000000000",
            active_pools: 3200,
          }),
      });

      const tool = createCexplorerEpochTool();
      const result = await tool.execute("test-id", {
        epoch: 450,
      });

      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.active_stake).toBe("23000000000000000");
    });
  });

  describe("cexplorer_search", () => {
    it("searches for addresses", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            results: [{ type: "address", value: "addr1qy...", label: "Address" }],
            total: 1,
          }),
      });

      const tool = createCexplorerSearchTool();
      const result = await tool.execute("test-id", {
        query: "addr1qy",
      });

      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.results).toHaveLength(1);
      expect(parsed.results[0].type).toBe("address");
    });

    it("searches for transactions", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            results: [{ type: "tx", value: "abc123...", label: "Transaction" }],
            total: 1,
          }),
      });

      const tool = createCexplorerSearchTool();
      const result = await tool.execute("test-id", {
        query: "abc123",
      });

      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.results[0].type).toBe("tx");
    });

    it("searches for pools by ticker", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            results: [{ type: "pool", value: "pool1abc...", label: "ALPHA Pool" }],
            total: 1,
          }),
      });

      const tool = createCexplorerSearchTool();
      const result = await tool.execute("test-id", {
        query: "ALPHA",
        type: "pool",
      });

      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.results[0].type).toBe("pool");
    });

    it("returns empty results for no matches", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            results: [],
            total: 0,
          }),
      });

      const tool = createCexplorerSearchTool();
      const result = await tool.execute("test-id", {
        query: "nonexistent123456",
      });

      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.results).toHaveLength(0);
      expect(parsed.total).toBe(0);
    });

    it("requires query parameter", async () => {
      const tool = createCexplorerSearchTool();
      const result = await tool.execute("test-id", {});

      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.error).toContain("query");
    });
  });

  describe("createCexplorerTools", () => {
    it("returns all 5 Cexplorer tools", () => {
      const tools = createCexplorerTools();
      expect(tools).toHaveLength(5);

      const names = tools.map((t) => t.name);
      expect(names).toContain("cexplorer_get_address");
      expect(names).toContain("cexplorer_get_transaction");
      expect(names).toContain("cexplorer_get_pool");
      expect(names).toContain("cexplorer_get_epoch");
      expect(names).toContain("cexplorer_search");
    });

    it("all tools have required properties", () => {
      const tools = createCexplorerTools();
      tools.forEach((tool) => {
        expect(tool.name).toBeDefined();
        expect(tool.description).toBeDefined();
        expect(tool.parameters).toBeDefined();
        expect(tool.execute).toBeInstanceOf(Function);
      });
    });
  });

  describe("error handling", () => {
    it("handles API errors gracefully", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        statusText: "Internal Server Error",
        text: () => Promise.resolve("Server error"),
      });

      const tool = createCexplorerAddressTool();
      const result = await tool.execute("test-id", {
        address: "addr1...",
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

      const tool = createCexplorerAddressTool();
      const result = await tool.execute("test-id", {
        address: "addr1...",
      });

      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.error).toBeDefined();
    });
  });
});
