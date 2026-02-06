# Pluggy-McPlugFace v1.0

<img src="pluggy.jpg" width="500" alt="Pluggy-McPlugFace" />

## Plugins

- **cardano-taptools** - Token prices, holders, NFT stats, DEX volume
- **cardano-handle** - $handle resolution, reverse lookup, metadata
- **cardano-nabu** - VPN node listing and stats
- **cardano-metera** - Index token composition and performance
- **cardano-govcircle** - Governance circles, proposals, votes
- **cardano-cexplorer** - Address info, transactions, pools, epochs
- **cardano-cswap** - Liquidity pools, prices, swap estimates
- **cardano-anvil** - Token minting, burning, collections

Each plugin loads independently and handles its own auth.

## Security

Seven layers:

1. Read-only container filesystem
2. Network isolation (proxy-only egress)
3. Domain allowlist
4. Seccomp syscall filtering
5. Rate limiting (64KB/s)
6. API key validation
7. Error truncation (200 chars)

Compromise a plugin, you still can't write to disk, exfiltrate fast, reach other hosts, or escalate.

## Usage

Set API keys via environment or `openclaw.json`:

```bash
export TAPTOOLS_API_KEY=tt_xxxx
export ADA_HANDLE_API_KEY=ah_xxxx
```

```typescript
const price = await agent.callTool("taptools_get_token_price", {
  policy_id: "279c909f348e533da5808898f87f9a14bb2c3dfbbacccd631d927a3f",
});
```

## Building your own

See the README. Short version: create a client that returns `Result<T>`, write tools with TypeBox schemas, wire it up in `createYourPlugin()`.

## Breaking changes

None.

---

Pluggy-McPlugFace: juggling plugins so you don't have to.
