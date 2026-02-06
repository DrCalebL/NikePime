# TapTools

Analytics API for Cardano tokens and NFTs. Tracks prices, holder distributions, DEX volume, and trending assets.

## API Details

- Base URL: `https://openapi.taptools.io/api/v1`
- Auth: `x-api-key` header
- Free tier available with rate limits
- Docs: https://openapi.taptools.io

## Tools

### taptools_get_token_price

Returns current price, 24h change, volume, and market cap.

| Param      | Type   | Required | Notes                                              |
| ---------- | ------ | -------- | -------------------------------------------------- |
| policy_id  | string | yes      | 56-char hex string                                 |
| asset_name | string | no       | Hex-encoded, omit for tokens with blank asset name |

```typescript
const result = await agent.callTool("taptools_get_token_price", {
  policy_id: "279c909f348e533da5808898f87f9a14bb2c3dfbbacccd631d927a3f",
  asset_name: "534e454b", // "SNEK" in hex
});
// {
//   policy_id: "279c909f...",
//   price: "0.0025",
//   change_24h: "5.25",
//   volume_24h: "125000",
//   market_cap: "2500000"
// }
```

Price is in ADA. Volume and market cap are also in ADA.

---

### taptools_get_token_holders

Returns total holder count and list of top holders with balances.

| Param     | Type   | Required | Notes               |
| --------- | ------ | -------- | ------------------- |
| policy_id | string | yes      | 56-char hex string  |
| limit     | number | no       | Default 10, max 100 |

```typescript
const result = await agent.callTool("taptools_get_token_holders", {
  policy_id: "279c909f348e533da5808898f87f9a14bb2c3dfbbacccd631d927a3f",
  limit: 5,
});
// {
//   policy_id: "279c909f...",
//   total_holders: 50000,
//   top_holders: [
//     { address: "addr1...", balance: "1000000", percentage: "10.5" },
//     { address: "addr2...", balance: "500000", percentage: "5.2" }
//   ]
// }
```

Percentage is the share of total supply.

---

### taptools_get_nft_collection

Returns floor price, volume, supply, and listing count for an NFT collection.

| Param     | Type   | Required | Notes                |
| --------- | ------ | -------- | -------------------- |
| policy_id | string | yes      | Collection policy ID |

```typescript
const result = await agent.callTool("taptools_get_nft_collection", {
  policy_id: "d5e6bf0500378d4f0da4e8dde6becec7621cd8cbf5cbb9b87013d4cc",
});
// {
//   name: "SpaceBudz",
//   policy_id: "d5e6bf05...",
//   floor_price: "500",      // ADA
//   volume_24h: "25000",     // ADA
//   volume_7d: "150000",     // ADA
//   total_supply: 10000,
//   listed_count: 250
// }
```

---

### taptools_get_dex_volume

Returns trading volume across Cardano DEXes, broken down by protocol.

| Param     | Type   | Required | Notes                                 |
| --------- | ------ | -------- | ------------------------------------- |
| timeframe | string | no       | "24h", "7d", or "30d" (default "24h") |

```typescript
const result = await agent.callTool("taptools_get_dex_volume", {
  timeframe: "7d",
});
// {
//   timeframe: "7d",
//   total_volume: "35000000", // ADA
//   protocols: [
//     { name: "Minswap", volume: "15000000", percentage: "42.8" },
//     { name: "SundaeSwap", volume: "10000000", percentage: "28.6" }
//   ]
// }
```

---

### taptools_get_trending

Returns tokens or NFTs ranked by recent trading activity.

| Param | Type   | Required | Notes                                 |
| ----- | ------ | -------- | ------------------------------------- |
| type  | string | no       | "tokens" or "nfts" (default "tokens") |
| limit | number | no       | Default 10, max 50                    |

```typescript
const result = await agent.callTool("taptools_get_trending", {
  type: "tokens",
  limit: 5,
});
// {
//   tokens: [
//     { name: "SNEK", policy_id: "279c...", price_change: "25.5", volume: "100000" },
//     { name: "MIN", policy_id: "abc...", price_change: "15.2", volume: "80000" }
//   ]
// }
```

price_change is percentage over 24h.

---

## API Key

```bash
export TAPTOOLS_API_KEY=tt_xxxx
```

Or in config:

```json
{
  "tools": {
    "taptools": { "apiKey": "tt_xxxx" }
  }
}
```

## Links

- https://www.taptools.io/
- https://openapi.taptools.io
- @TapToolsio
