/**
 * Tests for NABU VPN decentralized service integration.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  createNabuGetNodesTool,
  createNabuGetNodeStatsTool,
  createNabuCheckStatusTool,
  createNabuVpnTools,
} from "./nabu-vpn.js";

describe("nabu-vpn", () => {
  let originalFetch: typeof global.fetch;

  beforeEach(() => {
    originalFetch = global.fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  describe("nabu_get_nodes", () => {
    it("returns list of VPN nodes", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            nodes: [
              {
                node_id: "node1",
                region: "us-east",
                country: "US",
                status: "online",
                latency: 25,
                bandwidth: "100Mbps",
              },
              {
                node_id: "node2",
                region: "eu-west",
                country: "DE",
                status: "online",
                latency: 45,
                bandwidth: "50Mbps",
              },
            ],
          }),
      });

      const tool = createNabuGetNodesTool();
      const result = await tool.execute("test-id", {});

      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.nodes).toHaveLength(2);
      expect(parsed.nodes[0].region).toBe("us-east");
    });

    it("filters by region", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            nodes: [{ node_id: "node1", region: "us-east" }],
          }),
      });

      const tool = createNabuGetNodesTool();
      await tool.execute("test-id", {
        region: "us-east",
      });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("region=us-east"),
        expect.any(Object),
      );
    });

    it("filters by country", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            nodes: [],
          }),
      });

      const tool = createNabuGetNodesTool();
      await tool.execute("test-id", {
        country: "DE",
      });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("country=DE"),
        expect.any(Object),
      );
    });
  });

  describe("nabu_get_node_stats", () => {
    it("returns node performance statistics", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            node_id: "node1",
            uptime: "99.9%",
            avg_latency: 25,
            bandwidth_used: "500GB",
            active_connections: 150,
            total_data_transferred: "10TB",
          }),
      });

      const tool = createNabuGetNodeStatsTool();
      const result = await tool.execute("test-id", {
        node_id: "node1",
      });

      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.uptime).toBe("99.9%");
      expect(parsed.active_connections).toBe(150);
    });

    it("requires node_id parameter", async () => {
      const tool = createNabuGetNodeStatsTool();
      const result = await tool.execute("test-id", {});

      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.error).toContain("node_id");
    });

    it("handles node not found", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        statusText: "Not Found",
        text: () => Promise.resolve("Node not found"),
      });

      const tool = createNabuGetNodeStatsTool();
      const result = await tool.execute("test-id", {
        node_id: "nonexistent",
      });

      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.error).toBeDefined();
    });
  });

  describe("nabu_check_status", () => {
    it("returns service status", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            status: "operational",
            nodes_online: 150,
            nodes_total: 160,
            avg_latency: 35,
            last_updated: "2025-02-05T10:00:00Z",
          }),
      });

      const tool = createNabuCheckStatusTool();
      const result = await tool.execute("test-id", {});

      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.status).toBe("operational");
      expect(parsed.nodes_online).toBe(150);
    });

    it("returns degraded status when issues", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            status: "degraded",
            nodes_online: 50,
            nodes_total: 160,
            issues: ["High latency in EU region", "Node cluster offline"],
          }),
      });

      const tool = createNabuCheckStatusTool();
      const result = await tool.execute("test-id", {});

      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.status).toBe("degraded");
      expect(parsed.issues).toHaveLength(2);
    });
  });

  describe("createNabuVpnTools", () => {
    it("returns all 3 NABU VPN tools", () => {
      const tools = createNabuVpnTools();
      expect(tools).toHaveLength(3);

      const names = tools.map((t) => t.name);
      expect(names).toContain("nabu_get_nodes");
      expect(names).toContain("nabu_get_node_stats");
      expect(names).toContain("nabu_check_status");
    });

    it("all tools have required properties", () => {
      const tools = createNabuVpnTools();
      tools.forEach((tool) => {
        expect(tool.name).toBeDefined();
        expect(tool.description).toBeDefined();
        expect(tool.parameters).toBeDefined();
        expect(tool.execute).toBeInstanceOf(Function);
      });
    });
  });
});
