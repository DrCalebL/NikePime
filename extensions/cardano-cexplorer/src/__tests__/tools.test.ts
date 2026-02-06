import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createCexplorerClient } from "../client.js";
import {
  createAddressTool,
  createTransactionTool,
  createPoolTool,
  createEpochTool,
  createSearchTool,
} from "../tools/index.js";

describe("Cexplorer tools", () => {
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

  describe("cexplorer_get_address", () => {
    it("has correct name", () => {
      expect(createAddressTool(createCexplorerClient({})).name).toBe("cexplorer_get_address");
    });

    it("returns balance and stake info", async () => {
      mockFetch.mockResolvedValue(
        mockJson({ address: "addr1...", balance: "5000000000", stake_address: "stake1..." }),
      );
      const result = await createAddressTool(createCexplorerClient({})).execute("c1", {
        address: "addr1...",
      });
      const data = JSON.parse((result[0] as any).text);
      expect(data.balance).toBe("5000000000");
      expect(data.stake_address).toBe("stake1...");
    });

    it("optional tx history", async () => {
      mockFetch.mockResolvedValue(mockJson({ recent_txs: [{ tx_hash: "abc" }] }));
      await createAddressTool(createCexplorerClient({})).execute("c1", {
        address: "addr1...",
        include_txs: true,
      });
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("include_txs=true"),
        expect.anything(),
      );
    });

    it("requires address", async () => {
      const result = await createAddressTool(createCexplorerClient({})).execute("c1", {});
      const data = JSON.parse((result[0] as any).text);
      expect(data.error).toContain("address");
    });
  });

  describe("cexplorer_get_transaction", () => {
    it("has correct name", () => {
      expect(createTransactionTool(createCexplorerClient({})).name).toBe(
        "cexplorer_get_transaction",
      );
    });

    it("returns inputs/outputs", async () => {
      mockFetch.mockResolvedValue(
        mockJson({
          inputs: [{ address: "a1", amount: "100" }],
          outputs: [{ address: "a2", amount: "80" }],
        }),
      );
      const result = await createTransactionTool(createCexplorerClient({})).execute("c1", {
        tx_hash: "abc",
      });
      const data = JSON.parse((result[0] as any).text);
      expect(data.inputs).toHaveLength(1);
      expect(data.outputs).toHaveLength(1);
    });

    it("includes metadata", async () => {
      mockFetch.mockResolvedValue(mockJson({ metadata: { "674": { msg: "Hello" } } }));
      const result = await createTransactionTool(createCexplorerClient({})).execute("c1", {
        tx_hash: "abc",
      });
      const data = JSON.parse((result[0] as any).text);
      expect(data.metadata["674"].msg).toBe("Hello");
    });
  });

  describe("cexplorer_get_pool", () => {
    it("has correct name", () => {
      expect(createPoolTool(createCexplorerClient({})).name).toBe("cexplorer_get_pool");
    });

    it("returns ticker, margin, stake", async () => {
      mockFetch.mockResolvedValue(
        mockJson({ ticker: "TEST", margin: 0.02, live_stake: "50000000000000" }),
      );
      const result = await createPoolTool(createCexplorerClient({})).execute("c1", {
        pool_id: "pool1...",
      });
      const data = JSON.parse((result[0] as any).text);
      expect(data.ticker).toBe("TEST");
      expect(data.margin).toBe(0.02);
    });

    it("includes saturation", async () => {
      mockFetch.mockResolvedValue(mockJson({ saturation: 0.85 }));
      const result = await createPoolTool(createCexplorerClient({})).execute("c1", {
        pool_id: "pool1...",
      });
      const data = JSON.parse((result[0] as any).text);
      expect(data.saturation).toBe(0.85);
    });
  });

  describe("cexplorer_get_epoch", () => {
    it("has correct name", () => {
      expect(createEpochTool(createCexplorerClient({})).name).toBe("cexplorer_get_epoch");
    });

    it("returns current epoch", async () => {
      mockFetch.mockResolvedValue(mockJson({ epoch: 500, block_count: 21600 }));
      const result = await createEpochTool(createCexplorerClient({})).execute("c1", {});
      const data = JSON.parse((result[0] as any).text);
      expect(data.epoch).toBe(500);
    });

    it("supports specific epoch query", async () => {
      mockFetch.mockResolvedValue(mockJson({ epoch: 400 }));
      await createEpochTool(createCexplorerClient({})).execute("c1", { epoch: 400 });
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/epochs/400"),
        expect.anything(),
      );
    });
  });

  describe("cexplorer_search", () => {
    it("has correct name", () => {
      expect(createSearchTool(createCexplorerClient({})).name).toBe("cexplorer_search");
    });

    it("searches addresses", async () => {
      mockFetch.mockResolvedValue(mockJson([{ type: "address", id: "addr1..." }]));
      const result = await createSearchTool(createCexplorerClient({})).execute("c1", {
        query: "addr1",
      });
      const data = JSON.parse((result[0] as any).text);
      expect(data.results[0].type).toBe("address");
    });

    it("searches txs", async () => {
      mockFetch.mockResolvedValue(mockJson([{ type: "tx", id: "abc123" }]));
      const result = await createSearchTool(createCexplorerClient({})).execute("c1", {
        query: "abc",
      });
      const data = JSON.parse((result[0] as any).text);
      expect(data.results[0].type).toBe("tx");
    });

    it("filters by type", async () => {
      mockFetch.mockResolvedValue(mockJson([]));
      await createSearchTool(createCexplorerClient({})).execute("c1", {
        query: "test",
        type: "token",
      });
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("type=token"),
        expect.anything(),
      );
    });

    it("requires query", async () => {
      const result = await createSearchTool(createCexplorerClient({})).execute("c1", {});
      const data = JSON.parse((result[0] as any).text);
      expect(data.error).toContain("query");
    });
  });
});
