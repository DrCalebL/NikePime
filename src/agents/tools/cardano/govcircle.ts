/**
 * GovCircle governance platform integration.
 *
 * GovCircle provides decentralized governance through circles and proposals.
 * API Documentation: https://govcircle.gitbook.io/circle-paper
 */

import { Type } from "@sinclair/typebox";
import type { OpenClawConfig } from "../../../config/types.js";
import type { AnyAgentTool } from "../common.js";
import { jsonResult, readStringParam } from "../common.js";

const GOVCIRCLE_API = "https://api.govcircle.io/v1";
const TIMEOUT_MS = 30_000;

type Result<T> = { ok: true; data: T } | { ok: false; error: string };

function getGovCircleApiKey(cfg?: OpenClawConfig): string | undefined {
  const tools = cfg?.tools as Record<string, unknown> | undefined;
  const govcircle = tools?.govCircle as Record<string, unknown> | undefined;
  return (govcircle?.apiKey as string) || process.env.GOVCIRCLE_API_KEY;
}

async function fetchGovCircle<T>(endpoint: string, apiKey?: string): Promise<Result<T>> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const headers: Record<string, string> = { Accept: "application/json" };
    if (apiKey) {
      headers["Authorization"] = `Bearer ${apiKey}`;
    }
    const res = await fetch(`${GOVCIRCLE_API}${endpoint}`, {
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

interface CircleInfo {
  circle_id: string;
  name: string;
  description?: string;
  member_count?: number;
  proposal_count?: number;
}

interface CirclesResponse {
  circles: CircleInfo[];
}

interface Proposal {
  proposal_id: string;
  title: string;
  description?: string;
  status: string;
  votes_for?: number;
  votes_against?: number;
  deadline?: string;
}

interface ProposalsResponse {
  circle_id: string;
  proposals: Proposal[];
}

interface Vote {
  voter: string;
  vote: string;
  weight?: number;
  timestamp?: string;
}

interface VotesResponse {
  proposal_id: string;
  votes: Vote[];
  total_for?: number;
  total_against?: number;
}

export function createGovCircleGetCirclesTool(cfg?: OpenClawConfig): AnyAgentTool {
  const apiKey = getGovCircleApiKey(cfg);
  return {
    label: "GovCircle Circles",
    name: "govcircle_get_circles",
    description: "List governance circles on GovCircle platform.",
    parameters: Type.Object({
      status: Type.Optional(Type.String({ description: "Filter by status: active, archived" })),
    }),
    execute: async (_toolCallId, args) => {
      const params = args as Record<string, unknown>;
      const status = readStringParam(params, "status");

      let endpoint = "/circles";
      if (status) {
        endpoint += `?status=${encodeURIComponent(status)}`;
      }

      const result = await fetchGovCircle<CirclesResponse>(endpoint, apiKey);
      if (!result.ok) {
        return jsonResult({ error: `GovCircle API: ${result.error}` });
      }

      return jsonResult({
        circles: result.data.circles,
      });
    },
  };
}

export function createGovCircleGetProposalsTool(cfg?: OpenClawConfig): AnyAgentTool {
  const apiKey = getGovCircleApiKey(cfg);
  return {
    label: "GovCircle Proposals",
    name: "govcircle_get_proposals",
    description: "Get proposals in a governance circle.",
    parameters: Type.Object({
      circle_id: Type.String({ description: "Circle identifier" }),
      status: Type.Optional(
        Type.String({ description: "Filter by status: active, passed, rejected" }),
      ),
    }),
    execute: async (_toolCallId, args) => {
      const params = args as Record<string, unknown>;
      const circleId = readStringParam(params, "circle_id");
      if (!circleId) {
        return jsonResult({ error: "circle_id is required" });
      }
      const status = readStringParam(params, "status");

      let endpoint = `/circles/${encodeURIComponent(circleId)}/proposals`;
      if (status) {
        endpoint += `?status=${encodeURIComponent(status)}`;
      }

      const result = await fetchGovCircle<ProposalsResponse>(endpoint, apiKey);
      if (!result.ok) {
        return jsonResult({ error: `GovCircle API: ${result.error}` });
      }

      return jsonResult({
        circle_id: result.data.circle_id,
        proposals: result.data.proposals,
      });
    },
  };
}

export function createGovCircleGetVotesTool(cfg?: OpenClawConfig): AnyAgentTool {
  const apiKey = getGovCircleApiKey(cfg);
  return {
    label: "GovCircle Votes",
    name: "govcircle_get_votes",
    description: "Get voting history for a proposal.",
    parameters: Type.Object({
      proposal_id: Type.String({ description: "Proposal identifier" }),
      voter: Type.Optional(Type.String({ description: "Filter by voter address" })),
    }),
    execute: async (_toolCallId, args) => {
      const params = args as Record<string, unknown>;
      const proposalId = readStringParam(params, "proposal_id");
      if (!proposalId) {
        return jsonResult({ error: "proposal_id is required" });
      }
      const voter = readStringParam(params, "voter");

      let endpoint = `/proposals/${encodeURIComponent(proposalId)}/votes`;
      if (voter) {
        endpoint += `?voter=${encodeURIComponent(voter)}`;
      }

      const result = await fetchGovCircle<VotesResponse>(endpoint, apiKey);
      if (!result.ok) {
        return jsonResult({ error: `GovCircle API: ${result.error}` });
      }

      return jsonResult({
        proposal_id: result.data.proposal_id,
        votes: result.data.votes,
        total_for: result.data.total_for,
        total_against: result.data.total_against,
      });
    },
  };
}

export function createGovCircleTools(cfg?: OpenClawConfig): AnyAgentTool[] {
  return [
    createGovCircleGetCirclesTool(cfg),
    createGovCircleGetProposalsTool(cfg),
    createGovCircleGetVotesTool(cfg),
  ];
}
