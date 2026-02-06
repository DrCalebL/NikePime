# Pluggy-McPlugFace: Container Diagram

Shows the internal structure of the plugin system.

```mermaid
C4Container
  title Container Diagram - Pluggy-McPlugFace

  Person(agent, "AI Agent", "Executes blockchain tools")

  Container_Boundary(pluggy, "Pluggy-McPlugFace") {
    Container(registry, "Plugin Registry", "TypeScript", "Registers and manages plugins")

    Container_Boundary(plugins, "Cardano Plugins") {
      Container(taptools, "cardano-taptools", "TypeScript", "Token analytics (4 tools)")
      Container(handle, "cardano-handle", "TypeScript", "Identity resolution (4 tools)")
      Container(nabu, "cardano-nabu", "TypeScript", "VPN nodes (3 tools)")
      Container(metera, "cardano-metera", "TypeScript", "Index tokens (3 tools)")
      Container(govcircle, "cardano-govcircle", "TypeScript", "Governance (3 tools)")
      Container(cexplorer, "cardano-cexplorer", "TypeScript", "Explorer (5 tools)")
      Container(cswap, "cardano-cswap", "TypeScript", "DEX (4 tools)")
      Container(anvil, "cardano-anvil", "TypeScript", "Minting (4 tools)")
    }
  }

  System_Ext(apis, "External APIs", "8 Cardano service APIs")

  Rel(agent, registry, "Discovers tools")
  Rel(registry, taptools, "Loads")
  Rel(registry, handle, "Loads")
  Rel(registry, nabu, "Loads")
  Rel(registry, metera, "Loads")
  Rel(registry, govcircle, "Loads")
  Rel(registry, cexplorer, "Loads")
  Rel(registry, cswap, "Loads")
  Rel(registry, anvil, "Loads")
  Rel(taptools, apis, "HTTP GET", "x-api-key")
  Rel(handle, apis, "HTTP GET", "Bearer")
  Rel(anvil, apis, "HTTP POST", "x-api-key")

  UpdateLayoutConfig($c4ShapeInRow="4", $c4BoundaryInRow="1")
```

## Plugin Inventory

| Plugin            | Tools        | Test Coverage |
| ----------------- | ------------ | ------------- |
| cardano-taptools  | 4            | 35 tests      |
| cardano-handle    | 4            | 27 tests      |
| cardano-nabu      | 3            | 21 tests      |
| cardano-metera    | 3            | 20 tests      |
| cardano-govcircle | 3            | 23 tests      |
| cardano-cexplorer | 5            | 33 tests      |
| cardano-cswap     | 4            | 26 tests      |
| cardano-anvil     | 4            | 29 tests      |
| **Total**         | **30 tools** | **214 tests** |
