# Example — `bsp_check_consent`

**Consent required:** No — reads session config only.

**What it does:** Returns active consent status — which BEO is connected, which intents are authorized, token ID, expiry. This is the first tool your AI should call in every session.

---

## Input schema

```json
{
  "type": "object",
  "properties": {},
  "required": []
}
```

No input parameters. The tool reads `BSP_BEO_DOMAIN` and `BSP_CONSENT_TOKEN_ID` from the MCP server environment.

## Request payload

```json
{
  "name": "bsp_check_consent",
  "arguments": {}
}
```

## Response — consent active

```json
{
  "content": [{
    "type": "text",
    "text": "BSP Consent Status\n────────────────────\nBEO:        alice.bsp\nBEO ID:     tx_abc123...\nToken ID:   tok_7f3a...c291\nNetwork:    mainnet\nIntents:    READ_RECORDS\nCategories: BSP-HM, BSP-GL, BSP-LA\nExpires:    2026-12-31T23:59:59Z (254 days remaining)\nStatus:     ACTIVE\n\nYou have read access to hematology, light genomics, and advanced lab data."
  }]
}
```

## Response — no consent configured

```json
{
  "content": [{
    "type": "text",
    "text": "⛔ BSP Consent Error [ENV_VAR_MISSING]\n\nBSP_BEO_DOMAIN is not set in the MCP server environment.\n\nTo connect a BSP identity:\n1. Set BSP_BEO_DOMAIN to your .bsp domain\n2. Issue a ConsentToken: bsp consent grant ...\n3. Set BSP_CONSENT_TOKEN_ID to the token ID\n4. Restart the MCP server"
  }],
  "isError": true
}
```
