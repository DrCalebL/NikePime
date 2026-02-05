# ADA Anvil - Developer Minting API

## Overview

ADA Anvil provides easy-to-use APIs for minting native tokens and NFTs on Cardano without requiring deep blockchain knowledge.

## Features

- **Token Minting**: Mint fungible tokens with custom metadata
- **NFT Creation**: Create NFT collections with royalties
- **Burn Tokens**: Burn tokens to reduce supply
- **Minting History**: Track all minting operations
- **Policy Management**: Custom or managed policy IDs

## API Integration

ADA Anvil provides a REST API:

- Base URL: `https://api.ada-anvil.io/v1`
- Authentication: API key via `x-api-key` header
- Documentation: https://dev.ada-anvil.io/

## Available Tools

| Tool                      | Description           |
| ------------------------- | --------------------- |
| `anvil_mint_token`        | Mint native tokens    |
| `anvil_burn_token`        | Burn tokens           |
| `anvil_create_collection` | Create NFT collection |
| `anvil_get_mints`         | Get minting history   |

## Use Cases

- Quick token launches without infrastructure
- NFT collection creation with royalty support
- Prototyping and testing token mechanics
- Event-based NFT minting

## Links

- Website: https://ada-anvil.io/
- Documentation: https://dev.ada-anvil.io/
