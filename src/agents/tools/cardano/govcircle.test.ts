/**
 * Tests for GovCircle governance platform integration.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  createGovCircleGetCirclesTool,
  createGovCircleGetProposalsTool,
  createGovCircleGetVotesTool,
  createGovCircleTools,
} from "./govcircle.js";

describe("govcircle", () => {
  let originalFetch: typeof global.fetch;

  beforeEach(() => {
    originalFetch = global.fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  describe("govcircle_get_circles", () => {
    it("returns list of governance circles", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            circles: [
              {
                circle_id: "circle1",
                name: "Treasury Circle",
                description: "Manages treasury allocations",
                member_count: 50,
                proposal_count: 12,
              },
              {
                circle_id: "circle2",
                name: "Technical Circle",
                description: "Technical governance",
                member_count: 30,
                proposal_count: 8,
              },
            ],
          }),
      });

      const tool = createGovCircleGetCirclesTool();
      const result = await tool.execute("test-id", {});

      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.circles).toHaveLength(2);
      expect(parsed.circles[0].name).toBe("Treasury Circle");
    });

    it("filters by status", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            circles: [{ circle_id: "circle1", name: "Active Circle" }],
          }),
      });

      const tool = createGovCircleGetCirclesTool();
      await tool.execute("test-id", {
        status: "active",
      });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("status=active"),
        expect.any(Object),
      );
    });
  });

  describe("govcircle_get_proposals", () => {
    it("returns proposals in a circle", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            circle_id: "circle1",
            proposals: [
              {
                proposal_id: "prop1",
                title: "Fund Development",
                status: "active",
                votes_for: 100,
                votes_against: 20,
                deadline: "2025-02-01T00:00:00Z",
              },
              {
                proposal_id: "prop2",
                title: "New Partnership",
                status: "passed",
                votes_for: 150,
                votes_against: 10,
              },
            ],
          }),
      });

      const tool = createGovCircleGetProposalsTool();
      const result = await tool.execute("test-id", {
        circle_id: "circle1",
      });

      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.proposals).toHaveLength(2);
      expect(parsed.proposals[0].title).toBe("Fund Development");
    });

    it("filters by proposal status", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            circle_id: "circle1",
            proposals: [],
          }),
      });

      const tool = createGovCircleGetProposalsTool();
      await tool.execute("test-id", {
        circle_id: "circle1",
        status: "active",
      });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("status=active"),
        expect.any(Object),
      );
    });

    it("requires circle_id parameter", async () => {
      const tool = createGovCircleGetProposalsTool();
      const result = await tool.execute("test-id", {});

      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.error).toContain("circle_id");
    });

    it("handles circle not found", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        statusText: "Not Found",
        text: () => Promise.resolve("Circle not found"),
      });

      const tool = createGovCircleGetProposalsTool();
      const result = await tool.execute("test-id", {
        circle_id: "nonexistent",
      });

      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.error).toBeDefined();
    });
  });

  describe("govcircle_get_votes", () => {
    it("returns voting history for a proposal", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            proposal_id: "prop1",
            votes: [
              { voter: "addr1...", vote: "for", weight: 100, timestamp: "2025-01-20T10:00:00Z" },
              { voter: "addr2...", vote: "against", weight: 50, timestamp: "2025-01-20T11:00:00Z" },
            ],
            total_for: 100,
            total_against: 50,
          }),
      });

      const tool = createGovCircleGetVotesTool();
      const result = await tool.execute("test-id", {
        proposal_id: "prop1",
      });

      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.votes).toHaveLength(2);
      expect(parsed.total_for).toBe(100);
    });

    it("filters by voter address", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            proposal_id: "prop1",
            votes: [{ voter: "addr1...", vote: "for" }],
          }),
      });

      const tool = createGovCircleGetVotesTool();
      await tool.execute("test-id", {
        proposal_id: "prop1",
        voter: "addr1...",
      });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("voter="),
        expect.any(Object),
      );
    });

    it("requires proposal_id parameter", async () => {
      const tool = createGovCircleGetVotesTool();
      const result = await tool.execute("test-id", {});

      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.error).toContain("proposal_id");
    });
  });

  describe("createGovCircleTools", () => {
    it("returns all 3 GovCircle tools", () => {
      const tools = createGovCircleTools();
      expect(tools).toHaveLength(3);

      const names = tools.map((t) => t.name);
      expect(names).toContain("govcircle_get_circles");
      expect(names).toContain("govcircle_get_proposals");
      expect(names).toContain("govcircle_get_votes");
    });

    it("all tools have required properties", () => {
      const tools = createGovCircleTools();
      tools.forEach((tool) => {
        expect(tool.name).toBeDefined();
        expect(tool.description).toBeDefined();
        expect(tool.parameters).toBeDefined();
        expect(tool.execute).toBeInstanceOf(Function);
      });
    });
  });
});
