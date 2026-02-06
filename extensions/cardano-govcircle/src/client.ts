import type { Circle, Proposal, VoteBreakdown } from "./types.js";

export type Result<T> = { ok: true; data: T } | { ok: false; error: string };

export interface GovCircleClientConfig {
  apiKey?: string;
  timeout?: number;
}

export interface GovCircleClient {
  getCircles(status?: string): Promise<Result<Circle[]>>;
  getProposals(circleId: string, status?: string): Promise<Result<Proposal[]>>;
  getVotes(proposalId: string): Promise<Result<VoteBreakdown>>;
}

const BASE_URL = "https://api.govcircle.io/v1";

export function createGovCircleClient(config: GovCircleClientConfig): GovCircleClient {
  const timeout = config.timeout ?? 30000;

  async function request<T>(endpoint: string): Promise<Result<T>> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);
    try {
      const headers: Record<string, string> = { Accept: "application/json" };
      if (config.apiKey) headers["Authorization"] = `Bearer ${config.apiKey}`;
      const res = await fetch(`${BASE_URL}${endpoint}`, { headers, signal: controller.signal });
      clearTimeout(timer);
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        const safeError = text.length > 200 ? `${text.slice(0, 200)}...` : text;
        return { ok: false, error: `${res.status}: ${safeError || res.statusText}` };
      }
      return { ok: true, data: (await res.json()) as T };
    } catch (e) {
      clearTimeout(timer);
      if (e instanceof Error && e.name === "AbortError")
        return { ok: false, error: "Request timeout" };
      return { ok: false, error: e instanceof Error ? e.message : "Unknown error" };
    }
  }

  return {
    async getCircles(status?: string) {
      const query = status ? `?status=${encodeURIComponent(status)}` : "";
      return request<Circle[]>(`/circles${query}`);
    },
    async getProposals(circleId: string, status?: string) {
      const query = status ? `?status=${encodeURIComponent(status)}` : "";
      return request<Proposal[]>(`/circles/${encodeURIComponent(circleId)}/proposals${query}`);
    },
    async getVotes(proposalId: string) {
      return request<VoteBreakdown>(`/proposals/${encodeURIComponent(proposalId)}/votes`);
    },
  };
}
