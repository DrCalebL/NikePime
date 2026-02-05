# Cexplorer - Cardano Blockchain Explorer

## Overview

Cexplorer is a comprehensive blockchain explorer for Cardano, providing detailed information about addresses, transactions, stake pools, and network statistics.

## Features

- **Address Lookup**: Balance, transaction history, staking info
- **Transaction Details**: Inputs, outputs, metadata, confirmations
- **Stake Pool Analysis**: Performance metrics, delegators, rewards
- **Epoch Statistics**: Transaction counts, fees, active stake
- **Search**: Universal search across addresses, transactions, pools, tokens

## API Integration

Cexplorer provides a REST API:

- Base URL: `https://api.cexplorer.io/v1`
- Authentication: Bearer token (optional for enhanced rate limits)
- Documentation: https://cexplorer.apidocumentation.com/cexplorer-api

## Available Tools

| Tool                        | Description                  |
| --------------------------- | ---------------------------- |
| `cexplorer_get_address`     | Get address info and balance |
| `cexplorer_get_transaction` | Get transaction details      |
| `cexplorer_get_pool`        | Get stake pool information   |
| `cexplorer_get_epoch`       | Get epoch statistics         |
| `cexplorer_search`          | Search across all entities   |

## Links

- Website: https://cexplorer.io/
- API Docs: https://cexplorer.apidocumentation.com/cexplorer-api
