# Example — `bsp_destroy_beo`

**Consent required:** Yes — `BSP_PRIVATE_KEY` + `confirm: true`.

**What it does:** **IRREVERSIBLE** cryptographic erasure. Implements LGPD Art. 18 / GDPR Art. 17. Nullifies the BEO's public key on-chain, revokes all ConsentTokens, releases the `.bsp` domain, and sets status to `DESTROYED`.

⚠️ **No undo.** Once destroyed, no one — not the holder, not the Ambrósio Institute, not any relayer — can revive the BEO. All BioRecords on Arweave remain but become unreadable without a verifiable key.

---

## Input schema

```json
{
  "type": "object",
  "properties": {
    "confirm": {
      "type": "boolean",
      "description": "Must be true — prevents accidental destruction"
    },
    "reason": {
      "type": "string",
      "description": "Optional reason (logged on-chain for audit)"
    }
  },
  "required": ["confirm"]
}
```

## Request

```json
{
  "name": "bsp_destroy_beo",
  "arguments": {
    "confirm": true,
    "reason":  "GDPR Art. 17 erasure request"
  }
}
```

## Response — success

```json
{
  "content": [{
    "type": "text",
    "text": "✓ BEO DESTROYED\n\nBEO:              alice.bsp\nBEO ID:           tx_abc123...\nDestroyed at:     2026-04-19T16:00:00Z\nTX:               0xaptos_destroy_tx...\nReason logged:    GDPR Art. 17 erasure request\n\nActions completed:\n  ✓ Public key nullified (cryptographic erasure)\n  ✓ 3 active ConsentTokens revoked\n  ✓ Domain alice.bsp released\n  ✓ Recovery config wiped\n  ✓ Status set to DESTROYED\n\nThis action is IRREVERSIBLE."
  }]
}
```

## Response — confirm missing

```json
{
  "content": [{
    "type": "text",
    "text": "⛔ Error [CONFIRM_REQUIRED]\n\nbsp_destroy_beo requires confirm: true.\nThis is a destructive, irreversible operation. Re-invoke with explicit confirmation."
  }],
  "isError": true
}
```
