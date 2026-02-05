import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createNabuClient } from "../client.js";
import { createNodesTool, createNodeStatsTool, createStatusTool } from "../tools/index.js";

describe("Nabu tools", () => {
  const mockFetch = vi.fn();
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = mockFetch;
    mockFetch.mockReset();
  });
  afterEach(() => {
    global.fetch = originalFetch;
  });

  function mockJson(data: unknown, status = 200) {
    return {
      ok: status >= 200 && status < 300,
      status,
      json: () => Promise.resolve(data),
      text: () => Promise.resolve(""),
    };
  }

  describe("nabu_get_nodes", () => {
    it("has correct name", () => {
      const tool = createNodesTool(createNabuClient({}));
      expect(tool.name).toBe("nabu_get_nodes");
    });

    it("returns node list", async () => {
      mockFetch.mockResolvedValue(mockJson([{ id: "n1", name: "Node 1", region: "europe" }]));
      const tool = createNodesTool(createNabuClient({}));
      const result = await tool.execute("c1", {});
      const data = JSON.parse((result[0] as any).text);
      expect(data.nodes).toHaveLength(1);
    });

    it("filters by region", async () => {
      mockFetch.mockResolvedValue(mockJson([]));
      const tool = createNodesTool(createNabuClient({}));
      await tool.execute("c1", { region: "asia" });
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("region=asia"),
        expect.anything(),
      );
    });
  });

  describe("nabu_get_node_stats", () => {
    it("has correct name", () => {
      const tool = createNodeStatsTool(createNabuClient({}));
      expect(tool.name).toBe("nabu_get_node_stats");
    });

    it("returns performance metrics", async () => {
      mockFetch.mockResolvedValue(
        mockJson({ node_id: "n1", uptime_percentage: 99.9, latency_ms: 25 }),
      );
      const tool = createNodeStatsTool(createNabuClient({}));
      const result = await tool.execute("c1", { node_id: "n1" });
      const data = JSON.parse((result[0] as any).text);
      expect(data.uptime_percentage).toBe(99.9);
    });

    it("requires node_id", async () => {
      const tool = createNodeStatsTool(createNabuClient({}));
      const result = await tool.execute("c1", {});
      const data = JSON.parse((result[0] as any).text);
      expect(data.error).toContain("node_id");
    });
  });

  describe("nabu_check_status", () => {
    it("has correct name", () => {
      const tool = createStatusTool(createNabuClient({}));
      expect(tool.name).toBe("nabu_check_status");
    });

    it("returns health info", async () => {
      mockFetch.mockResolvedValue(
        mockJson({ status: "healthy", total_nodes: 50, active_nodes: 48, issues: [] }),
      );
      const tool = createStatusTool(createNabuClient({}));
      const result = await tool.execute("c1", {});
      const data = JSON.parse((result[0] as any).text);
      expect(data.status).toBe("healthy");
    });

    it("includes issues array", async () => {
      mockFetch.mockResolvedValue(mockJson({ status: "degraded", issues: ["Node n5 offline"] }));
      const tool = createStatusTool(createNabuClient({}));
      const result = await tool.execute("c1", {});
      const data = JSON.parse((result[0] as any).text);
      expect(data.issues).toContain("Node n5 offline");
    });
  });
});
