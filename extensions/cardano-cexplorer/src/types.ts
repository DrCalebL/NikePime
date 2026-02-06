export interface AddressInfo {
  address: string;
  balance: string;
  tx_count: number;
  stake_address: string | null;
  recent_txs?: TransactionSummary[];
}

export interface TransactionSummary {
  tx_hash: string;
  block_height: number;
  timestamp: string;
}

export interface TransactionDetails {
  tx_hash: string;
  block_height: number;
  block_hash: string;
  timestamp: string;
  fee: string;
  inputs: Array<{ address: string; amount: string }>;
  outputs: Array<{ address: string; amount: string }>;
  metadata: Record<string, unknown> | null;
}

export interface PoolInfo {
  pool_id: string;
  ticker: string;
  name: string;
  margin: number;
  fixed_cost: string;
  live_stake: string;
  delegators: number;
  saturation: number;
  blocks_minted: number;
}

export interface EpochInfo {
  epoch: number;
  start_time: string;
  end_time: string;
  block_count: number;
  tx_count: number;
  total_output: string;
  total_fees: string;
}

export interface SearchResult {
  type: string;
  id: string;
  label: string;
}
