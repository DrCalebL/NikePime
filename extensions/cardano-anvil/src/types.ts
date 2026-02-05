export interface MintRequest {
  name: string;
  quantity: number;
  recipient_address: string;
  metadata?: Record<string, unknown>;
}

export interface MintResponse {
  mint_id: string;
  policy_id: string;
  status: string;
  tx_hash: string | null;
  created_at: string;
}

export interface BurnRequest {
  policy_id: string;
  asset_name: string;
  quantity: number;
}

export interface BurnResponse {
  burn_id: string;
  status: string;
  tx_hash: string | null;
}

export interface CollectionRequest {
  name: string;
  description: string;
  royalty_percentage: number;
  royalty_address: string;
}

export interface CollectionResponse {
  collection_id: string;
  policy_id: string;
  name: string;
  status: string;
}

export interface MintHistory {
  mint_id: string;
  policy_id: string;
  asset_name: string;
  quantity: number;
  status: string;
  tx_hash: string | null;
  created_at: string;
}
