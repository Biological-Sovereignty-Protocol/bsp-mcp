![BSP MCP](https://img.shields.io/badge/MCP-compatible-6e40c9?style=flat-square) ![Version](https://img.shields.io/npm/v/bsp-mcp?style=flat-square&label=version) ![License](https://img.shields.io/badge/license-Apache%202.0-blue?style=flat-square) ![Node](https://img.shields.io/badge/node-%3E%3D18-green?style=flat-square)

# bsp-mcp

**Connect AI to health data — with verified consent**

> Published by the [Ambrósio Institute](https://ambrosioinstitute.org) · [biologicalsovereigntyprotocol.com](https://biologicalsovereigntyprotocol.com)

---

## What it is

`bsp-mcp` is the official Model Context Protocol server for the Biological Sovereignty Protocol. It lets any MCP-compatible AI assistant — Claude, GPT, or any other — read and interact with a user's BSP health records. But it never does so silently: every single data access is gated by a ConsentToken that the user explicitly issued, with cryptographic verification enforced on-chain.

The server implements the MCP tool interface over stdio, integrates with the `bsp-sdk` ExchangeClient, and treats consent as a hard runtime constraint — not a UI checkbox. If a valid token is not present, or if the requested intent falls outside what was authorized, the call is rejected before any data is touched.

---

## Why this matters

In 2026, AI health assistants are everywhere. The problem is that most of them access health data through institutional pipelines where the user is a bystander — data flows from EHR to platform to model, and the individual never sees the consent trail, let alone controls it.

BSP-MCP inverts that. Every query your AI makes is gated by a ConsentToken you issued, scoped to exactly the categories and intents you authorized, with an expiry you set. The AI sees what you allowed — nothing more. When you revoke access, it stops immediately. The entire access history is permanently recorded on Aptos, auditable by anyone.

This is what sovereign health data looks like in practice.

---

## Available Tools

| Tool | Consent Required | What it returns |
|---|---|---|
| `bsp_get_biorecords` | Yes — `READ_RECORDS` intent | Biological measurements in BSP format: values, units, reference ranges, collection timestamps. Filterable by category, biomarker codes, and date range. |
| `bsp_get_beo_summary` | Yes — `READ_RECORDS` intent | Overview of the user's biological profile: categories present, record counts, last measurement dates, and data coverage level. |
| `bsp_resolve_biomarker` | No — public taxonomy | Name, category, level, and clinical context for a BSP biomarker code. |
| `bsp_list_categories` | No — public taxonomy | All 25 BSP taxonomy categories with level filters (CORE / STANDARD / EXTENDED / DEVICE). |
| `bsp_check_consent` | No — reads session config | Active consent status: which BEO is connected, which intents are authorized, token ID, and expiry. Run this first. |
| `bsp_lock_beo` | Yes — `BSP_PRIVATE_KEY` | Emergency lock — freezes the BEO immediately. No operations permitted while locked. |
| `bsp_unlock_beo` | Yes — `BSP_PRIVATE_KEY` | Unlock a previously locked BEO. |
| `bsp_destroy_beo` | Yes — `BSP_PRIVATE_KEY` + `confirm: true` | **IRREVERSIBLE** — Permanent erasure (LGPD/GDPR). Nullifies key, revokes all tokens, releases domain. |
| `bsp_revoke_all_tokens` | Yes — `BSP_PRIVATE_KEY` | Emergency revoke ALL active ConsentTokens for a BEO. |

---

## Setup

**1. Install**

```bash
npx bsp-mcp
```

**2. Configure in Claude Desktop**

Add to `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "bsp": {
      "command": "npx",
      "args": ["-y", "bsp-mcp"],
      "env": {
        "BSP_BEO_DOMAIN": "yourname.bsp",
        "BSP_CONSENT_TOKEN_ID": "tok_...",
        "BSP_NETWORK": "mainnet"
      }
    }
  }
}
```

**3. Issue a ConsentToken**

Before your AI can read any records, you need to authorize it from your BSP identity:

```bash
bsp consent grant \
  --beo yourname.bsp \
  --intent READ_RECORDS \
  --categories BSP-HM,BSP-GL,BSP-LA \
  --expires 2026-12-31 \
  --output tok_...
```

Then set that token ID as `BSP_CONSENT_TOKEN_ID` in the server env.

**4. Verify the connection**

Start a Claude session and ask:

> "Check my BSP consent status"

Claude will call `bsp_check_consent` and confirm which BEO is connected and what data it can access.

---

## Demo conversation

```
User: Analyze my latest blood panel results

Claude: Let me check your BSP consent first.

  [bsp_check_consent]
  → BEO: alice.bsp
  → Token: tok_7f3a...c291
  → Network: mainnet
  → Intents: READ_RECORDS
  → Authorized categories: BSP-HM (Hematology), BSP-GL (Genomics Light), BSP-LA (Lab – Advanced)
  → Expires: 2026-12-31

  Consent verified. Fetching your hematology records.

  [bsp_get_biorecords]
  → BEO: alice.bsp
  → Category: BSP-HM
  → Date range: last 90 days
  → Records returned: 12

Based on your latest blood panel (March 18, 2026):

  Hemoglobin     14.2 g/dL   ✓  normal (ref: 12.0–16.0)
  Hematocrit     42.1 %      ✓  normal (ref: 36–48)
  WBC            7,200 /μL   ✓  normal (ref: 4,500–11,000)
  Platelets      238,000 /μL ✓  normal (ref: 150,000–400,000)
  MCV            88 fL       ✓  normal (ref: 80–100)
  Ferritin       22 ng/mL    ⚠  low-normal (ref: 20–200; optimal longevity: >50)

Everything is within clinical range. Ferritin at 22 ng/mL is technically normal,
but for longevity optimization the target is typically above 50. Worth discussing
iron supplementation or dietary adjustments with your provider.
```

---

## Security model

**How consent verification works**

The `ConsentGuard` runs before every data-access tool call. It checks that:

1. A BEO domain is configured (`BSP_BEO_DOMAIN`)
2. A ConsentToken is present (`BSP_CONSENT_TOKEN_ID`)
3. The token's `intents` array includes the required intent for the requested operation
4. The token has not expired

When `bsp-sdk` is connected to the registry, step 3 and 4 are verified on-chain against the AccessControl contract. The token state on Aptos is the source of truth — not the local environment.

**What happens when a token expires**

```
[bsp_get_biorecords]
⛔ BSP Consent Error [TOKEN_EXPIRED]

The ConsentToken tok_7f3a...c291 expired on 2026-06-01.
The BEO holder must issue a new token to continue.
→ https://biologicalsovereigntyprotocol.com/getting-started/quickstart
```

The AI cannot proceed. No data is returned. No fallback path exists.

**What happens when a token is revoked**

Revocation is immediate. The AccessControl contract on Aptos marks the token as revoked, and the next tool call that hits the registry will receive a `TOKEN_REVOKED` error and halt. Mid-conversation revocation is handled gracefully — the AI acknowledges the revocation and stops accessing data.

**Scope enforcement**

Tokens are scoped. A token with `READ_RECORDS` on `BSP-HM,BSP-GL` cannot be used to read `BSP-CV` (cardiovascular) data even if that category exists in the BEO. Category-level enforcement is delegated to the AccessControl contract.

---

## For developers

**Adding a new tool**

Tools are registered in `src/index.ts`. Each tool follows this pattern:

```typescript
// 1. Define the tool in the tools[] array
{
  name: 'bsp_my_new_tool',
  description: '...',
  inputSchema: { type: 'object', properties: { ... } }
}

// 2. Add a case in the CallToolRequestSchema handler
case 'bsp_my_new_tool': {
  // For consent-required tools:
  const consentError = guard.check('REQUIRED_INTENT')
  if (consentError) return consentError

  // Your tool logic here
  // Use bsp-sdk ExchangeClient to interact with the registry
}
```

**Tool interface**

Every tool returns an `MCPResult`:

```typescript
type MCPResult = {
  content: Array<{ type: 'text'; text: string }>
  isError?: boolean
}
```

**Environment variables**

| Variable | Required | Description |
|---|---|---|
| `BSP_BEO_DOMAIN` | Yes | The user's BSP identity domain (e.g. `alice.bsp`) |
| `BSP_CONSENT_TOKEN_ID` | Yes for data access | Token ID issued by the BEO holder |
| `BSP_RELAYER_URL` | No | Override registry endpoint (default: official relayer) |
| `BSP_NETWORK` | No | `mainnet` or `testnet` (default: `mainnet`) |

**Related packages**

- [bsp-spec](https://github.com/Biological-Sovereignty-Protocol/bsp-spec) — full BSP specification
- [bsp-sdk-typescript](https://github.com/Biological-Sovereignty-Protocol/bsp-sdk-typescript) — TypeScript SDK (`bsp-sdk`)
- [bsp-id-web](https://github.com/ambrosio-institute/bsp-id-web) — web app to manage your BEO and issue tokens

---

## Changelog

**v1.0.0** — Initial release
- 9 tools: 5 read (`bsp_get_biorecords`, `bsp_get_beo_summary`, `bsp_resolve_biomarker`, `bsp_list_categories`, `bsp_check_consent`) + 4 write (`bsp_lock_beo`, `bsp_unlock_beo`, `bsp_destroy_beo`, `bsp_revoke_all_tokens`)
- ConsentGuard with intent and BEO domain validation
- Full BSP taxonomy: 25 categories, CORE/STANDARD/EXTENDED/DEVICE levels
- stdio transport via `@modelcontextprotocol/sdk`

---

## License

Apache 2.0 — [Ambrósio Institute](https://ambrosioinstitute.org)
