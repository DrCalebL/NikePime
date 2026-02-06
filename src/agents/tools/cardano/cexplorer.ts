/**
 * Cexplorer blockchain explorer integration.
 *
 * Cexplorer provides comprehensive Cardano blockchain data including
 * addresses, transactions, pools, and epochs.
 * API Documentation: https://cexplorer.apidocumentation.com/cexplorer-api
 */

import { Type } from "@sinclair/typebox";
import type { OpenClawConfig } from "../../../config/types.js";
import type { AnyAgentTool } from "../common.js";
import { jsonResult, readStringParam, readNumberParam } from "../common.js";

const CEXPLORER_API = "https://api.cexplorer.io/v1";
const TIMEOUT_MS = 30_000;

type Result<T> = { ok: true; data: T } | { ok: false; error: string };

function getCexplorerApiKey(cfg?: OpenClawConfig): string | undefined {
  const tools = cfg?.tools as Record<string, unknown> | undefined;
  const cexplorer = tools?.cexplorer as Record<string, unknown> | undefined;
  return (cexplorer?.apiKey as string) || process.env.CEXPLORER_API_KEY;
}

async function fetchCexplorer<T>(endpoint: string, apiKey?: string): Promise<Result<T>> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const headers: Record<string, string> = { Accept: "application/json" };
    if (apiKey) {
      headers["Authorization"] = `Bearer ${apiKey}`;
    }
    const res = await fetch(`${CEXPLORER_API}${endpoint}`, {
      headers,
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      return { ok: false, error: `${res.status}: ${text || res.statusText}` };
    }
    return { ok: true, data: (await res.json()) as T };
  } catch (e) {
    clearTimeout(timer);
    return { ok: false, error: e instanceof Error ? e.message : "Unknown error" };
  }
}

interface AddressInfo {
  address: string;
  balance: string;
  stake_address?: string;
  tx_count: number;
  utxo_count: number;
  rewards_available?: string;
  pool_id?: string;
  recent_txs?: Array<{ tx_hash: string; epoch: number; slot: number }>;
}

interface TransactionInfo {
  tx_hash: string;
  block_hash?: string;
  block_height: number;
  epoch?: number;
  slot?: number;
  fee: string;
  total_output?: string;
  confirmations?: number;
  inputs: Array<{ address: string; value: string }>;
  outputs: Array<{ address: string; value: string }>;
  metadata?: Record<string, unknown>;
}

interface PoolInfo {
  pool_id: string;
  ticker: string;
  name: string;
  margin: number;
  fixed_cost?: string;
  pledge?: string;
  live_stake: string;
  delegators?: number;
  blocks_minted?: number;
  saturation?: number;
  lifetime_rewards?: string;
  ros?: number;
}

interface EpochInfo {
  epoch: number;
  start_time: number;
  end_time?: number;
  tx_count: number;
  blk_count: number;
  fees?: string;
  out_sum?: string;
  active_stake?: string;
  active_pools?: number;
}

interface SearchResult {
  results: Array<{ type: string; value: string; label: string }>;
  total: number;
}

export function createCexplorerAddressTool(cfg?: OpenClawConfig): AnyAgentTool {
  const apiKey = getCexplorerApiKey(cfg);
  return {
    label: "Cexplorer Address",
    name: "cexplorer_get_address",
    description: "Get address info including balance, transaction count, and staking info.",
    parameters: Type.Object({
      address: Type.String({ description: "Cardano address or stake address" }),
      include_txs: Type.Optional(Type.Boolean({ description: "Include recent transactions" })),
    }),
    execute: async (_toolCallId, args) => {
      const params = args as Record<string, unknown>;
      const address = readStringParam(params, "address");
      if (!address) {
        return jsonResult({ error: "address is required" });
      }
      const includeTxs = params.include_txs === true;

      const endpoint = includeTxs
        ? `/address/${encodeURIComponent(address)}?include_txs=true`
        : `/address/${encodeURIComponent(address)}`;

      const result = await fetchCexplorer<AddressInfo>(endpoint, apiKey);
      if (!result.ok) {
        return jsonResult({ error: `Cexplorer API: ${result.error}` });
      }

      return jsonResult({
        address: result.data.address,
        balance: result.data.balance,
        stake_address: result.data.stake_address,
        tx_count: result.data.tx_count,
        utxo_count: result.data.utxo_count,
        rewards_available: result.data.rewards_available,
        pool_id: result.data.pool_id,
        recent_txs: result.data.recent_txs,
      });
    },
  };
}

export function createCexplorerTransactionTool(cfg?: OpenClawConfig): AnyAgentTool {
  const apiKey = getCexplorerApiKey(cfg);
  return {
    label: "Cexplorer Transaction",
    name: "cexplorer_get_transaction",
    description: "Get transaction details including inputs, outputs, and metadata.",
    parameters: Type.Object({
      tx_hash: Type.String({ description: "Transaction hash" }),
    }),
    execute: async (_toolCallId, args) => {
      const params = args as Record<string, unknown>;
      const txHash = readStringParam(params, "tx_hash");
      if (!txHash) {
        return jsonResult({ error: "tx_hash is required" });
      }

      const result = await fetchCexplorer<TransactionInfo>(
        `/tx/${encodeURIComponent(txHash)}`,
        apiKey,
      );
      if (!result.ok) {
        return jsonResult({ error: `Cexplorer API: ${result.error}` });
      }

      return jsonResult({
        tx_hash: result.data.tx_hash,
        block_hash: result.data.block_hash,
        block_height: result.data.block_height,
        epoch: result.data.epoch,
        slot: result.data.slot,
        fee: result.data.fee,
        total_output: result.data.total_output,
        confirmations: result.data.confirmations,
        inputs: result.data.inputs,
        outputs: result.data.outputs,
        metadata: result.data.metadata,
      });
    },
  };
}

export function createCexplorerPoolTool(cfg?: OpenClawConfig): AnyAgentTool {
  const apiKey = getCexplorerApiKey(cfg);
  return {
    label: "Cexplorer Pool",
    name: "cexplorer_get_pool",
    description: "Get stake pool information including delegators and performance.",
    parameters: Type.Object({
      pool_id: Type.String({ description: "Pool ID (bech32 or hex)" }),
    }),
    execute: async (_toolCallId, args) => {
      const params = args as Record<string, unknown>;
      const poolId = readStringParam(params, "pool_id");
      if (!poolId) {
        return jsonResult({ error: "pool_id is required" });
      }

      const result = await fetchCexplorer<PoolInfo>(`/pool/${encodeURIComponent(poolId)}`, apiKey);
      if (!result.ok) {
        return jsonResult({ error: `Cexplorer API: ${result.error}` });
      }

      return jsonResult({
        pool_id: result.data.pool_id,
        ticker: result.data.ticker,
        name: result.data.name,
        margin: result.data.margin,
        fixed_cost: result.data.fixed_cost,
        pledge: result.data.pledge,
        live_stake: result.data.live_stake,
        delegators: result.data.delegators,
        blocks_minted: result.data.blocks_minted,
        saturation: result.data.saturation,
        lifetime_rewards: result.data.lifetime_rewards,
        ros: result.data.ros,
      });
    },
  };
}

export function createCexplorerEpochTool(cfg?: OpenClawConfig): AnyAgentTool {
  const apiKey = getCexplorerApiKey(cfg);
  return {
    label: "Cexplorer Epoch",
    name: "cexplorer_get_epoch",
    description: "Get epoch statistics including transaction count and fees.",
    parameters: Type.Object({
      epoch: Type.Optional(Type.Number({ description: "Epoch number (default: current)" })),
    }),
    execute: async (_toolCallId, args) => {
      const params = args as Record<string, unknown>;
      const epoch = readNumberParam(params, "epoch");

      const endpoint = epoch !== undefined && epoch !== null ? `/epoch/${epoch}` : "/epoch/current";

      const result = await fetchCexplorer<EpochInfo>(endpoint, apiKey);
      if (!result.ok) {
        return jsonResult({ error: `Cexplorer API: ${result.error}` });
      }

      return jsonResult({
        epoch: result.data.epoch,
        start_time: result.data.start_time,
        end_time: result.data.end_time,
        tx_count: result.data.tx_count,
        blk_count: result.data.blk_count,
        fees: result.data.fees,
        out_sum: result.data.out_sum,
        active_stake: result.data.active_stake,
        active_pools: result.data.active_pools,
      });
    },
  };
}

export function createCexplorerSearchTool(cfg?: OpenClawConfig): AnyAgentTool {
  const apiKey = getCexplorerApiKey(cfg);
  return {
    label: "Cexplorer Search",
    name: "cexplorer_search",
    description: "Search for addresses, transactions, pools, or tokens.",
    parameters: Type.Object({
      query: Type.String({ description: "Search query" }),
      type: Type.Optional(Type.String({ description: "Filter by type: address, tx, pool, token" })),
      limit: Type.Optional(Type.Number({ description: "Max results (default 10)" })),
    }),
    execute: async (_toolCallId, args) => {
      const params = args as Record<string, unknown>;
      const query = readStringParam(params, "query");
      if (!query) {
        return jsonResult({ error: "query is required" });
      }
      const type = readStringParam(params, "type");
      const limit = readNumberParam(params, "limit") ?? 10;

      let endpoint = `/search?q=${encodeURIComponent(query)}&limit=${limit}`;
      if (type) {
        endpoint += `&type=${encodeURIComponent(type)}`;
      }

      const result = await fetchCexplorer<SearchResult>(endpoint, apiKey);
      if (!result.ok) {
        return jsonResult({ error: `Cexplorer API: ${result.error}` });
      }

      return jsonResult({
        query,
        results: result.data.results,
        total: result.data.total,
      });
    },
  };
}

export function createCexplorerTools(cfg?: OpenClawConfig): AnyAgentTool[] {
  return [
    createCexplorerAddressTool(cfg),
    createCexplorerTransactionTool(cfg),
    createCexplorerPoolTool(cfg),
    createCexplorerEpochTool(cfg),
    createCexplorerSearchTool(cfg),
  ];
}
