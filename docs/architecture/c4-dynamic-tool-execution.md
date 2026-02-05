# Pluggy-McPlugFace: Tool Execution Flow

Shows the request flow when an AI agent invokes a tool.

```mermaid
C4Dynamic
  title Dynamic Diagram - Tool Execution Flow

  Person(agent, "AI Agent", "Invokes blockchain tools")

  Container_Boundary(pluggy, "Pluggy-McPlugFace") {
    Component(registry, "Plugin Registry", "TypeScript", "Tool lookup")
    Component(tool, "Tool", "TypeBox", "Parameter validation")
    Component(client, "HTTP Client", "TypeScript", "API requests")
  }

  System_Ext(api, "External API", "Cardano service")

  Rel(agent, registry, "1. Invoke tool by name", "JSON args")
  Rel(registry, tool, "2. Dispatch to tool.execute()")
  Rel(tool, tool, "3. Validate params", "TypeBox schema")
  Rel(tool, client, "4. Call client method")
  Rel(client, api, "5. HTTP request", "JSON/HTTPS")
  Rel(api, client, "6. API response", "JSON")
  Rel(client, tool, "7. Return Result<T>")
  Rel(tool, agent, "8. Return JSON result")

  UpdateRelStyle(agent, registry, $offsetY="-40")
  UpdateRelStyle(tool, agent, $offsetY="40")
```

## Execution Steps

1. **Agent invokes tool** - Agent calls `anvil_mint_token` with JSON arguments
2. **Registry dispatches** - Plugin registry finds registered tool, calls `execute()`
3. **Parameter validation** - Tool validates args against TypeBox schema
4. **Client method call** - Tool calls appropriate client method (e.g., `client.mintToken()`)
5. **HTTP request** - Client sends authenticated request to external API
6. **API response** - External service returns JSON response
7. **Result wrapping** - Client wraps response in `Result<T>` (ok/error)
8. **JSON result** - Tool formats result as JSON text content for agent

## Error Handling

```mermaid
C4Dynamic
  title Dynamic Diagram - Error Handling Flow

  Component(tool, "Tool", "TypeBox", "Validates and executes")
  Component(client, "HTTP Client", "TypeScript", "API communication")
  System_Ext(api, "External API", "May fail")

  Rel(tool, client, "1. Call client")
  Rel(client, api, "2. HTTP request")
  Rel(api, client, "3. Error response", "4xx/5xx")
  Rel(client, tool, "4. Return { ok: false, error }")
  Rel(tool, tool, "5. Format error JSON")
```

Errors are handled gracefully:

- Network failures return `{ ok: false, error: "Network error" }`
- API errors return `{ ok: false, error: "API: <message>" }`
- Validation errors return `{ error: "param is required" }`
