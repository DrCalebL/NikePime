# Cardano Native Tokens Explained

## What Makes Them "Native"?

On Cardano, tokens exist at the **ledger level**, not as smart contracts. This is fundamentally different from Ethereum's ERC-20 standard.

### Ethereum (ERC-20)
```
Token = Smart Contract
- Contract stores balances
- Contract handles transfers
- Contract can have bugs/exploits
- Contract owner may have special powers
```

### Cardano (Native)
```
Token = Ledger Entry
- Ledger stores balances (like ADA)
- Protocol handles transfers
- No contract to exploit
- Minting policy is locked forever
```

## Why This Matters for NIKEPIG

1. **Security** — No smart contract vulnerabilities
2. **Simplicity** — Transfers work exactly like ADA
3. **Cost** — No contract execution = lower fees
4. **Permanence** — Once minting policy locks, supply is fixed forever

## Minting Policies

Every Cardano native token has a **minting policy** that defines:
- Who can mint new tokens
- Under what conditions
- Whether it can ever be changed

Once a policy is "locked" (time-locked or key-destroyed), no more tokens can ever be minted. This is verifiable on-chain.

## Policy ID

The **Policy ID** is a unique identifier for a token's minting policy. It's derived cryptographically from the policy script.

For NIKEPIG, always verify the policy ID:
```
[YOUR_POLICY_ID]
```

Different policy ID = different token = probably a scam.

## Token Fingerprint

The **fingerprint** is a human-readable identifier combining policy ID and asset name. Format: `asset1...`

## Multi-Asset Transactions

On Cardano, a single transaction can send multiple different tokens. You can:
- Send ADA + NIKEPIG in one transaction
- Pay fees in ADA while transferring NIKEPIG
- Bundle multiple token transfers

## Minimum ADA

Every UTXO (output) containing tokens must also contain minimum ADA (~1-2 ADA). This prevents dust attacks and ensures network health.

## Compared to Other Chains

| Feature | Cardano | Ethereum | Solana |
|---------|---------|----------|--------|
| Token Type | Native | Smart Contract | Program |
| Can be rugged | No (if locked) | Yes (contract owner) | Yes (program authority) |
| Transfer fee | ~0.2 ADA | Gas variable | ~0.00025 SOL |
| Complexity | Low | High | Medium |

## Bottom Line

Cardano native tokens are the most secure way to hold a memecoin. No contract to hack, no owner to rug, just protocol-level ownership.

`$NIKEPIG` benefits from all of this.
