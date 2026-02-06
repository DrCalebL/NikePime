import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  createCardanoApiClient,
  fetchAddressUtxos,
  fetchProtocolParameters,
  submitTransaction,
  fetchAddressInfo,
  fetchTxStatus,
} from "./cardano-api.js";

describe("cardano-api", () => {
  let originalFetch: typeof global.fetch;
  beforeEach(() => {
    originalFetch = global.fetch;
  });
  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  describe("createCardanoApiClient", () => {
    it("creates Koios client for mainnet", () => {
      const client = createCardanoApiClient({ provider: "koios", network: "mainnet" });
      expect(client.provider).toBe("koios");
      expect(client.network).toBe("mainnet");
      expect(client.endpoint).toBe("https://api.koios.rest/api/v1");
    });

    it("creates Koios client for preprod", () => {
      const client = createCardanoApiClient({ provider: "koios", network: "preprod" });
      expect(client.endpoint).toBe("https://preprod.koios.rest/api/v1");
    });
  });

  describe("fetchAddressUtxos", () => {
    it("fetches UTxOs from Koios API", async () => {
      const mockUtxos = [
        { tx_hash: "abc123" + "0".repeat(58), tx_index: 0, value: "5000000", asset_list: [] },
      ];
      global.fetch = vi
        .fn()
        .mockResolvedValue({ ok: true, json: () => Promise.resolve(mockUtxos) });
      const client = createCardanoApiClient({ provider: "koios", network: "preprod" });
      const utxos = await fetchAddressUtxos(client, "addr_test1qz...");
      expect(utxos).toHaveLength(1);
      expect(utxos[0].lovelace).toBe("5000000");
    });

    it("returns empty array for address with no UTxOs", async () => {
      global.fetch = vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve([]) });
      const client = createCardanoApiClient({ provider: "koios", network: "preprod" });
      const utxos = await fetchAddressUtxos(client, "addr_test1qz...");
      expect(utxos).toEqual([]);
    });

    it("throws on API error", async () => {
      global.fetch = vi
        .fn()
        .mockResolvedValue({ ok: false, status: 500, statusText: "Internal Server Error" });
      const client = createCardanoApiClient({ provider: "koios", network: "preprod" });
      await expect(fetchAddressUtxos(client, "addr_test1qz...")).rejects.toThrow();
    });
  });

  describe("fetchProtocolParameters", () => {
    it("fetches current protocol parameters", async () => {
      const mockParams = {
        min_fee_a: 44,
        min_fee_b: 155381,
        max_tx_size: 16384,
        coins_per_utxo_word: "4310",
      };
      global.fetch = vi
        .fn()
        .mockResolvedValue({ ok: true, json: () => Promise.resolve([mockParams]) });
      const client = createCardanoApiClient({ provider: "koios", network: "mainnet" });
      const params = await fetchProtocolParameters(client);
      expect(params.minFeeA).toBe(44);
      expect(params.minFeeB).toBe(155381);
    });
  });

  describe("submitTransaction", () => {
    it("submits signed transaction successfully", async () => {
      global.fetch = vi
        .fn()
        .mockResolvedValue({
          ok: true,
          json: () => Promise.resolve({ tx_hash: "submitted-tx-hash" }),
        });
      const client = createCardanoApiClient({ provider: "koios", network: "preprod" });
      const result = await submitTransaction(client, "84a400...");
      expect(result.txHash).toBe("submitted-tx-hash");
      expect(result.status).toBe("submitted");
    });
  });

  describe("fetchAddressInfo", () => {
    it("fetches address balance and stake info", async () => {
      const mockInfo = [{ balance: "10000000", stake_address: "stake_test1..." }];
      global.fetch = vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve(mockInfo) });
      const client = createCardanoApiClient({ provider: "koios", network: "preprod" });
      const info = await fetchAddressInfo(client, "addr_test1qz...");
      expect(info.balance).toBe("10000000");
      expect(info.stakeAddress).toBe("stake_test1...");
    });
  });

  describe("fetchTxStatus", () => {
    it("returns confirmed for on-chain transaction", async () => {
      global.fetch = vi
        .fn()
        .mockResolvedValue({
          ok: true,
          json: () => Promise.resolve([{ tx_hash: "abc123", block_height: 12345 }]),
        });
      const client = createCardanoApiClient({ provider: "koios", network: "preprod" });
      const status = await fetchTxStatus(client, "abc123");
      expect(status.status).toBe("confirmed");
      expect(status.blockHeight).toBe(12345);
    });

    it("returns pending for unconfirmed transaction", async () => {
      global.fetch = vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve([]) });
      const client = createCardanoApiClient({ provider: "koios", network: "preprod" });
      const status = await fetchTxStatus(client, "abc123");
      expect(status.status).toBe("pending");
    });
  });
});
