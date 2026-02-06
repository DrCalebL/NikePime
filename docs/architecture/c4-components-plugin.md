# Pluggy-McPlugFace: Plugin Component Diagram

Shows the internal structure of a single plugin (pattern shared by all 8 plugins).

```mermaid
C4Component
  title Component Diagram - Plugin Architecture

  Container(registry, "Plugin Registry", "Manages tool registration")

  Container_Boundary(plugin, "cardano-xxx Plugin") {
    Component(factory, "createXxxPlugin()", "Factory", "Plugin entry point")
    Component(client, "createXxxClient()", "HTTP Client", "API communication with Result<T>")
    Component(types, "types.ts", "TypeScript", "API response interfaces")

    Container_Boundary(tools, "Tools") {
      Component(tool1, "Tool A", "TypeBox Schema", "First endpoint")
      Component(tool2, "Tool B", "TypeBox Schema", "Second endpoint")
      Component(tool3, "Tool N", "TypeBox Schema", "Additional endpoints")
    }
  }

  System_Ext(api, "External API", "Cardano service")

  Rel(registry, factory, "Calls register()")
  Rel(factory, tool1, "Creates")
  Rel(factory, tool2, "Creates")
  Rel(factory, tool3, "Creates")
  Rel(tool1, client, "Uses")
  Rel(tool2, client, "Uses")
  Rel(tool3, client, "Uses")
  Rel(client, api, "HTTP requests", "JSON")
  Rel(client, types, "Returns typed")
```

## Plugin Structure

Each plugin follows the same directory layout:

```
extensions/cardano-xxx/
  package.json
  tsconfig.json
  vitest.config.ts
  src/
    index.ts          # createXxxPlugin() factory
    client.ts         # createXxxClient() with Result<T>
    types.ts          # API response types
    tools/
      tool-a.ts       # Individual tool
      tool-b.ts
      index.ts        # Tool exports
    __tests__/
      plugin.test.ts  # Registration tests
      client.test.ts  # HTTP client tests
      tools.test.ts   # Tool behavior tests
```

## Result Type Pattern

All clients use the discriminated union `Result<T>`:

```typescript
type Result<T> = { ok: true; data: T } | { ok: false; error: string };
```

This enables explicit error handling without exceptions:

```typescript
const result = await client.getTokenPrice("SNEK");
if (!result.ok) {
  return jsonResult({ error: result.error });
}
return jsonResult(result.data);
```
