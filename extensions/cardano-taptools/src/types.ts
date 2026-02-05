/**
 * TapTools API response types.
 */

export interface TokenPrice {
  price: string;
  price_24h_change: string;
  volume_24h: string;
  market_cap: string;
}

export interface TokenHolders {
  total_holders: number;
  top_holders: Array<{
    address: string;
    balance: string;
    percentage: string;
  }>;
}

export interface NftCollection {
  name: string;
  policy_id: string;
  floor_price: string;
  volume_24h: string;
  volume_7d: string;
  total_supply: number;
  listed_count: number;
}

export interface DexVolume {
  total_volume_24h: string;
  protocols: Array<{
    name: string;
    volume_24h: string;
    percentage: string;
  }>;
}

export interface TrendingTokens {
  tokens: Array<{
    name: string;
    policy_id: string;
    price_change: string;
    volume: string;
  }>;
}

export interface TrendingNfts {
  nfts: Array<{
    name: string;
    policy_id: string;
    floor_change: string;
    volume: string;
  }>;
}
