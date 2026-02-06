export interface VpnNode {
  id: string;
  name: string;
  region: string;
  country: string;
  ip: string;
  port: number;
  protocol: string;
  status: string;
}

export interface NodeStats {
  node_id: string;
  uptime_percentage: number;
  bandwidth_mbps: number;
  latency_ms: number;
  data_transferred_gb: number;
  active_connections: number;
}

export interface ServiceStatus {
  status: string;
  total_nodes: number;
  active_nodes: number;
  issues: string[];
  last_updated: string;
}
