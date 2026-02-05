# Ada Handle

Human-readable names for Cardano wallets. Like ENS for Ethereum. Each handle is an NFT under a single policy ID.

## How handles work

- Unique: only one $charles can exist
- Case-insensitive: $Charles = $charles = $CHARLES
- Characters: letters, numbers, underscores, hyphens
- Pricing: shorter handles cost more (1-char handles go for 500+ ADA)

Policy ID: `f0ff48bbb7bbe9d59a40f1ce90e9e9d0ff5002ec48f232b49ca0fb9a`

## API Details

- Base URL: `https://api.handle.me`
- Auth: Bearer token (optional but recommended)
- Docs: https://docs.handle.me/

## Tools

### handle_resolve

Converts a handle to its Cardano address.

| Param  | Type   | Required | Notes                    |
| ------ | ------ | -------- | ------------------------ |
| handle | string | yes      | With or without $ prefix |

```typescript
const result = await agent.callTool("handle_resolve", {
  handle: "charles", // or "$charles" or "CHARLES"
});
// {
//   handle: "charles",
//   address: "addr1qy8ac7qqy0vtulyl7wntmsxc6wex80gvcyjy33qffrhm7sh927ysx5sftuw0dlft05dz3c7revpf7jx0xnlcjz3g69mq4afdhv",
//   policy_id: "f0ff48bbb7bbe9d59a40f1ce90e9e9d0ff5002ec48f232b49ca0fb9a"
// }
```

Returns error if handle doesn't exist.

---

### handle_reverse_lookup

Finds all handles owned by an address.

| Param   | Type   | Required | Notes                           |
| ------- | ------ | -------- | ------------------------------- |
| address | string | yes      | Full Cardano address (addr1...) |

```typescript
const result = await agent.callTool("handle_reverse_lookup", {
  address:
    "addr1qy8ac7qqy0vtulyl7wntmsxc6wex80gvcyjy33qffrhm7sh927ysx5sftuw0dlft05dz3c7revpf7jx0xnlcjz3g69mq4afdhv",
});
// {
//   address: "addr1qy8ac7qqy...",
//   handles: [
//     { handle: "charles", is_primary: true },
//     { handle: "hoskinson", is_primary: false }
//   ],
//   primary_handle: "charles"
// }
```

One address can hold many handles. One is marked primary.

---

### handle_get_metadata

Returns NFT metadata, rarity, and any custom data the owner set.

| Param  | Type   | Required | Notes                    |
| ------ | ------ | -------- | ------------------------ |
| handle | string | yes      | With or without $ prefix |

```typescript
const result = await agent.callTool("handle_get_metadata", {
  handle: "charles",
});
// {
//   handle: "charles",
//   policy_id: "f0ff48bbb7bbe9d59a40f1ce90e9e9d0ff5002ec48f232b49ca0fb9a",
//   asset_name: "636861726c6573",
//   rarity: "legendary",
//   length: 7,
//   characters: "letters",
//   created_slot: 12345678,
//   image: "ipfs://...",
//   custom_data: {
//     profile_pic: "ipfs://...",
//     socials: { twitter: "@charleshoskinson" }
//   }
// }
```

asset_name is the handle hex-encoded.

---

### handle_check_availability

Checks if a handle can be registered and shows the price.

| Param  | Type   | Required | Notes                    |
| ------ | ------ | -------- | ------------------------ |
| handle | string | yes      | With or without $ prefix |

```typescript
// Available handle
const result = await agent.callTool("handle_check_availability", {
  handle: "newhandle123",
});
// { handle: "newhandle123", available: true, price: "10000000", price_tier: "common" }

// Taken handle
const result2 = await agent.callTool("handle_check_availability", {
  handle: "charles",
});
// { handle: "charles", available: false, owner: "addr1qy8ac7qqy..." }
```

Price is in lovelace (10000000 = 10 ADA).

---

## Price tiers

| Length | Rarity     | Price     |
| ------ | ---------- | --------- |
| 1      | Mythic     | 500+ ADA  |
| 2      | Legendary  | 250 ADA   |
| 3      | Ultra Rare | 100 ADA   |
| 4-7    | Rare       | 25-50 ADA |
| 8-15   | Common     | 10 ADA    |
| 16+    | Basic      | 5 ADA     |

Prices change based on demand.

---

## API Key

```bash
export ADA_HANDLE_API_KEY=ah_xxxx
```

Or in config:

```json
{
  "tools": {
    "adaHandle": { "apiKey": "ah_xxxx" }
  }
}
```

## Links

- https://handle.me/
- https://docs.handle.me/
- @adaHandle
