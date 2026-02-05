# Metera Protocol - Index Tokens

## Overview

Metera Protocol provides index tokens on Cardano that track baskets of assets, enabling diversified exposure to ecosystem sectors.

## Features

- **Index Tokens**: Tradeable tokens representing asset baskets
- **Auto-Rebalancing**: Periodic rebalancing to maintain weights
- **Sector Exposure**: DeFi, NFT, Gaming indices
- **Transparent Composition**: On-chain verifiable holdings
- **Performance Tracking**: Historical returns and metrics

## How It Works

1. Index tokens are minted against underlying asset deposits
2. Weights are determined by market cap or custom methodology
3. Rebalancing occurs periodically to maintain target allocations
4. Holders can redeem for underlying assets or trade on DEXes

## API Integration

Metera provides a REST API:

- Base URL: `https://api.metera.io/v1`
- Authentication: API key (optional)
- Documentation: https://metera-protocol.gitbook.io/documentation

## Available Tools

| Tool                     | Description             |
| ------------------------ | ----------------------- |
| `metera_get_indices`     | List available indices  |
| `metera_get_composition` | Get index composition   |
| `metera_get_performance` | Get performance metrics |

## Index Types

- **DeFi Index**: Top DeFi protocols by TVL
- **NFT Blue Chip**: Premium NFT collections
- **Gaming Index**: Cardano gaming tokens

## Links

- Documentation: https://metera-protocol.gitbook.io/documentation
