# From Shell With Love

![From Shell With Love](from-shell-with-love.jpg)

**Release Date:** 2026-02-05

---

## What's New

32 new tools for querying the Cardano blockchain. Look up token prices, resolve handles, estimate swaps, check governance proposals. All the data you need without leaving your agent.

127 tests. All passing.

---

## New Integrations

### TapTools (5 tools, 19 tests)

Analytics API for Cardano tokens and NFTs.

| Tool                          | What it does                          |
| ----------------------------- | ------------------------------------- |
| `taptools_get_token_price`    | Price, 24h change, volume, market cap |
| `taptools_get_token_holders`  | Holder count and top holders          |
| `taptools_get_nft_collection` | Floor price, volume, supply           |
| `taptools_get_dex_volume`     | Trading volume by DEX                 |
| `taptools_get_trending`       | Trending tokens or NFTs               |

### Cexplorer (5 tools, 24 tests)

Blockchain explorer for addresses, transactions, pools.

| Tool                        | What it does                           |
| --------------------------- | -------------------------------------- |
| `cexplorer_get_address`     | Balance, tx count, stake address       |
| `cexplorer_get_transaction` | Inputs, outputs, fees, metadata        |
| `cexplorer_get_pool`        | Pool ticker, margin, stake, delegators |
| `cexplorer_get_epoch`       | Epoch number, times, block count       |
| `cexplorer_search`          | Search addresses, txs, pools, tokens   |

### Ada Handle (4 tools, 18 tests)

Human-readable names for Cardano wallets.

| Tool                        | What it does                 |
| --------------------------- | ---------------------------- |
| `handle_resolve`            | Convert $handle to address   |
| `handle_reverse_lookup`     | Find handles for an address  |
| `handle_get_metadata`       | Rarity, image, custom data   |
| `handle_check_availability` | Check if handle is available |

### CSWAP (4 tools, 17 tests)

DEX aggregator for token swaps.

| Tool                  | What it does                      |
| --------------------- | --------------------------------- |
| `cswap_get_pools`     | List liquidity pools              |
| `cswap_get_price`     | Token price from pools            |
| `cswap_estimate_swap` | Output amount, price impact, fees |
| `cswap_get_liquidity` | TVL and pool depth                |

### ADA Anvil (4 tools, 18 tests)

Minting API for tokens and NFTs.

| Tool                      | What it does          |
| ------------------------- | --------------------- |
| `anvil_mint_token`        | Mint native tokens    |
| `anvil_burn_token`        | Burn tokens           |
| `anvil_create_collection` | Create NFT collection |
| `anvil_get_mints`         | Minting history       |

### Metera (3 tools, 10 tests)

Index tokens tracking baskets of Cardano assets.

| Tool                     | What it does                 |
| ------------------------ | ---------------------------- |
| `metera_get_indices`     | List index tokens            |
| `metera_get_composition` | Component tokens and weights |
| `metera_get_performance` | NAV, returns over time       |

### GovCircle (3 tools, 11 tests)

Governance circles and proposals.

| Tool                      | What it does            |
| ------------------------- | ----------------------- |
| `govcircle_get_circles`   | List governance circles |
| `govcircle_get_proposals` | Proposals in a circle   |
| `govcircle_get_votes`     | Vote breakdown          |

### NABU VPN (3 tools, 10 tests)

Decentralized VPN node network.

| Tool                  | What it does               |
| --------------------- | -------------------------- |
| `nabu_get_nodes`      | Available VPN nodes        |
| `nabu_get_node_stats` | Bandwidth, uptime, latency |
| `nabu_check_status`   | Service health             |

---

## Files Added

### Implementation (8 files)

```
src/agents/tools/cardano/taptools.ts
src/agents/tools/cardano/cexplorer.ts
src/agents/tools/cardano/ada-handle.ts
src/agents/tools/cardano/cswap.ts
src/agents/tools/cardano/ada-anvil.ts
src/agents/tools/cardano/metera.ts
src/agents/tools/cardano/govcircle.ts
src/agents/tools/cardano/nabu-vpn.ts
```

### Tests (8 files)

```
src/agents/tools/cardano/taptools.test.ts
src/agents/tools/cardano/cexplorer.test.ts
src/agents/tools/cardano/ada-handle.test.ts
src/agents/tools/cardano/cswap.test.ts
src/agents/tools/cardano/ada-anvil.test.ts
src/agents/tools/cardano/metera.test.ts
src/agents/tools/cardano/govcircle.test.ts
src/agents/tools/cardano/nabu-vpn.test.ts
```

### Documentation (2 files)

```
docs/tools/cardano.md
docs/concepts/cardano-integration.md
```

### Knowledge Base (8 files)

```
workspace/knowledge/ecosystem/taptools.md
workspace/knowledge/ecosystem/cexplorer.md
workspace/knowledge/ecosystem/ada-handle.md
workspace/knowledge/ecosystem/cswap.md
workspace/knowledge/ecosystem/ada-anvil.md
workspace/knowledge/ecosystem/metera.md
workspace/knowledge/ecosystem/govcircle.md
workspace/knowledge/ecosystem/nabu-vpn.md
```

---

## Files Modified

- `src/agents/tools/cardano/index.ts` - exports all new tools
- `docs/docs.json` - added Cardano navigation section
- `README.md` - added Cardano ecosystem tools section, updated file counts

---

## API Keys

All tools work without keys but rate limits apply. For production:

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

---

## Test Summary

```
Test Files  8 passed (8)
     Tests  127 passed (127)
  Duration  4.02s
```

| Integration | Tests   |
| ----------- | ------- |
| TapTools    | 19      |
| Cexplorer   | 24      |
| Ada Handle  | 18      |
| CSWAP       | 17      |
| ADA Anvil   | 18      |
| Metera      | 10      |
| GovCircle   | 11      |
| NABU VPN    | 10      |
| **Total**   | **127** |

---

## Breaking Changes

None.

---

## Upgrade Notes

Tools load automatically. No configuration needed.

To disable:

```json
{
  "tools": {
    "cardano": { "enabled": false }
  }
}
```
