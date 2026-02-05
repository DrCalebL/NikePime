export interface Pool {
  pool_id: string;
  token_a: string;
  token_b: string;
  reserve_a: string;
  reserve_b: string;
  tvl: string;
  apy: string;
}

export interface TokenPrice {
  token: string;
  price_ada: string;
  price_usd: string;
}

export interface SwapEstimate {
  input_token: string;
  output_token: string;
  input_amount: string;
  output_amount: string;
  price_impact: string;
  fee: string;
  route: string[];
}

export interface LiquidityInfo {
  pool_id: string;
  tvl: string;
  reserve_a: string;
  reserve_b: string;
  volume_24h: string;
  fees_24h: string;
}
