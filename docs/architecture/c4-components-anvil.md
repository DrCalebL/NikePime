# Pluggy-McPlugFace: ADA Anvil Plugin (POST Example)

The cardano-anvil plugin demonstrates stateful operations using HTTP POST requests.

```mermaid
C4Component
  title Component Diagram - cardano-anvil Plugin

  Container(registry, "Plugin Registry", "Tool registration")

  Container_Boundary(anvil, "cardano-anvil Plugin") {
    Component(factory, "createAnvilPlugin()", "Factory", "Plugin entry with env fallback")

    Component(client, "createAnvilClient()", "HTTP Client", "GET and POST support")

    Container_Boundary(tools, "Tools (4)") {
      Component(mint, "anvil_mint_token", "POST", "Create mint request")
      Component(burn, "anvil_burn_token", "POST", "Create burn request")
      Component(collection, "anvil_create_collection", "POST", "Create NFT collection")
      Component(getMints, "anvil_get_mints", "GET", "Query mint history")
    }
  }

  System_Ext(api, "ADA Anvil API", "https://api.ada-anvil.io/v1")

  Rel(registry, factory, "register()")
  Rel(factory, mint, "Creates")
  Rel(factory, burn, "Creates")
  Rel(factory, collection, "Creates")
  Rel(factory, getMints, "Creates")
  Rel(mint, client, "client.mintToken()")
  Rel(burn, client, "client.burnToken()")
  Rel(collection, client, "client.createCollection()")
  Rel(getMints, client, "client.getMints()")
  Rel(client, api, "POST/GET", "x-api-key")
```

## POST Request Pattern

The anvil client supports both GET and POST methods:

```typescript
async function request<T>(method: string, endpoint: string, body?: unknown): Promise<Result<T>> {
  const headers: Record<string, string> = { Accept: "application/json" };
  if (config.apiKey) headers["x-api-key"] = config.apiKey;
  if (body) headers["Content-Type"] = "application/json";

  const res = await fetch(`${BASE_URL}${endpoint}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
    signal: controller.signal,
  });
  // ...
}
```

## Tool Parameter Validation

```mermaid
C4Dynamic
  title Mint Token Validation Flow

  Component(mint, "anvil_mint_token", "Tool", "Mint tokens")
  Component(client, "AnvilClient", "HTTP", "API calls")

  Rel(mint, mint, "1. Check name", "required string")
  Rel(mint, mint, "2. Check quantity", "required number")
  Rel(mint, mint, "3. Check recipient_address", "required string")
  Rel(mint, client, "4. Valid: call client")
  Rel(mint, mint, "4. Invalid: return error JSON")
```

Required parameters for `anvil_mint_token`:

- `name` - Token name (string)
- `quantity` - Number to mint (number)
- `recipient_address` - Cardano address (string)
- `metadata` - Optional CIP-25 metadata (object)
