# Pluggy-McPlugFace Architecture

C4 model documentation for the Cardano plugin system.

## Diagrams

| Diagram                                        | Level | Audience   | Description                          |
| ---------------------------------------------- | ----- | ---------- | ------------------------------------ |
| [System Context](c4-context.md)                | 1     | Everyone   | System boundaries and external APIs  |
| [Containers](c4-containers.md)                 | 2     | Technical  | 8 plugins and their relationships    |
| [Plugin Components](c4-components-plugin.md)   | 3     | Developers | Internal plugin architecture pattern |
| [Anvil Components](c4-components-anvil.md)     | 3     | Developers | POST request pattern example         |
| [Tool Execution](c4-dynamic-tool-execution.md) | -     | Developers | Request flow through system          |

## Quick Stats

```
Plugins:     8
Tools:       30
Tests:       214 (plugins) + 183 (legacy) = 397 total
Auth types:  Bearer, x-api-key
HTTP:        GET (queries), POST (mutations)
```

## Plugin Matrix

| Plugin            | Tools | Auth      | HTTP Methods |
| ----------------- | ----- | --------- | ------------ |
| cardano-taptools  | 4     | x-api-key | GET          |
| cardano-handle    | 4     | Bearer    | GET          |
| cardano-nabu      | 3     | x-api-key | GET          |
| cardano-metera    | 3     | x-api-key | GET          |
| cardano-govcircle | 3     | Bearer    | GET          |
| cardano-cexplorer | 5     | Bearer    | GET          |
| cardano-cswap     | 4     | x-api-key | GET          |
| cardano-anvil     | 4     | x-api-key | GET, POST    |

## Key Patterns

### Result<T> Type

All clients return discriminated unions for explicit error handling:

```typescript
type Result<T> = { ok: true; data: T } | { ok: false; error: string };
```

### Plugin Factory

Each plugin exports a factory function:

```typescript
export function createXxxPlugin(): Plugin {
  return {
    id: "cardano-xxx",
    name: "Xxx Service",
    register(api) {
      const client = createXxxClient({ apiKey: api.pluginConfig.apiKey });
      api.registerTool(createTool1(client));
      api.registerTool(createTool2(client));
    },
  };
}
```

### Environment Fallback

API keys fall back to environment variables:

```typescript
const apiKey = config.apiKey ?? process.env.XXX_API_KEY;
```
