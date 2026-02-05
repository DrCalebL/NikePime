# Pluggy-McPlugFace: System Context

The Pluggy-McPlugFace plugin system provides modular Cardano blockchain integrations for AI agents.

```mermaid
C4Context
  title System Context - Pluggy-McPlugFace

  Person(agent, "AI Agent", "Executes blockchain queries and transactions")
  Person(dev, "Developer", "Configures plugins and API keys")

  System(pluggy, "Pluggy-McPlugFace", "Modular plugin system for Cardano integrations")

  System_Ext(taptools, "TapTools API", "Token analytics and market data")
  System_Ext(handle, "Ada Handle API", "Identity resolution service")
  System_Ext(nabu, "NABU VPN API", "Decentralized VPN nodes")
  System_Ext(metera, "Metera API", "Index token management")
  System_Ext(govcircle, "GovCircle API", "Governance proposals")
  System_Ext(cexplorer, "Cexplorer API", "Blockchain explorer")
  System_Ext(cswap, "CSWAP API", "DEX liquidity pools")
  System_Ext(anvil, "ADA Anvil API", "Token minting service")

  Rel(agent, pluggy, "Invokes tools")
  Rel(dev, pluggy, "Configures")
  Rel(pluggy, taptools, "Queries", "HTTPS/JSON")
  Rel(pluggy, handle, "Queries", "HTTPS/JSON")
  Rel(pluggy, nabu, "Queries", "HTTPS/JSON")
  Rel(pluggy, metera, "Queries", "HTTPS/JSON")
  Rel(pluggy, govcircle, "Queries", "HTTPS/JSON")
  Rel(pluggy, cexplorer, "Queries", "HTTPS/JSON")
  Rel(pluggy, cswap, "Queries", "HTTPS/JSON")
  Rel(pluggy, anvil, "Queries/Mutates", "HTTPS/JSON")
```

## External Systems

| System     | Purpose                            | Auth Method |
| ---------- | ---------------------------------- | ----------- |
| TapTools   | Token prices, holders, market data | x-api-key   |
| Ada Handle | $handle to address resolution      | Bearer      |
| NABU VPN   | Decentralized VPN node info        | x-api-key   |
| Metera     | Index token composition            | x-api-key   |
| GovCircle  | Governance circles and proposals   | Bearer      |
| Cexplorer  | Address, tx, pool, epoch data      | Bearer      |
| CSWAP      | DEX pools and swap estimates       | x-api-key   |
| ADA Anvil  | Token minting and burning          | x-api-key   |
