/**
 * NABU VPN decentralized service integration.
 *
 * NABU provides decentralized VPN services on Cardano.
 * API Documentation: https://api.b7s.services/swagger/index.html
 */

import { Type } from "@sinclair/typebox";
import type { OpenClawConfig } from "../../../config/types.js";
import type { AnyAgentTool } from "../common.js";
import { jsonResult, readStringParam } from "../common.js";

const NABU_API = "https://api.b7s.services/v1";
const TIMEOUT_MS = 30_000;

type Result<T> = { ok: true; data: T } | { ok: false; error: string };

function getNabuApiKey(cfg?: OpenClawConfig): string | undefined {
  const tools = cfg?.tools as Record<string, unknown> | undefined;
  const nabu = tools?.nabuVpn as Record<string, unknown> | undefined;
  return (nabu?.apiKey as string) || process.env.NABU_VPN_API_KEY;
}

async function fetchNabu<T>(endpoint: string, apiKey?: string): Promise<Result<T>> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const headers: Record<string, string> = { Accept: "application/json" };
    if (apiKey) {
      headers["x-api-key"] = apiKey;
    }
    const res = await fetch(`${NABU_API}${endpoint}`, {
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

interface VpnNode {
  node_id: string;
  region: string;
  country: string;
  status: string;
  latency?: number;
  bandwidth?: string;
}

interface NodesResponse {
  nodes: VpnNode[];
}

interface NodeStats {
  node_id: string;
  uptime?: string;
  avg_latency?: number;
  bandwidth_used?: string;
  active_connections?: number;
  total_data_transferred?: string;
}

interface ServiceStatus {
  status: string;
  nodes_online?: number;
  nodes_total?: number;
  avg_latency?: number;
  last_updated?: string;
  issues?: string[];
}

export function createNabuGetNodesTool(cfg?: OpenClawConfig): AnyAgentTool {
  const apiKey = getNabuApiKey(cfg);
  return {
    label: "NABU Nodes",
    name: "nabu_get_nodes",
    description: "List available VPN nodes on NABU network.",
    parameters: Type.Object({
      region: Type.Optional(
        Type.String({ description: "Filter by region (e.g., us-east, eu-west)" }),
      ),
      country: Type.Optional(Type.String({ description: "Filter by country code (e.g., US, DE)" })),
    }),
    execute: async (_toolCallId, args) => {
      const params = args as Record<string, unknown>;
      const region = readStringParam(params, "region");
      const country = readStringParam(params, "country");

      const queryParams: string[] = [];
      if (region) {
        queryParams.push(`region=${encodeURIComponent(region)}`);
      }
      if (country) {
        queryParams.push(`country=${encodeURIComponent(country)}`);
      }

      let endpoint = "/nodes";
      if (queryParams.length > 0) {
        endpoint += `?${queryParams.join("&")}`;
      }

      const result = await fetchNabu<NodesResponse>(endpoint, apiKey);
      if (!result.ok) {
        return jsonResult({ error: `NABU API: ${result.error}` });
      }

      return jsonResult({
        nodes: result.data.nodes,
      });
    },
  };
}

export function createNabuGetNodeStatsTool(cfg?: OpenClawConfig): AnyAgentTool {
  const apiKey = getNabuApiKey(cfg);
  return {
    label: "NABU Node Stats",
    name: "nabu_get_node_stats",
    description: "Get performance statistics for a NABU VPN node.",
    parameters: Type.Object({
      node_id: Type.String({ description: "Node identifier" }),
    }),
    execute: async (_toolCallId, args) => {
      const params = args as Record<string, unknown>;
      const nodeId = readStringParam(params, "node_id");
      if (!nodeId) {
        return jsonResult({ error: "node_id is required" });
      }

      const result = await fetchNabu<NodeStats>(
        `/nodes/${encodeURIComponent(nodeId)}/stats`,
        apiKey,
      );
      if (!result.ok) {
        return jsonResult({ error: `NABU API: ${result.error}` });
      }

      return jsonResult({
        node_id: result.data.node_id,
        uptime: result.data.uptime,
        avg_latency: result.data.avg_latency,
        bandwidth_used: result.data.bandwidth_used,
        active_connections: result.data.active_connections,
        total_data_transferred: result.data.total_data_transferred,
      });
    },
  };
}

export function createNabuCheckStatusTool(cfg?: OpenClawConfig): AnyAgentTool {
  const apiKey = getNabuApiKey(cfg);
  return {
    label: "NABU Status",
    name: "nabu_check_status",
    description: "Check overall NABU VPN service status.",
    parameters: Type.Object({}),
    execute: async (_toolCallId) => {
      const result = await fetchNabu<ServiceStatus>("/status", apiKey);
      if (!result.ok) {
        return jsonResult({ error: `NABU API: ${result.error}` });
      }

      return jsonResult({
        status: result.data.status,
        nodes_online: result.data.nodes_online,
        nodes_total: result.data.nodes_total,
        avg_latency: result.data.avg_latency,
        last_updated: result.data.last_updated,
        issues: result.data.issues,
      });
    },
  };
}

export function createNabuVpnTools(cfg?: OpenClawConfig): AnyAgentTool[] {
  return [
    createNabuGetNodesTool(cfg),
    createNabuGetNodeStatsTool(cfg),
    createNabuCheckStatusTool(cfg),
  ];
}
