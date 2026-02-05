---
title: Cardano Tools
description: Tools for querying Cardano blockchain data, swapping tokens, resolving handles, and checking governance proposals
---

# Cardano Tools

OpenClaw includes 32 tools for working with the Cardano blockchain. These let you:

- Look up token prices and holder distributions
- Query addresses, transactions, and stake pools
- Estimate DEX swaps and check liquidity
- Resolve $handles to wallet addresses
- Read governance proposals and voting records
- Mint tokens and NFTs through Anvil

All tools are enabled by default. No configuration needed for basic use.

## Examples

```typescript
// What address does $charles point to?
const result = await agent.callTool("handle_resolve", { handle: "charles" });
// { handle: "charles", address: "addr1qy8ac7qqy...", policy_id: "f0ff48..." }

// What's SNEK trading at?
const price = await agent.callTool("taptools_get_token_price", {
  policy_id: "279c909f348e533da5808898f87f9a14bb2c3dfbbacccd631d927a3f",
  asset_name: "534e454b",
});
// { price: "0.0025", change_24h: "5.25", volume_24h: "125000" }

// How much would I get swapping 1000 ADA for SNEK?
const estimate = await agent.callTool("cswap_estimate_swap", {
  input_token: "ada",
  output_token: "279c909f348e533da5808898f87f9a14bb2c3dfbbacccd631d927a3f",
  amount: "1000000000",
});
// { output_amount: "4000000000", price_impact: "0.15", fee: "3000000" }
```

## Tool List

### TapTools (Analytics)

| Tool                          | What it does                                            |
| ----------------------------- | ------------------------------------------------------- |
| `taptools_get_token_price`    | Returns price, 24h change, volume, market cap           |
| `taptools_get_token_holders`  | Returns holder count and top holders with balances      |
| `taptools_get_nft_collection` | Returns floor price, volume, supply for NFT collections |
| `taptools_get_dex_volume`     | Returns trading volume broken down by DEX               |
| `taptools_get_trending`       | Returns tokens or NFTs ranked by recent activity        |

### Cexplorer (Blockchain Data)

| Tool                        | What it does                                             |
| --------------------------- | -------------------------------------------------------- |
| `cexplorer_get_address`     | Returns balance, transaction count, stake address        |
| `cexplorer_get_transaction` | Returns inputs, outputs, fees, metadata                  |
| `cexplorer_get_pool`        | Returns pool ticker, margin, stake, delegator count      |
| `cexplorer_get_epoch`       | Returns epoch number, start/end times, block count       |
| `cexplorer_search`          | Searches addresses, transactions, pools, tokens by query |

### CSWAP (DEX)

| Tool                  | What it does                                            |
| --------------------- | ------------------------------------------------------- |
| `cswap_get_pools`     | Lists liquidity pools, optionally filtered by token     |
| `cswap_get_price`     | Returns token price from liquidity pools                |
| `cswap_estimate_swap` | Calculates output amount, price impact, fees for a swap |
| `cswap_get_liquidity` | Returns TVL and pool depth                              |

### Metera (Index Tokens)

| Tool                     | What it does                               |
| ------------------------ | ------------------------------------------ |
| `metera_get_indices`     | Lists available index tokens               |
| `metera_get_composition` | Returns component tokens and their weights |
| `metera_get_performance` | Returns NAV, returns over various periods  |

### Ada Handle (Identity)

| Tool                        | What it does                                         |
| --------------------------- | ---------------------------------------------------- |
| `handle_resolve`            | Converts $handle to Cardano address                  |
| `handle_reverse_lookup`     | Finds handles owned by an address                    |
| `handle_get_metadata`       | Returns handle rarity, image, custom data            |
| `handle_check_availability` | Checks if a handle can be registered and shows price |

### GovCircle (Governance)

| Tool                      | What it does                                         |
| ------------------------- | ---------------------------------------------------- |
| `govcircle_get_circles`   | Lists governance circles (treasury, technical, etc.) |
| `govcircle_get_proposals` | Returns proposals in a circle with status            |
| `govcircle_get_votes`     | Returns vote breakdown for a proposal                |

### ADA Anvil (Minting)

| Tool                      | What it does                                |
| ------------------------- | ------------------------------------------- |
| `anvil_mint_token`        | Mints native tokens with specified quantity |
| `anvil_burn_token`        | Burns tokens from a wallet                  |
| `anvil_create_collection` | Creates NFT collection with metadata        |
| `anvil_get_mints`         | Returns minting history for an address      |

### NABU (VPN)

| Tool                  | What it does                                  |
| --------------------- | --------------------------------------------- |
| `nabu_get_nodes`      | Lists available VPN nodes with locations      |
| `nabu_get_node_stats` | Returns bandwidth, uptime, latency for a node |
| `nabu_check_status`   | Returns service health status                 |

## API Keys

The tools work without API keys but you'll hit rate limits quickly. For anything beyond testing, add keys:

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

Or in your config file:

```json
{
  "tools": {
    "taptools": { "apiKey": "tt_xxxx" },
    "cexplorer": { "apiKey": "cx_xxxx" },
    "adaHandle": { "apiKey": "ah_xxxx" }
  }
}
```

## Disabling Cardano Tools

If you don't need them:

```json
{
  "tools": {
    "cardano": { "enabled": false }
  }
}
```

## External Documentation

- [TapTools API](https://openapi.taptools.io)
- [Cexplorer API](https://cexplorer.apidocumentation.com)
- [Ada Handle](https://docs.handle.me/)
- [CSWAP](https://docs.cswap.fi/)
