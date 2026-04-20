# Examples — `bsp_lock_beo` and `bsp_unlock_beo`

**Consent required:** Yes — `BSP_PRIVATE_KEY` env var must be set (operation is signed locally).

**What it does:** Emergency lock freezes all operations on the BEO. Unlock reverts it. Use lock when you suspect key compromise or want to pause all institutional access immediately.

---

## `bsp_lock_beo`

### Input schema

```json
{
  "type": "object",
  "properties": {
    "confirm": { "type": "boolean", "description": "Must be true" }
  },
  "required": ["confirm"]
}
```

### Request

```json
{
  "name": "bsp_lock_beo",
  "arguments": { "confirm": true }
}
```

### Response — success

```json
{
  "content": [{
    "type": "text",
    "text": "✓ BEO locked\n\nBEO:       alice.bsp\nStatus:    LOCKED\nLocked at: 2026-04-19T14:22:01Z\nTX:        0xaptos_tx_hash...\n\nAll submit/read/consent operations are now rejected.\nUnlock with bsp_unlock_beo when ready."
  }]
}
```

---

## `bsp_unlock_beo`

### Input schema

```json
{
  "type": "object",
  "properties": {
    "confirm": { "type": "boolean" }
  },
  "required": ["confirm"]
}
```

### Request

```json
{
  "name": "bsp_unlock_beo",
  "arguments": { "confirm": true }
}
```

### Response

```json
{
  "content": [{
    "type": "text",
    "text": "✓ BEO unlocked\n\nBEO:         alice.bsp\nStatus:      ACTIVE\nUnlocked at: 2026-04-19T15:05:12Z\nTX:          0xaptos_tx_hash...\n\nConsentTokens remain in their prior state (active ones resume)."
  }]
}
```

### Response — private key missing

```json
{
  "content": [{
    "type": "text",
    "text": "⛔ Error [PRIVATE_KEY_MISSING]\n\nBSP_PRIVATE_KEY is not set in the MCP server environment.\nLock and unlock require the BEO holder's signature."
  }],
  "isError": true
}
```
