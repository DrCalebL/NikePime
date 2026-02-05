import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createGovCircleClient } from "../client.js";
import { createCirclesTool, createProposalsTool, createVotesTool } from "../tools/index.js";

describe("GovCircle tools", () => {
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

  describe("govcircle_get_circles", () => {
    it("has correct name", () => {
      expect(createCirclesTool(createGovCircleClient({})).name).toBe("govcircle_get_circles");
    });

    it("returns circle list", async () => {
      mockFetch.mockResolvedValue(mockJson([{ id: "c1", name: "Treasury Circle" }]));
      const result = await createCirclesTool(createGovCircleClient({})).execute("c1", {});
      const data = JSON.parse((result[0] as any).text);
      expect(data.circles).toHaveLength(1);
    });

    it("filters by status", async () => {
      mockFetch.mockResolvedValue(mockJson([]));
      await createCirclesTool(createGovCircleClient({})).execute("c1", { status: "archived" });
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("status=archived"),
        expect.anything(),
      );
    });
  });

  describe("govcircle_get_proposals", () => {
    it("has correct name", () => {
      expect(createProposalsTool(createGovCircleClient({})).name).toBe("govcircle_get_proposals");
    });

    it("requires circle_id", async () => {
      const result = await createProposalsTool(createGovCircleClient({})).execute("c1", {});
      const data = JSON.parse((result[0] as any).text);
      expect(data.error).toContain("circle_id");
    });

    it("returns proposals", async () => {
      mockFetch.mockResolvedValue(mockJson([{ id: "p1", title: "Fund project X" }]));
      const result = await createProposalsTool(createGovCircleClient({})).execute("c1", {
        circle_id: "c1",
      });
      const data = JSON.parse((result[0] as any).text);
      expect(data.proposals[0].title).toBe("Fund project X");
    });

    it("filters by status", async () => {
      mockFetch.mockResolvedValue(mockJson([]));
      await createProposalsTool(createGovCircleClient({})).execute("c1", {
        circle_id: "c1",
        status: "active",
      });
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("status=active"),
        expect.anything(),
      );
    });
  });

  describe("govcircle_get_votes", () => {
    it("has correct name", () => {
      expect(createVotesTool(createGovCircleClient({})).name).toBe("govcircle_get_votes");
    });

    it("requires proposal_id", async () => {
      const result = await createVotesTool(createGovCircleClient({})).execute("c1", {});
      const data = JSON.parse((result[0] as any).text);
      expect(data.error).toContain("proposal_id");
    });

    it("returns vote breakdown", async () => {
      mockFetch.mockResolvedValue(
        mockJson({ proposal_id: "p1", votes_for: 100, votes_against: 20, votes: [] }),
      );
      const result = await createVotesTool(createGovCircleClient({})).execute("c1", {
        proposal_id: "p1",
      });
      const data = JSON.parse((result[0] as any).text);
      expect(data.votes_for).toBe(100);
    });

    it("includes voter addresses", async () => {
      mockFetch.mockResolvedValue(
        mockJson({ votes: [{ voter_address: "addr1...", vote: "for" }] }),
      );
      const result = await createVotesTool(createGovCircleClient({})).execute("c1", {
        proposal_id: "p1",
      });
      const data = JSON.parse((result[0] as any).text);
      expect(data.votes[0].voter_address).toBe("addr1...");
    });
  });
});
