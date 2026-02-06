# CSWAP - Cardano Decentralized Exchange

## Overview

CSWAP is a decentralized exchange (DEX) on Cardano providing automated market making (AMM) for token swaps.

## Features

- **Token Swaps**: Swap any Cardano native token
- **Liquidity Pools**: Provide liquidity and earn fees
- **Price Discovery**: Real-time price from pool ratios
- **Multi-hop Routes**: Automatic routing for best prices
- **Low Fees**: Competitive swap fees

## How It Works

CSWAP uses an AMM model where:

1. Liquidity providers deposit token pairs into pools
2. Prices are determined by the constant product formula (x \* y = k)
3. Swappers trade against the pool, paying fees to LPs
4. Arbitrageurs keep prices aligned with external markets

## API Integration

CSWAP provides a REST API:

- Base URL: `https://api.cswap.fi/v1`
- Authentication: API key (optional)
- Documentation: https://docs.cswap.fi/

## Available Tools

| Tool                  | Description              |
| --------------------- | ------------------------ |
| `cswap_get_pools`     | List liquidity pools     |
| `cswap_get_price`     | Get token price          |
| `cswap_estimate_swap` | Estimate swap output     |
| `cswap_get_liquidity` | Get pool liquidity stats |

## Links

- Website: https://cswap.fi/
- Documentation: https://docs.cswap.fi/
