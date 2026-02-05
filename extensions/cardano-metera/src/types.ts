export interface IndexToken {
  id: string;
  name: string;
  symbol: string;
  category: string;
  nav: string;
  aum: string;
}

export interface IndexComposition {
  index_id: string;
  components: Array<{ token: string; weight: string; policy_id: string }>;
  last_rebalance: string;
}

export interface IndexPerformance {
  index_id: string;
  timeframe: string;
  return_percentage: string;
  nav_current: string;
  nav_start: string;
  ath: string;
  atl: string;
}
