# GovCircle - Governance Platform

## Overview

GovCircle provides decentralized governance infrastructure through circles and proposals, enabling community-driven decision making.

## Features

- **Governance Circles**: Topic-specific governance groups
- **Proposal System**: Create and vote on proposals
- **Weighted Voting**: Token-weighted voting power
- **Transparent History**: On-chain voting records
- **Multi-sig Treasury**: Circle-controlled treasuries

## How It Works

1. Circles are created around specific governance domains
2. Members hold governance tokens for voting power
3. Proposals are submitted with defined voting periods
4. Votes are cast and tallied transparently
5. Passed proposals trigger on-chain actions

## API Integration

GovCircle provides a REST API:

- Base URL: `https://api.govcircle.io/v1`
- Authentication: Bearer token
- Documentation: https://govcircle.gitbook.io/circle-paper

## Available Tools

| Tool                      | Description               |
| ------------------------- | ------------------------- |
| `govcircle_get_circles`   | List governance circles   |
| `govcircle_get_proposals` | Get proposals in a circle |
| `govcircle_get_votes`     | Get voting history        |

## Governance Model

- **Active Proposals**: Open for voting
- **Passed**: Approved by majority
- **Rejected**: Did not meet threshold
- **Executed**: Implemented on-chain

## Links

- Documentation: https://govcircle.gitbook.io/circle-paper
