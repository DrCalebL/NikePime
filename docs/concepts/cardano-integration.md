---
title: Cardano Integration Guide
description: How to query Cardano data, swap tokens, resolve handles, and work with governance
---

# Cardano Integration Guide

This guide walks through common Cardano operations: checking token prices, resolving handles, querying wallets, estimating swaps, and reading governance proposals.

## Setup

Cardano tools load automatically. To verify:

```typescript
const tools = agent.getAvailableTools();
const cardanoTools = tools.filter(
  (t) =>
    t.name.startsWith("taptools_") ||
    t.name.startsWith("cexplorer_") ||
    t.name.startsWith("handle_") ||
    t.name.startsWith("cswap_"),
);
console.log(cardanoTools.length); // Should be 32+
```

## API Keys

Without keys, you'll get rate limited after a few requests. Set them as environment variables:

```bash
export TAPTOOLS_API_KEY=tt_xxxx
export CEXPLORER_API_KEY=cx_xxxx
export ADA_HANDLE_API_KEY=ah_xxxx
export CSWAP_API_KEY=cs_xxxx
export METERA_API_KEY=mt_xxxx
export GOVCIRCLE_API_KEY=gc_xxxx
export ADA_ANVIL_API_KEY=av_xxxx
export NABU_VPN_API_KEY=nb_xxxx
```

Or in config:

```json
{
  "tools": {
    "taptools": { "apiKey": "tt_xxxx" },
    "cexplorer": { "apiKey": "cx_xxxx" },
    "adaHandle": { "apiKey": "ah_xxxx" }
  }
}
```

---

## Token Prices and Holders

Get current price for SNEK:

```typescript
const price = await agent.callTool("taptools_get_token_price", {
  policy_id: "279c909f348e533da5808898f87f9a14bb2c3dfbbacccd631d927a3f",
  asset_name: "534e454b", // "SNEK" in hex
});
// { price: "0.0025", change_24h: "5.2", volume_24h: "125000", market_cap: "2500000" }
```

The `asset_name` is hex-encoded. For tokens with blank asset names (like most fungible tokens), omit it.

Get top holders:

```typescript
const holders = await agent.callTool("taptools_get_token_holders", {
  policy_id: "279c909f348e533da5808898f87f9a14bb2c3dfbbacccd631d927a3f",
  limit: 10,
});
// { total_holders: 50000, top_holders: [{ address: "addr1...", balance: "1000000", percentage: "10.5" }, ...] }
```

---

## Ada Handles

Handles are case-insensitive. The `$` prefix is optional.

```typescript
// Resolve to address
const addr = await agent.callTool("handle_resolve", {
  handle: "charles", // or "$charles" or "CHARLES"
});
// { handle: "charles", address: "addr1qy8ac7qqy...", policy_id: "f0ff48..." }

// Find handles for an address
const handles = await agent.callTool("handle_reverse_lookup", {
  address:
    "addr1qy8ac7qqy0vtulyl7wntmsxc6wex80gvcyjy33qffrhm7sh927ysx5sftuw0dlft05dz3c7revpf7jx0xnlcjz3g69mq4afdhv",
});
// { handles: [{ handle: "charles", is_primary: true }], primary_handle: "charles" }

// Check if a handle is taken
const avail = await agent.callTool("handle_check_availability", {
  handle: "newhandle123",
});
// { available: true, price: "10000000", price_tier: "common" }
// or { available: false, owner: "addr1..." }
```

---

## Wallet and Transaction Data

Check an address:

```typescript
const info = await agent.callTool("cexplorer_get_address", {
  address: "addr1qy8ac7qqy...",
  include_txs: true,
});
// { balance: "5000000000", tx_count: 42, stake_address: "stake1u...", recent_txs: [...] }
```

Balance is in lovelace (1 ADA = 1,000,000 lovelace).

Look up a transaction:

```typescript
const tx = await agent.callTool("cexplorer_get_transaction", {
  tx_hash: "abc123...",
});
// { inputs: [...], outputs: [...], fee: "200000", metadata: {...} }
```

---

## Stake Pools

```typescript
const pool = await agent.callTool("cexplorer_get_pool", {
  pool_id: "pool1abc...",
});
// { ticker: "ALPHA", margin: 0.02, live_stake: "50000000000000", delegators: 1500, saturation: 0.75 }
```

Saturation above 1.0 means the pool is oversaturated and rewards decrease.

---

## DEX Swaps

List pools for a token:

```typescript
const pools = await agent.callTool("cswap_get_pools", {
  token: "279c909f348e533da5808898f87f9a14bb2c3dfbbacccd631d927a3f",
  limit: 10,
});
```

Estimate a swap:

```typescript
const estimate = await agent.callTool("cswap_estimate_swap", {
  input_token: "ada",
  output_token: "279c909f348e533da5808898f87f9a14bb2c3dfbbacccd631d927a3f",
  amount: "1000000000", // 1000 ADA in lovelace
});
// { output_amount: "4000000000", price_impact: "0.15", fee: "3000000", route: ["ada", "snek"] }
```

Price impact is a percentage. Above 1% and you're moving the market.

---

## Governance

List active circles:

```typescript
const circles = await agent.callTool("govcircle_get_circles", {
  status: "active",
});
```

Get proposals:

```typescript
const proposals = await agent.callTool("govcircle_get_proposals", {
  circle_id: "treasury-circle",
  status: "active",
});
```

Check votes on a proposal:

```typescript
const votes = await agent.callTool("govcircle_get_votes", {
  proposal_id: "prop-123",
});
```

---

## Error Handling

All tools return errors in the same format:

```typescript
const result = await agent.callTool("handle_resolve", {
  handle: "nonexistent12345xyz",
});

if (result.error) {
  console.log(result.error);
  // "Handle API: 404: Handle not found"
}
```

Common errors:

| Code | Meaning                |
| ---- | ---------------------- |
| 404  | Resource doesn't exist |
| 401  | Bad or missing API key |
| 429  | Rate limited           |

---

## Parallelizing Requests

If you need multiple pieces of data, run them concurrently:

```typescript
const [price, holders, collection] = await Promise.all([
  agent.callTool("taptools_get_token_price", { policy_id }),
  agent.callTool("taptools_get_token_holders", { policy_id }),
  agent.callTool("taptools_get_nft_collection", { policy_id }),
]);
```

---

## Retry on Rate Limits

```typescript
async function withRetry(fn, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (e) {
      if (e.message.includes("429") && i < maxRetries - 1) {
        await new Promise((r) => setTimeout(r, 1000 * (i + 1)));
        continue;
      }
      throw e;
    }
  }
}
```

---

## Links

- [TapTools API](https://openapi.taptools.io)
- [Cexplorer API](https://cexplorer.apidocumentation.com)
- [Ada Handle](https://docs.handle.me/)
- [CSWAP](https://docs.cswap.fi/)
