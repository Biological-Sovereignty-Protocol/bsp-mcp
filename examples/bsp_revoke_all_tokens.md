# Example — `bsp_revoke_all_tokens`

**Consent required:** Yes — `BSP_PRIVATE_KEY` must be set.

**What it does:** Emergency revoke **all** active ConsentTokens for a BEO. Use when a device is lost, a key is suspected compromised, or a clean slate is needed. The BEO itself remains active — only outstanding tokens are cancelled.

---

## Input schema

```json
{
  "type": "object",
  "properties": {
    "confirm": { "type": "boolean", "description": "Must be true" }
  },
  "required": ["confirm"]
}
```

## Request

```json
{
  "name": "bsp_revoke_all_tokens",
  "arguments": { "confirm": true }
}
```

## Response

```json
{
  "content": [{
    "type": "text",
    "text": "✓ All tokens revoked\n\nBEO:          alice.bsp\nRevoked at:   2026-04-19T14:30:00Z\nTokens cancelled: 4\n  tok_7f3a...c291  → fleury.bsp       (LAB)\n  tok_12b8...f4a2  → whoop.bsp        (WEARABLE)\n  tok_9cde...1207  → einstein.bsp     (HOSPITAL)\n  tok_44a1...8e65  → dr-silva.bsp     (PHYSICIAN)\n\nBEO remains ACTIVE. You can issue new ConsentTokens anytime."
  }]
}
```
