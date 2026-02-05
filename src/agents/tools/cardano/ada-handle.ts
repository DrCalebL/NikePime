/**
 * Ada Handle identity resolution integration.
 *
 * Ada Handle provides human-readable names ($handles) that resolve to Cardano addresses.
 * API Documentation: https://docs.handle.me/
 */

import { Type } from "@sinclair/typebox";
import type { OpenClawConfig } from "../../../config/types.js";
import type { AnyAgentTool } from "../common.js";
import { jsonResult, readStringParam } from "../common.js";

const HANDLE_API = "https://api.handle.me";
const TIMEOUT_MS = 30_000;

type Result<T> = { ok: true; data: T } | { ok: false; error: string };

function getHandleApiKey(cfg?: OpenClawConfig): string | undefined {
  const tools = cfg?.tools as Record<string, unknown> | undefined;
  const handle = tools?.adaHandle as Record<string, unknown> | undefined;
  return (handle?.apiKey as string) || process.env.ADA_HANDLE_API_KEY;
}

async function fetchHandle<T>(endpoint: string, apiKey?: string): Promise<Result<T>> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const headers: Record<string, string> = { Accept: "application/json" };
    if (apiKey) {
      headers["Authorization"] = `Bearer ${apiKey}`;
    }
    const res = await fetch(`${HANDLE_API}${endpoint}`, {
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

interface HandleResolution {
  handle: string;
  address: string;
  policy_id?: string;
}

interface HandleReverseLookup {
  address: string;
  handles: Array<{ handle: string; is_primary: boolean }>;
}

interface HandleMetadata {
  handle: string;
  policy_id?: string;
  asset_name?: string;
  rarity?: string;
  length?: number;
  characters?: string;
  created_slot?: number;
  updated_slot?: number;
  image?: string;
  custom_data?: Record<string, unknown>;
}

interface HandleAvailability {
  handle: string;
  available: boolean;
  price?: string;
  price_tier?: string;
  owner?: string;
}

function normalizeHandle(handle: string): string {
  // Remove $ prefix if present and convert to lowercase
  return handle.replace(/^\$/, "").toLowerCase();
}

export function createHandleResolveTool(cfg?: OpenClawConfig): AnyAgentTool {
  const apiKey = getHandleApiKey(cfg);
  return {
    label: "Ada Handle Resolve",
    name: "handle_resolve",
    description: "Resolve an Ada Handle ($handle) to its Cardano address.",
    parameters: Type.Object({
      handle: Type.String({ description: "Handle name (with or without $ prefix)" }),
    }),
    execute: async (_toolCallId, args) => {
      const params = args as Record<string, unknown>;
      const handle = readStringParam(params, "handle");
      if (!handle) {
        return jsonResult({ error: "handle is required" });
      }
      const normalized = normalizeHandle(handle);

      const result = await fetchHandle<HandleResolution>(
        `/handles/${encodeURIComponent(normalized)}`,
        apiKey,
      );
      if (!result.ok) {
        return jsonResult({ error: `Handle API: ${result.error}` });
      }

      return jsonResult({
        handle: result.data.handle,
        address: result.data.address,
        policy_id: result.data.policy_id,
      });
    },
  };
}

export function createHandleReverseLookupTool(cfg?: OpenClawConfig): AnyAgentTool {
  const apiKey = getHandleApiKey(cfg);
  return {
    label: "Ada Handle Reverse Lookup",
    name: "handle_reverse_lookup",
    description: "Look up Ada Handles associated with a Cardano address.",
    parameters: Type.Object({
      address: Type.String({ description: "Cardano address to look up" }),
    }),
    execute: async (_toolCallId, args) => {
      const params = args as Record<string, unknown>;
      const address = readStringParam(params, "address");
      if (!address) {
        return jsonResult({ error: "address is required" });
      }

      const result = await fetchHandle<HandleReverseLookup>(
        `/holders/${encodeURIComponent(address)}`,
        apiKey,
      );
      if (!result.ok) {
        return jsonResult({ error: `Handle API: ${result.error}` });
      }

      const primaryHandle = result.data.handles.find((h) => h.is_primary)?.handle;

      return jsonResult({
        address: result.data.address,
        handles: result.data.handles,
        primary_handle: primaryHandle,
      });
    },
  };
}

export function createHandleMetadataTool(cfg?: OpenClawConfig): AnyAgentTool {
  const apiKey = getHandleApiKey(cfg);
  return {
    label: "Ada Handle Metadata",
    name: "handle_get_metadata",
    description: "Get metadata for an Ada Handle NFT including rarity and custom data.",
    parameters: Type.Object({
      handle: Type.String({ description: "Handle name (with or without $ prefix)" }),
    }),
    execute: async (_toolCallId, args) => {
      const params = args as Record<string, unknown>;
      const handle = readStringParam(params, "handle");
      if (!handle) {
        return jsonResult({ error: "handle is required" });
      }
      const normalized = normalizeHandle(handle);

      const result = await fetchHandle<HandleMetadata>(
        `/handles/${encodeURIComponent(normalized)}/metadata`,
        apiKey,
      );
      if (!result.ok) {
        return jsonResult({ error: `Handle API: ${result.error}` });
      }

      return jsonResult({
        handle: result.data.handle,
        policy_id: result.data.policy_id,
        asset_name: result.data.asset_name,
        rarity: result.data.rarity,
        length: result.data.length,
        characters: result.data.characters,
        created_slot: result.data.created_slot,
        updated_slot: result.data.updated_slot,
        image: result.data.image,
        custom_data: result.data.custom_data,
      });
    },
  };
}

export function createHandleCheckAvailabilityTool(cfg?: OpenClawConfig): AnyAgentTool {
  const apiKey = getHandleApiKey(cfg);
  return {
    label: "Ada Handle Availability",
    name: "handle_check_availability",
    description: "Check if an Ada Handle is available for registration.",
    parameters: Type.Object({
      handle: Type.String({ description: "Handle name to check (with or without $ prefix)" }),
    }),
    execute: async (_toolCallId, args) => {
      const params = args as Record<string, unknown>;
      const handle = readStringParam(params, "handle");
      if (!handle) {
        return jsonResult({ error: "handle is required" });
      }
      const normalized = normalizeHandle(handle);

      const result = await fetchHandle<HandleAvailability>(
        `/handles/${encodeURIComponent(normalized)}/availability`,
        apiKey,
      );
      if (!result.ok) {
        return jsonResult({ error: `Handle API: ${result.error}` });
      }

      return jsonResult({
        handle: result.data.handle,
        available: result.data.available,
        price: result.data.price,
        price_tier: result.data.price_tier,
        owner: result.data.owner,
      });
    },
  };
}

export function createAdaHandleTools(cfg?: OpenClawConfig): AnyAgentTool[] {
  return [
    createHandleResolveTool(cfg),
    createHandleReverseLookupTool(cfg),
    createHandleMetadataTool(cfg),
    createHandleCheckAvailabilityTool(cfg),
  ];
}
