/**
 * ADA Anvil minting API integration.
 *
 * ADA Anvil provides developer APIs for minting native tokens and NFTs on Cardano.
 * API Documentation: https://dev.ada-anvil.io/
 */

import { Type } from "@sinclair/typebox";
import type { OpenClawConfig } from "../../../config/types.js";
import type { AnyAgentTool } from "../common.js";
import { jsonResult, readStringParam, readNumberParam } from "../common.js";

const ANVIL_API = "https://api.ada-anvil.io/v1";
const TIMEOUT_MS = 30_000;

type Result<T> = { ok: true; data: T } | { ok: false; error: string };

function getAnvilApiKey(cfg?: OpenClawConfig): string | undefined {
  const tools = cfg?.tools as Record<string, unknown> | undefined;
  const anvil = tools?.adaAnvil as Record<string, unknown> | undefined;
  return (anvil?.apiKey as string) || process.env.ADA_ANVIL_API_KEY;
}

async function fetchAnvil<T>(
  endpoint: string,
  apiKey?: string,
  options?: { method?: string; body?: unknown },
): Promise<Result<T>> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const headers: Record<string, string> = {
      Accept: "application/json",
      "Content-Type": "application/json",
    };
    if (apiKey) {
      headers["x-api-key"] = apiKey;
    }
    const res = await fetch(`${ANVIL_API}${endpoint}`, {
      method: options?.method || "GET",
      headers,
      body: options?.body ? JSON.stringify(options.body) : undefined,
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

interface MintResponse {
  mint_id: string;
  policy_id: string;
  asset_name: string;
  quantity?: number;
  status: string;
  tx_hash?: string | null;
}

interface BurnResponse {
  burn_id: string;
  policy_id: string;
  asset_name: string;
  quantity: number;
  status: string;
  tx_hash?: string | null;
}

interface CollectionResponse {
  collection_id: string;
  policy_id: string;
  name: string;
  max_supply?: number;
  royalty_percentage?: number;
  royalty_address?: string;
  status: string;
}

interface MintHistoryResponse {
  mints: Array<{
    mint_id: string;
    policy_id: string;
    asset_name: string;
    quantity?: number;
    status: string;
    tx_hash?: string | null;
  }>;
  total: number;
}

export function createAnvilMintTokenTool(cfg?: OpenClawConfig): AnyAgentTool {
  const apiKey = getAnvilApiKey(cfg);
  return {
    label: "ADA Anvil Mint",
    name: "anvil_mint_token",
    description: "Mint native tokens on Cardano via ADA Anvil API.",
    parameters: Type.Object({
      name: Type.String({ description: "Token/asset name" }),
      quantity: Type.Number({ description: "Number of tokens to mint" }),
      policy_id: Type.Optional(Type.String({ description: "Custom policy ID (optional)" })),
      metadata: Type.Optional(
        Type.Object({}, { additionalProperties: true, description: "Token metadata" }),
      ),
    }),
    execute: async (_toolCallId, args) => {
      const params = args as Record<string, unknown>;
      const name = readStringParam(params, "name");
      const quantity = readNumberParam(params, "quantity");

      if (!name || quantity === undefined || quantity === null) {
        return jsonResult({ error: "name and quantity are required" });
      }

      const body: Record<string, unknown> = {
        name,
        quantity,
      };
      const policyId = readStringParam(params, "policy_id");
      if (policyId) {
        body.policy_id = policyId;
      }
      if (params.metadata) {
        body.metadata = params.metadata;
      }

      const result = await fetchAnvil<MintResponse>("/mint", apiKey, {
        method: "POST",
        body,
      });
      if (!result.ok) {
        return jsonResult({ error: `Anvil API: ${result.error}` });
      }

      return jsonResult({
        mint_id: result.data.mint_id,
        policy_id: result.data.policy_id,
        asset_name: result.data.asset_name,
        quantity: result.data.quantity,
        status: result.data.status,
        tx_hash: result.data.tx_hash,
      });
    },
  };
}

export function createAnvilBurnTokenTool(cfg?: OpenClawConfig): AnyAgentTool {
  const apiKey = getAnvilApiKey(cfg);
  return {
    label: "ADA Anvil Burn",
    name: "anvil_burn_token",
    description: "Burn native tokens on Cardano via ADA Anvil API.",
    parameters: Type.Object({
      policy_id: Type.String({ description: "Token policy ID" }),
      asset_name: Type.String({ description: "Token asset name" }),
      quantity: Type.Number({ description: "Number of tokens to burn" }),
    }),
    execute: async (_toolCallId, args) => {
      const params = args as Record<string, unknown>;
      const policyId = readStringParam(params, "policy_id");
      const assetName = readStringParam(params, "asset_name");
      const quantity = readNumberParam(params, "quantity");

      if (!policyId || !assetName || quantity === undefined || quantity === null) {
        return jsonResult({ error: "policy_id, asset_name, and quantity are required" });
      }

      const result = await fetchAnvil<BurnResponse>("/burn", apiKey, {
        method: "POST",
        body: {
          policy_id: policyId,
          asset_name: assetName,
          quantity,
        },
      });
      if (!result.ok) {
        return jsonResult({ error: `Anvil API: ${result.error}` });
      }

      return jsonResult({
        burn_id: result.data.burn_id,
        policy_id: result.data.policy_id,
        asset_name: result.data.asset_name,
        quantity: result.data.quantity,
        status: result.data.status,
        tx_hash: result.data.tx_hash,
      });
    },
  };
}

export function createAnvilCreateCollectionTool(cfg?: OpenClawConfig): AnyAgentTool {
  const apiKey = getAnvilApiKey(cfg);
  return {
    label: "ADA Anvil Collection",
    name: "anvil_create_collection",
    description: "Create an NFT collection on Cardano via ADA Anvil API.",
    parameters: Type.Object({
      name: Type.String({ description: "Collection name" }),
      max_supply: Type.Optional(Type.Number({ description: "Maximum supply of NFTs" })),
      royalty_percentage: Type.Optional(Type.Number({ description: "Royalty percentage (0-100)" })),
      royalty_address: Type.Optional(Type.String({ description: "Address to receive royalties" })),
    }),
    execute: async (_toolCallId, args) => {
      const params = args as Record<string, unknown>;
      const name = readStringParam(params, "name");

      if (!name) {
        return jsonResult({ error: "name is required" });
      }

      const body: Record<string, unknown> = { name };
      const maxSupply = readNumberParam(params, "max_supply");
      if (maxSupply !== undefined && maxSupply !== null) {
        body.max_supply = maxSupply;
      }
      const royaltyPercentage = readNumberParam(params, "royalty_percentage");
      if (royaltyPercentage !== undefined && royaltyPercentage !== null) {
        body.royalty_percentage = royaltyPercentage;
      }
      const royaltyAddress = readStringParam(params, "royalty_address");
      if (royaltyAddress) {
        body.royalty_address = royaltyAddress;
      }

      const result = await fetchAnvil<CollectionResponse>("/collections", apiKey, {
        method: "POST",
        body,
      });
      if (!result.ok) {
        return jsonResult({ error: `Anvil API: ${result.error}` });
      }

      return jsonResult({
        collection_id: result.data.collection_id,
        policy_id: result.data.policy_id,
        name: result.data.name,
        max_supply: result.data.max_supply,
        royalty_percentage: result.data.royalty_percentage,
        royalty_address: result.data.royalty_address,
        status: result.data.status,
      });
    },
  };
}

export function createAnvilGetMintsTool(cfg?: OpenClawConfig): AnyAgentTool {
  const apiKey = getAnvilApiKey(cfg);
  return {
    label: "ADA Anvil Mints",
    name: "anvil_get_mints",
    description: "Get minting history from ADA Anvil API.",
    parameters: Type.Object({
      policy_id: Type.Optional(Type.String({ description: "Filter by policy ID" })),
      status: Type.Optional(
        Type.String({ description: "Filter by status: pending, completed, failed" }),
      ),
      limit: Type.Optional(Type.Number({ description: "Max results (default 20)" })),
      offset: Type.Optional(Type.Number({ description: "Pagination offset" })),
    }),
    execute: async (_toolCallId, args) => {
      const params = args as Record<string, unknown>;
      const policyId = readStringParam(params, "policy_id");
      const status = readStringParam(params, "status");
      const limit = readNumberParam(params, "limit") ?? 20;
      const offset = readNumberParam(params, "offset") ?? 0;

      const queryParams: string[] = [`limit=${limit}`, `offset=${offset}`];
      if (policyId) {
        queryParams.push(`policy_id=${encodeURIComponent(policyId)}`);
      }
      if (status) {
        queryParams.push(`status=${encodeURIComponent(status)}`);
      }

      const result = await fetchAnvil<MintHistoryResponse>(
        `/mints?${queryParams.join("&")}`,
        apiKey,
      );
      if (!result.ok) {
        return jsonResult({ error: `Anvil API: ${result.error}` });
      }

      return jsonResult({
        mints: result.data.mints,
        total: result.data.total,
      });
    },
  };
}

export function createAdaAnvilTools(cfg?: OpenClawConfig): AnyAgentTool[] {
  return [
    createAnvilMintTokenTool(cfg),
    createAnvilBurnTokenTool(cfg),
    createAnvilCreateCollectionTool(cfg),
    createAnvilGetMintsTool(cfg),
  ];
}
